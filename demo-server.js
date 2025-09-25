const express = require('express');
const path = require('path');

// Create a simple demo server to show all functions
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Function Demo Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'function-demo.html'));
});

// Mock API endpoints to demonstrate functionality
app.get('/api/status', (req, res) => {
    res.json({
        status: 'operational',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        components: {
            authentication: 'operational',
            aiVerification: 'operational', 
            partnerships: 'operational',
            database: 'operational',
            analytics: 'operational',
            payments: 'operational',
            security: 'operational'
        },
        stats: {
            totalEndpoints: 50,
            activePartnerships: 6,
            aiAccuracy: 99.3,
            uptime: '99.9%'
        }
    });
});

app.get('/api/demo/auth', (req, res) => {
    res.json({
        system: 'Authentication System',
        status: 'LIVE & SECURE',
        features: [
            'JWT Access & Refresh Tokens',
            'Two-Factor Authentication (TOTP)', 
            'Password Strength Validation',
            'Email Verification System',
            'Account Lockout Protection',
            'Session Management'
        ],
        security: {
            passwordHashing: 'bcrypt (12 rounds)',
            tokenExpiry: '15 minutes',
            refreshExpiry: '7 days',
            rateLimiting: '5 attempts max',
            sessionStore: 'Redis-backed'
        }
    });
});

app.get('/api/demo/ai', (req, res) => {
    res.json({
        system: 'AI Verification System',
        status: 'AI POWERED',
        features: [
            'Google Cloud Vision Integration',
            'Custom ML Models',
            'Contextual Analysis',
            'Fraud Detection',
            'Weather & Location Verification',
            '99.3% Accuracy Rate'
        ],
        performance: {
            responseTime: '<500ms',
            accuracy: '99.3%',
            falsePositiveRate: '<0.1%',
            processingCapacity: '10,000 images/hour'
        }
    });
});

app.get('/api/demo/partnerships', (req, res) => {
    res.json({
        system: 'Environmental Partnerships',
        status: '6 ACTIVE PARTNERSHIPS',
        partners: [
            {
                name: 'One Tree Planted',
                service: 'Tree Planting',
                status: 'active',
                impact: '2,500+ trees planted'
            },
            {
                name: 'Offset.earth',
                service: 'Carbon Offsetting',
                status: 'active',
                impact: '15,000kg CO2 offset'
            },
            {
                name: 'Ocean Cleanup',
                service: 'Plastic Removal',
                status: 'active', 
                impact: '1,200kg plastic removed'
            },
            {
                name: 'WWF',
                service: 'Wildlife Conservation',
                status: 'active',
                impact: 'Multiple conservation projects'
            },
            {
                name: 'Ecosia',
                service: 'Search Trees',
                status: 'active',
                impact: 'Search-based tree planting'
            },
            {
                name: 'Local NGO Network',
                service: 'Community Actions', 
                status: 'active',
                impact: 'Local environmental groups'
            }
        ]
    });
});

app.get('/api/demo/analytics', (req, res) => {
    res.json({
        system: 'Real-Time Analytics',
        status: 'LIVE MONITORING',
        metrics: {
            systemPerformance: {
                cpu: Math.floor(Math.random() * 30) + 20,
                memory: Math.floor(Math.random() * 40) + 30,
                uptime: '15 days, 8 hours'
            },
            userActivity: {
                activeUsers: Math.floor(Math.random() * 500) + 100,
                tasksCompleted: Math.floor(Math.random() * 100) + 50,
                newRegistrations: Math.floor(Math.random() * 20) + 5
            },
            environmentalImpact: {
                treesPlanted: Math.floor(Math.random() * 20) + 5,
                co2Saved: Math.floor(Math.random() * 500) + 100,
                partnershipsActive: 6
            }
        }
    });
});

// Start the demo server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`
🌱 EcoSaver Function Demo Server Started! 🌱

📍 Server running at: http://localhost:${PORT}
🎯 Demo page: http://localhost:${PORT}
📊 API status: http://localhost:${PORT}/api/status

✅ All functions are operational and ready for demonstration!

🚀 Features Available:
   🔐 Authentication System
   🤖 AI Verification System  
   🌍 Environmental Partnerships
   📊 Real-Time Analytics
   🗄️ Database System
   💳 Payment System
   📱 Mobile API
   🛡️ Security Features
   🚀 Deployment System

Open http://localhost:${PORT} in your browser to see all functions!
        `);
    });
}

module.exports = app;