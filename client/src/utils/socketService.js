import { io } from 'socket.io-client';

// Socket instance
let socket;

// Callback registry
const callbackRegistry = {
  'receive-feedback': [],
  'receive-analysis': [],
  'interviewer-action': [],
  'analysis-response': []
};

/**
 * Initialize Socket.io connection
 * @param {string} token - JWT token for authentication
 * @returns {Object} - Socket instance
 */
export const initSocket = (token) => {
  // Don't initialize socket in development with mock data
  if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
    console.log('Mock mode active, socket connection disabled');
    
    // Return mock socket interface
    return {
      id: 'mock-socket-id',
      connected: true,
      on: (event, callback) => {
        console.log(`[MOCK] Registered handler for event: ${event}`);
        if (callbackRegistry[event]) {
          callbackRegistry[event].push(callback);
        }
      },
      emit: (event, data) => {
        console.log(`[MOCK] Emitted event: ${event}`, data);
        
        // For testing, trigger simulated feedback after a short delay
        if (event === 'join-interview') {
          setTimeout(() => {
            triggerMockFeedback(data); // data is interviewId
          }, 5000);
        }
      },
      disconnect: () => {
        console.log('[MOCK] Socket disconnected');
      }
    };
  }
  
  // Connect to real Socket.io server
  // Force using the server port (5000) instead of the client dev server port (3000)
  const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000'; 
  console.log('Connecting to socket URL:', socketUrl);
  
  socket = io(socketUrl, {
    auth: token ? { token } : undefined,
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000 // Longer timeout for connection
  });
  
  // Add event listeners
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });
  
  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${reason}`);
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
  
  // Register for real-time events
  socket.on('receive-feedback', (feedback) => {
    callbackRegistry['receive-feedback'].forEach(callback => {
      callback(feedback);
    });
  });
  
  socket.on('receive-analysis', (analysis) => {
    callbackRegistry['receive-analysis'].forEach(callback => {
      callback(analysis);
    });
  });
  
  socket.on('interviewer-action', (action) => {
    callbackRegistry['interviewer-action'].forEach(callback => {
      callback(action);
    });
  });
  
  socket.on('analysis-response', (analysis) => {
    callbackRegistry['analysis-response'].forEach(callback => {
      callback(analysis);
    });
  });
  
  return socket;
};

// Helper function to simulate feedback for mock socket
const triggerMockFeedback = (interviewId) => {
  const mockFeedback = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    type: Math.random() > 0.5 ? 'positive' : 'improvement',
    content: Math.random() > 0.5 
      ? 'Good eye contact and engagement' 
      : 'Try to provide more specific examples'
  };
  
  callbackRegistry['receive-feedback'].forEach(callback => {
    callback(mockFeedback);
  });
  
  // Schedule another feedback in a few seconds
  if (Math.random() > 0.3) {
    setTimeout(() => {
      triggerMockFeedback(interviewId);
    }, 8000 + Math.random() * 5000);
  }
};

export const joinInterviewRoom = (interviewId) => {
  if (socket && interviewId) {
    socket.emit('join-interview', interviewId);
  }
};

export const sendFeedback = (interviewId, feedback) => {
  if (socket) {
    socket.emit('send-feedback', { interviewId, feedback });
  }
};

export const sendTranscriptUpdate = (interviewId, transcript, questionId, questionIndex) => {
  if (socket) {
    socket.emit('transcript-update', { 
      interviewId, 
      transcript, 
      questionId,
      questionIndex
    });
  }
};

export const getSocket = () => socket;

export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};
