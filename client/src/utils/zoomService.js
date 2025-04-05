import { ZoomMtg } from '@zoom/meetingsdk';
import api from './api';

// Define userSettings globally if it's not already defined
try {
  window.userSettings = window.userSettings || {
    darkMode: false,
    notifications: true,
    accessibility: {
      fontSize: 'medium',
      highContrast: false
    }
  };
} catch (e) {
  console.log('Error setting userSettings:', e);
}

// Get meeting signature from our backend
export const getSignature = async (meetingNumber, role = 0) => {
  try {
    // Make a real API call if USE_MOCK_DATA is false
    if (!process.env.REACT_APP_USE_MOCK_DATA || process.env.REACT_APP_USE_MOCK_DATA === 'false') {
      const response = await api.get(`/interviews/zoom-signature`, {
        params: { meetingNumber, role }
      });
      return response.data.signature;
    }
    
    // Return a mock signature for development
    return 'mockSignature123';
  } catch (error) {
    console.error('Error getting Zoom signature:', error);
    throw error;
  }
};

// Initialize with latest version
try {
  ZoomMtg.setZoomJSLib('https://source.zoom.us/3.12.0/lib', '/av');
  ZoomMtg.preLoadWasm();
  ZoomMtg.prepareWebSDK();
} catch (e) {
  console.log('Error initializing Zoom SDK:', e);
}

// Initialize Zoom Meeting
export const initZoomMeeting = async ({
  meetingNumber,
  userName,
  userEmail,
  passWord,
  signature = null, // Now optional, we can fetch it if not provided
  leaveUrl,
  onMeetingJoined,
  onMeetingLeft,
  role = 0 // 0 for attendee, 1 for host
}) => {
  try {
    const zoomContainer = document.getElementById('zoom-container');
    
    if (!zoomContainer) {
      throw new Error('Zoom container element not found');
    }
    
    // If USE_MOCK_DATA is true, return success without joining a real Zoom meeting
    if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
      console.log('Mock Zoom meeting initialized');
      if (onMeetingJoined) setTimeout(onMeetingJoined, 500);
      return true;
    }
    
    const sdkKey = process.env.REACT_APP_ZOOM_SDK_KEY;
    
    // Get signature if not provided
    if (!signature) {
      try {
        signature = await getSignature(meetingNumber, role);
      } catch (error) {
        console.error('Error getting meeting signature:', error);
        throw error;
      }
    }
    
    ZoomMtg.init({
      leaveUrl,
      success: () => {
        console.log('Zoom SDK initialized');
        
        ZoomMtg.join({
          sdkKey,
          signature,
          meetingNumber,
          userName,
          userEmail,
          passWord,
          success: () => {
            console.log('Joined Zoom meeting successfully');
            if (onMeetingJoined) onMeetingJoined();
          },
          error: (error) => {
            console.error('Failed to join Zoom meeting:', error);
          }
        });
      },
      error: (error) => {
        console.error('Failed to initialize Zoom SDK:', error);
      }
    });
    
    // Setup event handlers
    ZoomMtg.inMeetingServiceListener('onUserLeave', (data) => {
      console.log('User left:', data);
    });
    
    ZoomMtg.inMeetingServiceListener('onMeetingStatus', (data) => {
      if (data.meetingStatus === 4) { // Meeting ended
        if (onMeetingLeft) onMeetingLeft();
      }
    });
    
    // Setup recording listeners
    ZoomMtg.inMeetingServiceListener('onRecording', (data) => {
      console.log('Recording status:', data);
    });
    
    return true;
  } catch (error) {
    console.error('Error initializing Zoom meeting:', error);
    return false;
  }
};

// Leave Zoom Meeting
export const leaveMeeting = () => {
  try {
    ZoomMtg.leaveMeeting({
      success: () => {
        console.log('Left Zoom meeting successfully');
      },
      error: (error) => {
        console.error('Error leaving Zoom meeting:', error);
      }
    });
  } catch (e) {
    console.log('Error leaving meeting:', e);
  }
};

// Start recording
export const startRecording = () => {
  try {
    ZoomMtg.record({
      action: 'start',
      success: () => {
        console.log('Started recording');
      },
      error: (error) => {
        console.error('Failed to start recording:', error);
      }
    });
  } catch (e) {
    console.log('Error starting recording:', e);
  }
};

// Stop recording
export const stopRecording = () => {
  try {
    ZoomMtg.record({
      action: 'stop',
      success: () => {
        console.log('Stopped recording');
      },
      error: (error) => {
        console.error('Failed to stop recording:', error);
      }
    });
  } catch (e) {
    console.log('Error stopping recording:', e);
  }
};

// Get current participants
export const getParticipants = (callback) => {
  try {
    ZoomMtg.getAttendeeslist({
      success: (participants) => {
        callback(participants);
      },
      error: (error) => {
        console.error('Failed to get participants:', error);
        callback([]);
      }
    });
  } catch (e) {
    console.log('Error getting participants:', e);
    callback([]);
  }
};