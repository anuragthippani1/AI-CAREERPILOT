/**
 * Agent Action Logger
 * Logs all agent actions to database
 */

const db = require('../config/database');

async function logAgentAction(userId, agentName, action, inputData, outputData, executionTime, status, errorMessage = null) {
  try {
    await db.query(
      `INSERT INTO agent_logs 
       (user_id, agent_name, action, input_data, output_data, execution_time_ms, status, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        agentName,
        action,
        JSON.stringify(inputData),
        outputData ? JSON.stringify(outputData) : null,
        executionTime || 0,
        status,
        errorMessage
      ]
    );
  } catch (error) {
    console.error('Error logging agent action:', error);
    // Don't throw - logging failures shouldn't break the app
  }
}

module.exports = {
  logAgentAction
};


