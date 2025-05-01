const User = require('../models/user.model');
const mockData = require('./mock.controller');

// Check if we're in development mode without MongoDB
const useMockData = process.env.NODE_ENV === 'development' && process.env.MONGO_REQUIRED !== 'true';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (useMockData) {
      // Check if user already exists in mock data
      const existingUser = mockData.users.find(user => user.email === email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User already exists',
        });
      }

      // Create mock user
      const newUser = {
        _id: (mockData.users.length + 1).toString(),
        name,
        email,
        role: 'user',
        createdAt: new Date(),
        last_login: new Date(),
        stats: {
          portfolios: 0,
          trades: 0,
          watchlist_items: 0
        }
      };

      // Add to mock data
      mockData.users.push(newUser);

      // Return token
      const token = 'mock-token-' + Date.now();
      return res.status(201).json({
        success: true,
        access_token: token,
      });
    }

    // Create user in MongoDB
    const user = await User.create({
      name,
      email,
      password,
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email and password',
      });
    }

    if (useMockData) {
      // Find user in mock data
      const user = mockData.users.find(user => user.email === email);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

      // In development mode, we don't check passwords
      const isMatch = mockData.passwordMatch();

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

      // Update last login time
      user.last_login = new Date();

      // Return token
      const token = 'mock-token-' + Date.now();
      return res.status(200).json({
        success: true,
        access_token: token,
      });
    }

    // Check for user in MongoDB
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Update last login time
    user.last_login = Date.now();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    if (useMockData) {
      // In mock mode, find the first user (we can't truly authenticate)
      const user = mockData.users[0];

      return res.status(200).json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: '',
          bio: '',
          avatar_url: '',
          role: user.role,
          created_at: user.createdAt,
          last_login: user.last_login,
          stats: user.stats,
        },
      });
    }

    // user is already available in req due to the protect middleware
    const user = await User.findById(req.user.id);

    // Calculate stats for user (number of portfolios, trades, etc.)
    // This would need to be updated based on your actual models
    const stats = {
      portfolios: 0, // Placeholder: you'd need to count actual portfolios
      trades: 0, // Placeholder: you'd need to count actual trades
      watchlist_items: 0, // Placeholder: you'd need to count actual watchlist items
    };

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        bio: user.bio,
        avatar_url: user.avatar_url,
        role: user.role,
        created_at: user.createdAt,
        last_login: user.last_login,
        stats,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    if (useMockData) {
      // Update mock user (first user)
      const user = mockData.users[0];
      
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || '';
      user.bio = req.body.bio || '';
      
      return res.status(200).json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          bio: user.bio || '',
          avatar_url: '',
          role: user.role,
          created_at: user.createdAt,
          last_login: user.last_login,
        },
      });
    }

    // Fields to update
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      bio: req.body.bio,
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        bio: user.bio,
        avatar_url: user.avatar_url,
        role: user.role,
        created_at: user.createdAt,
        last_login: user.last_login,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    if (useMockData) {
      // In mock mode, just return success
      const token = 'mock-token-' + Date.now();
      return res.status(200).json({
        success: true,
        access_token: token,
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.current_password))) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    user.password = req.body.new_password;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  res.status(statusCode).json({
    success: true,
    access_token: token,
  });
}; 