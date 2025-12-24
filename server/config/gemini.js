const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not found in environment variables');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Get model instance
// Use gemini-2.0-flash-lite (better free tier quota)
function getModel(modelName = 'gemini-2.0-flash-lite') {
  try {
    return genAI.getGenerativeModel({ model: modelName });
  } catch (error) {
    console.error('Error initializing Gemini model:', error);
    throw error;
  }
}

module.exports = {
  genAI,
  getModel
};

