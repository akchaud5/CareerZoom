# CareerZoom - Intelligent Interview Preparation Platform

CareerZoom is a comprehensive Zoom-based mock interview platform that prepares students for the modern virtual interview landscape through AI-driven simulation, real-time feedback, and peer collaboration.

## Key Features

- **AI-Powered Interview Simulation:** Leverages Zoom SDK to create realistic interview environments with industry-specific questions tailored to specific job roles
- **Voice-Over Technology:** AI-generated voice that reads interview questions aloud with natural-sounding speech
- **Comprehensive Feedback System:** Analyzes verbal and non-verbal communication including tone, confidence, pacing, and body language using Zoom AI analytics
- **Personalized Improvement Plans:** Generates customized development roadmaps based on performance metrics
- **Collaborative Learning:** Optional peer-review breakout rooms where students can observe and provide feedback to each other

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- Socket.io for real-time communication
- JWT for authentication
- OpenAI API for AI analysis and text-to-speech

### Frontend
- React
- Material-UI
- Chart.js for data visualization
- Socket.io-client for real-time updates

### Integrations
- Zoom SDK for video conferencing
- OpenAI API for AI analysis, recommendation generation, and text-to-speech

## Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB
- Zoom SDK credentials
- OpenAI API key

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/careerzoom.git
cd careerzoom
```

2. Install server dependencies
```bash
npm install
```

3. Install client dependencies
```bash
cd client
npm install
cd ..
```

4. Create a `.env` file in the root directory with the following variables (see .env.example for template)
```
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/careerzoom
JWT_SECRET=your_jwt_secret
ZOOM_SDK_KEY=your_zoom_sdk_key
ZOOM_SDK_SECRET=your_zoom_sdk_secret
OPENAI_API_KEY=your_openai_api_key
```

5. Create a `.env` file in the client directory
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ZOOM_SDK_KEY=your_zoom_sdk_key
GENERATE_SOURCEMAP=false
```

6. Start the development servers
```bash
# Run backend server
node index.js

# In a separate terminal, run frontend
cd client
npm start
```

7. Seed the database with initial data
```bash
node utils/seedData.js
```

### Development Mode

The application is configured to work in two modes:

1. **Mock Data Mode**: Uses hardcoded mockups for development without requiring a backend
2. **API Mode**: Uses the real API endpoints connecting to the backend

To toggle between these modes, find the `USE_MOCK_DATA` constant in each component and set it to `true` or `false`. The default is set to `true` for easier development.

### Test Credentials

You can log in with the following credentials in mock data mode:
- Email: student@careerzoom.com
- Password: student123

## Project Structure

```
careerzoom/
├── api/                    # Backend API
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Express middleware
│   ├── services/           # Business logic
│   └── routes.js           # API routes definition
├── client/                 # React frontend
│   ├── public/             # Static files
│   └── src/
│       ├── components/     # Reusable components
│       ├── context/        # React context providers
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Page components
│       └── utils/          # Utility functions
├── models/                 # Mongoose models
├── utils/                  # Server utility functions
├── .env                    # Environment variables
├── .env.example            # Example environment variables
├── index.js                # Server entry point
└── package.json            # Project dependencies
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive token

### User
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Interviews
- `POST /api/interviews` - Create a new interview
- `GET /api/interviews` - Get user's interviews
- `GET /api/interviews/:id` - Get interview by ID
- `POST /api/interviews/:id/start` - Start an interview
- `POST /api/interviews/:id/end` - End an interview
- `POST /api/interviews/:id/analyze` - Analyze interview recording
- `POST /api/interviews/:id/peer-invite` - Invite a peer reviewer
- `GET /api/interviews/invitations` - Get peer review invitations

### Feedback
- `POST /api/interviews/:id/feedback` - Save feedback for an interview
- `GET /api/interviews/:id/feedback` - Get all feedback for an interview

### Questions
- `GET /api/questions/industries` - Get list of industries
- `GET /api/questions/industry/:industry` - Get questions for a specific industry

### Voice & Audio
- `GET /api/questions/:id/audio` - Get audio version of a question (text-to-speech)
- `GET /api/voices` - Get available voice options for text-to-speech

## Voice-Over Feature

CareerZoom offers an advanced voice-over feature that uses OpenAI's text-to-speech technology to read interview questions aloud. This creates a more realistic interview environment and helps users practice responding to verbal questions.

### Features:
- Enable/disable voice-over for each interview
- Choose from multiple voice options with different characteristics
- Audio controls for playing and stopping question playback
- Automatic voice selection based on interview settings

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Zoom for their SDK
- OpenAI for their API
- Material-UI for the UI components