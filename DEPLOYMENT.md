# Homework Tracker - Deployment Guide

This project consists of three services that need to be deployed separately on Render:

## Services

1. **Discord Bot** (`bot/Website-Bot-Homework-main/`)
2. **Express Server** (`server/`)
3. **Next.js Client** (`client/`)

## Deployment Instructions

### 1. Discord Bot Service

- **Build Command**: `cd bot/Website-Bot-Homework-main && npm install`
- **Start Command**: `cd bot/Website-Bot-Homework-main && node index.js`
- **Environment Variables**:
  - `DISCORD_TOKEN`: Your Discord bot token
  - `API_URL`: URL of your deployed server (e.g., `https://homework-tracker-server.onrender.com`)

### 2. Express Server Service

- **Build Command**: `cd server && npm install`
- **Start Command**: `cd server && node index.js`
- **Environment Variables**:
  - `MONGO_URI`: Your MongoDB connection string
  - `PORT`: 5000 (or let Render assign it)

### 3. Next.js Client Service

- **Build Command**: `cd client && npm install && npm run build`
- **Start Command**: `cd client && npm start`
- **Environment Variables**:
  - `NEXT_PUBLIC_API_URL`: URL of your deployed server (e.g., `https://homework-tracker-server.onrender.com`)
  - `PORT`: 3000 (or let Render assign it)

## Fixed Issues

### Discord Bot
- ✅ Removed `MessageContent` intent (requires special permissions)
- ✅ Added license field to package.json

### Website
- ✅ Created root-level `index.js` for deployment routing
- ✅ Updated Next.js config for standalone deployment
- ✅ Fixed package.json structure

## Environment Variables Setup

Make sure to set up the following environment variables in your Render services:

1. **Bot Service**:
   - `SERVICE=bot`
   - `DISCORD_TOKEN=your_bot_token`
   - `API_URL=https://your-server-url.onrender.com`

2. **Server Service**:
   - `SERVICE=server`
   - `MONGO_URI=your_mongodb_connection_string`

3. **Client Service**:
   - `SERVICE=client`
   - `NEXT_PUBLIC_API_URL=https://your-server-url.onrender.com`

## Notes

- The root `index.js` file determines which service to run based on the `SERVICE` environment variable
- Each service should be deployed as a separate web service on Render
- Make sure your MongoDB database is accessible from Render's servers
- The Discord bot requires the `MessageContent` intent to be enabled in the Discord Developer Portal if you need to read message content
