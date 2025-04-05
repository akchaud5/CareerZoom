const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profile-pictures');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with original extension
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

// Configure upload restrictions
const fileFilter = (req, file, cb) => {
  // Accept only image files
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WEBP images are allowed.'), false);
  }
};

// Initialize upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  }
});

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: role || 'student'
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing email or password in request');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User not found with email: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);
    console.log(`Login successful for user: ${user.email}`);

    // Return user data and token
    res.json({
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      token
    });
  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    // req.user is set by authMiddleware
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('improvementPlan');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    console.log('Update profile request:', req.body);
    const { firstName, lastName, email, password, industries, jobTitles, skillLevel, profilePicture } = req.body;

    // Get user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    
    // Handle password update
    if (password) {
      if (req.body.currentPassword) {
        // Verify current password
        const isMatch = await user.comparePassword(req.body.currentPassword);
        if (!isMatch) {
          return res.status(401).json({ message: 'Current password is incorrect' });
        }
        user.password = password; // This will be hashed by the pre-save hook
      } else {
        return res.status(400).json({ message: 'Current password is required to update password' });
      }
    }
    
    // Handle arrays
    if (industries && Array.isArray(industries)) user.industries = industries;
    if (jobTitles && Array.isArray(jobTitles)) user.jobTitles = jobTitles;
    
    if (skillLevel) user.skillLevel = skillLevel;
    if (profilePicture) user.profilePicture = profilePicture;

    const updatedUser = await user.save();
    console.log('User updated successfully:', updatedUser.firstName);

    // Return user data without password
    res.json({
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      role: updatedUser.role,
      industries: updatedUser.industries,
      jobTitles: updatedUser.jobTitles,
      skillLevel: updatedUser.skillLevel,
      profilePicture: updatedUser.profilePicture
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Upload profile picture
// @route   POST /api/users/profile/picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
  try {
    // Handle the upload with multer middleware
    const uploadSingle = upload.single('profilePicture');
    
    uploadSingle(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ 
          message: err.message || 'Error uploading file',
          error: err 
        });
      }
      
      // If no file was uploaded
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      try {
        // Get user
        const user = await User.findById(req.user._id);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        // Generate public URL for the uploaded file
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        const relativePath = path.relative(path.join(__dirname, '../..'), req.file.path).replace(/\\/g, '/');
        const profilePictureUrl = `${baseUrl}/${relativePath}`;
        
        // Delete old profile picture if it exists
        if (user.profilePicture) {
          try {
            const oldPicturePath = user.profilePicture.replace(baseUrl, '');
            const fullPath = path.join(__dirname, '../..', oldPicturePath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
              console.log(`Deleted old profile picture: ${oldPicturePath}`);
            }
          } catch (deleteErr) {
            console.error('Error deleting old profile picture:', deleteErr);
            // Continue even if delete fails
          }
        }
        
        // Update user with new profile picture URL
        user.profilePicture = profilePictureUrl;
        await user.save();
        
        // Return success response with updated user data
        res.json({
          message: 'Profile picture uploaded successfully',
          profilePicture: profilePictureUrl
        });
      } catch (error) {
        console.error('Profile picture update error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
      }
    });
  } catch (error) {
    console.error('Upload handler error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
