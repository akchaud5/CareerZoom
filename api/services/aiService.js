const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Readable } = require('stream');

// Initialize OpenAI client with error handling
let openai;
try {
  const { OpenAI } = require('openai');
  
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('OpenAI client initialized successfully');
  } else {
    console.log('No OpenAI API key found, will use mock data');
    openai = null;
  }
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error.message);
  openai = null;
}

// Helper function to download recording file
const downloadRecording = async (url, fileName) => {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });
    
    const filePath = path.join(__dirname, '../../uploads/recordings', fileName);
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filePath));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Error downloading recording:', error);
    throw error;
  }
};

// Helper function to transcribe audio file using OpenAI Whisper
const transcribeAudio = async (filePath) => {
  try {
    // If OpenAI API Key is not available or in development mode, return mock transcript
    if (!process.env.OPENAI_API_KEY || process.env.NODE_ENV === 'development') {
      return {
        text: "Mock transcript of an interview. This would be a full transcript of the interview with timestamps.",
        segments: []
      };
    }
    
    const fileStream = fs.createReadStream(filePath);
    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1',
      response_format: 'verbose_json'
    });
    
    return transcription;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
};

// Analyze interview recording
exports.analyzeInterview = async (interviewData) => {
  try {
    // Only use mock data if specifically requested or if we have no API key
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key available - using mock data');
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return mock analysis
      return {
        overallScore: 4.2,
        contentAnalysis: {
          relevance: {
            score: 4.5,
            feedback: 'Answers were highly relevant to the questions asked.'
          },
          completeness: {
            score: 4.0,
            feedback: 'Most answers were complete, but some technical details could be expanded upon.'
          },
          accuracy: {
            score: 4.3,
            feedback: 'Technical information provided was accurate and well-explained.'
          },
          structure: {
            score: 3.9,
            feedback: 'Answers had a good structure but could benefit from clearer organization in some cases.'
          }
        },
        deliveryAnalysis: {
          confidence: {
            score: 4.1,
            feedback: 'Demonstrated good confidence throughout most of the interview.'
          },
          clarity: {
            score: 4.4,
            feedback: 'Speech was clear and well-articulated.'
          },
          pacing: {
            score: 3.8,
            feedback: 'Pacing was generally good but occasionally too rapid when discussing complex topics.'
          },
          engagement: {
            score: 4.2,
            feedback: 'Maintained good engagement and enthusiasm throughout the interview.'
          },
          bodyLanguage: {
            score: 3.7,
            feedback: 'Generally positive body language, but could improve eye contact and reduce nervous gestures.'
          }
        },
        questionAnalysis: [
          {
            question: 'Tell me about yourself',
            responseQuality: 4.5,
            feedback: 'Excellent overview of relevant experience and skills. Well-structured narrative.'
          },
          {
            question: 'What is your greatest professional achievement?',
            responseQuality: 4.3,
            feedback: 'Good example with clear impact metrics. Could strengthen by explaining your specific contributions more clearly.'
          },
          {
            question: 'How do you handle conflict in the workplace?',
            responseQuality: 3.9,
            feedback: 'Solid framework for conflict resolution. Consider adding a more specific example to illustrate your approach.'
          }
        ],
        keyInsights: [
          'Strong technical knowledge demonstrated throughout',
          'Excellent communication skills and articulation',
          'Good preparation for common questions',
          'Could improve specific examples for behavioral questions',
          'Occasional nervous gestures could be reduced'
        ],
        improvementAreas: [
          'Body language - reduce fidgeting and improve eye contact',
          'Take more time when answering technical questions',
          'Provide more quantifiable results in achievement examples',
          'Be more concise in responses to behavioral questions'
        ]
      };
    }
    
    // Get transcript - either directly provided or from recording
    let transcriptText;
    
    if (interviewData.transcript) {
      // Use the provided transcript directly
      transcriptText = interviewData.transcript;
      console.log(`Using provided transcript (${transcriptText.length} chars) for analysis`);
    } else if (interviewData.recordingUrl) {
      // Download and transcribe the recording
      const fileName = `interview_${interviewData.interviewId || Date.now()}.mp4`;
      const filePath = await downloadRecording(interviewData.recordingUrl, fileName);
      
      // Transcribe using OpenAI's Whisper
      const transcriptResult = await transcribeAudio(filePath);
      transcriptText = transcriptResult.text;
      
      // Delete the temporary file
      fs.unlinkSync(filePath);
      
      console.log(`Transcribed recording to text (${transcriptText.length} chars) for analysis`);
    } else {
      throw new Error('No transcript or recording URL provided for analysis');
    }
    
    // Extract questions
    const questions = interviewData.questions.map(q => {
      if (typeof q === 'string') return q;
      if (q.text) return q.text;
      if (q.toString) return q.toString();
      return '';
    }).filter(q => q.length > 0).join('\n');
    
    // Analyze transcript with GPT-4
    const systemPrompt = `You are an expert interview coach analyzing a job interview for a ${interviewData.jobTitle} position in the ${interviewData.industry} industry. 
    Analyze the interview transcript and provide a detailed assessment including:
    1. Overall performance rating (1-5 scale)
    2. Content analysis (relevance, completeness, accuracy, structure)
    3. Delivery analysis (confidence, clarity, pacing, engagement)
    4. Question-by-question analysis
    5. Key insights and strengths
    6. Areas for improvement
    
    The candidate was asked the following questions:
    ${questions}
    
    Format your analysis as a structured JSON object.`;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: transcriptText }
      ],
      response_format: { type: 'json_object' }
    });
    
    // Parse GPT-4 analysis
    const analysisText = response.choices[0].message.content.trim();
    const analysis = JSON.parse(analysisText);
    
    return analysis;
  } catch (error) {
    console.error('AI interview analysis error:', error);
    // Return a basic error analysis in case of OpenAI API issues
    return {
      overallScore: 3.0,
      contentAnalysis: {
        relevance: { score: 3.0, feedback: 'Unable to analyze completely. Please try again.' }
      },
      deliveryAnalysis: {
        clarity: { score: 3.0, feedback: 'Unable to analyze completely. Please try again.' }
      },
      questionAnalysis: [],
      keyInsights: ['Analysis encountered technical difficulties'],
      improvementAreas: ['Try submitting the interview again for complete analysis']
    };
  }
};

// Generate personalized recommendations based on weak areas
exports.generateRecommendations = async (weakAreas) => {
  try {
    // If OpenAI API Key is not available, return mock recommendations
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key available - using mock recommendations');
      const recommendations = [];
      
      // Sample recommendation generation logic
      if (weakAreas.includes('content_clarity') || weakAreas.includes('content_structure')) {
        recommendations.push({
          area: 'content',
          description: 'Improve answer structure and clarity',
          resources: [
            {
              title: 'The STAR Method for Behavioral Interviews',
              url: 'https://example.com/star-method',
              type: 'article'
            },
            {
              title: 'Structured Communication Techniques',
              url: 'https://example.com/structured-communication',
              type: 'video'
            }
          ]
        });
      }
      
      if (weakAreas.includes('delivery_confidence') || weakAreas.includes('delivery_bodyLanguage')) {
        recommendations.push({
          area: 'delivery',
          description: 'Enhance confidence and body language',
          resources: [
            {
              title: 'Body Language Mastery for Interviews',
              url: 'https://example.com/body-language',
              type: 'course'
            },
            {
              title: 'Confidence Building Exercises',
              url: 'https://example.com/confidence',
              type: 'practice'
            }
          ]
        });
      }
      
      if (weakAreas.includes('technical_accuracy') || weakAreas.includes('technical_problemSolving')) {
        recommendations.push({
          area: 'technical',
          description: 'Strengthen technical knowledge and problem-solving',
          resources: [
            {
              title: 'Technical Interview Problem Solving',
              url: 'https://example.com/technical-problems',
              type: 'course'
            },
            {
              title: 'Industry-Specific Knowledge Guide',
              url: 'https://example.com/industry-knowledge',
              type: 'book'
            }
          ]
        });
      }
      
      return recommendations;
    }
    
    // Use OpenAI API to generate personalized recommendations
    const weakAreasFormatted = weakAreas.map(area => {
      // Convert from underscore format (e.g., content_clarity)
      // to readable format (e.g., Content Clarity)
      return area.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }).join(', ');
    
    const systemPrompt = `You are an expert career coach providing targeted recommendations for interview improvement.
    The user has demonstrated weaknesses in the following areas: ${weakAreasFormatted}.
    
    Generate personalized recommendations including:
    1. The key area to focus on
    2. A detailed description of how to improve
    3. Specific resources (articles, videos, courses, books, or practice exercises)
    
    Format your recommendations as a JSON array of objects with the following structure:
    [
      {
        "area": "content|delivery|technical",
        "description": "Brief description of what to improve",
        "resources": [
          {
            "title": "Resource title",
            "url": "https://example.com/resource",
            "type": "article|video|course|book|practice"
          }
        ]
      }
    ]`;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please provide recommendations for improving in these areas: ${weakAreasFormatted}` }
      ],
      response_format: { type: 'json_object' }
    });
    
    const recommendationsText = response.choices[0].message.content.trim();
    const recommendations = JSON.parse(recommendationsText);
    
    return recommendations;
  } catch (error) {
    console.error('Generate recommendations error:', error);
    // Return basic recommendations in case of API issues
    return [
      {
        area: 'general',
        description: 'Focus on overall interview performance',
        resources: [
          {
            title: 'Interview Preparation Guide',
            url: 'https://example.com/interview-prep',
            type: 'article'
          }
        ]
      }
    ];
  }
};

// Analyze real-time feedback during interview
exports.analyzeRealTime = async (data) => {
  try {
    // If OpenAI API Key is not available, return mock feedback
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key available - using mock real-time feedback');
      return {
        timestamp: new Date().toISOString(),
        pacing: 'good',
        volume: 'appropriate',
        engagement: 'high',
        nervousSignals: 'low',
        suggestedAdjustments: [
          'Slightly reduce speaking pace',
          'Maintain current eye contact'
        ]
      };
    }
    
    // Handle audio chunk (binary data) or text transcript
    if (data.audioChunk) {
      // Process audio chunk with Whisper API (similar to original implementation)
      // Convert audio chunk to a format that can be sent to OpenAI
      const audioInput = Buffer.from(data.audioChunk).toString('base64');
      
      // Transcribe the audio
      const transcription = await openai.audio.transcriptions.create({
        model: 'whisper-1',
        file: data.audioChunk
      });
      
      // Analyze the transcribed text
      return await this.analyzeRealTime({ text: transcription.text });
      
    } else if (data.text) {
      // Direct text analysis - analyze the provided transcript
      const textToAnalyze = data.text.substring(0, 4000); // Limit length to avoid token issues
      
      // Analyze the transcription with a more interview-specific prompt
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: `You are an expert interview coach providing real-time feedback on interview responses.
            Analyze the following interview response text and provide:
            1. A brief assessment of speaking style (pacing, clarity, confidence)
            2. Whether there are signs of nervousness
            3. One specific, actionable suggestion to improve the response
            Format your analysis as JSON with the following structure:
            {
              "pacing": "too fast|good|too slow",
              "clarity": "unclear|moderate|good|excellent",
              "confidence": "low|moderate|high",
              "nervousSignals": "high|moderate|low",
              "suggestedAdjustments": ["One specific, actionable suggestion"]
            }`
          },
          { role: 'user', content: textToAnalyze }
        ],
        response_format: { type: 'json_object' }
      });
      
      // Parse the response
      const analysis = JSON.parse(response.choices[0].message.content);
      
      // Return the analysis with timestamp
      return {
        timestamp: new Date().toISOString(),
        ...analysis
      };
    }
    
    // If no audio or text data provided, return default feedback
    return {
      timestamp: new Date().toISOString(),
      pacing: 'moderate',
      clarity: 'good',
      confidence: 'moderate',
      nervousSignals: 'moderate',
      suggestedAdjustments: [
        'Structure your answer with a clear introduction and conclusion',
        'Include specific examples from your experience'
      ]
    };
  } catch (error) {
    console.error('Real-time analysis error:', error);
    // Return basic feedback in case of API issues
    return {
      timestamp: new Date().toISOString(),
      pacing: 'moderate',
      volume: 'appropriate',
      engagement: 'moderate',
      nervousSignals: 'moderate',
      suggestedAdjustments: [
        'Continue speaking clearly',
        'Maintain professional posture'
      ]
    };
  }
};
