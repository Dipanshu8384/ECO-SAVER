#!/usr/bin/env node

// EcoSaver Production Deployment Script
// This script helps you deploy your EcoSaver platform to production

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log(`
🌱 EcoSaver Production Deployment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

// Check if we're in the right directory
const requiredFiles = [
  'server-production.js',
  'ecosaver-frontend-production.js',
  'package.json',
  'signup.html',
  'dashboard.html'
];

const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(__dirname, file)));

if (missingFiles.length > 0) {
  console.log(`❌ Missing required files: ${missingFiles.join(', ')}`);
  console.log('Please make sure you\'re running this script from your EcoSaver project directory.');
  process.exit(1);
}

console.log('✅ All required files found');
console.log('');

// Deployment options
console.log('🚀 Choose your deployment method:');
console.log('1. Railway (Recommended - Free tier, automatic deployments)');
console.log('2. Heroku (Classic choice)');
console.log('3. DigitalOcean App Platform');
console.log('4. Manual deployment (VPS/own server)');
console.log('5. Local testing with production backend');
console.log('');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter your choice (1-5): ', (choice) => {
  switch (choice.trim()) {
    case '1':
      deployToRailway();
      break;
    case '2':
      deployToHeroku();
      break;
    case '3':
      deployToDigitalOcean();
      break;
    case '4':
      manualDeployment();
      break;
    case '5':
      localTesting();
      break;
    default:
      console.log('❌ Invalid choice. Please run the script again.');
      rl.close();
      process.exit(1);
  }
});

function deployToRailway() {
  console.log(`
🚂 Railway Deployment Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Railway is the recommended platform for EcoSaver deployment:
- Free tier with 500 hours/month
- Automatic deployments from GitHub
- Built-in MongoDB support
- Easy environment variable management

Setup Steps:
1. Create a GitHub repository for your project
2. Push all your code to GitHub
3. Sign up at railway.app with your GitHub account
4. Click "New Project" → "Deploy from GitHub repo"
5. Select your EcoSaver repository
6. Railway will auto-detect Node.js and deploy

Environment Variables to set in Railway:
- MONGODB_URI: Your MongoDB connection string
- JWT_SECRET: A long random string (32+ characters)
- EMAIL_USER: Your Gmail address
- EMAIL_PASS: Your Gmail app password
- PORT: 3000 (Railway sets this automatically)

MongoDB Setup:
- Go to mongodb.com/atlas
- Create free cluster
- Get connection string
- Add to Railway environment variables

📖 Detailed guide: See DEPLOYMENT_COMPLETE_GUIDE.md
`);
  
  rl.question('Do you want me to help initialize a git repository? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      try {
        console.log('🔧 Initializing git repository...');
        execSync('git init', { cwd: __dirname, stdio: 'inherit' });
        execSync('git add .', { cwd: __dirname, stdio: 'inherit' });
        execSync('git commit -m "Initial EcoSaver production deployment"', { cwd: __dirname, stdio: 'inherit' });
        console.log('✅ Git repository initialized successfully!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Create a repository on GitHub');
        console.log('2. Add remote: git remote add origin YOUR_GITHUB_REPO_URL');
        console.log('3. Push code: git push -u origin main');
        console.log('4. Deploy on Railway.app');
      } catch (error) {
        console.log('⚠️  Git initialization failed. You may need to install Git first.');
        console.log('Alternative: Upload your files to GitHub manually.');
      }
    }
    rl.close();
  });
}

function deployToHeroku() {
  console.log(`
🟣 Heroku Deployment Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Setup Steps:
1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Login: heroku login
3. Create app: heroku create your-ecosaver-app
4. Set environment variables:
   - heroku config:set MONGODB_URI="your-mongodb-connection-string"
   - heroku config:set JWT_SECRET="your-long-random-secret"
   - heroku config:set EMAIL_USER="your-email@gmail.com"
   - heroku config:set EMAIL_PASS="your-gmail-app-password"
5. Deploy: git push heroku main

MongoDB Atlas Setup:
- Create free cluster at mongodb.com/atlas
- Whitelist 0.0.0.0/0 for Heroku IPs
- Get connection string for MONGODB_URI

📖 Full guide in DEPLOYMENT_COMPLETE_GUIDE.md
`);
  rl.close();
}

function deployToDigitalOcean() {
  console.log(`
🌊 DigitalOcean App Platform Deployment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Setup Steps:
1. Push code to GitHub repository
2. Go to cloud.digitalocean.com
3. Create new App
4. Connect your GitHub repository
5. Configure environment variables in App settings
6. Deploy

Required Environment Variables:
- MONGODB_URI
- JWT_SECRET
- EMAIL_USER
- EMAIL_PASS

📖 See DEPLOYMENT_COMPLETE_GUIDE.md for detailed steps
`);
  rl.close();
}

function manualDeployment() {
  console.log(`
🔧 Manual Deployment (VPS/Own Server)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For deployment on your own server or VPS:

1. Upload all files to your server
2. Install Node.js and npm
3. Run: npm install
4. Create .env file with your environment variables
5. Start with PM2: pm2 start server-production.js --name ecosaver
6. Set up reverse proxy (Nginx) to serve on port 80/443
7. Set up SSL certificate (Let's Encrypt)

Required packages on server:
- Node.js 16+
- npm
- PM2 (for process management)
- Nginx (for reverse proxy)

📖 Complete server setup guide in DEPLOYMENT_COMPLETE_GUIDE.md
`);
  rl.close();
}

function localTesting() {
  console.log(`
🏠 Local Testing Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Testing your EcoSaver platform locally:

1. Install dependencies:
`);
  
  try {
    console.log('   Installing npm packages...');
    execSync('npm install', { cwd: __dirname, stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully!');
  } catch (error) {
    console.log('❌ Failed to install dependencies. Make sure npm is installed.');
    rl.close();
    return;
  }
  
  console.log(`
2. Set up environment variables:
   - Copy .env.production to .env
   - Fill in your MongoDB URI and email credentials

3. Start the server:
   - npm start
   OR
   - node server-production.js

Your EcoSaver platform will be available at:
http://localhost:3000

📝 Note: You'll need MongoDB running locally or a cloud connection.
`);
  
  rl.question('Do you want to start the server now? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      console.log('🚀 Starting EcoSaver production server...');
      console.log('Visit http://localhost:3000 to test your platform');
      console.log('Press Ctrl+C to stop the server');
      console.log('');
      try {
        execSync('node server-production.js', { cwd: __dirname, stdio: 'inherit' });
      } catch (error) {
        console.log('⚠️  Server stopped or failed to start.');
        console.log('Make sure you have set up your .env file with valid credentials.');
      }
    }
    rl.close();
  });
}