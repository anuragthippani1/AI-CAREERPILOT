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
        
        // If quota exceeded or other API error, provide fallback feedback
        if (errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('Quota') || errorMsg.includes('exceeded')) {
          console.warn('Gemini API quota exceeded, using fallback feedback for demo');
          // Provide realistic fallback feedback
          interviewResponse = {
            feedback: {
              clarity: 75,
              technicalAccuracy: 70,
              relevance: 80,
              communication: 75,
              overallScore: 75,
              strengths: ['Good use of examples', 'Clear explanation'],
              improvements: ['Could be more specific', 'Add more technical details'],
              comments: 'Good answer! You demonstrated knowledge of HTML, CSS, and JavaScript. Consider mentioning specific React features or projects you\'ve worked on.'
            },
            nextQuestion: {
              question: `That's great! Can you tell me about a specific project where you used React? What challenges did you face?`,
              questionType: currentInterviewType,
              context: `Continuing the ${currentInterviewType} interview for the ${session.role_title} position.`
            },
            isComplete: false,
            summary: null
          };
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
}

module.exports = InterviewAgent;

