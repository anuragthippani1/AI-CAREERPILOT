/**
 * Interview Agent
 * Conducts AI-powered mock interviews with adaptive questions
 */

const { getModel } = require('../config/gemini');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { logAgentAction } = require('../utils/logger');

class InterviewAgent {
  constructor() {
    this.model = getModel('gemini-2.0-flash-lite');
    this.systemPrompt = `You are a professional Interview Simulator Agent for CareerPilot.
Your responsibilities:
1. Conduct realistic mock interviews
2. Ask adaptive follow-up questions based on answers
3. Provide constructive feedback
4. Score answers on multiple dimensions
5. Simulate real interview scenarios

Always:
- Ask one question at a time
- Provide feedback after each answer
- Score answers (0-100) on: clarity, technical accuracy, relevance, communication
- Ask follow-up questions when appropriate
- Maintain professional, supportive tone

Format your response as JSON.`;
  }

  /**
   * Start a new interview session
   */
  async start(context, inputData) {
    const startTime = Date.now();
    let firstQuestion = null;
    let sessionId = null;

    try {
      sessionId = uuidv4();
      const roleTitle = inputData.roleTitle || context.activeGoal?.target_role || 'Software Engineer';
      const interviewType = inputData.type || 'technical'; // technical, behavioral, mixed, system-design, leadership
      const companyName = inputData.companyName || null;

      // Get user context for personalized questions
      const resumeAnalysis = context.resume?.analysis_json 
        ? (typeof context.resume.analysis_json === 'string' 
            ? JSON.parse(context.resume.analysis_json) 
            : context.resume.analysis_json)
        : null;

      const prompt = `${this.systemPrompt}

Role: ${roleTitle}
${companyName ? `Company: ${companyName}` : ''}
Interview Type: ${interviewType}
${resumeAnalysis ? `Candidate Background: ${resumeAnalysis.experience?.summary || 'Not specified'}` : ''}

Start the interview. Ask the first question and provide initial context.

Response format:
{
  "question": "<string>",
  "questionType": "<technical|behavioral|mixed>",
  "context": "<string>",
  "hints": [<optional array of hints>],
  "expectedTopics": [<array of topics to cover>]
}`;

      // Call Gemini with error handling and fallback
      let firstQuestion;
      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        let interviewText = response.text();

        // Clean JSON
        interviewText = interviewText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        firstQuestion = JSON.parse(interviewText);
      } catch (geminiError) {
        const errorMsg = geminiError.message || String(geminiError) || JSON.stringify(geminiError);
        
        // If quota exceeded, use fallback for demo (don't throw error)
        if (errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('Quota') || errorMsg.includes('exceeded')) {
          console.warn('Gemini API quota exceeded, using fallback question for demo');
          // Provide realistic fallback question based on role and type
          const questions = {
            technical: [
              `Can you walk me through your experience with ${roleTitle}? What are the key technologies you've worked with?`,
              `Describe a challenging technical problem you solved in your ${roleTitle} role. How did you approach it?`,
              `What programming languages and frameworks are you most comfortable with for ${roleTitle}?`,
              `Explain a complex system you've designed or worked on. What were the key architectural decisions?`
            ],
            behavioral: [
              `Tell me about a time you had to work under pressure in a ${roleTitle} role. How did you handle it?`,
              `Describe a situation where you had to collaborate with a difficult team member. What was the outcome?`,
              `Can you share an example of how you've grown in your ${roleTitle} career?`,
              `Tell me about a time you had to make a difficult decision. What was your process?`
            ],
            mixed: [
              `Let's start with your background. Can you tell me about your experience as a ${roleTitle}?`,
              `What drew you to the ${roleTitle} field, and what keeps you motivated?`,
              `Describe your ideal ${roleTitle} role and what you'd bring to the team.`
            ],
            'system-design': [
              `Design a scalable system for ${roleTitle.includes('frontend') || roleTitle.includes('Frontend') ? 'a real-time chat application' : 'handling millions of requests per second'}. Walk me through your approach.`,
              `How would you design a distributed system for ${roleTitle}? What are the key components?`,
              `Explain how you would handle system failures and ensure high availability.`
            ],
            leadership: [
              `Describe your leadership style. How do you motivate and manage a team?`,
              `Tell me about a time you had to resolve a conflict within your team.`,
              `How do you handle underperforming team members while maintaining team morale?`
            ]
          };
          
          const questionList = questions[interviewType] || questions.mixed;
          const selectedQuestion = questionList[Math.floor(Math.random() * questionList.length)];
          
          firstQuestion = {
            question: selectedQuestion,
            questionType: interviewType,
            context: `This is a ${interviewType} interview for the ${roleTitle} position. (Note: Using demo mode due to API quota limits)`,
            hints: ['Be specific', 'Use examples', 'Show your thought process'],
            expectedTopics: ['Experience', 'Skills', 'Problem-solving']
          };
        } else {
          // Other errors - throw them
          throw geminiError;
        }
      }

      // Initialize interview session
      const questions = [firstQuestion];
      const answers = [];
      const feedback = [];

      await db.query(
        `INSERT INTO interview_sessions 
         (user_id, session_id, role_title, questions_json, answers_json, feedback_json, status)
         VALUES (?, ?, ?, ?, ?, ?, 'in_progress')`,
        [
          context.userId,
          sessionId,
          roleTitle,
          JSON.stringify(questions),
          JSON.stringify(answers),
          JSON.stringify(feedback)
        ]
      );

      const executionTime = Date.now() - startTime;
      await logAgentAction(
        context.userId,
        'interview',
        'start',
        { roleTitle, interviewType },
        { sessionId, firstQuestion },
        executionTime,
        'success'
      );

      return {
        success: true,
        data: {
          sessionId,
          question: firstQuestion,
          questionNumber: 1,
          totalQuestions: 0 // Will be determined dynamically
        }
      };

    } catch (error) {
      // If we have a fallback question, use it instead of failing
      if (firstQuestion) {
        // Initialize interview session with fallback question
        const questions = [firstQuestion];
        const answers = [];
        const feedback = [];

        try {
          await db.query(
            `INSERT INTO interview_sessions 
             (user_id, session_id, role_title, questions_json, answers_json, feedback_json, status)
             VALUES (?, ?, ?, ?, ?, ?, 'in_progress')`,
            [
              context.userId,
              uuidv4(),
              roleTitle,
              JSON.stringify(questions),
              JSON.stringify(answers),
              JSON.stringify(feedback)
            ]
          );

          const executionTime = Date.now() - startTime;
          await logAgentAction(
            context.userId,
            'interview',
            'start',
            inputData,
            { sessionId, firstQuestion, fallback: true },
            executionTime,
            'success'
          );

          return {
            success: true,
            data: {
              sessionId,
              question: firstQuestion,
              questionNumber: 1,
              totalQuestions: 0
            }
          };
        } catch (dbError) {
          // If DB fails too, return error
        }
      }

      const executionTime = Date.now() - startTime;
      await logAgentAction(
        context.userId,
        'interview',
        'start',
        inputData,
        null,
        executionTime,
        'error',
        error.message
      );

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Continue interview with answer
   */
  async continue(context, inputData) {
    const startTime = Date.now();

    try {
      const { sessionId, answer } = inputData;

      if (!sessionId || !answer) {
        throw new Error('Session ID and answer are required');
      }

      // Get session from database
      const [sessions] = await db.query(
        'SELECT * FROM interview_sessions WHERE session_id = ?',
        [sessionId]
      );

      if (!sessions.length) {
        throw new Error('Interview session not found');
      }

      const session = sessions[0];
      // Safely parse JSON (handle if already parsed)
      const questions = typeof session.questions_json === 'string' 
        ? JSON.parse(session.questions_json) 
        : session.questions_json;
      const answers = typeof session.answers_json === 'string' 
        ? JSON.parse(session.answers_json) 
        : session.answers_json;
      const feedback = typeof session.feedback_json === 'string' 
        ? JSON.parse(session.feedback_json) 
        : session.feedback_json;

      // Add new answer
      answers.push({
        questionNumber: questions.length,
        answer: answer,
        timestamp: new Date().toISOString()
      });

      // Get current question for analysis (the last question asked)
      const currentQuestion = questions && questions.length > 0 ? questions[questions.length - 1] : null;
      
      // Get feedback and next question
      const conversationHistory = this.buildConversationHistory(questions, answers, feedback);
      
      const prompt = `${this.systemPrompt}

Interview Context:
Role: ${session.role_title}
Current Question Number: ${questions.length}

Conversation History:
${conversationHistory}

Latest Answer: ${answer}

Provide:
1. Feedback on the answer (scores and comments)
2. Next question (or conclude if appropriate)

Response format:
{
  "feedback": {
    "clarity": <number 0-100>,
    "technicalAccuracy": <number 0-100>,
    "relevance": <number 0-100>,
    "communication": <number 0-100>,
    "overallScore": <number 0-100>,
    "strengths": [<array of strings>],
    "improvements": [<array of strings>],
    "comments": "<string>"
  },
  "nextQuestion": {
    "question": "<string>",
    "questionType": "<technical|behavioral|mixed>",
    "context": "<string>"
  } | null,
  "isComplete": <boolean>,
  "summary": "<string if complete>"
}`;

      // Get interview type from session or default
      const currentInterviewType = questions[0]?.questionType || 'technical';
      
      // Call Gemini with error handling
      let interviewResponse;
      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        let interviewText = response.text();

        // Clean JSON
        interviewText = interviewText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        interviewResponse = JSON.parse(interviewText);
      } catch (geminiError) {
        const errorMsg = geminiError.message || String(geminiError) || JSON.stringify(geminiError);
        
        // If quota exceeded or other API error, provide intelligent fallback feedback
        if (errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('Quota') || errorMsg.includes('exceeded')) {
          console.warn('Gemini API quota exceeded, using intelligent fallback feedback');
          // Analyze answer quality and provide adaptive feedback
          if (!currentQuestion) {
            // Fallback if no current question available
            interviewResponse = {
              feedback: {
                clarity: 50,
                technicalAccuracy: 50,
                relevance: 30,
                communication: 50,
                overallScore: 45,
                strengths: ['Attempted to answer'],
                improvements: ['Please provide a more detailed and relevant answer'],
                comments: 'Your answer needs improvement. Please provide more specific details and ensure your answer directly addresses the question.'
              },
              nextQuestion: {
                question: this.generateNextQuestion(session.role_title, currentInterviewType, questions.length, 45),
                questionType: currentInterviewType,
                context: `Continuing the ${currentInterviewType} interview for the ${session.role_title} position.`
              },
              isComplete: false,
              summary: null
            };
          } else {
            interviewResponse = this.analyzeAnswerQuality(answer, currentQuestion, currentInterviewType, session.role_title, questions);
          }
        } else {
          // Other errors - throw them
          throw geminiError;
        }
      }

      // Add feedback
      feedback.push(interviewResponse.feedback);

      // Add next question if available
      if (interviewResponse.nextQuestion && !interviewResponse.isComplete) {
        questions.push(interviewResponse.nextQuestion);
      }

      // Update session
      const status = interviewResponse.isComplete ? 'completed' : 'in_progress';
      const overallScore = this.calculateOverallScore(feedback);

      await db.query(
        `UPDATE interview_sessions 
         SET questions_json = ?, answers_json = ?, feedback_json = ?, 
             overall_score = ?, status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE session_id = ?`,
        [
          JSON.stringify(questions),
          JSON.stringify(answers),
          JSON.stringify(feedback),
          overallScore,
          status,
          sessionId
        ]
      );

      const executionTime = Date.now() - startTime;
      await logAgentAction(
        context.userId,
        'interview',
        'continue',
        { sessionId, answerLength: answer.length },
        { feedback: interviewResponse.feedback, hasNext: !!interviewResponse.nextQuestion },
        executionTime,
        'success'
      );

      return {
        success: true,
        data: {
          sessionId,
          feedback: interviewResponse.feedback,
          nextQuestion: interviewResponse.nextQuestion,
          isComplete: interviewResponse.isComplete,
          summary: interviewResponse.summary,
          questionNumber: questions.length,
          overallScore
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      await logAgentAction(
        context.userId,
        'interview',
        'continue',
        inputData,
        null,
        executionTime,
        'error',
        error.message
      );

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build conversation history for context
   */
  buildConversationHistory(questions, answers, feedback) {
    let history = '';
    for (let i = 0; i < questions.length; i++) {
      history += `Q${i + 1}: ${questions[i].question}\n`;
      if (answers[i]) {
        history += `A${i + 1}: ${answers[i].answer}\n`;
      }
      if (feedback[i]) {
        history += `Feedback: ${feedback[i].comments}\n`;
      }
      history += '\n';
    }
    return history;
  }

  /**
   * Calculate overall interview score
   */
  calculateOverallScore(feedback) {
    if (!feedback.length) return 0;
    const total = feedback.reduce((sum, f) => sum + (f.overallScore || 0), 0);
    return Math.round(total / feedback.length);
  }

  /**
   * Analyze answer quality and provide adaptive feedback
   */
  analyzeAnswerQuality(answer, question, interviewType, roleTitle, questions) {
    // Handle case where question might be null or undefined
    if (!question || !question.question) {
      // Fallback if question is missing
      return {
        feedback: {
          clarity: 40,
          technicalAccuracy: 40,
          relevance: 20,
          communication: 40,
          overallScore: 35,
          strengths: ['Attempted to answer'],
          improvements: ['Please ensure your answer addresses the question asked'],
          comments: 'Your answer needs significant improvement. Please provide a relevant and detailed response.'
        },
        nextQuestion: null,
        isComplete: true,
        summary: 'Interview completed. Please try again with a complete question.'
      };
    }
    
    const answerLower = answer.toLowerCase();
    const questionLower = question.question.toLowerCase();
    const answerLength = answer.trim().length;
    const wordCount = answer.trim().split(/\s+/).length;

    // Check relevance - STRICT scoring
    let relevanceScore = 40; // Start lower at 40
    const questionKeywords = this.extractKeywords(questionLower);
    const answerKeywords = this.extractKeywords(answerLower);
    const matchingKeywords = questionKeywords.filter(kw => answerKeywords.includes(kw));
    
    // Calculate keyword match ratio
    const keywordMatchRatio = questionKeywords.length > 0 
      ? matchingKeywords.length / questionKeywords.length 
      : 0;
    
    if (keywordMatchRatio > 0.5) {
      // Good relevance - 60%+ keywords matched
      relevanceScore = Math.min(95, 60 + (keywordMatchRatio * 30));
    } else if (keywordMatchRatio > 0.2) {
      // Partial relevance - 20-50% keywords matched
      relevanceScore = 40 + (keywordMatchRatio * 20);
    } else if (matchingKeywords.length > 0) {
      // Weak relevance - some keywords but low ratio
      relevanceScore = 25 + (matchingKeywords.length * 5);
    } else {
      // No keywords match - answer is likely completely unrelated
      // Check for common unrelated answer patterns
      const unrelatedPatterns = [
        /^(i don't know|idk|not sure|maybe|probably|i think|i guess)/i,
        /^(yes|no|ok|sure|alright|fine)$/i,
        /^(thank you|thanks|okay)$/i
      ];
      const isUnrelatedPattern = unrelatedPatterns.some(pattern => pattern.test(answer.trim()));
      
      if (isUnrelatedPattern || wordCount < 10) {
        relevanceScore = 15; // Very low for unrelated patterns or very short answers
      } else {
        relevanceScore = Math.max(15, 30 - (questionKeywords.length * 3)); // Penalize heavily for no matches
      }
    }

    // Check answer quality indicators
    const hasExamples = answerLower.includes('example') || answerLower.includes('project') || answerLower.includes('worked');
    const hasTechnicalTerms = answerLower.match(/\b(react|javascript|python|java|node|api|database|algorithm|system|design|architecture)\b/i);
    const hasActionWords = answerLower.match(/\b(built|created|developed|implemented|designed|solved|improved|optimized)\b/i);
    const isTooShort = wordCount < 20;
    const isTooLong = wordCount > 500;
    const hasGrammarIssues = (answer.match(/[.!?]/g) || []).length < 1 && wordCount > 30;

    // Calculate clarity score
    let clarityScore = 60;
    if (isTooShort) clarityScore -= 20;
    if (isTooLong) clarityScore -= 10;
    if (hasGrammarIssues) clarityScore -= 15;
    if (hasExamples) clarityScore += 10;
    clarityScore = Math.max(30, Math.min(95, clarityScore));

    // Calculate technical accuracy (based on role and question type)
    let technicalScore = 50;
    if (interviewType === 'technical' || interviewType === 'system-design') {
      if (hasTechnicalTerms) technicalScore += 20;
      if (hasActionWords) technicalScore += 10;
      if (!hasTechnicalTerms && interviewType === 'technical') technicalScore -= 25;
    } else {
      // Behavioral questions
      if (hasExamples) technicalScore += 15;
      if (hasActionWords) technicalScore += 10;
    }
    technicalScore = Math.max(30, Math.min(95, technicalScore));

    // Calculate communication score
    let communicationScore = 60;
    if (wordCount >= 50 && wordCount <= 200) communicationScore += 15;
    if (hasExamples) communicationScore += 10;
    if (isTooShort) communicationScore -= 20;
    if (hasGrammarIssues) communicationScore -= 15;
    communicationScore = Math.max(30, Math.min(95, communicationScore));

    // Overall score (weighted average with relevance penalty)
    // If relevance is very low, cap the overall score
    let baseScore = Math.round(
      (clarityScore * 0.20) +
      (technicalScore * 0.30) +
      (relevanceScore * 0.40) + // Increased weight for relevance
      (communicationScore * 0.10)
    );
    
    // Apply strict penalty for low relevance
    if (relevanceScore < 30) {
      // If relevance is very low, cap overall score at 50
      baseScore = Math.min(baseScore, 50);
    } else if (relevanceScore < 50) {
      // If relevance is low, cap overall score at 65
      baseScore = Math.min(baseScore, 65);
    }
    
    const overallScore = Math.max(15, baseScore); // Minimum score of 15

    // Generate strengths and improvements based on actual answer quality
    const strengths = [];
    const improvements = [];

    if (hasExamples) strengths.push('Good use of concrete examples');
    if (hasTechnicalTerms && interviewType === 'technical') strengths.push('Demonstrated technical knowledge');
    if (wordCount >= 50 && wordCount <= 200) strengths.push('Appropriate answer length');
    if (hasActionWords) strengths.push('Used action-oriented language');

    if (relevanceScore < 50) {
      improvements.push('Answer seems unrelated to the question - focus on addressing what was asked');
    }
    if (isTooShort) {
      improvements.push('Answer is too brief - provide more detail and examples');
    }
    if (isTooLong) {
      improvements.push('Answer is too lengthy - be more concise and focused');
    }
    if (!hasExamples && interviewType !== 'technical') {
      improvements.push('Include specific examples from your experience');
    }
    if (!hasTechnicalTerms && interviewType === 'technical') {
      improvements.push('Include more technical details and terminology');
    }
    if (hasGrammarIssues) {
      improvements.push('Improve sentence structure and clarity');
    }
    if (strengths.length === 0) {
      strengths.push('Attempted to answer the question');
    }
    if (improvements.length === 0) {
      improvements.push('Continue to refine your communication');
    }

    // Generate comments based on score and relevance
    let comments = '';
    if (relevanceScore < 30) {
      // Answer is unrelated
      comments = `Your answer doesn't address the question asked. The question was about "${question.question || 'the topic'}", but your response focused on something else. Please re-read the question and provide a relevant answer that directly addresses what was asked.`;
    } else if (relevanceScore < 50) {
      // Answer is partially related
      comments = `Your answer is somewhat related but doesn't fully address the question. Make sure you're directly answering what was asked: "${question.question || 'the question'}". Provide more specific details that relate to the question.`;
    } else if (overallScore >= 80) {
      comments = 'Excellent answer! You demonstrated strong understanding and provided relevant examples that directly addressed the question.';
    } else if (overallScore >= 65) {
      comments = 'Good answer with room for improvement. Consider adding more specific examples and technical details to strengthen your response.';
    } else if (overallScore >= 50) {
      comments = 'Your answer addresses the question but could be more detailed and specific. Try to provide concrete examples and expand on your points.';
    } else {
      comments = 'Your answer needs significant improvement. Focus on directly addressing the question with relevant examples, clear explanations, and specific details.';
    }

    // Determine if interview should continue
    const questionNumber = (questions?.length || 0) + 1;
    const shouldContinue = questionNumber < 5 && overallScore > 30;

    return {
      feedback: {
        clarity: Math.round(clarityScore),
        technicalAccuracy: Math.round(technicalScore),
        relevance: Math.round(relevanceScore),
        communication: Math.round(communicationScore),
        overallScore: overallScore,
        strengths: strengths,
        improvements: improvements,
        comments: comments
      },
      nextQuestion: shouldContinue ? {
        question: this.generateNextQuestion(roleTitle, interviewType, questionNumber, overallScore),
        questionType: interviewType,
        context: `Continuing the ${interviewType} interview for the ${roleTitle} position.`
      } : null,
      isComplete: !shouldContinue,
      summary: !shouldContinue ? `Interview completed. Overall performance: ${overallScore}/100. ${overallScore >= 70 ? 'Strong performance!' : overallScore >= 50 ? 'Good effort, keep practicing.' : 'Continue practicing to improve your interview skills.'}` : null
    };
  }

  /**
   * Extract keywords from text (helper function)
   */
  extractKeywords(text) {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how'];
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .slice(0, 10);
  }

  /**
   * Generate next question based on performance
   */
  generateNextQuestion(roleTitle, interviewType, questionNumber, previousScore) {
    const questions = {
      technical: [
        `Can you explain a time when you had to optimize performance in a ${roleTitle} project?`,
        `Describe a challenging bug you encountered and how you debugged it.`,
        `How do you stay updated with the latest ${roleTitle} technologies?`,
        `Walk me through how you would design a scalable ${roleTitle} system.`
      ],
      behavioral: [
        `Tell me about a time you had to learn a new technology quickly for a project.`,
        `Describe a situation where you disagreed with a team member. How did you handle it?`,
        `Can you share an example of how you've mentored or helped a colleague?`,
        `Tell me about a project that didn't go as planned and what you learned.`
      ],
      mixed: [
        `What motivates you in your ${roleTitle} career?`,
        `Where do you see yourself in 5 years as a ${roleTitle}?`,
        `What's the most interesting ${roleTitle} project you've worked on?`
      ],
      'system-design': [
        `Design a system to handle 1 million requests per second. Walk me through your approach.`,
        `How would you design a distributed caching system?`,
        `Explain how you would build a real-time notification system.`
      ],
      leadership: [
        `How do you handle conflicts within your team?`,
        `Describe your approach to giving feedback to team members.`,
        `Tell me about a time you had to make a difficult decision as a leader.`
      ]
    };

    const questionList = questions[interviewType] || questions.mixed;
    return questionList[questionNumber % questionList.length];
  }
}

module.exports = InterviewAgent;

