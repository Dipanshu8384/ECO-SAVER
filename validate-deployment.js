#!/usr/bin/env node

// EcoSaver Production Deployment Validator
// This script validates that your deployment is ready for production

const fs = require('fs');
const path = require('path');

console.log(`
🌱 EcoSaver Production Deployment Validator
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

const checks = [];

// Check 1: Required files exist
const requiredFiles = [
  'server-production.js',
  'ecosaver-frontend-production.js',
  'package.json',
  '.env.production',
  'DEPLOYMENT_COMPLETE_GUIDE.md'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  checks.push({
    name: `Required file: ${file}`,
    status: exists,
    message: exists ? 'Found' : 'Missing - deployment will fail'
  });
});

// Check 2: Package.json validation
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  checks.push({
    name: 'Package.json main script',
    status: packageJson.main === 'server-production.js',
    message: packageJson.main === 'server-production.js' ? 'Correctly set' : 'Should point to server-production.js'
  });
  
  checks.push({
    name: 'Start command configured',
    status: packageJson.scripts && packageJson.scripts.start,
    message: packageJson.scripts?.start ? `"${packageJson.scripts.start}"` : 'Missing start script'
  });
} catch (error) {
  checks.push({
    name: 'Package.json validation',
    status: false,
    message: 'Cannot read package.json'
  });
}

// Check 3: Environment variables template
try {
  const envTemplate = fs.readFileSync(path.join(__dirname, '.env.production'), 'utf8');
  const hasMongoUri = envTemplate.includes('MONGODB_URI');
  const hasJwtSecret = envTemplate.includes('JWT_SECRET');
  const hasEmailConfig = envTemplate.includes('EMAIL_USER');
  
  checks.push({
    name: 'Environment template complete',
    status: hasMongoUri && hasJwtSecret && hasEmailConfig,
    message: hasMongoUri && hasJwtSecret && hasEmailConfig ? 'All required variables present' : 'Missing required environment variables'
  });
} catch (error) {
  checks.push({
    name: 'Environment template',
    status: false,
    message: 'Cannot read .env.production template'
  });
}

// Check 4: Frontend integration
try {
  const frontendScript = fs.readFileSync(path.join(__dirname, 'ecosaver-frontend-production.js'), 'utf8');
  const hasApiClient = frontendScript.includes('EcoAPI');
  const hasAuthManager = frontendScript.includes('AuthManager');
  
  checks.push({
    name: 'Frontend integration ready',
    status: hasApiClient && hasAuthManager,
    message: hasApiClient && hasAuthManager ? 'API client and auth manager present' : 'Frontend integration incomplete'
  });
} catch (error) {
  checks.push({
    name: 'Frontend integration',
    status: false,
    message: 'Cannot read frontend integration file'
  });
}

// Check 5: Server configuration
try {
  const serverScript = fs.readFileSync(path.join(__dirname, 'server-production.js'), 'utf8');
  const hasDatabase = serverScript.includes('mongoose.connect');
  const hasAuth = serverScript.includes('jwt.sign');
  const hasOtp = serverScript.includes('nodemailer');
  const hasSecurity = serverScript.includes('helmet');
  
  checks.push({
    name: 'Server production features',
    status: hasDatabase && hasAuth && hasOtp && hasSecurity,
    message: hasDatabase && hasAuth && hasOtp && hasSecurity ? 'All production features ready' : 'Missing production features'
  });
} catch (error) {
  checks.push({
    name: 'Server configuration',
    status: false,
    message: 'Cannot read server-production.js'
  });
}

// Display results
let allPassed = true;
let passedCount = 0;

checks.forEach(check => {
  const icon = check.status ? '✅' : '❌';
  const status = check.status ? 'PASS' : 'FAIL';
  console.log(`${icon} ${check.name}: ${status}`);
  if (check.message) {
    console.log(`   ${check.message}`);
  }
  console.log('');
  
  if (check.status) {
    passedCount++;
  } else {
    allPassed = false;
  }
});

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 DEPLOYMENT READINESS: ${passedCount}/${checks.length} checks passed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

if (allPassed) {
  console.log(`🎉 DEPLOYMENT READY!

Your EcoSaver platform is ready for production deployment!

Next steps:
1. Set up MongoDB Atlas database
2. Configure Gmail app password or SendGrid
3. Deploy to Railway/Heroku/DigitalOcean
4. Set environment variables on your platform
5. Test the deployed application

📖 See DEPLOYMENT_COMPLETE_GUIDE.md for detailed instructions.

🚀 Deploy commands:
   Railway: Push to GitHub (auto-deploy)
   Heroku: git push heroku main
   Manual: npm start (after setting up environment)
`);
} else {
  console.log(`⚠️  DEPLOYMENT NOT READY

Please fix the failed checks above before deploying.
Run this script again after making corrections.

🔧 Common fixes:
- Ensure all required files exist
- Check package.json configuration
- Verify environment template is complete
- Make sure all scripts are properly integrated
`);
}

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌱 EcoSaver - Ready to change the world!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

process.exit(allPassed ? 0 : 1);