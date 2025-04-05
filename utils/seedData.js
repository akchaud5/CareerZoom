require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Question = require('../models/Question');

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/careerzoom')
  .then(() => console.log('MongoDB connected for seeding'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Sample industries and job titles
const industries = [
  'Software Development',
  'Data Science',
  'Product Management',
  'Marketing',
  'Finance',
  'Healthcare',
];

const jobTitles = {
  'Software Development': [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Mobile Developer',
    'DevOps Engineer',
  ],
  'Data Science': [
    'Data Scientist',
    'Data Analyst',
    'Machine Learning Engineer',
    'Data Engineer',
    'Business Intelligence Analyst',
  ],
  'Product Management': [
    'Product Manager',
    'Product Owner',
    'Technical Product Manager',
    'Associate Product Manager',
    'Senior Product Manager',
  ],
  'Marketing': [
    'Digital Marketing Manager',
    'Content Marketer',
    'SEO Specialist',
    'Social Media Manager',
    'Marketing Analyst',
  ],
  'Finance': [
    'Financial Analyst',
    'Investment Banker',
    'Accountant',
    'Financial Advisor',
    'Risk Analyst',
  ],
  'Healthcare': [
    'Registered Nurse',
    'Physician Assistant',
    'Medical Technologist',
    'Healthcare Administrator',
    'Clinical Research Associate',
  ],
};

// Sample question types
const questionTypes = ['behavioral', 'technical', 'situational', 'case-study'];

// Sample questions
const generateQuestions = () => {
  const questions = [];

  // Behavioral questions - general across industries
  const behavioralQuestions = [
    'Tell me about yourself.',
    'What is your greatest professional achievement?',
    'Describe a time when you had to overcome a significant challenge at work.',
    'How do you handle conflict with colleagues?',
    'Tell me about a time you failed and what you learned from it.',
    'How do you prioritize your work when you have multiple deadlines?',
    'Describe a situation where you had to work with a difficult team member.',
    'Tell me about a time you had to adapt to a significant change at work.',
    'How do you handle pressure or stressful situations?',
    'Describe a time when you showed leadership skills.',
  ];

  // Add behavioral questions for all industries and job titles
  industries.forEach((industry) => {
    jobTitles[industry].forEach((jobTitle) => {
      behavioralQuestions.forEach((question) => {
        questions.push({
          text: question,
          industry,
          jobTitle,
          difficulty: ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)],
          type: 'behavioral',
          sampleAnswer: `Sample answer for "${question}" in ${industry} - ${jobTitle}`,
          keywords: question
            .toLowerCase()
            .split(' ')
            .filter((word) => word.length > 3),
          isPublic: true,
        });
      });
    });
  });

  // Industry-specific technical questions
  const technicalQuestions = {
    'Software Development': [
      'What is the difference between var, let, and const in JavaScript?',
      'Explain the concept of RESTful APIs and their principles.',
      'How do you handle state management in React?',
      'Describe the difference between SQL and NoSQL databases.',
      'What are the SOLID principles in object-oriented programming?',
    ],
    'Data Science': [
      'Explain the difference between supervised and unsupervised learning.',
      'What is the curse of dimensionality and how would you handle it?',
      'Describe the bias-variance tradeoff in machine learning models.',
      'How would you handle imbalanced data in a classification problem?',
      'Explain the concept of regularization in machine learning.',
    ],
    'Product Management': [
      'How do you prioritize features in a product roadmap?',
      'Explain your approach to conducting user research.',
      'How do you measure the success of a product feature?',
      'Walk me through how you would create a PRD (Product Requirements Document).',
      'How do you collaborate with engineering teams to ensure successful delivery?',
    ],
    'Marketing': [
      'How do you measure the ROI of a marketing campaign?',
      'Explain your approach to creating a content marketing strategy.',
      'How would you optimize a PPC campaign?',
      'What metrics do you use to evaluate social media performance?',
      'How do you approach A/B testing for marketing materials?',
    ],
    'Finance': [
      'Explain the concept of time value of money.',
      'How would you value a company using DCF analysis?',
      'What are the main financial statements and how do they relate to each other?',
      'Explain the difference between NPV and IRR.',
      'How would you evaluate a potential investment opportunity?',
    ],
    'Healthcare': [
      'How do you ensure patient confidentiality and HIPAA compliance?',
      'Describe your approach to handling emergency situations.',
      'How do you stay updated with the latest medical research and developments?',
      'What experience do you have with electronic health records (EHR) systems?',
      'How do you handle situations where a patient is not following treatment recommendations?',
    ],
  };

  // Add technical questions for each industry and job title
  industries.forEach((industry) => {
    jobTitles[industry].forEach((jobTitle) => {
      technicalQuestions[industry].forEach((question) => {
        questions.push({
          text: question,
          industry,
          jobTitle,
          difficulty: ['intermediate', 'advanced'][Math.floor(Math.random() * 2)],
          type: 'technical',
          sampleAnswer: `Sample answer for "${question}" in ${industry} - ${jobTitle}`,
          keywords: question
            .toLowerCase()
            .split(' ')
            .filter((word) => word.length > 3),
          isPublic: true,
        });
      });
    });
  });

  // Situational questions - general across industries but with some specificity
  const situationalQuestions = [
    "How would you handle a situation where you're assigned more work than you can handle?",
    "What would you do if you caught a colleague breaking company policy?",
    "How would you handle a situation where your team disagrees with your approach?",
    "What would you do if you realized you made a significant mistake on a project?",
    "How would you handle a situation where you have to meet a tight deadline?",
  ];

  // Add situational questions for all industries and job titles
  industries.forEach((industry) => {
    jobTitles[industry].forEach((jobTitle) => {
      situationalQuestions.forEach((question) => {
        questions.push({
          text: question,
          industry,
          jobTitle,
          difficulty: ['beginner', 'intermediate'][Math.floor(Math.random() * 2)],
          type: 'situational',
          sampleAnswer: `Sample answer for "${question}" in ${industry} - ${jobTitle}`,
          keywords: question
            .toLowerCase()
            .split(' ')
            .filter((word) => word.length > 3),
          isPublic: true,
        });
      });
    });
  });

  return questions;
};

// Sample users
const users = [
  {
    email: 'admin@careerzoom.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    industries: ['Software Development', 'Data Science'],
    jobTitles: ['Full Stack Developer', 'Data Scientist'],
    skillLevel: 'senior',
  },
  {
    email: 'mentor@careerzoom.com',
    password: 'mentor123',
    firstName: 'Mentor',
    lastName: 'User',
    role: 'mentor',
    industries: ['Software Development', 'Product Management'],
    jobTitles: ['Senior Developer', 'Technical Product Manager'],
    skillLevel: 'senior',
  },
  {
    email: 'student@careerzoom.com',
    password: 'student123',
    firstName: 'Student',
    lastName: 'User',
    role: 'student',
    industries: ['Software Development'],
    jobTitles: ['Frontend Developer'],
    skillLevel: 'entry',
  },
];

// Seed the database
const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Question.deleteMany({});

    console.log('Cleared existing data');

    // Create users with hashed passwords
    const createdUsers = [];
    for (const userData of users) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const user = new User({
        ...userData,
        password: hashedPassword,
      });

      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`Created user: ${savedUser.email}`);
    }

    // Generate questions
    const questions = generateQuestions();

    // Set some questions to be created by the admin user
    const adminUser = createdUsers.find((user) => user.role === 'admin');
    questions.slice(0, 20).forEach((question) => {
      question.createdBy = adminUser._id;
    });

    // Create questions
    await Question.insertMany(questions);
    console.log(`Created ${questions.length} questions`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedDatabase();