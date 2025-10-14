# Homework Tracker

A modern, full-stack homework tracking system with Discord bot integration. Features a beautiful dark-themed website built with Next.js and TailwindCSS, a robust Express.js backend with MongoDB, and a Discord bot for easy homework management.

## 🚀 Features

- **Modern Web Interface**: Clean, responsive design with dark theme
- **Real-time Updates**: Auto-refreshes every 30 seconds to show new homework
- **Discord Bot Integration**: Add/remove homework directly from Discord
- **Mobile Responsive**: Works perfectly on desktop and mobile devices
- **Status Tracking**: Mark homework as Done or Not Done
- **Due Date Countdown**: Visual countdown timers and urgency indicators
- **Modal Details**: Click homework cards to see full descriptions and details
- **Study Resources**: Add and browse study links via Discord bot
- **Contact System**: Submit suggestions and report issues with Discord integration
- **Admin Controls**: Edit homework assignments with admin permissions
- **Rate Limiting**: Built-in protection against spam and abuse
- **Creator Tracking**: Track who created each homework assignment

## 📁 Project Structure

```
homework-tracker/
├── client/          # Next.js frontend
├── server/          # Express.js backend
├── bot/            # Discord bot
├── package.json    # Root package.json
└── README.md       # This file
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Axios** - HTTP client
- **date-fns** - Date manipulation

### Backend
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **CORS** - Cross-origin resource sharing

### Discord Bot
- **discord.js v14** - Discord API library
- **Slash Commands** - Modern Discord command system

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud)
- Discord Bot Token

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd homework-tracker
npm install
```

### 2. Environment Setup

#### Backend (server/.env)
```env
MONGO_URI=mongodb://localhost:27017/homework-tracker
PORT=5000
```

#### Discord Bot (bot/.env)
```env
DISCORD_TOKEN=your_discord_bot_token_here
API_URL=http://localhost:5000
```

#### Frontend (client/.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Run Development Servers

```bash
# Run all services concurrently
npm run dev

# Or run individually:
npm run dev:client  # Frontend on http://localhost:3000
npm run dev:server  # Backend on http://localhost:5000
npm run dev:bot     # Discord bot
```

## 🤖 Discord Bot Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name your application (e.g., "Homework Tracker")
4. Go to "Bot" section
5. Click "Add Bot"
6. Copy the bot token

### 2. Invite Bot to Server

1. Go to "OAuth2" → "URL Generator"
2. Select scopes: `bot`, `applications.commands`
3. Select permissions: `Send Messages`, `Use Slash Commands`
4. Copy the generated URL and open it to invite the bot

### 3. Bot Commands

- `/addhomework [title] [subject] [duedate: yyyy-mm-dd] [creator] [description]` - Add new homework
- `/removehomework [title]` - Remove homework by title
- `/listhomework [status]` - List all homework (optional status filter)
- `/editprompt [homework_id] [field] [new_value]` - Edit homework (Admin only)
- `/link [url] [title] [description]` - Add study resource link
- `/deletelink [link_id]` - Delete study resource link
- `/database` - View completion status for all users
- `/showwebsite` - Show website/API/DB status

## 🌐 API Endpoints

### Homework Endpoints
- **GET /api/homework** - Returns all homework assignments
- **POST /api/homework** - Adds a new homework assignment
- **DELETE /api/homework/:id** - Deletes a homework assignment by ID
- **PUT /api/homework/:id** - Updates homework status
- **POST /api/homework/:id/complete** - Toggle personal completion status

### Study Links Endpoints
- **GET /api/study-links** - Returns all study links
- **POST /api/study-links** - Adds a new study link
- **DELETE /api/study-links/:id** - Deletes a study link by ID

### Contact Form Endpoints
- **POST /api/contact** - Submits a contact form (suggestion or issue)
- **GET /api/contact** - Returns all contact form submissions

### Health Check
- **GET /health** - Returns API, database, and website status

## 🔗 Discord Webhook Setup

To enable contact form submissions to be sent to Discord:

1. Go to your Discord server settings
2. Navigate to "Integrations" → "Webhooks"
3. Create a new webhook for the channel where you want notifications
4. Copy the webhook URL
5. Add it to your server environment variables:
   ```env
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL_HERE
   ```

Contact form submissions will be sent as Discord embeds with:
- 💡 emoji for homework suggestions
- 🐛 emoji for issue reports
- Form details including title, description, submitter, and attachments

## 🚀 Deployment on Render

### 1. Backend Deployment

1. Connect your GitHub repository to Render
2. Create a new "Web Service"
3. Configure:
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Environment Variables**:
     - `MONGO_URI`: Your MongoDB connection string
     - `PORT`: 10000 (Render default)

### 2. Frontend Deployment

1. Create a new "Static Site" on Render
2. Configure:
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/out`
   - **Environment Variables**:
     - `NEXT_PUBLIC_API_URL`: Your backend URL

### 3. Discord Bot Deployment

1. Create a new "Background Worker" on Render
2. Configure:
   - **Build Command**: `cd bot && npm install`
   - **Start Command**: `cd bot && npm start`
   - **Environment Variables**:
     - `DISCORD_TOKEN`: Your Discord bot token
     - `API_URL`: Your backend URL

### 4. Keep Services Alive with UptimeRobot

1. Sign up at [UptimeRobot](https://uptimerobot.com/)
2. Add monitors for:
   - Backend API: `https://your-backend-url.onrender.com/health`
   - Frontend: `https://your-frontend-url.onrender.com`
3. Set monitoring interval to 5 minutes

## 🎨 Customization

### Colors and Theme
Edit `client/tailwind.config.js` to customize the color scheme:

```javascript
colors: {
  'dark-bg': '#0a0a0a',        // Background
  'dark-card': '#1a1a1a',      // Card background
  'dark-border': '#2a2a2a',    // Border color
  'dark-text': '#e5e5e5',      // Primary text
  'dark-text-secondary': '#a3a3a3', // Secondary text
}
```

### Auto-refresh Interval
Change the refresh interval in `client/app/page.tsx`:

```javascript
// Auto-refresh every 30 seconds
const interval = setInterval(fetchHomework, 30000)
```

## 🔧 Development

### Adding New Features

1. **Backend**: Add new routes in `server/index.js`
2. **Frontend**: Create components in `client/app/components/`
3. **Bot**: Add new slash commands in `bot/index.js`

### Database Schema

```javascript
{
  title: String (required),
  subject: String (required),
  dueDate: Date (required),
  description: String (optional),
  status: String (enum: ['Done', 'Not Done']),
  createdAt: Date (auto-generated)
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Bot not responding**: Check bot token and permissions
2. **API connection failed**: Verify API_URL environment variable
3. **MongoDB connection error**: Check MONGO_URI format
4. **Build failures**: Ensure Node.js 18+ is installed

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## 📝 License

MIT License - feel free to use this project for your own homework tracking needs!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

If you encounter any issues, please check the troubleshooting section or create an issue in the repository.

---

**Happy homework tracking! 📚✨**
