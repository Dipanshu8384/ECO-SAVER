const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

class AuthenticationSystem {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || this.generateSecureSecret();
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || this.generateSecureSecret();
    this.setupEmailTransporter();
    this.setupRateLimiting();
    this.initializeSecurityConfig();
  }

  generateSecureSecret() {
    return crypto.randomBytes(64).toString('hex');
  }

  initializeSecurityConfig() {
    this.config = {
      // JWT Configuration
      jwt: {
        accessTokenExpiry: '15m',
        refreshTokenExpiry: '7d',
        issuer: 'ecosaver-platform',
        audience: 'ecosaver-users'
      },
      
      // Password Policy
      password: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        maxAttempts: 5,
        lockoutDuration: 30 * 60 * 1000 // 30 minutes
      },

      // Two-Factor Authentication
      twoFactor: {
        enabled: true,
        algorithm: 'sha1',
        digits: 6,
        period: 30,
        window: 1
      },

      // Session Management
      session: {
        maxConcurrentSessions: 3,
        idleTimeout: 30 * 60 * 1000, // 30 minutes
        absoluteTimeout: 8 * 60 * 60 * 1000 // 8 hours
      }
    };
  }

  setupEmailTransporter() {
    this.emailTransporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  setupRateLimiting() {
    // Login Rate Limiting
    this.loginLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      message: {
        error: 'Too many login attempts, please try again later',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    // Registration Rate Limiting
    this.registerLimiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 registrations per hour per IP
      message: {
        error: 'Registration limit exceeded, please try again later',
        retryAfter: '1 hour'
      }
    });

    // Password Reset Rate Limiting
    this.resetPasswordLimiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 reset attempts per hour
      message: {
        error: 'Password reset limit exceeded',
        retryAfter: '1 hour'
      }
    });

    // General API Rate Limiting
    this.apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      message: {
        error: 'API rate limit exceeded',
        retryAfter: '15 minutes'
      }
    });
  }

  // Password Validation
  validatePassword(password) {
    const errors = [];
    
    if (password.length < this.config.password.minLength) {
      errors.push(`Password must be at least ${this.config.password.minLength} characters long`);
    }
    
    if (this.config.password.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (this.config.password.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (this.config.password.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (this.config.password.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check against common passwords
    const commonPasswords = [
      'password', '123456', '12345678', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common, please choose a stronger password');
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      strength: this.calculatePasswordStrength(password)
    };
  }

  calculatePasswordStrength(password) {
    let score = 0;
    
    // Length bonus
    if (password.length >= 12) score += 25;
    else if (password.length >= 8) score += 15;
    else score += 5;
    
    // Character variety bonus
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/\d/.test(password)) score += 15;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 20;
    
    // Pattern penalties
    if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
    if (/123|abc|qwe/i.test(password)) score -= 10; // Sequential characters
    
    if (score >= 80) return 'very-strong';
    if (score >= 60) return 'strong';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'weak';
    return 'very-weak';
  }

  // Hash Password
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verify Password
  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT Tokens
  generateTokens(userId, userEmail, userRole = 'user') {
    const payload = {
      userId: userId,
      email: userEmail,
      role: userRole,
      sessionId: crypto.randomUUID(),
      iat: Math.floor(Date.now() / 1000)
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.config.jwt.accessTokenExpiry,
      issuer: this.config.jwt.issuer,
      audience: this.config.jwt.audience
    });

    const refreshToken = jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: this.config.jwt.refreshTokenExpiry,
      issuer: this.config.jwt.issuer,
      audience: this.config.jwt.audience
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      tokenType: 'Bearer',
      sessionId: payload.sessionId
    };
  }

  // Verify JWT Token
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret, {
        issuer: this.config.jwt.issuer,
        audience: this.config.jwt.audience
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid access token');
      }
      throw new Error('Token verification failed');
    }
  }

  // Refresh Token
  async refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret, {
        issuer: this.config.jwt.issuer,
        audience: this.config.jwt.audience
      });

      // Generate new access token
      const newTokens = this.generateTokens(decoded.userId, decoded.email, decoded.role);
      
      return {
        success: true,
        ...newTokens
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Authentication Middleware
  authenticateToken() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
          return res.status(401).json({
            error: 'Access token required',
            code: 'NO_TOKEN'
          });
        }

        const decoded = this.verifyAccessToken(token);
        
        // Check if session is still valid (in real app, check against database)
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          sessionId: decoded.sessionId
        };

        // Update last activity
        req.user.lastActivity = new Date();
        
        next();
      } catch (error) {
        if (error.message === 'Access token expired') {
          return res.status(401).json({
            error: 'Token expired',
            code: 'TOKEN_EXPIRED'
          });
        }
        
        return res.status(403).json({
          error: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }
    };
  }

  // Role-based Authorization Middleware
  requireRole(requiredRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      const userRole = req.user.role;
      const allowedRoles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: allowedRoles,
          current: userRole
        });
      }

      next();
    };
  }

  // Two-Factor Authentication Setup
  async setupTwoFactor(userId, userEmail) {
    const speakeasy = require('speakeasy');
    const qrcode = require('qrcode');

    try {
      const secret = speakeasy.generateSecret({
        name: `EcoSaver (${userEmail})`,
        issuer: 'EcoSaver Platform',
        length: 32
      });

      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

      return {
        success: true,
        secret: secret.base32,
        qrCode: qrCodeUrl,
        backupCodes: this.generateBackupCodes(),
        setupInstructions: 'Scan the QR code with your authenticator app and enter the 6-digit code to complete setup'
      };
    } catch (error) {
      console.error('2FA setup error:', error);
      return {
        success: false,
        error: 'Failed to setup two-factor authentication'
      };
    }
  }

  // Verify Two-Factor Authentication
  verifyTwoFactor(token, secret) {
    const speakeasy = require('speakeasy');
    
    return speakeasy.verify({
      secret: secret,
      token: token,
      window: this.config.twoFactor.window
    });
  }

  generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  // Password Reset System
  async generatePasswordResetToken(userEmail) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    return {
      resetToken,
      resetTokenHash,
      expiresAt
    };
  }

  async sendPasswordResetEmail(userEmail, resetToken) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: '🔐 EcoSaver Password Reset Request',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>🌱 EcoSaver Password Reset</h2>
              </div>
              <div class="content">
                <h3>Password Reset Request</h3>
                <p>We received a request to reset your EcoSaver account password. Click the button below to set a new password:</p>
                
                <div style="text-align: center;">
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </div>
                
                <div class="warning">
                  <strong>⚠️ Security Notice:</strong>
                  <ul>
                    <li>This link will expire in 10 minutes</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Never share this link with anyone</li>
                  </ul>
                </div>
                
                <p><strong>Alternative:</strong> If the button doesn't work, copy and paste this link:</p>
                <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">${resetUrl}</p>
              </div>
              <div class="footer">
                <p>🌍 EcoSaver Platform - Making the world greener, one step at a time</p>
                <p><small>This is an automated email. Please do not reply.</small></p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      await this.emailTransporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Password reset email error:', error);
      return { success: false, error: 'Failed to send reset email' };
    }
  }

  // Account Verification System
  async generateVerificationToken(userEmail) {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    
    return {
      verificationToken,
      verificationTokenHash
    };
  }

  async sendVerificationEmail(userEmail, verificationToken, userName = 'EcoSaver User') {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: '🌱 Welcome to EcoSaver - Verify Your Account',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
              .features { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; }
              .feature { display: flex; align-items: center; margin: 10px 0; }
              .icon { margin-right: 15px; font-size: 24px; }
              .footer { text-align: center; margin-top: 30px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🌱 Welcome to EcoSaver!</h1>
                <p>Join thousands of eco-warriors making a difference</p>
              </div>
              <div class="content">
                <h3>Hi ${userName}! 👋</h3>
                <p>Welcome to the EcoSaver community! We're excited to have you join us in making the world a greener, more sustainable place.</p>
                
                <div style="text-align: center;">
                  <a href="${verificationUrl}" class="button">Verify Your Account</a>
                </div>
                
                <div class="features">
                  <h4>🚀 What's waiting for you:</h4>
                  <div class="feature">
                    <span class="icon">🌳</span>
                    <span>Plant real trees with every eco-action you complete</span>
                  </div>
                  <div class="feature">
                    <span class="icon">📊</span>
                    <span>Track your environmental impact with AI-powered verification</span>
                  </div>
                  <div class="feature">
                    <span class="icon">🏆</span>
                    <span>Compete with friends and earn meaningful rewards</span>
                  </div>
                  <div class="feature">
                    <span class="icon">🌍</span>
                    <span>Connect with environmental organizations worldwide</span>
                  </div>
                  <div class="feature">
                    <span class="icon">💰</span>
                    <span>Earn EcoCoins and redeem for real environmental impact</span>
                  </div>
                </div>
                
                <p><strong>🔐 Verification Link:</strong></p>
                <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">${verificationUrl}</p>
                
                <p><small>⏰ This link will expire in 24 hours. If you didn't create this account, please ignore this email.</small></p>
              </div>
              <div class="footer">
                <p>🌍 EcoSaver Platform - Making the world greener, one action at a time</p>
                <p><small>Follow us on social media for daily eco-tips and challenges!</small></p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      await this.emailTransporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Verification email error:', error);
      return { success: false, error: 'Failed to send verification email' };
    }
  }

  // Security Monitoring
  logSecurityEvent(eventType, userId, ipAddress, userAgent, details = {}) {
    const securityEvent = {
      timestamp: new Date().toISOString(),
      eventType,
      userId,
      ipAddress,
      userAgent,
      details,
      severity: this.getEventSeverity(eventType)
    };

    console.log('🔒 Security Event:', securityEvent);

    // In production, this would be logged to a security monitoring system
    // like ElasticSearch, Splunk, or cloud security services
    
    return securityEvent;
  }

  getEventSeverity(eventType) {
    const severityMap = {
      'login_success': 'low',
      'login_failed': 'medium',
      'login_locked': 'high',
      'password_reset_requested': 'medium',
      'password_changed': 'high',
      '2fa_setup': 'medium',
      '2fa_disabled': 'high',
      'suspicious_activity': 'critical',
      'account_compromised': 'critical'
    };

    return severityMap[eventType] || 'medium';
  }

  // Session Management
  async createSession(userId, ipAddress, userAgent) {
    const sessionId = crypto.randomUUID();
    const session = {
      sessionId,
      userId,
      ipAddress,
      userAgent,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true
    };

    // In production, store in Redis or database
    console.log('📱 New session created:', sessionId);
    
    return session;
  }

  async validateSession(sessionId, userId) {
    // In production, check against stored sessions
    // For now, just validate format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(sessionId);
  }

  // Rate Limiting Getters
  getLoginLimiter() { return this.loginLimiter; }
  getRegisterLimiter() { return this.registerLimiter; }
  getResetPasswordLimiter() { return this.resetPasswordLimiter; }
  getApiLimiter() { return this.apiLimiter; }
}

module.exports = AuthenticationSystem;