// EcoSaver Production Frontend Integration - Complete Backend Connection
// This seamlessly connects your beautiful UI to the production-ready backend!

(function() {
  'use strict';

  // Backend API Configuration
  const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000/api' 
    : '/api';

  console.log('🌱 EcoSaver Production Integration Loaded');
  console.log('🔗 API Base URL:', API_BASE);

  // ===============================
  // AUTHENTICATION MANAGER
  // ===============================
  
  const AuthManager = {
    setToken(token) {
      localStorage.setItem('ecosaver_token', token);
      this.setupAuthHeader();
    },
    
    getToken() {
      return localStorage.getItem('ecosaver_token');
    },
    
    removeToken() {
      localStorage.removeItem('ecosaver_token');
      delete window.ecoUser;
      delete window.ecoAuthHeader;
    },
    
    isAuthenticated() {
      const token = this.getToken();
      if (!token) return false;
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 > Date.now();
      } catch {
        return false;
      }
    },
    
    setupAuthHeader() {
      const token = this.getToken();
      if (token) {
        window.ecoAuthHeader = { 'Authorization': `Bearer ${token}` };
      }
    }
  };

  // Initialize auth on page load
  AuthManager.setupAuthHeader();

  // ===============================
  // API CLIENT
  // ===============================
  
  const EcoAPI = {
    async call(endpoint, options = {}) {
      const url = `${API_BASE}${endpoint}`;
      const config = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(window.ecoAuthHeader || {}),
          ...options.headers
        },
        ...options
      };

      if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
      }

      try {
        console.log(`🚀 API Call: ${config.method} ${url}`);
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'API request failed');
        }
        
        console.log('✅ API Success:', data);
        return data;
      } catch (error) {
        console.error('❌ API Error:', error);
        throw error;
      }
    },

    // Authentication endpoints
    async sendOTP(identifier, type) {
      return await this.call('/send-otp', {
        method: 'POST',
        body: { identifier, type }
      });
    },

    async verifyOTP(identifier, otp) {
      return await this.call('/verify-otp', {
        method: 'POST',
        body: { identifier, otp }
      });
    },

    async signup(userData) {
      return await this.call('/signup', {
        method: 'POST',
        body: userData
      });
    },

    async login(identifier, password) {
      return await this.call('/login', {
        method: 'POST',
        body: { identifier, password }
      });
    },

    async getUserProfile() {
      return await this.call('/user/profile');
    },

    async getDashboard() {
      return await this.call('/user/dashboard');
    }
  };

  // ===============================
  // ENHANCED SIGNUP INTEGRATION
  // ===============================
  
  let currentVerificationData = null;

  // Enhanced OTP sending
  window.sendRealOTP = async function(type, value) {
    try {
      console.log(`📧 Sending real OTP to ${type}: ${value}`);
      
      const response = await EcoAPI.sendOTP(value, type);
      
      if (response.success) {
        currentVerificationData = { type, value };
        
        // Show success message
        const message = response.mock 
          ? `Demo OTP sent to ${value} (Check console for test code)`
          : `Verification code sent to your ${type}`;
          
        if (window.showPopup) {
          window.showPopup(message);
        }
        
        return { success: true, testOTP: response.testOTP };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Send OTP error:', error);
      return { success: false, message: error.message };
    }
  };

  // Enhanced OTP verification
  window.verifyRealOTP = async function(enteredOtp) {
    try {
      if (!currentVerificationData) {
        throw new Error('No verification data found');
      }

      console.log(`🔐 Verifying OTP: ${enteredOtp}`);
      
      const response = await EcoAPI.verifyOTP(currentVerificationData.value, enteredOtp);
      
      if (response.success) {
        console.log('✅ OTP verified successfully');
        return { success: true, message: response.message };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Verify OTP error:', error);
      return { success: false, message: error.message };
    }
  };

  // Enhanced signup completion
  window.completeRealSignup = async function(formData) {
    try {
      console.log('✨ Completing signup with real backend...', formData);
      
      const response = await EcoAPI.signup({
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
        signupMode: formData.signupMode
      });
      
      if (response.success) {
        // Store authentication token
        AuthManager.setToken(response.token);
        
        // Store user data
        window.ecoUser = response.user;
        localStorage.setItem("ecoUser", JSON.stringify(response.user));
        
        console.log('🎉 Signup completed successfully!', response.user);
        
        return { success: true, user: response.user, message: response.message };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Complete signup error:', error);
      return { success: false, message: error.message };
    }
  };

  // Enhanced login
  window.performRealLogin = async function(identifier, password) {
    try {
      console.log(`🔐 Logging in: ${identifier}`);
      
      const response = await EcoAPI.login(identifier, password);
      
      if (response.success) {
        AuthManager.setToken(response.token);
        window.ecoUser = response.user;
        localStorage.setItem("ecoUser", JSON.stringify(response.user));
        
        console.log('✅ Login successful!', response.user);
        return { success: true, user: response.user };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message };
    }
  };

  // ===============================
  // USER DATA MANAGEMENT
  // ===============================
  
  const UserDataManager = {
    async loadUserData() {
      if (!AuthManager.isAuthenticated()) return null;

      try {
        const response = await EcoAPI.getUserProfile();
        if (response.success) {
          window.ecoUser = response.user;
          localStorage.setItem("ecoUser", JSON.stringify(response.user));
          console.log('👤 User data loaded from backend:', response.user);
          return response.user;
        }
      } catch (error) {
        console.error('Load user data error:', error);
        AuthManager.removeToken();
        localStorage.removeItem("ecoUser");
      }
      
      return null;
    },

    async loadDashboardData() {
      if (!AuthManager.isAuthenticated()) return null;

      try {
        const response = await EcoAPI.getDashboard();
        if (response.success) {
          console.log('📊 Dashboard data loaded:', response.dashboard);
          return response.dashboard;
        }
      } catch (error) {
        console.error('Load dashboard error:', error);
      }
      
      return null;
    }
  };

  // ===============================
  // INTEGRATION WITH EXISTING CODE
  // ===============================
  
  // Check if we're on signup page and enhance it
  if (window.location.pathname.includes('signup.html') || document.getElementById('signup-form')) {
    document.addEventListener('DOMContentLoaded', function() {
      const signupForm = document.getElementById('signup-form');
      if (signupForm) {
        // Override the existing form submission
        signupForm.addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const nameInput = document.getElementById('name');
          const emailInput = document.getElementById('email');
          const mobileInput = document.getElementById('mobile');
          const passwordInput = document.getElementById('password');
          
          const name = nameInput ? nameInput.value.trim() : '';
          const email = emailInput ? emailInput.value.trim() : '';
          const mobile = mobileInput ? mobileInput.value.trim() : '';
          const password = passwordInput ? passwordInput.value : '';
          
          // Determine signup mode
          const signupMode = document.querySelector('.option-btn.active')?.textContent.toLowerCase().includes('email') ? 'email' : 'mobile';
          
          // Validation
          if (!name) {
            if (window.showPopup) window.showPopup('Please enter your name');
            return;
          }
          
          if (password.length < 6) {
            if (window.showPopup) window.showPopup('Password should be at least 6 characters');
            return;
          }
          
          let verificationType, verificationValue;
          
          if (signupMode === 'email') {
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              if (window.showPopup) window.showPopup('Please enter a valid email address');
              return;
            }
            verificationType = 'email';
            verificationValue = email;
          } else {
            if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
              if (window.showPopup) window.showPopup('Please enter a valid 10-digit mobile number');
              return;
            }
            verificationType = 'mobile';
            verificationValue = mobile;
          }
          
          // Store form data for OTP verification
          window.signupFormData = { name, email, mobile, password, signupMode };
          
          // Send real OTP
          const otpResult = await window.sendRealOTP(verificationType, verificationValue);
          
          if (otpResult.success) {
            // Show OTP popup with real backend integration
            const otpPopup = document.getElementById('otp-popup');
            const subtitle = document.getElementById('otp-subtitle');
            const title = document.querySelector('.otp-title');
            
            if (verificationType === 'email') {
              title.textContent = 'Email Verification';
              subtitle.innerHTML = `Enter the 6-digit code sent to <strong>${verificationValue}</strong>`;
            } else {
              title.textContent = 'Mobile Verification';
              subtitle.innerHTML = `Enter the 6-digit code sent to <strong>+91-${verificationValue}</strong>`;
            }
            
            // Show test OTP in development
            if (otpResult.testOTP) {
              subtitle.innerHTML += `<br><small style="color: #4ade80; font-weight: bold; font-size: 12px; margin-top: 8px; display: block;">Test OTP: ${otpResult.testOTP}</small>`;
            }
            
            // Clear OTP inputs
            for (let i = 1; i <= 6; i++) {
              const input = document.getElementById(`otp${i}`);
              if (input) input.value = '';
            }
            
            otpPopup.classList.add('show');
            const firstInput = document.getElementById('otp1');
            if (firstInput) firstInput.focus();
            
            // Start timer if function exists
            if (typeof window.startOtpTimer === 'function') {
              window.startOtpTimer();
            }
          } else {
            if (window.showPopup) {
              window.showPopup(otpResult.message || 'Failed to send OTP. Please try again.');
            }
          }
        });
      }
      
      // Enhance OTP verification
      window.verifyOtp = async function() {
        let enteredOtp = '';
        for (let i = 1; i <= 6; i++) {
          const input = document.getElementById(`otp${i}`);
          if (input) enteredOtp += input.value;
        }
        
        if (enteredOtp.length !== 6) {
          if (window.showPopup) window.showPopup('Please enter complete 6-digit OTP');
          return;
        }
        
        const verifyResult = await window.verifyRealOTP(enteredOtp);
        
        if (verifyResult.success) {
          // Close OTP popup
          const otpPopup = document.getElementById('otp-popup');
          if (otpPopup) otpPopup.classList.remove('show');
          
          if (window.clearInterval && window.otpTimer) {
            clearInterval(window.otpTimer);
          }
          
          // Complete signup with real backend
          const formData = window.signupFormData;
          if (formData) {
            const signupResult = await window.completeRealSignup(formData);
            
            if (signupResult.success) {
              if (window.showPopup) {
                window.showPopup('Account created successfully! Welcome to EcoSaver! 🌱\n\nRedirecting to your dashboard...', true);
              }
              
              // Clean up
              delete window.signupFormData;
              currentVerificationData = null;
              
              // Reset form
              const signupForm = document.getElementById('signup-form');
              if (signupForm) {
                signupForm.reset();
                document.querySelectorAll('.valid').forEach(e => e.classList.remove('valid'));
                const strengthBar = document.getElementById('strength-bar');
                const strengthText = document.getElementById('strength-text');
                if (strengthBar) strengthBar.style.width = "0%";
                if (strengthText) strengthText.textContent = "";
              }
            } else {
              if (window.showPopup) {
                window.showPopup(signupResult.message || 'Error creating account. Please try again.');
              }
            }
          }
        } else {
          if (window.showPopup) {
            window.showPopup(verifyResult.message || 'Invalid OTP. Please try again.');
          }
          
          // Clear OTP inputs on error
          for (let i = 1; i <= 6; i++) {
            const input = document.getElementById(`otp${i}`);
            if (input) input.value = '';
          }
          const firstInput = document.getElementById('otp1');
          if (firstInput) firstInput.focus();
        }
      };
    });
  }

  // Auto-load user data on dashboard pages
  if (window.location.pathname.includes('dashboard.html') || window.location.pathname.includes('login.html')) {
    document.addEventListener('DOMContentLoaded', async function() {
      console.log('📊 Loading dashboard data...');
      
      if (AuthManager.isAuthenticated()) {
        const userData = await UserDataManager.loadUserData();
        const dashboardData = await UserDataManager.loadDashboardData();
        
        if (userData && dashboardData) {
          console.log('🎯 User data loaded for dashboard');
          
          // Update existing profile display functions if they exist
          if (typeof updateProfileInfo === 'function') {
            updateProfileInfo();
          }
        }
      }
    });
  }

  // ===============================
  // GLOBAL EXPORTS
  // ===============================
  
  window.EcoAPI = EcoAPI;
  window.AuthManager = AuthManager;
  window.UserDataManager = UserDataManager;
  
  console.log('🚀 EcoSaver Production Integration Complete!');
  console.log('🌱 Your beautiful UI is now connected to a real backend!');

})();