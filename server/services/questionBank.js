/**
 * Question Bank Service
 * Fetches questions from GeeksforGeeks/LeetCode APIs or uses local database
 */

const db = require('../config/database');
const axios = require('axios');

class QuestionBankService {
  constructor() {
    this.cache = new Map(); // Simple in-memory cache
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get question by ID
   */
  async getQuestionById(id) {
    try {
      const [questions] = await db.query(
        'SELECT * FROM coding_questions WHERE id = ?',
        [id]
      );

      if (questions.length === 0) {
        return null;
      }

      const question = questions[0];
      return this.formatQuestion(question);
    } catch (error) {
      console.error('Error fetching question by ID:', error);
      throw error;
    }
  }

  /**
   * Get questions by filter
   */
  async getQuestionsByFilter(filters = {}) {
    try {
      let query = 'SELECT * FROM coding_questions WHERE 1=1';
      const params = [];

      if (filters.difficulty) {
        query += ' AND difficulty = ?';
        params.push(filters.difficulty);
      }

      if (filters.topic) {
        query += ' AND JSON_CONTAINS(topics, ?)';
        params.push(JSON.stringify(filters.topic));
      }

      if (filters.company) {
        query += ' AND JSON_CONTAINS(company_tags, ?)';
        params.push(JSON.stringify(filters.company));
      }

      if (filters.source) {
        query += ' AND source = ?';
        params.push(filters.source);
      }

      if (filters.search) {
        query += ' AND (MATCH(title, description) AGAINST(? IN NATURAL LANGUAGE MODE) OR title LIKE ?)';
        const searchTerm = filters.search;
        params.push(searchTerm, `%${searchTerm}%`);
      }

      // Ordering
      const allowedOrderBy = new Set(['id', 'title', 'difficulty', 'created_at', 'updated_at']);
      const requestedOrderBy = (filters.orderBy || 'id').toString();
      const orderBy = allowedOrderBy.has(requestedOrderBy) ? requestedOrderBy : 'id';

      const requestedOrderDir = (filters.orderDir || 'ASC').toString().toUpperCase();
      const orderDir = requestedOrderDir === 'DESC' ? 'DESC' : 'ASC';

      query += ` ORDER BY ${orderBy} ${orderDir}`;

      // Pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [questions] = await db.query(query, params);

      return questions.map(q => this.formatQuestion(q));
    } catch (error) {
      // Demo-safe: if schema isn't migrated yet, return empty list (routes/agents can fallback)
      if (error && (error.code === 'ER_NO_SUCH_TABLE' || error.errno === 1146 || error.sqlState === '42S02')) {
        console.warn('⚠️  coding_questions table is missing. Run DB schema/migrations to enable coding practice.');
        return [];
      }
      console.error('Error fetching questions by filter:', error);
      throw error;
    }
  }

  /**
   * Fetch question from GeeksforGeeks API (if available)
   */
  async fetchFromGeeksforGeeks(questionId) {
    try {
      // GeeksforGeeks doesn't have a public API, so we'll use web scraping as fallback
      // For now, return null to use local database
      // In production, you could implement web scraping here
      return null;
    } catch (error) {
      console.error('Error fetching from GeeksforGeeks:', error);
      return null;
    }
  }

  /**
   * Fetch question from LeetCode API
   */
  async fetchFromLeetCode(questionSlug) {
    try {
      // LeetCode GraphQL API endpoint
      const graphqlEndpoint = 'https://leetcode.com/graphql/';
      
      const query = `
        query getQuestionDetail($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            questionId
            title
            content
            difficulty
            topicTags {
              name
            }
            codeSnippets {
              lang
              code
            }
            exampleTestcases
            hints
          }
        }
      `;

      const variables = { titleSlug: questionSlug };

      const response = await axios.post(graphqlEndpoint, {
        query,
        variables
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000
      });

      if (response.data && response.data.data && response.data.data.question) {
        return this.formatLeetCodeQuestion(response.data.data.question);
      }

      return null;
    } catch (error) {
      console.error('Error fetching from LeetCode API:', error);
      // Return null to fallback to local database
      return null;
    }
  }

  /**
   * Format LeetCode question to our schema
   */
  formatLeetCodeQuestion(leetcodeQuestion) {
    return {
      title: leetcodeQuestion.title,
      slug: leetcodeQuestion.questionId,
      description: leetcodeQuestion.content,
      difficulty: leetcodeQuestion.difficulty.toLowerCase(),
      topics: leetcodeQuestion.topicTags?.map(tag => tag.name) || [],
      examples: this.parseExamples(leetcodeQuestion.exampleTestcases),
      hints: leetcodeQuestion.hints || [],
      source: 'leetcode',
      source_id: leetcodeQuestion.questionId,
      solution_template: this.parseCodeSnippets(leetcodeQuestion.codeSnippets)
    };
  }

  /**
   * Parse LeetCode examples
   */
  parseExamples(exampleTestcases) {
    if (!exampleTestcases) return [];
    
    // LeetCode examples are usually in format: "input1\noutput1\ninput2\noutput2"
    const parts = exampleTestcases.split('\n');
    const examples = [];
    
    for (let i = 0; i < parts.length; i += 2) {
      if (parts[i] && parts[i + 1]) {
        examples.push({
          input: parts[i],
          output: parts[i + 1],
          explanation: ''
        });
      }
    }
    
    return examples;
  }

  /**
   * Parse LeetCode code snippets
   */
  parseCodeSnippets(codeSnippets) {
    if (!codeSnippets) return {};
    
    const templates = {};
    codeSnippets.forEach(snippet => {
      const lang = snippet.lang.toLowerCase();
      templates[lang] = snippet.code;
    });
    
    return templates;
  }

  /**
   * Get random question by difficulty and topic
   */
  async getRandomQuestion(difficulty = null, topic = null) {
    try {
      const filters = {};
      if (difficulty) filters.difficulty = difficulty;
      if (topic) filters.topic = topic;

      const questions = await this.getQuestionsByFilter({
        ...filters,
        limit: 100
      });

      if (questions.length === 0) {
        return null;
      }

      const randomIndex = Math.floor(Math.random() * questions.length);
      return questions[randomIndex];
    } catch (error) {
      console.error('Error getting random question:', error);
      throw error;
    }
  }

  /**
   * Get question for interview based on role
   */
  async getQuestionForInterview(roleTitle, difficulty = 'medium') {
    try {
      // Determine relevant topics based on role
      const roleTopics = this.getTopicsForRole(roleTitle);
      
      // Try to get a question matching the role topics
      let question = null;
      for (const topic of roleTopics) {
        question = await this.getRandomQuestion(difficulty, topic);
        if (question) break;
      }

      // Fallback to any question of the difficulty
      if (!question) {
        question = await this.getRandomQuestion(difficulty);
      }

      return question;
    } catch (error) {
      console.error('Error getting question for interview:', error);
      throw error;
    }
  }

  /**
   * Get relevant topics for a role
   */
  getTopicsForRole(roleTitle) {
    const roleLower = roleTitle.toLowerCase();
    
    if (roleLower.includes('frontend') || roleLower.includes('react') || roleLower.includes('angular')) {
      return ['Arrays', 'Strings', 'Trees', 'Graphs'];
    } else if (roleLower.includes('backend') || roleLower.includes('server')) {
      return ['Arrays', 'Strings', 'Dynamic Programming', 'Graphs', 'System Design'];
    } else if (roleLower.includes('fullstack') || roleLower.includes('full stack')) {
      return ['Arrays', 'Strings', 'Trees', 'Graphs'];
    } else if (roleLower.includes('data') || roleLower.includes('ml') || roleLower.includes('ai')) {
      return ['Arrays', 'Dynamic Programming', 'Graphs', 'Math'];
    } else {
      return ['Arrays', 'Strings', 'Trees', 'Graphs', 'Dynamic Programming'];
    }
  }

  /**
   * Format question for response
   */
  formatQuestion(question) {
    const topics = typeof question.topics === 'string' ? JSON.parse(question.topics) : question.topics;
    const examples = typeof question.examples === 'string' ? JSON.parse(question.examples) : question.examples;
    const requiredCategories = new Set([
      'Arrays',
      'Strings',
      'Linked List',
      'Stack & Queue',
      'Hashing',
      'Recursion',
      'Trees',
      'Binary Search',
      'Graphs',
      'Dynamic Programming',
      'Greedy',
      'Bit Manipulation'
    ]);

    const category =
      (Array.isArray(topics) ? topics.find(t => requiredCategories.has(t)) : null) ||
      (Array.isArray(topics) && topics.length > 0 ? topics[0] : null);

    const firstExample = Array.isArray(examples) && examples.length > 0 ? examples[0] : null;

    return {
      id: question.id,
      title: question.title,
      slug: question.slug,
      description: question.description,
      difficulty: question.difficulty,
      category,
      topics,
      companyTags: typeof question.company_tags === 'string' ? JSON.parse(question.company_tags) : question.company_tags,
      sampleInput: firstExample?.input || null,
      sampleOutput: firstExample?.output || null,
      examples,
      constraints: question.constraints,
      expectedApproach: question.expected_approach || null,
      hints: typeof question.hints === 'string' ? JSON.parse(question.hints) : question.hints,
      testCases: typeof question.test_cases === 'string' ? JSON.parse(question.test_cases) : question.test_cases,
      solutionTemplate: typeof question.solution_template === 'string' ? JSON.parse(question.solution_template) : question.solution_template,
      source: question.source,
      sourceId: question.source_id,
      acceptanceRate: question.acceptance_rate,
      frequency: question.frequency
    };
  }

  /**
   * Seed local questions (called during initialization)
   */
  async seedLocalQuestions() {
    // This will be populated by the seed_questions.sql script
    // Just check if we have questions
    try {
      const [count] = await db.query('SELECT COUNT(*) as count FROM coding_questions');
      return count[0].count > 0;
    } catch (error) {
      console.error('Error checking seeded questions:', error);
      return false;
    }
  }

  /**
   * Get question statistics
   */
  async getQuestionStats(questionId) {
    try {
      const [stats] = await db.query(
        `SELECT 
          COUNT(DISTINCT user_id) as total_attempts,
          AVG(score) as average_score,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as solved_count
        FROM user_practice_sessions
        WHERE question_id = ?`,
        [questionId]
      );

      return stats[0] || { total_attempts: 0, average_score: 0, solved_count: 0 };
    } catch (error) {
      console.error('Error getting question stats:', error);
      return { total_attempts: 0, average_score: 0, solved_count: 0 };
    }
  }
}

// Singleton instance
const questionBank = new QuestionBankService();

module.exports = questionBank;


