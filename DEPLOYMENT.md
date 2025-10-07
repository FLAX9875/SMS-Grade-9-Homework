# Homework Tracker - Deployment Guide

This project consists of three services that need to be deployed separately on Render:

## Services

1. **Discord Bot** (`bot/Website-Bot-Homework-main/`)
2. **Express Server** (`server/`)
3. **Next.js Client** (`client/`)

## 🚀 **Step-by-Step Deployment Process**

### Step 1: Deploy Server First (Required!)

**Why first?** The client and bot need the server URL to work.

1. **Create a new Web Service on Render**
2. **Connect your GitHub repository**
3. **Configure the service:**
   - **Name**: `homework-tracker-server`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && node index.js`
   - **Environment Variables**:
     - `SERVICE=server`
     - `MONGO_URI=your_mongodb_connection_string`
4. **Deploy and wait for it to be live**
5. **Copy the URL** (e.g., `https://homework-tracker-server-abc123.onrender.com`)

### Step 2: Deploy Client (Website)

1. **Create a new Web Service on Render**
2. **Connect your GitHub repository**
3. **Configure the service:**
   - **Name**: `homework-tracker-client`
   - **Build Command**: `cd client && npm install && npm run build`
   - **Start Command**: `cd client && npm start`
   - **Environment Variables**:
     - `SERVICE=client`
     - `NEXT_PUBLIC_API_URL=https://homework-tracker-server-abc123.onrender.com` (use your actual server URL)
4. **Deploy**

### Step 3: Deploy Bot

1. **Create a new Web Service on Render**
2. **Connect your GitHub repository**
3. **Configure the service:**
   - **Name**: `homework-tracker-bot`
   - **Build Command**: `cd bot/Website-Bot-Homework-main && npm install`
   - **Start Command**: `cd bot/Website-Bot-Homework-main && node index.js`
   - **Environment Variables**:
     - `SERVICE=bot`
     - `DISCORD_TOKEN=your_discord_bot_token`
     - `API_URL=https://homework-tracker-server-abc123.onrender.com` (use your actual server URL)
4. **Deploy**

## 🔧 **Alternative: Deploy with Localhost URLs First**

If you want to deploy all services at once and update URLs later:

### All Services with Localhost URLs

1. **Server Service**:
   - `SERVICE=server`
   - `MONGO_URI=your_mongodb_connection_string`

2. **Client Service**:
   - `SERVICE=client`
   - `NEXT_PUBLIC_API_URL=http://localhost:5000` (will be updated later)

3. **Bot Service**:
   - `SERVICE=bot`
   - `DISCORD_TOKEN=your_discord_bot_token`
   - `API_URL=http://localhost:5000` (will be updated later)

### After Deployment:
1. **Get your server URL** from Render
2. **Update client environment variables** with the real server URL
3. **Update bot environment variables** with the real server URL
4. **Redeploy client and bot** services

## 📋 **Environment Variables Reference**

### Server Service
- `SERVICE=server`
- `MONGO_URI=your_mongodb_connection_string`

### Client Service  
- `SERVICE=client`
- `NEXT_PUBLIC_API_URL=https://your-server-url.onrender.com`

### Bot Service
- `SERVICE=bot`
- `DISCORD_TOKEN=your_bot_token`
- `API_URL=https://your-server-url.onrender.com`

## ✅ **Fixed Issues**

### Discord Bot
- ✅ Removed `MessageContent` intent (requires special permissions)
- ✅ Added license field to package.json

### Website
- ✅ Created root-level `index.js` for deployment routing
- ✅ Updated Next.js config for standalone deployment
- ✅ Fixed package.json structure
- ✅ Moved index.js to src/ directory for correct Render path

## 📝 **Notes**

- The root `src/index.js` file determines which service to run based on the `SERVICE` environment variable
- Each service should be deployed as a separate web service on Render
- Make sure your MongoDB database is accessible from Render's servers
- The Discord bot requires the `MessageContent` intent to be enabled in the Discord Developer Portal if you need to read message content
- **Always deploy the server first** to get its URL for the other services
