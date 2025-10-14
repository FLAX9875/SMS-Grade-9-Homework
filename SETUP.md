# SMS Grade 9 Homework Tracker - Setup Guide

## Overview
This is a full-stack Discord bot + website project for tracking homework assignments. The system includes:
- **Discord Bot**: Commands for adding/removing homework, study links, and managing assignments
- **Website**: React/Next.js frontend for viewing homework and study resources
- **Backend**: Express.js API server with MongoDB database
- **Contact System**: Integrated contact form that sends reports/suggestions to Discord

## Features

### Discord Bot Commands
- `/addhomework` - Add new homework (requires name/creator)
- `/removehomework` - Remove homework by title
- `/listhomework` - List all homework with filtering
- `/editprompt` - Edit existing homework (Admin only)
- `/link` - Add study resource links
- `/deletelink` - Delete study resource links
- `/database` - View completion status for all users
- `/showwebsite` - Check website/API/DB status

### Website Features
- **Main Tab**: View pending homework assignments
- **Done Tab**: View completed homework assignments
- **Studying Tab**: Browse study resource links
- **Contact System**: Submit suggestions or report issues
- **Personal Progress**: Track individual completion status

## Environment Setup

### 1. Backend Server Setup

1. Navigate to the server directory:
```bash
cd SMS-Grade-9-Homework/server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp env.example .env
```

4. Configure `.env` file:
```env
MONGO_URI=mongodb://localhost:27017/homework-tracker
PORT=5000
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL_HERE
```

5. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

### 2. Frontend Website Setup

1. Navigate to the client directory:
```bash
cd SMS-Grade-9-Homework/client
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp env.local.example .env.local
```

4. Configure `.env.local` file:
```env
# For local development
NEXT_PUBLIC_API_URL=http://localhost:5000

# For production deployment
# NEXT_PUBLIC_API_URL=https://sms-grade-9-homework-server.onrender.com
```

5. Start the development server:
```bash
npm run dev
```

### 3. Discord Bot Setup

1. Navigate to the bot directory:
```bash
cd SMS-Grade-9-Homework/Website-Bot-Homework/Website-Bot-Homework
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp env.example .env
```

4. Configure `.env` file:
```env
DISCORD_TOKEN=your_discord_bot_token_here
API_URL=https://sms-grade-9-homework-server.onrender.com
WEBSITE_URL=https://sms-grade-9-homework.onrender.com
```

5. Start the bot:
```bash
node index.js
```

## API Endpoints

### Homework Management
- `GET /api/homework` - Get all homework assignments
- `POST /api/homework` - Create new homework
- `PUT /api/homework/:id` - Update homework status
- `DELETE /api/homework/:id` - Delete homework
- `POST /api/homework/:id/complete` - Mark homework as completed by user

### Study Links
- `GET /api/study-links` - Get all study links
- `POST /api/study-links` - Add new study link
- `DELETE /api/study-links/:id` - Delete study link

### Contact System
- `POST /api/contact` - Submit contact form (suggestion/issue)
- `GET /api/contact` - Get all contact submissions

### Health Check
- `GET /health` - Check API and database status

## Database Schema

### Homework Collection
```javascript
{
  title: String (required),
  subject: String (required),
  dueDate: Date (required),
  description: String,
  creator: String (required),
  status: String (enum: ['Not Done', 'Done']),
  completedBy: [{
    username: String,
    completedAt: Date
  }],
  createdAt: Date
}
```

### Study Links Collection
```javascript
{
  url: String (required),
  title: String (required),
  description: String,
  addedBy: String (required),
  createdAt: Date
}
```

### Contact Forms Collection
```javascript
{
  type: String (enum: ['suggestion', 'issue']),
  title: String (required),
  description: String (required),
  attachments: [{
    filename: String,
    url: String,
    mimetype: String
  }],
  submittedBy: String (required),
  status: String (enum: ['pending', 'reviewed', 'resolved']),
  createdAt: Date
}
```

## Deployment

### Backend (Render/Vercel)
1. Connect your GitHub repository
2. Set environment variables:
   - `MONGO_URI`: Your MongoDB connection string
   - `DISCORD_WEBHOOK_URL`: Your Discord webhook URL
   - `PORT`: 5000 (or let Render set it)

### Frontend (Vercel)
1. Connect your GitHub repository
2. Set environment variables:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL

### Discord Bot (Render)
1. Connect your GitHub repository
2. Set environment variables:
   - `DISCORD_TOKEN`: Your Discord bot token
   - `API_URL`: Your backend API URL
   - `WEBSITE_URL`: Your frontend URL

## Troubleshooting

### Common Issues

1. **ERR_CONNECTION_REFUSED**: 
   - Check if backend server is running
   - Verify API URL in frontend environment variables
   - Ensure CORS is properly configured

2. **Database Connection Issues**:
   - Verify MongoDB URI is correct
   - Check if MongoDB service is running
   - Ensure network connectivity

3. **Discord Bot Not Responding**:
   - Verify bot token is correct
   - Check if bot has proper permissions
   - Ensure API_URL points to running backend

4. **Rate Limiting**:
   - The system has built-in rate limiting
   - Wait 30 seconds between commands
   - Contact form has 5 requests per 15 minutes limit

## Development Notes

- The system uses Winnipeg timezone (America/Winnipeg) for all date operations
- Completed homework is automatically cleaned up after 2 days
- All API calls have proper error handling and timeouts
- The frontend gracefully handles backend unavailability
- Discord webhooks are used for contact form notifications

## Support

For issues or suggestions, use the contact form on the website or report issues through the Discord bot.
