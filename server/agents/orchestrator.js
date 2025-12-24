/**
 * Antigravity Agent Orchestrator
 * Coordinates multiple AI agents for CareerPilot
 */

const ResumeAnalyzerAgent = require('./resumeAnalyzer');
const SkillGapAgent = require('./skillGap');
const CareerRoadmapAgent = require('./careerRoadmap');
const InterviewAgent = require('./interview');
const db = require('../config/database');
const { logAgentAction } = require('../utils/logger');

class AgentOrchestrator {
  constructor() {
    this.agents = {
      resumeAnalyzer: new ResumeAnalyzerAgent(),
      skillGap: new SkillGapAgent(),
      careerRoadmap: new CareerRoadmapAgent(),
      interview: new InterviewAgent()
    };
    this.userContexts = new Map(); // In-memory context store
  }

  /**
   * Get or create user context
   */
  async getUserContext(userId) {
    if (!this.userContexts.has(userId)) {
      const context = await this.buildUserContext(userId);
      this.userContexts.set(userId, context);
    }
    return this.userContexts.get(userId);
  }

  /**
   * Build user context from database
   */
  async buildUserContext(userId) {
    try {
      const [resumes] = await db.query(
        'SELECT * FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        [userId]
      );
      const [skills] = await db.query(
        'SELECT * FROM skills WHERE user_id = ?',
        [userId]
      );
      const [goals] = await db.query(
        'SELECT * FROM career_goals WHERE user_id = ? AND status = "active" LIMIT 1',
        [userId]
      );
      const [roadmaps] = await db.query(
        'SELECT * FROM roadmaps WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        [userId]
      );

      return {
        userId,
        resume: resumes[0] || null,
        skills: skills || [],
        activeGoal: goals[0] || null,
        roadmap: roadmaps[0] || null,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error building user context:', error);
      return { userId, resume: null, skills: [], activeGoal: null, roadmap: null };
    }
  }

  /**
   * Main orchestration method
   * Decides which agent to activate based on user action
   */
  async orchestrate(userId, action, inputData) {
    const startTime = Date.now();
    
    try {
      // Update user context
      const context = await this.getUserContext(userId);
      
      // Log orchestration start
      await logAgentAction(userId, 'orchestrator', 'orchestrate', inputData, null, null, 'pending');

      let result;
      let nextActions = [];

      switch (action) {
        case 'analyze_resume':
          result = await this.agents.resumeAnalyzer.analyze(context, inputData);
          // Chain: Resume → Skill Gap → Roadmap
          if (result.success && context.activeGoal) {
            nextActions.push({
              agent: 'skillGap',
              action: 'analyze_gap',
              input: { resumeAnalysis: result.data }
            });
          }
          break;

        case 'analyze_skill_gap':
          result = await this.agents.skillGap.analyze(context, inputData);
          // Chain: Skill Gap → Roadmap
          if (result.success) {
            nextActions.push({
              agent: 'careerRoadmap',
              action: 'generate_roadmap',
              input: { skillGap: result.data }
            });
          }
          break;

        case 'generate_roadmap':
          result = await this.agents.careerRoadmap.generate(context, inputData);
          // Don't chain further - roadmap is the end of the chain
          break;

        case 'start_interview':
          result = await this.agents.interview.start(context, inputData);
          break;

        case 'continue_interview':
          result = await this.agents.interview.continue(context, inputData);
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Execute chained actions
      for (const nextAction of nextActions) {
        const nextResult = await this.orchestrate(
          userId,
          nextAction.action,
          nextAction.input
        );
        if (nextResult.success) {
          result.chainedResults = result.chainedResults || [];
          result.chainedResults.push({
            agent: nextAction.agent,
            result: nextResult
          });
        }
      }

      // Update context
      await this.updateUserContext(userId);

      const executionTime = Date.now() - startTime;
      await logAgentAction(
        userId,
        'orchestrator',
        action,
        inputData,
        result,
        executionTime,
        'success'
      );

      return {
        success: true,
        data: result,
        executionTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      await logAgentAction(
        userId,
        'orchestrator',
        action,
        inputData,
        { error: error.message },
        executionTime,
        'error',
        error.message
      );

      return {
        success: false,
        error: error.message,
        executionTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Update user context after agent execution
   */
  async updateUserContext(userId) {
    const newContext = await this.buildUserContext(userId);
    this.userContexts.set(userId, newContext);
  }

  /**
   * Clear user context (useful for testing or logout)
   */
  clearUserContext(userId) {
    this.userContexts.delete(userId);
  }
}

// Singleton instance
const orchestrator = new AgentOrchestrator();

module.exports = orchestrator;

