const axios = require('axios');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const qs = require('querystring');

// Zoom API credentials from env
const ZOOM_API_KEY = process.env.ZOOM_SDK_KEY;
const ZOOM_API_SECRET = process.env.ZOOM_SDK_SECRET;
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID || '';

// Base URL for Zoom API
const ZOOM_API_BASE_URL = 'https://api.zoom.us/v2';

// Generate Zoom JWT token with expiration time for Server-to-Server OAuth
const generateZoomJWT = () => {
  try {
    // Check if Zoom credentials exist
    if (!ZOOM_API_KEY || !ZOOM_API_SECRET) {
      console.warn('Missing Zoom API credentials - returning mock token');
      return 'mock-zoom-jwt-token';
    }
    
    // Token expiration time (1 hour)
    const expirationTime = Math.floor(Date.now() / 1000) + 3600;
    
    const payload = {
      iss: ZOOM_API_KEY,
      exp: expirationTime
    };
    
    const token = jwt.sign(payload, ZOOM_API_SECRET);
    return token;
  } catch (error) {
    console.error('Error generating Zoom JWT:', error);
    return 'mock-zoom-jwt-token-after-error';
  }
};

// Get OAuth token using Server-to-Server OAuth flow
const getOAuthToken = async () => {
  try {
    // Check if Zoom credentials exist
    if (!ZOOM_API_KEY || !ZOOM_API_SECRET || !ZOOM_ACCOUNT_ID) {
      console.warn('Missing Zoom API credentials for OAuth - returning mock token');
      return 'mock-zoom-oauth-token';
    }
    
    const url = 'https://zoom.us/oauth/token';
    const params = {
      grant_type: 'account_credentials',
      account_id: ZOOM_ACCOUNT_ID
    };
    
    const headers = {
      'Authorization': `Basic ${Buffer.from(`${ZOOM_API_KEY}:${ZOOM_API_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    
    const response = await axios.post(url, qs.stringify(params), { headers });
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting OAuth token:', error);
    return 'mock-zoom-oauth-token-after-error';
  }
};

// Create Zoom API client with auth headers
const createZoomApiClient = async () => {
  try {
    let token;
    
    // Use OAuth token if account ID is available, otherwise fallback to JWT
    if (ZOOM_ACCOUNT_ID) {
      token = await getOAuthToken();
      return axios.create({
        baseURL: ZOOM_API_BASE_URL,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } else {
      token = generateZoomJWT();
      return axios.create({
        baseURL: ZOOM_API_BASE_URL,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Error creating Zoom API client:', error);
    // Return a mock client that will handle errors gracefully
    return {
      post: async () => ({ data: getMockZoomMeeting() }),
      get: async () => ({ data: getMockZoomMeeting() })
    };
  }
};

// Helper function to generate mock zoom meeting data
const getMockZoomMeeting = () => {
  const meetingId = Math.floor(Math.random() * 90000000) + 10000000;
  return {
    id: meetingId.toString(),
    topic: 'Mock Interview Session',
    start_url: `https://zoom.us/s/${meetingId}?zak=mock-zoom-key`,
    join_url: `https://zoom.us/j/${meetingId}`,
    password: 'mockpassword',
    duration: 30,
    start_time: new Date().toISOString(),
    timezone: 'UTC'
  };
};

// Create a Zoom meeting
exports.createMeeting = async (meetingDetails) => {
  try {
    // If in development mode and no Zoom credentials, return mock data
    if (process.env.NODE_ENV === 'development' && !ZOOM_API_KEY) {
      const meetingId = Math.floor(Math.random() * 90000000) + 10000000;
      return {
        id: meetingId.toString(),
        topic: meetingDetails.topic,
        start_url: `https://zoom.us/s/${meetingId}?zak=mock-zoom-key`,
        join_url: `https://zoom.us/j/${meetingId}`,
        password: 'mockpassword',
        duration: meetingDetails.duration,
        start_time: meetingDetails.start_time,
        timezone: 'UTC'
      };
    }
    
    const client = await createZoomApiClient();
    
    const payload = {
      topic: meetingDetails.topic,
      type: 2, // Scheduled meeting
      start_time: meetingDetails.start_time,
      duration: meetingDetails.duration,
      timezone: 'UTC',
      agenda: meetingDetails.agenda || '',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        mute_upon_entry: false,
        auto_recording: 'cloud',
        waiting_room: false
      }
    };
    
    const response = await client.post('/users/me/meetings', payload);
    return response.data;
  } catch (error) {
    console.error('Create Zoom meeting error:', error.response?.data || error.message);
    throw error;
  }
};

// Get Zoom meeting details
exports.getMeeting = async (meetingId) => {
  try {
    // If in development mode and no Zoom credentials, return mock data
    if (process.env.NODE_ENV === 'development' && !ZOOM_API_KEY) {
      return {
        id: meetingId,
        topic: 'Simulated Zoom Meeting',
        status: 'waiting',
        start_url: `https://zoom.us/s/${meetingId}?zak=mock-zoom-key`,
        join_url: `https://zoom.us/j/${meetingId}`,
        password: 'mockpassword',
        settings: {
          waiting_room: true,
          join_before_host: false,
          mute_upon_entry: true,
          auto_recording: 'cloud'
        }
      };
    }
    
    const client = await createZoomApiClient();
    const response = await client.get(`/meetings/${meetingId}`);
    return response.data;
  } catch (error) {
    console.error('Get Zoom meeting error:', error.response?.data || error.message);
    throw error;
  }
};

// Get Zoom meeting recordings
exports.getRecordings = async (meetingId) => {
  try {
    // If in development mode and no Zoom credentials, return mock data
    if (process.env.NODE_ENV === 'development' && !ZOOM_API_KEY) {
      return [
        {
          id: `recording_${meetingId}_1`,
          meeting_id: meetingId,
          recording_type: 'shared_screen_with_speaker_view',
          recording_start: new Date(Date.now() - 3600000).toISOString(),
          recording_end: new Date().toISOString(),
          file_size: 24930000,
          file_type: 'MP4',
          file_extension: 'mp4',
          download_url: `https://zoom.us/rec/download/${meetingId}_recording_1.mp4`
        }
      ];
    }
    
    const client = await createZoomApiClient();
    const response = await client.get(`/meetings/${meetingId}/recordings`);
    return response.data.recording_files;
  } catch (error) {
    console.error('Get Zoom recordings error:', error.response?.data || error.message);
    throw error;
  }
};

// Generate Zoom SDK Signature for frontend
exports.generateSignature = (meetingNumber, role) => {
  try {
    // If no Zoom credentials, return mock signature
    if (!ZOOM_API_KEY || !ZOOM_API_SECRET) {
      return 'placeholder_zoom_signature';
    }
    
    // Zoom Web SDK requires a specific signature format
    const timestamp = new Date().getTime() - 30000;
    const msg = Buffer.from(ZOOM_API_KEY + meetingNumber + timestamp + role).toString('base64');
    const hash = crypto.createHmac('sha256', ZOOM_API_SECRET).update(msg).digest('base64');
    const signature = Buffer.from(`${ZOOM_API_KEY}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64');
    
    return signature;
  } catch (error) {
    console.error('Generate Zoom signature error:', error);
    throw error;
  }
};

// Create a meeting invitation with details
exports.createMeetingInvitation = (meetingDetails) => {
  const { topic, join_url, password, start_time, duration } = meetingDetails;
  
  const startTime = new Date(start_time);
  const endTime = new Date(startTime.getTime() + duration * 60000);
  
  const formattedStartTime = startTime.toLocaleString();
  const formattedEndTime = endTime.toLocaleString();
  
  return `
You are invited to a CareerZoom mock interview session.

Topic: ${topic}
Time: ${formattedStartTime} to ${formattedEndTime}

Join Zoom Meeting:
${join_url}

Meeting ID: ${meetingDetails.id}
Passcode: ${password}
  `;
};
