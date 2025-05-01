const News = require('../models/news.model');
const mockData = require('./mock.controller');

// Check if we're in development mode without MongoDB
const useMockData = process.env.NODE_ENV === 'development' && process.env.MONGO_REQUIRED !== 'true';

// @desc    Get all news articles
// @route   GET /api/news
// @access  Public
exports.getNews = async (req, res, next) => {
  try {
    if (useMockData) {
      // Filter mock news based on query parameters
      let filteredNews = [...mockData.news];
      
      // Handle category filtering
      if (req.query.category) {
        filteredNews = filteredNews.filter(item => item.category === req.query.category);
      }
      
      // Sort (default to newest first)
      filteredNews.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
      
      // Basic pagination
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const total = filteredNews.length;
      
      const paginatedNews = filteredNews.slice(startIndex, endIndex);
      
      // Pagination result
      const pagination = {};
      
      if (endIndex < total) {
        pagination.next = {
          page: page + 1,
          limit
        };
      }
      
      if (startIndex > 0) {
        pagination.prev = {
          page: page - 1,
          limit
        };
      }
      
      return res.status(200).json({
        success: true,
        count: paginatedNews.length,
        pagination,
        data: paginatedNews
      });
    }

    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = News.find(JSON.parse(queryStr));

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-published_at');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await News.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const news = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: news.length,
      pagination,
      data: news
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single news article
// @route   GET /api/news/:id
// @access  Public
exports.getNewsById = async (req, res, next) => {
  try {
    if (useMockData) {
      const newsItem = mockData.news.find(item => item._id === req.params.id);
      
      if (!newsItem) {
        return res.status(404).json({
          success: false,
          error: 'News article not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: newsItem
      });
    }

    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'News article not found'
      });
    }

    res.status(200).json({
      success: true,
      data: news
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new news article
// @route   POST /api/news
// @access  Private (Admin only)
exports.createNews = async (req, res, next) => {
  try {
    if (useMockData) {
      const newArticle = {
        _id: (mockData.news.length + 1).toString(),
        title: req.body.title,
        content: req.body.content,
        summary: req.body.summary,
        source: req.body.source,
        url: req.body.url,
        image_url: req.body.image_url || '',
        published_at: new Date(),
        sentiment: req.body.sentiment || 0,
        category: req.body.category || 'other',
        related_symbols: req.body.related_symbols || [],
      };
      
      mockData.news.push(newArticle);
      
      return res.status(201).json({
        success: true,
        data: newArticle
      });
    }

    const news = await News.create(req.body);

    res.status(201).json({
      success: true,
      data: news
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update news article
// @route   PUT /api/news/:id
// @access  Private (Admin only)
exports.updateNews = async (req, res, next) => {
  try {
    if (useMockData) {
      const index = mockData.news.findIndex(item => item._id === req.params.id);
      
      if (index === -1) {
        return res.status(404).json({
          success: false,
          error: 'News article not found'
        });
      }
      
      const updatedArticle = {
        ...mockData.news[index],
        ...req.body,
      };
      
      mockData.news[index] = updatedArticle;
      
      return res.status(200).json({
        success: true,
        data: updatedArticle
      });
    }

    const news = await News.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'News article not found'
      });
    }

    res.status(200).json({
      success: true,
      data: news
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete news article
// @route   DELETE /api/news/:id
// @access  Private (Admin only)
exports.deleteNews = async (req, res, next) => {
  try {
    if (useMockData) {
      const index = mockData.news.findIndex(item => item._id === req.params.id);
      
      if (index === -1) {
        return res.status(404).json({
          success: false,
          error: 'News article not found'
        });
      }
      
      mockData.news.splice(index, 1);
      
      return res.status(200).json({
        success: true,
        data: {}
      });
    }

    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'News article not found'
      });
    }

    await news.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Search news articles
// @route   GET /api/news/search
// @access  Public
exports.searchNews = async (req, res, next) => {
  try {
    if (useMockData) {
      if (!req.query.q) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a search term'
        });
      }
      
      // Simple search in title and content
      const searchTerm = req.query.q.toLowerCase();
      const searchResults = mockData.news.filter(
        article => 
          article.title.toLowerCase().includes(searchTerm) || 
          article.content.toLowerCase().includes(searchTerm) ||
          article.summary.toLowerCase().includes(searchTerm)
      );
      
      return res.status(200).json({
        success: true,
        count: searchResults.length,
        data: searchResults
      });
    }

    if (!req.query.q) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a search term'
      });
    }

    const news = await News.find(
      { $text: { $search: req.query.q } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });

    res.status(200).json({
      success: true,
      count: news.length,
      data: news
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get news by category
// @route   GET /api/news/category/:category
// @access  Public
exports.getNewsByCategory = async (req, res, next) => {
  try {
    if (useMockData) {
      const categoryNews = mockData.news.filter(
        article => article.category === req.params.category
      );
      
      // Sort by published date
      categoryNews.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
      
      return res.status(200).json({
        success: true,
        count: categoryNews.length,
        data: categoryNews
      });
    }

    const news = await News.find({ category: req.params.category })
      .sort('-published_at');

    res.status(200).json({
      success: true,
      count: news.length,
      data: news
    });
  } catch (err) {
    next(err);
  }
}; 