// Enhanced Security Module for EcoSaver
// Production-grade security that works with your beautiful frontend

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const crypto = require('crypto');

class SecurityManager {
  // Rate limiting configurations
  static createRateLimiters() {
    return {
      // General API rate limiting
      apiLimiter: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // 100 requests per windowMs
        message: {
          success: false,
          message: 'Too many requests, please try again later.'
        },
        standardHeaders: true,
        legacyHeaders: false
      }),

      // Strict rate limiting for auth endpoints
      authLimiter: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10, // 10 login/signup attempts per windowMs
        message: {
          success: false,
          message: 'Too many authentication attempts, please try again in 15 minutes.'
        },
        skipSuccessfulRequests: true
      }),

      // OTP rate limiting
      otpLimiter: rateLimit({
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 3, // 3 OTP requests per 5 minutes
        message: {
          success: false,
          message: 'Too many OTP requests, please wait 5 minutes before requesting again.'
        }
      })
    };
  }

  // Input validation and sanitization
  static validateInput(req, res, next) {
    // Sanitize against NoSQL injection
    mongoSanitize();
    
    // Clean user input from malicious HTML
    xss();
    
    // Prevent HTTP Parameter Pollution
    hpp();

    next();
  }

  // Password strength validation
  static validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password);

    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    if (!hasNonalphas) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      strength: this.calculatePasswordStrength(password)
    };
  }

  static calculatePasswordStrength(password) {
    let score = 0;
    
    // Length bonus
    score += Math.min(password.length * 4, 25);
    
    // Character variety bonus
    if (/[a-z]/.test(password)) score += 5;
    if (/[A-Z]/.test(password)) score += 5;
    if (/[0-9]/.test(password)) score += 5;
    if (/[^A-Za-z0-9]/.test(password)) score += 10;
    
    // Pattern penalties
    if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
    if (/123|abc|qwe/i.test(password)) score -= 10; // Common sequences
    
    if (score >= 70) return 'Strong';
    if (score >= 40) return 'Medium';
    return 'Weak';
  }

  // Email validation
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    return {
      isValid,
      message: isValid ? 'Valid email' : 'Please enter a valid email address'
    };
  }

  // Mobile number validation (Indian format)
  static validateMobile(mobile) {
    const mobileRegex = /^[6-9]\d{9}$/;
    const isValid = mobileRegex.test(mobile);
    
    return {
      isValid,
      message: isValid ? 'Valid mobile number' : 'Please enter a valid 10-digit mobile number starting with 6-9'
    };
  }

  // Generate secure random tokens
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Password reset token with expiry
  static generatePasswordResetToken() {
    const token = this.generateSecureToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    return { token, expires };
  }

  // Hash sensitive data
  static hashData(data, salt = null) {
    const saltRounds = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, saltRounds, 10000, 64, 'sha512').toString('hex');
    
    return {
      hash: hash,
      salt: saltRounds
    };
  }

  // Verify hashed data
  static verifyHash(data, hash, salt) {
    const hashedData = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512').toString('hex');
    return hashedData === hash;
  }

  // Content Security Policy
  static getCSPConfig() {
    return {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'", 
          "'unsafe-inline'", // Allow inline styles for your beautiful CSS
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com"
        ],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Allow inline scripts for your existing code
          "https://cdnjs.cloudflare.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https://api.dicebear.com", // Avatar service
          "https://*.openweathermap.org" // Weather images
        ],
        connectSrc: [
          "'self'",
          "https://api.openweathermap.org", // Weather API
          "https://api.carbonintensity.org.uk" // Carbon API
        ]
      }
    };
  }

  // Setup security middleware
  static setupSecurity(app) {
    const limiters = this.createRateLimiters();

    // Helmet for security headers
    app.use(helmet({
      contentSecurityPolicy: this.getCSPConfig()
    }));

    // Apply rate limiters
    app.use('/api/', limiters.apiLimiter);
    app.use('/api/signup', limiters.authLimiter);
    app.use('/api/login', limiters.authLimiter);
    app.use('/api/send-otp', limiters.otpLimiter);

    // Input validation and sanitization
    app.use(this.validateInput);

    return app;
  }

  // Security audit logging
  static logSecurityEvent(event, req, additional = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: event,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
      ...additional
    };

    // In production, send to security monitoring service
    console.log('🔒 Security Event:', logEntry);
    
    return logEntry;
  }

  // Check for suspicious activity
  static detectSuspiciousActivity(req) {
    const suspiciousPatterns = [
      // SQL injection patterns
      /(\bselect\b|\bunion\b|\binsert\b|\bdelete\b|\bdrop\b)/i,
      // XSS patterns
      /<script[^>]*>.*?<\/script>/gi,
      // Path traversal
      /\.\.\//,
      // Command injection
      /(\beval\b|\bexec\b|\bsystem\b)/i
    ];

    const requestData = JSON.stringify({
      body: req.body,
      query: req.query,
      params: req.params
    });

    return suspiciousPatterns.some(pattern => pattern.test(requestData));
  }
}

module.exports = SecurityManager;