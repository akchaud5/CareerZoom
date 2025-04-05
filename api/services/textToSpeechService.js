const fs = require('fs');
const path = require('path');

// Initialize OpenAI client with error handling
let openai = null;
try {
  if (process.env.OPENAI_API_KEY) {
    const { OpenAI } = require('openai');
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('OpenAI TTS service initialized successfully');
  } else {
    console.log('No OpenAI API key found, TTS will use mock data');
  }
} catch (error) {
  console.error('Failed to initialize OpenAI TTS service:', error.message);
}

// Define available voices with their characteristics
const availableVoices = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral, versatile voice' },
  { id: 'echo', name: 'Echo', description: 'Enhanced clarity and presence' },
  { id: 'fable', name: 'Fable', description: 'Warm, friendly voice' },
  { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative voice' },
  { id: 'nova', name: 'Nova', description: 'Professional female voice' },
  { id: 'shimmer', name: 'Shimmer', description: 'Energetic, youthful voice' }
];

// Define cache directory for storing audio files
const CACHE_DIR = path.join(__dirname, '../../uploads/audio-cache');

// Ensure cache directory exists
try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch (err) {
  console.error('Error creating cache directory:', err);
  // Fall back to temp directory if needed
}

/**
 * Generate a cache key for a text-to-speech request
 * @param {string} text - The text to convert
 * @param {string} voice - The voice to use
 * @param {string} model - The TTS model to use
 * @returns {string} - Unique cache key
 */
const generateCacheKey = (text, voice, model) => {
  // Create a deterministic key based on the input parameters
  return `${Buffer.from(text).toString('base64').substring(0, 100)}_${voice}_${model}`;
};

/**
 * Convert text to speech using OpenAI's text-to-speech API
 * @param {string} text - The text to convert to speech
 * @param {string} voice - The voice to use (default: 'alloy')
 * @param {string} model - The TTS model to use
 * @returns {Promise<Buffer>} - Audio buffer
 */
exports.textToSpeech = async (text, voice = 'alloy', model = 'tts-1') => {
  try {
    // Validate voice
    if (!availableVoices.some(v => v.id === voice)) {
      console.warn(`Invalid voice '${voice}', defaulting to 'alloy'`);
      voice = 'alloy';
    }
    
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY || process.env.NODE_ENV === 'development') {
      // Return a mock audio file in development mode
      const mockAudioPath = path.join(__dirname, '../../uploads/mock-audio.mp3');
      
      // If mock audio doesn't exist, create an empty file
      try {
        // Ensure directory exists first
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        if (!fs.existsSync(mockAudioPath)) {
          fs.writeFileSync(mockAudioPath, Buffer.from([0, 0, 0, 0]));
        }
        
        return fs.readFileSync(mockAudioPath);
      } catch (mockError) {
        console.error('Error creating mock audio:', mockError);
        // Return an empty buffer if file operations fail
        return Buffer.from([0, 0, 0, 0]);
      }
    }
    
    // Generate cache key and path
    const cacheKey = generateCacheKey(text, voice, model);
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.mp3`);
    
    // Check if cached version exists
    if (fs.existsSync(cachePath)) {
      console.log('Using cached audio file');
      return fs.readFileSync(cachePath);
    }
    
    // Generate audio using OpenAI API
    console.log(`Generating audio for text: "${text.substring(0, 50)}..." with voice: ${voice}`);
    const response = await openai.audio.speech.create({
      model,
      voice,
      input: text,
    });

    // Get audio as buffer
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Cache the result
    fs.writeFileSync(cachePath, buffer);
    
    return buffer;
  } catch (error) {
    console.error('Text-to-speech error:', error);
    
    // Return a default audio file in case of error
    const fallbackPath = path.join(__dirname, '../../uploads/error-audio.mp3');
    if (fs.existsSync(fallbackPath)) {
      return fs.readFileSync(fallbackPath);
    }
    
    // If fallback doesn't exist, return an empty buffer
    return Buffer.from([0, 0, 0, 0]);
  }
};

/**
 * Get available voice options for text-to-speech
 * @returns {Array} - List of available voices
 */
exports.getAvailableVoices = () => {
  return availableVoices;
};

/**
 * Clean up old cached audio files
 * @param {number} maxAgeMs - Maximum age in milliseconds (default: 1 day)
 */
exports.cleanupCache = (maxAgeMs = 24 * 60 * 60 * 1000) => {
  try {
    const now = Date.now();
    const files = fs.readdirSync(CACHE_DIR);
    
    files.forEach(file => {
      const filePath = path.join(CACHE_DIR, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtime.getTime();
      
      if (fileAge > maxAgeMs) {
        fs.unlinkSync(filePath);
        console.log(`Removed old cache file: ${file}`);
      }
    });
  } catch (error) {
    console.error('Cache cleanup error:', error);
  }
};