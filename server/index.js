const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/homework-tracker');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
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

// Routes
app.get('/api/homework', async (req, res) => {
  try {
    const homework = await Homework.find().sort({ dueDate: 1 });
    res.json(homework);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/homework', async (req, res) => {
  try {
    const { title, subject, dueDate, description } = req.body;
    
    if (!title || !subject || !dueDate) {
      return res.status(400).json({ error: 'Title, subject, and due date are required' });
    }

    const homework = new Homework({
      title,
      subject,
      dueDate: new Date(dueDate),
      description: description || ''
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
app.post('/api/homework/:id/complete', async (req, res) => {
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
    res.json(homework);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
