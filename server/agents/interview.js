/**
 * Interview Agent
 * Conducts AI-powered mock interviews with adaptive questions
 */

const { getModel } = require('../config/gemini');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { logAgentAction } = require('../utils/logger');
const questionBank = require('../services/questionBank');
const gamification = require('../services/gamification');
const achievements = require('../services/achievements');

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
      const interviewType = inputData.type || 'technical'; // technical, behavioral, mixed, system-design, leadership, coding
      const companyName = inputData.companyName || null;

      // Get user context for personalized questions
      const resumeAnalysis = context.resume?.analysis_json 
        ? (typeof context.resume.analysis_json === 'string' 
            ? JSON.parse(context.resume.analysis_json) 
            : context.resume.analysis_json)
        : null;

      // For technical/coding interviews, try to get a real coding problem
      let codingQuestion = null;
      if (interviewType === 'technical' || interviewType === 'coding' || interviewType === 'mixed') {
        try {
          codingQuestion = await this.getCodingQuestion(roleTitle, 'medium');
          if (codingQuestion) {
            // Format coding question for interview
            firstQuestion = {
              question: `Let's solve a coding problem:\n\n${codingQuestion.title}\n\n${codingQuestion.description}\n\nExamples:\n${codingQuestion.examples.map((ex, i) => `Example ${i + 1}:\nInput: ${ex.input}\nOutput: ${ex.output}`).join('\n\n')}`,
              questionType: 'coding',
              questionId: codingQuestion.id,
              context: `This is a coding interview question for the ${roleTitle} position.`,
              hints: codingQuestion.hints || [],
              expectedTopics: codingQuestion.topics || [],
              constraints: codingQuestion.constraints,
              testCases: codingQuestion.testCases,
              solutionTemplate: codingQuestion.solutionTemplate
            };
          }
        } catch (error) {
          console.warn('Could not fetch coding question, using AI-generated question:', error.message);
        }
      }

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

      // If we already have a coding question, skip AI generation
      if (!firstQuestion) {
        // Call Gemini with error handling and fallback
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
      const questionText = currentQuestion?.question || 'The interview question';
      
      // Get feedback and next question
      const conversationHistory = this.buildConversationHistory(questions, answers, feedback);
      
      // Determine difficulty level based on question number
      const difficultyLevel = questions.length <= 2 ? 'beginner' : questions.length <= 4 ? 'intermediate' : 'advanced';
      
      const prompt = `You are an AI Interview Evaluator for CareerPilot.

Interview Context:
- Target Role: ${session.role_title}
- Difficulty Level: ${difficultyLevel}
- Question: ${questionText}

Evaluate the candidate's answer using this rubric:

1. Relevance (0–3): Does the answer directly address the question?
2. Conceptual Understanding (0–3): Is the technical understanding correct?
3. Reasoning & Explanation (0–2): Does the answer explain why/how?
4. Originality (0–2): Is it expressed in the candidate's own words?

Scoring rules:
- If the answer repeats or paraphrases the question → total score MUST be ≤ 2
- If the answer is vague or generic → total score MUST be ≤ 4
- A strong, well-reasoned answer → total score ≥ 7

Candidate's Answer: ${answer}

Return ONLY valid JSON (no markdown, no code blocks, no explanations):

{
  "score": <0-10>,
  "breakdown": {
    "relevance": <0-3>,
    "understanding": <0-3>,
    "reasoning": <0-2>,
    "originality": <0-2>
  },
  "strengths": ["..."],
  "improvements": ["..."],
  "final_feedback": "One short paragraph",
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
      
      // Call Gemini with error handling and strict JSON parsing
      let interviewResponse;
      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        let interviewText = response.text();

        // Clean JSON - remove markdown code blocks and whitespace
        interviewText = interviewText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // Try to parse JSON
        try {
          interviewResponse = JSON.parse(interviewText);
          
          // Validate and normalize the response structure
          interviewResponse = this.validateAndNormalizeEvaluationResponse(interviewResponse, answer, currentQuestion, currentInterviewType, session.role_title, questions);
        } catch (parseError) {
          // Retry with stricter system message if JSON parsing fails
          console.warn('JSON parsing failed, retrying with stricter prompt:', parseError.message);
          const strictPrompt = `You are an AI Interview Evaluator. You MUST return ONLY valid JSON, no other text.

Interview Context:
- Target Role: ${session.role_title}
- Difficulty Level: ${difficultyLevel}
- Question: ${questionText}
- Candidate's Answer: ${answer}

Evaluate using this rubric:
1. Relevance (0–3): Does the answer directly address the question?
2. Conceptual Understanding (0–3): Is the technical understanding correct?
3. Reasoning & Explanation (0–2): Does the answer explain why/how?
4. Originality (0–2): Is it expressed in the candidate's own words?

Scoring rules:
- If answer repeats/paraphrases question → score ≤ 2
- If answer is vague/generic → score ≤ 4
- Strong answer → score ≥ 7

Return ONLY this JSON structure (no markdown, no code blocks):
{"score":0-10,"breakdown":{"relevance":0-3,"understanding":0-3,"reasoning":0-2,"originality":0-2},"strengths":[],"improvements":[],"final_feedback":"","nextQuestion":null,"isComplete":false,"summary":null}`;
          
          const retryResult = await this.model.generateContent(strictPrompt);
          const retryResponse = await retryResult.response;
          let retryText = retryResponse.text();
          retryText = retryText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          interviewResponse = JSON.parse(retryText);
          interviewResponse = this.validateAndNormalizeEvaluationResponse(interviewResponse, answer, currentQuestion, currentInterviewType, session.role_title, questions);
        }
      } catch (geminiError) {
        const errorMsg = geminiError.message || String(geminiError) || JSON.stringify(geminiError);
        
        // If quota exceeded or other API error, provide intelligent fallback feedback
        if (errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('Quota') || errorMsg.includes('exceeded')) {
          console.warn('Gemini API quota exceeded, using intelligent fallback feedback');
          // Analyze answer quality and provide adaptive feedback
          if (!currentQuestion) {
            // Fallback if no current question available - use rubric format
            interviewResponse = {
              score: 3,
              breakdown: {
                relevance: 1,
                understanding: 1,
                reasoning: 0,
                originality: 1
              },
              strengths: ['Attempted to answer'],
              improvements: ['Please provide a more detailed and relevant answer'],
              final_feedback: 'Your answer needs improvement. Please provide more specific details and ensure your answer directly addresses the question.',
              nextQuestion: {
                question: this.generateNextQuestion(session.role_title, currentInterviewType, questions.length, 30),
                questionType: currentInterviewType,
                context: `Continuing the ${currentInterviewType} interview for the ${session.role_title} position.`
              },
              isComplete: false,
              summary: null
            };
          } else {
            // Use rubric-based fallback evaluation
            interviewResponse = this.analyzeAnswerQuality(answer, currentQuestion, currentInterviewType, session.role_title, questions);
          }
        } else {
          // Other errors - throw them
          throw geminiError;
        }
      }

      // Add feedback (convert from new format to legacy format for compatibility)
      const legacyFeedback = this.convertToLegacyFeedbackFormat(interviewResponse);
      feedback.push(legacyFeedback);

      // Add next question if available (use the one from response or generate)
      if (interviewResponse.nextQuestion && !interviewResponse.isComplete) {
        questions.push(interviewResponse.nextQuestion);
      } else if (!interviewResponse.isComplete && !interviewResponse.nextQuestion) {
        // Generate next question if not provided
        const questionNumber = questions.length + 1;
        const shouldContinue = questionNumber < 5 && interviewResponse.score > 3;
        if (shouldContinue) {
          questions.push({
            question: this.generateNextQuestion(session.role_title, currentInterviewType, questionNumber, interviewResponse.score * 10),
            questionType: currentInterviewType,
            context: `Continuing the ${currentInterviewType} interview for the ${session.role_title} position.`
          });
        }
      }

      // Update session
      const status = interviewResponse.isComplete ? 'completed' : 'in_progress';
      // Use the new score format (0-10) converted to 0-100 for legacy compatibility
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

      // Award XP and check achievements if interview is completed
      let xpResult = null;
      let unlockedAchievements = [];
      if (status === 'completed') {
        try {
          // Calculate XP: 50 base + (score/10) bonus + 10 per question
          const baseXP = 50;
          const scoreBonus = Math.round(overallScore / 10);
          const questionBonus = questions.length * 10;
          const totalXP = baseXP + scoreBonus + questionBonus;

          // Award XP
          xpResult = await gamification.awardXP(context.userId, totalXP, 'interview');

          // Update streak
          await gamification.updateStreak(context.userId);

          // Check and unlock achievements
          const interviewTime = Math.floor((Date.now() - new Date(session.created_at).getTime()) / 1000);
          unlockedAchievements = await achievements.checkAchievements(context.userId, 'complete_interview', {
            score: overallScore,
            time: interviewTime,
            questionCount: questions.length
          });
        } catch (error) {
          console.error('Error awarding XP/achievements for interview:', error);
          // Don't fail the interview if gamification fails
        }
      }

      const executionTime = Date.now() - startTime;
      await logAgentAction(
        context.userId,
        'interview',
        'continue',
        { sessionId, answerLength: answer.length },
        { feedback: legacyFeedback, hasNext: !!interviewResponse.nextQuestion },
        executionTime,
        'success'
      );

      return {
        success: true,
        data: {
          sessionId,
          feedback: legacyFeedback,
          xpGained: xpResult ? xpResult.xpGained : null,
          leveledUp: xpResult ? xpResult.leveledUp : false,
          newLevel: xpResult ? xpResult.newLevel : null,
          unlockedAchievements: unlockedAchievements,
          nextQuestion: interviewResponse.nextQuestion || (interviewResponse.isComplete ? null : {
            question: this.generateNextQuestion(session.role_title, currentInterviewType, questions.length + 1, interviewResponse.score * 10),
            questionType: currentInterviewType,
            context: `Continuing the ${currentInterviewType} interview for the ${session.role_title} position.`
          }),
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
   * Validate and normalize evaluation response from AI
   */
  validateAndNormalizeEvaluationResponse(response, answer, question, interviewType, roleTitle, questions) {
    // Ensure score is between 0-10
    let score = typeof response.score === 'number' ? Math.max(0, Math.min(10, response.score)) : 5;
    
    // Validate breakdown
    const breakdown = response.breakdown || {};
    const relevance = Math.max(0, Math.min(3, breakdown.relevance || 0));
    const understanding = Math.max(0, Math.min(3, breakdown.understanding || 0));
    const reasoning = Math.max(0, Math.min(2, breakdown.reasoning || 0));
    const originality = Math.max(0, Math.min(2, breakdown.originality || 0));
    
    // Recalculate score from breakdown if provided
    const calculatedScore = relevance + understanding + reasoning + originality;
    if (calculatedScore >= 0 && calculatedScore <= 10) {
      score = calculatedScore;
    }
    
    // Apply strict scoring rules
    const answerLower = answer.toLowerCase();
    const questionText = question?.question?.toLowerCase() || '';
    
    // Check if answer repeats/paraphrases question
    const questionWords = questionText.split(/\s+/).filter(w => w.length > 3);
    const answerWords = answerLower.split(/\s+/);
    const repeatedWords = questionWords.filter(qw => answerWords.includes(qw));
    const repetitionRatio = questionWords.length > 0 ? repeatedWords.length / questionWords.length : 0;
    
    if (repetitionRatio > 0.5) {
      // Answer mostly repeats question - cap at 2
      score = Math.min(score, 2);
    }
    
    // Check if answer is vague/generic
    const vaguePatterns = ['i think', 'maybe', 'probably', 'i guess', 'not sure', 'i don\'t know'];
    const isVague = vaguePatterns.some(pattern => answerLower.includes(pattern)) || answer.trim().length < 30;
    if (isVague && score > 4) {
      score = Math.min(score, 4);
    }
    
    return {
      score: Math.max(0, Math.min(10, score)),
      breakdown: {
        relevance,
        understanding,
        reasoning,
        originality
      },
      strengths: Array.isArray(response.strengths) ? response.strengths : [],
      improvements: Array.isArray(response.improvements) ? response.improvements : [],
      final_feedback: response.final_feedback || response.comments || 'Please provide a more detailed answer.',
      nextQuestion: response.nextQuestion || null,
      isComplete: response.isComplete === true,
      summary: response.summary || null
    };
  }

  /**
   * Convert new rubric format (0-10) to legacy format (0-100) for compatibility
   */
  convertToLegacyFeedbackFormat(response) {
    const breakdown = response.breakdown || {};
    
    // Convert 0-10 score to 0-100
    const overallScore = Math.round((response.score / 10) * 100);
    
    // Convert breakdown scores (0-3, 0-3, 0-2, 0-2) to 0-100 scale
    const relevance = Math.round((breakdown.relevance / 3) * 100);
    const understanding = Math.round((breakdown.understanding / 3) * 100);
    const reasoning = Math.round((breakdown.reasoning / 2) * 100);
    const originality = Math.round((breakdown.originality / 2) * 100);
    
    // Map to legacy format
    return {
      clarity: Math.round((reasoning + originality) / 2), // Average of reasoning and originality
      technicalAccuracy: understanding,
      relevance: relevance,
      communication: Math.round((reasoning + originality) / 2),
      overallScore: overallScore,
      strengths: response.strengths || [],
      improvements: response.improvements || [],
      comments: response.final_feedback || 'Please provide a more detailed answer.'
    };
  }

  /**
   * Analyze answer quality and provide adaptive feedback (fallback method using rubric)
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

    // Convert to new rubric format (0-10 scale)
    // Map old scores (0-100) to new rubric (0-10)
    const relevanceRubric = Math.min(3, Math.round((relevanceScore / 100) * 3));
    const understandingRubric = Math.min(3, Math.round((technicalScore / 100) * 3));
    const reasoningRubric = Math.min(2, Math.round((clarityScore / 100) * 2));
    const originalityRubric = Math.min(2, Math.round((communicationScore / 100) * 2));
    
    // Calculate total score (0-10)
    let totalScore = relevanceRubric + understandingRubric + reasoningRubric + originalityRubric;
    
    // Apply strict rules (answerLower already declared above)
    const questionText = question?.question?.toLowerCase() || '';
    const questionWords = questionText.split(/\s+/).filter(w => w.length > 3);
    const answerWords = answerLower.split(/\s+/);
    const repeatedWords = questionWords.filter(qw => answerWords.includes(qw));
    const repetitionRatio = questionWords.length > 0 ? repeatedWords.length / questionWords.length : 0;
    
    if (repetitionRatio > 0.5) {
      totalScore = Math.min(totalScore, 2);
    }
    
    const vaguePatterns = ['i think', 'maybe', 'probably', 'i guess', 'not sure', 'i don\'t know'];
    const isVague = vaguePatterns.some(pattern => answerLower.includes(pattern)) || wordCount < 30;
    if (isVague && totalScore > 4) {
      totalScore = Math.min(totalScore, 4);
    }
    
    const rubricResponse = {
      score: Math.max(0, Math.min(10, totalScore)),
      breakdown: {
        relevance: relevanceRubric,
        understanding: understandingRubric,
        reasoning: reasoningRubric,
        originality: originalityRubric
      },
      strengths: strengths,
      improvements: improvements,
      final_feedback: comments,
      nextQuestion: shouldContinue ? {
        question: this.generateNextQuestion(roleTitle, interviewType, questionNumber, totalScore * 10),
        questionType: interviewType,
        context: `Continuing the ${interviewType} interview for the ${roleTitle} position.`
      } : null,
      isComplete: !shouldContinue,
      summary: !shouldContinue ? `Interview completed. Overall performance: ${totalScore}/10. ${totalScore >= 7 ? 'Strong performance!' : totalScore >= 5 ? 'Good effort, keep practicing.' : 'Continue practicing to improve your interview skills.'}` : null
    };
    
    // Convert to legacy format for return
    return rubricResponse;
  }

  /**
   * Get coding question for interview
   */
  async getCodingQuestion(roleTitle, difficulty = 'medium') {
    try {
      const question = await questionBank.getQuestionForInterview(roleTitle, difficulty);
      return question;
    } catch (error) {
      console.error('Error getting coding question:', error);
      return null;
    }
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

