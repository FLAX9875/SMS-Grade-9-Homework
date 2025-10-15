// SERVER FILE - Express.js Backend for Homework Tracker
// This file should NOT import discord.js
console.log('Starting Homework Tracker Server...');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { utcToZonedTime } = require('date-fns-tz');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const WINNIPEG_TIMEZONE = 'America/Winnipeg';

// Discord webhook configuration
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const DISCORD_GUILD_ID = '1426102941970071634';
const DISCORD_CHANNEL_ID = '1427497933942685818';

// Rate limiting configuration
const generalLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 20, // limit each IP to 20 requests per 10 seconds
  message: { error: 'Too many requests. Try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per minute for sensitive endpoints
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// More lenient rate limiter for contact form
const contactLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per minute for contact form
  message: { error: 'Too many contact form submissions. Please wait a minute before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors({
  origin: [
    'https://sms-grade-9-homework.onrender.com',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.static('uploads')); // Serve uploaded files
app.use(generalLimiter); // Apply general rate limiting to all routes

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common document types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// MongoDB connection
// Connect to MongoDB with error handling so the process doesn't crash if DB is down
let dbConnected = false;
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/homework-tracker')
  .then(() => {
    dbConnected = true;
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    dbConnected = false;
    console.error('MongoDB connection error (will continue running without DB):', err && err.message ? err.message : err);
  });

const db = mongoose.connection;
db.on('error', (err) => {
  dbConnected = false;
  console.error('MongoDB connection error:', err && err.message ? err.message : err);
});
db.once('open', () => {
  dbConnected = true;
  console.log('MongoDB connection opened');
});

// Homework Schema
const homeworkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  creator: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Not Done', 'Done'],
    default: 'Not Done'
  },
  completedBy: [{
    username: String,
    completedAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Homework = mongoose.model('Homework', homeworkSchema);

// Study Links Schema
const studyLinkSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  addedBy: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const StudyLink = mongoose.model('StudyLink', studyLinkSchema);

// Contact Form Schema
const contactFormSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['suggestion', 'issue'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  attachments: [{
    filename: String,
    url: String,
    mimetype: String
  }],
  submittedBy: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ContactForm = mongoose.model('ContactForm', contactFormSchema);

// Discord webhook function
async function sendDiscordWebhook(contactForm) {
  if (!DISCORD_WEBHOOK_URL) {
    console.log('Discord webhook URL not configured, skipping webhook send');
    return;
  }

  try {
    const isSuggestion = contactForm.type === 'suggestion';
    const emoji = isSuggestion ? '💡' : '🐛';
    const color = isSuggestion ? 0x00ff00 : 0xff0000; // Green for suggestions, red for issues
    
    const embed = {
      title: `${emoji} ${contactForm.title}`,
      description: contactForm.description,
      color: color,
      fields: [
        {
          name: 'Type',
          value: isSuggestion ? 'Homework Suggestion' : 'Issue Report',
          inline: true
        },
        {
          name: 'Submitted By',
          value: contactForm.submittedBy,
          inline: true
        },
        {
          name: 'Timestamp',
          value: new Date(contactForm.createdAt).toLocaleString(),
          inline: true
        }
      ],
      footer: {
        text: 'SMS Grade 9 Homework Tracker'
      },
      timestamp: new Date().toISOString()
    };

    // Add attachments field if there are any
    if (contactForm.attachments && contactForm.attachments.length > 0) {
      embed.fields.push({
        name: 'Attachments',
        value: contactForm.attachments.map(att => att.filename).join(', '),
        inline: false
      });

      // If there are image attachments, add the first image to the embed
      const imageAttachment = contactForm.attachments.find(att => 
        att.mimetype && att.mimetype.startsWith('image/')
      );
      
      if (imageAttachment && imageAttachment.url && !imageAttachment.url.startsWith('placeholder-')) {
        embed.image = {
          url: imageAttachment.url
        };
      }
    }

    const webhookData = {
      content: `New ${isSuggestion ? 'suggestion' : 'issue report'} submitted!`,
      embeds: [embed]
    };

    await axios.post(DISCORD_WEBHOOK_URL, webhookData);
    console.log(`Discord webhook sent for ${contactForm.type}: ${contactForm.title}`);
  } catch (error) {
    console.error('Error sending Discord webhook:', error);
  }
}

// Function to clean up completed homework after 2 days
async function cleanupCompletedHomework() {
  try {
    // If DB isn't connected, skip cleanup to avoid unhandled errors
    if (!dbConnected || mongoose.connection.readyState !== 1) {
      // Not connected: skip cleanup run
      // console.log('Skipping cleanup - DB not connected');
      return;
    }
    const nowWinnipeg = utcToZonedTime(new Date(), WINNIPEG_TIMEZONE);
    const twoDaysAgo = new Date(nowWinnipeg);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    // Find homework that has been completed by someone and the completion was more than 2 days ago
    const homeworkToDelete = await Homework.find({
      'completedBy.0': { $exists: true }, // Has at least one completion
      'completedBy.completedAt': { $lt: twoDaysAgo }
    });
    
    if (homeworkToDelete.length > 0) {
      console.log(`Cleaning up ${homeworkToDelete.length} completed homework items older than 2 days`);
      
      // Delete homework where all completions are older than 2 days
      for (const homework of homeworkToDelete) {
        const recentCompletions = homework.completedBy.filter(completion => 
          new Date(completion.completedAt) > twoDaysAgo
        );
        
        if (recentCompletions.length === 0) {
          // All completions are older than 2 days, delete the homework
          await Homework.findByIdAndDelete(homework._id);
          console.log(`Deleted homework: ${homework.title}`);
        } else {
          // Some completions are recent, keep the homework but remove old completions
          homework.completedBy = recentCompletions;
          await homework.save();
          console.log(`Updated homework: ${homework.title} - removed old completions`);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up completed homework:', error);
  }
}

// Run cleanup every hour
setInterval(cleanupCompletedHomework, 60 * 60 * 1000);

// Run initial cleanup on server start
setTimeout(cleanupCompletedHomework, 5000); // Wait 5 seconds after server start

// Middleware to short-circuit requests if DB isn't connected (except health check)
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  if (!dbConnected || mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Service temporarily unavailable - database not connected' });
  }
  return next();
});

// Routes
app.get('/api/homework', async (req, res) => {
  try {
    if (!dbConnected) {
      // DB is not connected; return empty list to keep frontend usable
      console.warn('GET /api/homework requested but DB not connected — returning empty array');
      return res.json([]);
    }

    const homework = await Homework.find().sort({ dueDate: 1 });
    res.json(homework);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/homework', strictLimiter, async (req, res) => {
  try {
    const { title, subject, dueDate, description, creator } = req.body;
    
    if (!title || !subject || !dueDate || !creator) {
      return res.status(400).json({ error: 'Title, subject, due date, and creator are required' });
    }

    const homework = new Homework({
      title,
      subject,
      dueDate: new Date(dueDate),
      description: description || '',
      creator
    });

    await homework.save();
    res.status(201).json(homework);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/homework/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const homework = await Homework.findByIdAndDelete(id);
    
    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }
    
    res.json({ message: 'Homework deleted successfully', homework });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/homework/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const homework = await Homework.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }
    
    res.json(homework);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Personal completion route
app.patch('/api/homework/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    const homework = await Homework.findById(id);
    
    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }
    
    // Check if user already completed this homework
    const alreadyCompleted = homework.completedBy.some(completion => completion.username === username);
    
    if (alreadyCompleted) {
      // Remove completion
      homework.completedBy = homework.completedBy.filter(completion => completion.username !== username);
    } else {
      // Add completion
      homework.completedBy.push({ username, completedAt: new Date() });
    }
    
    await homework.save();
    res.json({ success: true, homework });
  } catch (error) {
    console.error('Error marking homework complete:', error);
    res.status(500).json({ error: 'Server error updating homework' });
  }
});

// Study Links API endpoints
app.get('/api/study-links', async (req, res) => {
  try {
    if (!dbConnected) {
      console.warn('GET /api/study-links requested but DB not connected — returning empty array');
      return res.json([]);
    }

    const studyLinks = await StudyLink.find().sort({ createdAt: -1 });
    res.json(studyLinks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/study-links', strictLimiter, async (req, res) => {
  try {
    const { url, title, description, addedBy } = req.body;
    
    if (!url || !title || !addedBy) {
      return res.status(400).json({ error: 'URL, title, and addedBy are required' });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const studyLink = new StudyLink({
      url,
      title,
      description: description || '',
      addedBy
    });

    await studyLink.save();
    res.status(201).json(studyLink);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/study-links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const studyLink = await StudyLink.findByIdAndDelete(id);
    
    if (!studyLink) {
      return res.status(404).json({ error: 'Study link not found' });
    }
    
    res.json({ message: 'Study link deleted successfully', studyLink });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// File upload endpoint
app.post('/api/upload', upload.array('files', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => ({
      filename: file.originalname,
      url: `${req.protocol}://${req.get('host')}/${file.filename}`,
      mimetype: file.mimetype,
      size: file.size
    }));

    res.json({ success: true, files: uploadedFiles });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Contact Form API endpoints
app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    const { type, title, description, attachments, submittedBy } = req.body;
    
    if (!type || !title || !description || !submittedBy) {
      return res.status(400).json({ error: 'Type, title, description, and submittedBy are required' });
    }

    if (!['suggestion', 'issue'].includes(type)) {
      return res.status(400).json({ error: 'Type must be either "suggestion" or "issue"' });
    }

    const contactForm = new ContactForm({
      type,
      title,
      description,
      attachments: attachments || [],
      submittedBy
    });

    await contactForm.save();
    
    // Send Discord webhook
    await sendDiscordWebhook(contactForm);
    
    res.status(201).json(contactForm);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/contact', async (req, res) => {
  try {
    if (!dbConnected) {
      console.warn('GET /api/contact requested but DB not connected — returning empty array');
      return res.json([]);
    }

    const contactForms = await ContactForm.find().sort({ createdAt: -1 });
    res.json(contactForms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint (enhanced)
app.get('/health', async (req, res) => {
  const startedAt = Date.now();
  try {
    const dbState = mongoose.connection.readyState; // 1 connected, 2 connecting, 0 disconnected, 3 disconnecting
    const isDbUp = dbState === 1;

    // Basic metrics
    const [totalHomework, upcomingCount, overdueCount] = await Promise.all([
      Homework.countDocuments({}),
      Homework.countDocuments({ dueDate: { $gte: new Date() } }),
      Homework.countDocuments({ dueDate: { $lt: new Date() } })
    ]);

    const latencyMs = Date.now() - startedAt;

    res.json({
      status: 'OK',
      api: { up: true, latencyMs },
      db: { up: isDbUp, state: dbState },
      metrics: {
        totalHomework,
        upcomingCount,
        overdueCount
      },
      serverTimeUtc: new Date().toISOString(),
      timezone: WINNIPEG_TIMEZONE
    });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Keep-alive ping to prevent Render from sleeping
setInterval(() => {
  console.log('Keep-alive ping - server is running');
}, 5 * 60 * 1000); // Every 5 minutes
