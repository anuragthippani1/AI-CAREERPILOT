/**
 * Practice Agent
 * Provides AI-powered hints, explanations, and personalized recommendations
 */

const { getModel } = require('../config/gemini');
const questionBank = require('../services/questionBank');
const db = require('../config/database');
const { logAgentAction } = require('../utils/logger');

class PracticeAgent {
  constructor() {
    this.model = getModel('gemini-2.0-flash-lite');
    this.systemPrompt = `You are a helpful Coding Practice Assistant for CareerPilot.
Your responsibilities:
1. Provide hints when users are stuck (without giving away the solution)
2. Explain solutions after users submit code
3. Suggest similar problems based on user performance
4. Generate personalized practice recommendations

Always:
- Be encouraging and supportive
- Provide hints that guide thinking, not direct answers
- Explain concepts clearly with examples
- Suggest problems of appropriate difficulty
- Focus on learning and improvement

Format your response as JSON when possible.`;
  }

  /**
   * Get hint for a question
   */
  async getHint(userId, questionId, userCode = null, attempts = 0) {
    const startTime = Date.now();

    try {
      const question = await questionBank.getQuestionById(questionId);
      if (!question) {
        throw new Error('Question not found');
      }

      // Get user's progress on this question
      const [progress] = await db.query(
        'SELECT * FROM practice_progress WHERE user_id = ? AND question_id = ?',
        [userId, questionId]
      );

      const prompt = `${this.systemPrompt}

Question: ${question.title}
Description: ${question.description}
Difficulty: ${question.difficulty}
Topics: ${question.topics.join(', ')}
${question.examples.length > 0 ? `Examples: ${JSON.stringify(question.examples)}` : ''}

${userCode ? `User's current code:\n\`\`\`\n${userCode}\n\`\`\`` : 'User has not started coding yet.'}
Attempts: ${attempts}

Provide a helpful hint that guides the user's thinking without giving away the solution.
The hint should:
- Point them in the right direction
- Suggest what to think about
- Reference relevant concepts
- Be encouraging

Response format:
{
  "hint": "<hint text>",
  "concepts": ["<concept1>", "<concept2>"],
  "nextStep": "<suggestion for next step>"
}`;

      let hintData;
      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        let hintText = response.text();

        // Clean JSON
        hintText = hintText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        hintData = JSON.parse(hintText);
      } catch (geminiError) {
        // Fallback hint
        hintData = this.generateFallbackHint(question, attempts);
      }

      const executionTime = Date.now() - startTime;
      await logAgentAction(
        userId,
        'practice',
        'get_hint',
        { questionId, attempts },
        hintData,
        executionTime,
        'success'
      );

      return {
        success: true,
        data: hintData
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      await logAgentAction(
        userId,
        'practice',
        'get_hint',
        { questionId },
        { error: error.message },
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
   * Explain solution after submission
   */
  async explainSolution(userId, questionId, userCode, executionResult) {
    const startTime = Date.now();

    try {
      const question = await questionBank.getQuestionById(questionId);
      if (!question) {
        throw new Error('Question not found');
      }

      // Get optimal solution if available
      const [solutions] = await db.query(
        'SELECT * FROM question_solutions WHERE question_id = ? AND is_optimal = true LIMIT 1',
        [questionId]
      );

      const prompt = `${this.systemPrompt}

Question: ${question.title}
Description: ${question.description}
Difficulty: ${question.difficulty}
Topics: ${question.topics.join(', ')}

User's code:
\`\`\`
${userCode}
\`\`\`

Execution results:
- Passed: ${executionResult.passedTests}/${executionResult.totalTests} test cases
- Status: ${executionResult.success ? 'Success' : 'Failed'}

${executionResult.results.map((r, i) => `Test ${i + 1}: ${r.passed ? 'Passed' : 'Failed'}\nInput: ${r.input}\nExpected: ${r.expectedOutput}\nActual: ${r.actualOutput}${r.error ? `\nError: ${r.error}` : ''}`).join('\n\n')}

${solutions.length > 0 ? `Optimal solution:\n\`\`\`\n${solutions[0].solution_code}\n\`\`\`\nTime Complexity: ${solutions[0].time_complexity}\nSpace Complexity: ${solutions[0].space_complexity}` : ''}

Provide a comprehensive explanation:
1. What the user's code does (correctly or incorrectly)
2. Why it passed/failed the test cases
3. Key concepts and approaches
4. How to improve (if failed)
5. Alternative approaches

Response format:
{
  "explanation": "<detailed explanation>",
  "keyConcepts": ["<concept1>", "<concept2>"],
  "improvements": ["<improvement1>", "<improvement2>"],
  "alternativeApproaches": ["<approach1>", "<approach2>"]
}`;

      let explanationData;
      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        let explanationText = response.text();

        // Clean JSON
        explanationText = explanationText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        explanationData = JSON.parse(explanationText);
      } catch (geminiError) {
        // Fallback explanation
        explanationData = this.generateFallbackExplanation(question, executionResult);
      }

      const executionTime = Date.now() - startTime;
      await logAgentAction(
        userId,
        'practice',
        'explain_solution',
        { questionId },
        explanationData,
        executionTime,
        'success'
      );

      return {
        success: true,
        data: explanationData
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      await logAgentAction(
        userId,
        'practice',
        'explain_solution',
        { questionId },
        { error: error.message },
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
   * Suggest similar problems
   */
  async suggestSimilarProblems(userId, questionId) {
    try {
      const question = await questionBank.getQuestionById(questionId);
      if (!question) {
        throw new Error('Question not found');
      }

      // Get user's progress to understand their skill level
      const [userProgress] = await db.query(
        `SELECT 
          AVG(best_score) as avg_score,
          COUNT(CASE WHEN completion_status = 'solved' THEN 1 END) as solved_count
        FROM practice_progress
        WHERE user_id = ?`,
        [userId]
      );

      const avgScore = userProgress[0]?.avg_score || 50;
      const difficulty = avgScore > 70 ? 'hard' : avgScore > 40 ? 'medium' : 'easy';

      // Find similar questions by topic
      const similarQuestions = await questionBank.getQuestionsByFilter({
        topic: question.topics[0], // Use first topic
        difficulty: difficulty,
        limit: 10
      });

      // Filter out the current question
      const filtered = similarQuestions.filter(q => q.id !== questionId).slice(0, 5);

      return {
        success: true,
        data: {
          similarQuestions: filtered,
          reason: `Based on your performance and the topics in this question (${question.topics.join(', ')})`
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate personalized practice recommendations
   */
  async generateRecommendations(userId) {
    const startTime = Date.now();

    try {
      // Get user's practice history
      const [progress] = await db.query(
        `SELECT 
          pp.question_id,
          pp.completion_status,
          pp.best_score,
          cq.difficulty,
          cq.topics
        FROM practice_progress pp
        JOIN coding_questions cq ON pp.question_id = cq.id
        WHERE pp.user_id = ?
        ORDER BY pp.updated_at DESC
        LIMIT 20`,
        [userId]
      );

      // Analyze strengths and weaknesses
      const topics = {};
      const difficulties = { easy: 0, medium: 0, hard: 0 };

      progress.forEach(p => {
        const topicsList = typeof p.topics === 'string' ? JSON.parse(p.topics) : p.topics;
        topicsList.forEach(topic => {
          if (!topics[topic]) {
            topics[topic] = { solved: 0, attempted: 0, avgScore: 0 };
          }
          topics[topic].attempted++;
          if (p.completion_status === 'solved') {
            topics[topic].solved++;
          }
          topics[topic].avgScore = (topics[topic].avgScore * (topics[topic].attempted - 1) + (p.best_score || 0)) / topics[topic].attempted;
        });

        difficulties[p.difficulty]++;
      });

      // Find weak areas
      const weakTopics = Object.entries(topics)
        .filter(([_, stats]) => stats.avgScore < 50 || stats.solved / stats.attempted < 0.5)
        .map(([topic, _]) => topic);

      // Generate recommendations
      const recommendations = [];
      
      // Recommend questions in weak topics
      for (const topic of weakTopics.slice(0, 3)) {
        const questions = await questionBank.getQuestionsByFilter({
          topic: topic,
          difficulty: 'medium',
          limit: 3
        });
        recommendations.push(...questions);
      }

      // Recommend next difficulty level
      const currentDifficulty = difficulties.medium > difficulties.easy ? 'hard' : 'medium';
      const nextLevelQuestions = await questionBank.getQuestionsByFilter({
        difficulty: currentDifficulty,
        limit: 5
      });
      recommendations.push(...nextLevelQuestions);

      // Remove duplicates and limit
      const uniqueRecommendations = Array.from(
        new Map(recommendations.map(q => [q.id, q])).values()
      ).slice(0, 10);

      const executionTime = Date.now() - startTime;
      await logAgentAction(
        userId,
        'practice',
        'generate_recommendations',
        {},
        { count: uniqueRecommendations.length },
        executionTime,
        'success'
      );

      return {
        success: true,
        data: {
          recommendations: uniqueRecommendations,
          weakTopics,
          strengths: Object.entries(topics)
            .filter(([_, stats]) => stats.avgScore > 70)
            .map(([topic, _]) => topic)
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      await logAgentAction(
        userId,
        'practice',
        'generate_recommendations',
        {},
        { error: error.message },
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
   * Generate fallback hint
   */
  generateFallbackHint(question, attempts) {
    const hints = [
      `Think about the problem step by step. What are the key constraints?`,
      `Consider what data structures might be useful for this problem.`,
      `Try breaking the problem into smaller subproblems.`,
      `Think about edge cases - what happens with empty inputs or single elements?`,
      `Consider the time and space complexity trade-offs.`
    ];

    return {
      hint: hints[attempts % hints.length] || hints[0],
      concepts: question.topics.slice(0, 2),
      nextStep: 'Try to identify the pattern or algorithm that applies here.'
    };
  }

  /**
   * Generate fallback explanation
   */
  generateFallbackExplanation(question, executionResult) {
    return {
      explanation: executionResult.success
        ? `Your solution correctly solves the problem! The code passes all test cases.`
        : `Your solution needs some adjustments. Review the failed test cases to understand what went wrong.`,
      keyConcepts: question.topics,
      improvements: executionResult.success ? [] : [
        'Review the failed test cases',
        'Check edge cases',
        'Verify your logic matches the problem requirements'
      ],
      alternativeApproaches: []
    };
  }
}

module.exports = PracticeAgent;



