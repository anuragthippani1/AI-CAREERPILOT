/**
 * Career Roadmap Agent
 * Generates step-by-step career roadmap with milestones
 */

const { getModel } = require('../config/gemini');
const db = require('../config/database');
const { logAgentAction } = require('../utils/logger');

class CareerRoadmapAgent {
  constructor() {
    this.model = getModel('gemini-2.0-flash-lite');
    this.systemPrompt = `You are a Career Roadmap Generator Agent for CareerPilot.
Your responsibilities:
1. Create personalized, actionable career roadmaps
2. Break down journey into short-term and long-term milestones
3. Set realistic timelines
4. Adapt based on user's current skills and goals
5. Provide specific, measurable steps

Always provide:
- Short-term milestones (0-3 months)
- Medium-term milestones (3-6 months)
- Long-term milestones (6-12+ months)
- Specific action items for each milestone
- Success metrics
- Timeline estimates

Format your response as JSON.`;
  }

  /**
   * Generate career roadmap
   */
  async generate(context, inputData) {
    const startTime = Date.now();

    try {
      // Create default goal if none exists
      let goal = context.activeGoal;
      if (!goal) {
        // Create a default career goal
        const [result] = await db.query(
          `INSERT INTO career_goals (user_id, target_role, status)
           VALUES (?, ?, 'active')
           ON DUPLICATE KEY UPDATE target_role = VALUES(target_role)`,
          [context.userId, inputData.targetRole || 'Software Engineer']
        );
        const [goals] = await db.query(
          'SELECT * FROM career_goals WHERE id = ?',
          [result.insertId || 1]
        );
        goal = goals[0] || { target_role: inputData.targetRole || 'Software Engineer', id: null };
      }

      const targetRole = goal.target_role || inputData.targetRole || 'Software Engineer';
      const skillGap = inputData.skillGap || {};
      const resumeAnalysis = context.resume?.analysis_json 
        ? (typeof context.resume.analysis_json === 'string' 
            ? JSON.parse(context.resume.analysis_json) 
            : context.resume.analysis_json)
        : null;

      // Build context
      let contextText = `Target Role: ${targetRole}\n`;
      if (goal.target_company) contextText += `Target Company: ${goal.target_company}\n`;
      if (goal.timeline_months) contextText += `Timeline: ${goal.timeline_months} months\n`;
      
      if (skillGap.missingCritical) {
        contextText += `\nMissing Critical Skills: ${skillGap.missingCritical.map(s => s.skill).join(', ')}\n`;
      }
      
      if (resumeAnalysis) {
        contextText += `\nCurrent Experience: ${resumeAnalysis.experience?.summary || 'Not specified'}\n`;
        contextText += `Current Skills: ${resumeAnalysis.skills?.join(', ') || 'None'}\n`;
      }

      const prompt = `${this.systemPrompt}

${contextText}

Generate a comprehensive career roadmap in JSON format:
{
  "shortTerm": [
    {
      "title": "<string>",
      "description": "<string>",
      "timeline": "<string>",
      "actionItems": [<array of strings>],
      "successMetrics": [<array of strings>],
      "priority": <number 1-10>
    }
  ],
  "mediumTerm": [
    {
      "title": "<string>",
      "description": "<string>",
      "timeline": "<string>",
      "actionItems": [<array of strings>],
      "successMetrics": [<array of strings>],
      "priority": <number 1-10>
    }
  ],
  "longTerm": [
    {
      "title": "<string>",
      "description": "<string>",
      "timeline": "<string>",
      "actionItems": [<array of strings>],
      "successMetrics": [<array of strings>],
      "priority": <number 1-10>
    }
  ],
  "overallTimeline": "<string>",
  "keyMilestones": [<array of milestone objects>],
  "recommendations": [<array of strings>]
}`;

      // Call Gemini with fallback
      let roadmap;
      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        let roadmapText = response.text();

        // Clean JSON
        roadmapText = roadmapText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        roadmap = JSON.parse(roadmapText);
      } catch (geminiError) {
        const errorMsg = geminiError.message || String(geminiError);
        
        // If quota exceeded, use fallback roadmap
        if (errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('Quota') || errorMsg.includes('exceeded')) {
          console.warn('Gemini API quota exceeded, using fallback roadmap for demo');
          roadmap = generateFallbackRoadmap(targetRole, skillGap, resumeAnalysis);
        } else {
          throw geminiError;
        }
      }

      // Save to database
      const roadmapId = await this.saveRoadmap(context.userId, goal.id || null, roadmap);

      const executionTime = Date.now() - startTime;
      await logAgentAction(
        context.userId,
        'careerRoadmap',
        'generate',
        { targetRole },
        roadmap,
        executionTime,
        'success'
      );

      return {
        success: true,
        data: {
          roadmapId,
          roadmap
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      await logAgentAction(
        context.userId,
        'careerRoadmap',
        'generate',
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
   * Generate fallback roadmap when API quota is exceeded
   */
  generateFallbackRoadmap(targetRole, skillGap, resumeAnalysis) {
    const missingSkills = skillGap?.missingCritical?.map(s => s.skill || s) || ['Cloud Computing', 'System Design'];
    
    return {
      shortTerm: [
        {
          title: `Master Core ${targetRole} Fundamentals`,
          description: `Build a strong foundation in essential ${targetRole} skills and technologies.`,
          timeline: "1-2 months",
          actionItems: [
            `Complete online courses on ${targetRole} fundamentals`,
            `Build 2-3 portfolio projects demonstrating core skills`,
            `Join ${targetRole} communities and forums`,
            `Practice coding challenges daily`
          ],
          successMetrics: [
            "Complete 2-3 online courses",
            "Build 3 portfolio projects",
            "Solve 50+ coding challenges",
            "Contribute to open source"
          ],
          priority: 10
        },
        {
          title: `Learn ${missingSkills[0] || 'Key Technology'}`,
          description: `Focus on acquiring the most critical missing skill: ${missingSkills[0] || 'key technology'}.`,
          timeline: "2-3 months",
          actionItems: [
            `Enroll in ${missingSkills[0] || 'technology'} certification course`,
            `Complete hands-on projects using ${missingSkills[0] || 'this technology'}`,
            `Join ${missingSkills[0] || 'technology'} study groups`,
            `Document your learning journey`
          ],
          successMetrics: [
            "Complete certification",
            "Build 2 projects",
            "Write technical blog posts",
            "Get peer feedback"
          ],
          priority: 9
        }
      ],
      mediumTerm: [
        {
          title: `Advanced ${targetRole} Skills Development`,
          description: `Deepen your expertise in advanced ${targetRole} concepts and best practices.`,
          timeline: "3-6 months",
          actionItems: [
            `Master advanced ${targetRole} patterns and architectures`,
            `Contribute to major open source projects`,
            `Attend ${targetRole} conferences and workshops`,
            `Build a comprehensive portfolio`
          ],
          successMetrics: [
            "Complete advanced courses",
            "Contribute to 3+ open source projects",
            "Attend 2+ industry events",
            "Build 5+ portfolio projects"
          ],
          priority: 8
        },
        {
          title: `Network and Industry Engagement`,
          description: `Build professional relationships and establish your presence in the ${targetRole} community.`,
          timeline: "4-6 months",
          actionItems: [
            `Attend local ${targetRole} meetups`,
            `Connect with industry professionals on LinkedIn`,
            `Write technical blog posts`,
            `Participate in hackathons and competitions`
          ],
          successMetrics: [
            "Attend 5+ meetups",
            "Grow LinkedIn network by 100+",
            "Publish 10+ blog posts",
            "Win or place in hackathon"
          ],
          priority: 7
        }
      ],
      longTerm: [
        {
          title: `Land Your Target ${targetRole} Role`,
          description: `Apply your skills and secure your dream ${targetRole} position.`,
          timeline: "6-12 months",
          actionItems: [
            `Optimize your resume and LinkedIn profile`,
            `Apply to 50+ ${targetRole} positions`,
            `Prepare for technical and behavioral interviews`,
            `Negotiate offers and choose the best opportunity`
          ],
          successMetrics: [
            "Get 10+ interview invitations",
            "Complete 5+ interview rounds",
            "Receive 2+ job offers",
            "Accept ideal position"
          ],
          priority: 10
        },
        {
          title: `Continuous Growth and Leadership`,
          description: `Establish yourself as a senior ${targetRole} and mentor others.`,
          timeline: "12+ months",
          actionItems: [
            `Take on leadership responsibilities`,
            `Mentor junior ${targetRole} professionals`,
            `Speak at conferences or meetups`,
            `Pursue advanced certifications or education`
          ],
          successMetrics: [
            "Lead 2+ projects",
            "Mentor 3+ professionals",
            "Speak at 1+ event",
            "Earn advanced certification"
          ],
          priority: 8
        }
      ],
      overallTimeline: "6-12 months to reach your target role",
      keyMilestones: [
        { milestone: "Complete core skills training", timeline: "Month 2" },
        { milestone: "Build portfolio projects", timeline: "Month 3" },
        { milestone: "Start applying to positions", timeline: "Month 6" },
        { milestone: "Land target role", timeline: "Month 9-12" }
      ],
      recommendations: [
        `Focus on ${missingSkills[0] || 'key skills'} as it's critical for ${targetRole} roles`,
        "Build a strong portfolio showcasing real-world projects",
        "Network actively in the industry",
        "Practice interview skills regularly",
        "Stay updated with latest ${targetRole} trends and technologies"
      ]
    };
  }

  /**
   * Save roadmap to database
   */
  async saveRoadmap(userId, careerGoalId, roadmap) {
    // Extract milestones for separate storage
    const milestones = [
      ...(roadmap.shortTerm || []),
      ...(roadmap.mediumTerm || []),
      ...(roadmap.longTerm || [])
    ];

    // Use INSERT ... ON DUPLICATE KEY UPDATE or just INSERT
    try {
      const [result] = await db.query(
        `INSERT INTO roadmaps (user_id, career_goal_id, roadmap_json, milestones, progress_percentage)
         VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          careerGoalId,
          JSON.stringify(roadmap),
          JSON.stringify(milestones),
          0
        ]
      );
      return result.insertId;
    } catch (err) {
      // If duplicate, update existing
      if (err.code === 'ER_DUP_ENTRY' || err.message.includes('Duplicate')) {
        const [result] = await db.query(
          `UPDATE roadmaps 
           SET roadmap_json = ?, milestones = ?, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ?`,
          [
            JSON.stringify(roadmap),
            JSON.stringify(milestones),
            userId
          ]
        );
        const [updated] = await db.query(
          'SELECT id FROM roadmaps WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
          [userId]
        );
        return updated[0]?.id || 1;
      }
      throw err;
    }
  }
}

module.exports = CareerRoadmapAgent;

