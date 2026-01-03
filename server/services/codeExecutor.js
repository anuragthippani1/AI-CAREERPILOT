/**
 * Code Execution Service
 * Executes user code against test cases using Judge0 API or similar
 */

const axios = require('axios');

class CodeExecutorService {
  constructor() {
    // Judge0 API endpoint (free tier)
    this.judge0ApiUrl = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
    this.judge0ApiKey = process.env.JUDGE0_API_KEY || null;
    
    // Alternative: Piston API (open source, no API key needed)
    this.pistonApiUrl = 'https://emkc.org/api/v2/piston';
    
    // Language mappings
    this.languageMap = {
      'python': { judge0: 71, piston: 'python' },
      'javascript': { judge0: 63, piston: 'javascript' },
      'java': { judge0: 62, piston: 'java' },
      'cpp': { judge0: 54, piston: 'cpp' },
      'c': { judge0: 50, piston: 'c' },
      'typescript': { judge0: 74, piston: 'typescript' },
      'go': { judge0: 60, piston: 'go' },
      'rust': { judge0: 73, piston: 'rust' }
    };
  }

  /**
   * Execute code against test cases
   */
  async executeCode(code, language, testCases) {
    try {
      // Try Judge0 first if API key is available
      if (this.judge0ApiKey) {
        return await this.executeWithJudge0(code, language, testCases);
      } else {
        // Fallback to Piston API
        return await this.executeWithPiston(code, language, testCases);
      }
    } catch (error) {
      console.error('Error executing code:', error);
      throw new Error(`Code execution failed: ${error.message}`);
    }
  }

  /**
   * Execute code using Judge0 API
   */
  async executeWithJudge0(code, language, testCases) {
    const langId = this.languageMap[language.toLowerCase()]?.judge0;
    if (!langId) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const results = [];
    
    for (const testCase of testCases) {
      try {
        // Submit code for execution
        const submitResponse = await axios.post(
          `${this.judge0ApiUrl}/submissions`,
          {
            source_code: code,
            language_id: langId,
            stdin: testCase.input || '',
            expected_output: testCase.output || '',
            cpu_time_limit: 2, // 2 seconds
            memory_limit: 128000 // 128 MB
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-RapidAPI-Key': this.judge0ApiKey,
              'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
            },
            timeout: 10000
          }
        );

        const token = submitResponse.data.token;

        // Poll for result
        let result = null;
        let attempts = 0;
        const maxAttempts = 20;

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms

          const resultResponse = await axios.get(
            `${this.judge0ApiUrl}/submissions/${token}`,
            {
              headers: {
                'X-RapidAPI-Key': this.judge0ApiKey,
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
              }
            }
          );

          result = resultResponse.data;

          if (result.status.id !== 1 && result.status.id !== 2) {
            // Status 1 = In Queue, 2 = Processing
            // Other statuses mean completed
            break;
          }

          attempts++;
        }

        if (!result) {
          throw new Error('Execution timeout');
        }

        // Parse result
        const testResult = {
          passed: result.status.id === 3, // 3 = Accepted
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: result.stdout || result.stderr || '',
          error: result.stderr || null,
          status: this.getStatusDescription(result.status.id),
          executionTime: result.time ? parseFloat(result.time) * 1000 : 0, // Convert to ms
          memoryUsage: result.memory || 0
        };

        results.push(testResult);
      } catch (error) {
        results.push({
          passed: false,
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: '',
          error: error.message,
          status: 'Error',
          executionTime: 0,
          memoryUsage: 0
        });
      }
    }

    return {
      success: results.every(r => r.passed),
      results,
      totalTests: testCases.length,
      passedTests: results.filter(r => r.passed).length,
      executionTime: results.reduce((sum, r) => sum + r.executionTime, 0),
      memoryUsage: Math.max(...results.map(r => r.memoryUsage), 0)
    };
  }

  /**
   * Execute code using Piston API (fallback, no API key needed)
   */
  async executeWithPiston(code, language, testCases) {
    const langName = this.languageMap[language.toLowerCase()]?.piston;
    if (!langName) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const results = [];

    for (const testCase of testCases) {
      try {
        const response = await axios.post(
          `${this.pistonApiUrl}/execute`,
          {
            language: langName,
            version: '*', // Use latest version
            files: [{
              content: code
            }],
            stdin: testCase.input || '',
            args: [],
            compile_timeout: 10000,
            run_timeout: 5000,
            memory_limit: 128000000 // 128 MB in bytes
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );

        const output = response.data.run.stdout || '';
        const error = response.data.run.stderr || '';
        const actualOutput = output.trim();
        const expectedOutput = (testCase.output || '').trim();

        const testResult = {
          passed: actualOutput === expectedOutput && !error,
          input: testCase.input,
          expectedOutput: expectedOutput,
          actualOutput: actualOutput,
          error: error || null,
          status: actualOutput === expectedOutput ? 'Accepted' : 'Wrong Answer',
          executionTime: response.data.run.time ? parseFloat(response.data.run.time) * 1000 : 0,
          memoryUsage: 0 // Piston doesn't provide memory usage
        };

        results.push(testResult);
      } catch (error) {
        results.push({
          passed: false,
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: '',
          error: error.message,
          status: 'Error',
          executionTime: 0,
          memoryUsage: 0
        });
      }
    }

    return {
      success: results.every(r => r.passed),
      results,
      totalTests: testCases.length,
      passedTests: results.filter(r => r.passed).length,
      executionTime: results.reduce((sum, r) => sum + r.executionTime, 0),
      memoryUsage: 0
    };
  }

  /**
   * Get status description from Judge0 status ID
   */
  getStatusDescription(statusId) {
    const statusMap = {
      1: 'In Queue',
      2: 'Processing',
      3: 'Accepted',
      4: 'Wrong Answer',
      5: 'Time Limit Exceeded',
      6: 'Compilation Error',
      7: 'Runtime Error',
      8: 'Memory Limit Exceeded',
      9: 'Internal Error'
    };
    return statusMap[statusId] || 'Unknown';
  }

  /**
   * Validate solution against question test cases
   */
  async validateSolution(questionId, code, language) {
    try {
      const db = require('../config/database');
      const questionBank = require('./questionBank');

      // Get question and test cases
      const question = await questionBank.getQuestionById(questionId);
      if (!question) {
        throw new Error('Question not found');
      }

      const testCases = question.testCases || [];
      if (testCases.length === 0) {
        throw new Error('No test cases available for this question');
      }

      // Execute code
      const executionResult = await this.executeCode(code, language, testCases);

      const totalTests = Number(executionResult.totalTests) || 0;
      const passedTests = Number(executionResult.passedTests) || 0;

      return {
        questionId,
        passed: executionResult.success,
        score: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
        executionResult
      };
    } catch (error) {
      console.error('Error validating solution:', error);
      throw error;
    }
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(language) {
    return language.toLowerCase() in this.languageMap;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return Object.keys(this.languageMap);
  }
}

// Singleton instance
const codeExecutor = new CodeExecutorService();

module.exports = codeExecutor;




