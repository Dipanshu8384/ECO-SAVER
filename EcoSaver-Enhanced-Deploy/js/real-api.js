// EcoSaver Real Authentication & API Integration
class EcoSaverAPI {
  constructor() {
    this.baseURL = '/api';
    this.token = localStorage.getItem('ecosaver_token');
    this.user = this.loadUser();
    this.ws = null; // WebSocket for real-time features
  }

  // Authentication Methods
  async register(userData) {
    try {
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      
      if (response.ok) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('ecosaver_token', this.token);
        localStorage.setItem('ecosaver_user', JSON.stringify(this.user));
        this.showToast('Registration successful! Welcome to EcoSaver! 🌱', 'success');
        return { success: true, data };
      } else {
        this.showToast(data.error || 'Registration failed', 'error');
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.showToast('Network error during registration', 'error');
      return { success: false, error: 'Network error' };
    }
  }

  async login(credentials) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();
      
      if (response.ok) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('ecosaver_token', this.token);
        localStorage.setItem('ecosaver_user', JSON.stringify(this.user));
        this.showToast(`Welcome back, ${this.user.username}! 🌿`, 'success');
        this.initializeRealTimeFeatures();
        return { success: true, data };
      } else {
        this.showToast(data.error || 'Login failed', 'error');
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showToast('Network error during login', 'error');
      return { success: false, error: 'Network error' };
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('ecosaver_token');
    localStorage.removeItem('ecosaver_user');
    if (this.ws) {
      this.ws.close();
    }
    this.showToast('Logged out successfully', 'info');
    window.location.href = 'index.html';
  }

  loadUser() {
    const userData = localStorage.getItem('ecosaver_user');
    return userData ? JSON.parse(userData) : null;
  }

  isAuthenticated() {
    return this.token && this.user;
  }

  // API Request Helper with Authentication
  async apiRequest(endpoint, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      if (response.status === 401) {
        // Token expired or invalid
        this.logout();
        throw new Error('Authentication required');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Real Task Completion with AI Verification
  async completeTask(taskData) {
    try {
      this.showToast('Submitting task for verification...', 'info');
      
      // Compress and process images if present
      if (taskData.verificationData.photos) {
        taskData.verificationData.photos = await Promise.all(
          taskData.verificationData.photos.map(photo => this.compressImage(photo))
        );
      }

      const result = await this.apiRequest('/tasks/complete', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });

      // Update local user data
      if (result.newTotalPoints !== undefined) {
        this.user.points = result.newTotalPoints;
        this.user.level = result.currentLevel;
        this.user.streak = result.currentStreak;
        localStorage.setItem('ecosaver_user', JSON.stringify(this.user));
      }

      // Show success message with impact
      let message = `Task completed! +${result.pointsEarned} points`;
      if (result.environmentalImpact.co2Saved > 0) {
        message += ` | ${result.environmentalImpact.co2Saved.toFixed(2)}kg CO₂ saved`;
      }
      if (result.partnerIntegration && result.partnerIntegration.length > 0) {
        message += ' | Real environmental action taken!';
      }

      this.showToast(message, 'success');
      this.updateUI();
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Task completion error:', error);
      this.showToast(error.message || 'Failed to complete task', 'error');
      return { success: false, error: error.message };
    }
  }

  // Image Compression for Mobile Optimization
  async compressImage(imageBase64, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };

      img.src = imageBase64;
    });
  }

  // Real-time Leaderboard
  async getLeaderboard(type = 'points', period = 'all') {
    try {
      const data = await this.apiRequest(`/leaderboard?type=${type}&period=${period}`);
      return { success: true, data: data.leaderboard };
    } catch (error) {
      console.error('Leaderboard error:', error);
      return { success: false, error: error.message };
    }
  }

  // Global Statistics
  async getGlobalStats() {
    try {
      const data = await this.apiRequest('/stats/global');
      return { success: true, data };
    } catch (error) {
      console.error('Stats error:', error);
      return { success: false, error: error.message };
    }
  }

  // User Profile Management
  async updateProfile(profileData) {
    try {
      const data = await this.apiRequest('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      
      this.user = { ...this.user, ...data.user };
      localStorage.setItem('ecosaver_user', JSON.stringify(this.user));
      this.showToast('Profile updated successfully! 🎉', 'success');
      
      return { success: true, data };
    } catch (error) {
      console.error('Profile update error:', error);
      this.showToast('Failed to update profile', 'error');
      return { success: false, error: error.message };
    }
  }

  // Real-time Features with WebSocket
  initializeRealTimeFeatures() {
    if (!this.token) return;

    // Initialize WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsURL = `${protocol}//${window.location.host}?token=${this.token}`;
    
    this.ws = new WebSocket(wsURL);

    this.ws.onopen = () => {
      console.log('🔗 Real-time connection established');
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleRealTimeMessage(message);
    };

    this.ws.onclose = () => {
      console.log('🔗 Real-time connection closed');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (this.isAuthenticated()) {
          this.initializeRealTimeFeatures();
        }
      }, 5000);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  handleRealTimeMessage(message) {
    switch (message.type) {
      case 'leaderboard_update':
        this.updateLeaderboardUI(message.data);
        break;
      case 'global_stats_update':
        this.updateGlobalStatsUI(message.data);
        break;
      case 'achievement_earned':
        this.showAchievement(message.data);
        break;
      case 'friend_activity':
        this.showFriendActivity(message.data);
        break;
      case 'challenge_update':
        this.updateChallengeUI(message.data);
        break;
    }
  }

  // Enhanced UI Updates
  updateUI() {
    if (!this.isAuthenticated()) return;

    // Update points display
    const pointsElements = document.querySelectorAll('.user-points');
    pointsElements.forEach(el => el.textContent = this.user.points.toLocaleString());

    // Update level display
    const levelElements = document.querySelectorAll('.user-level');
    levelElements.forEach(el => el.textContent = this.user.level);

    // Update streak display
    const streakElements = document.querySelectorAll('.user-streak');
    streakElements.forEach(el => el.textContent = this.user.streak);

    // Update environmental impact
    if (this.user.environmentalImpact) {
      const co2Elements = document.querySelectorAll('.user-co2-saved');
      co2Elements.forEach(el => {
        el.textContent = `${this.user.environmentalImpact.totalCO2Saved.toFixed(1)}kg`;
      });
    }

    // Update progress bars
    this.updateProgressBars();
  }

  updateProgressBars() {
    const levelThresholds = {
      'Nature Friend': 0,
      'Eco Enthusiast': 500,
      'Green Guardian': 1500,
      'Climate Champion': 3000,
      'Earth Hero': 6000,
      'Eco Master': 10000
    };

    const currentThreshold = levelThresholds[this.user.level];
    const nextLevel = Object.keys(levelThresholds).find(level => 
      levelThresholds[level] > this.user.points
    );
    
    if (nextLevel) {
      const nextThreshold = levelThresholds[nextLevel];
      const progress = ((this.user.points - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
      
      const progressBars = document.querySelectorAll('.level-progress');
      progressBars.forEach(bar => {
        bar.style.width = `${Math.min(progress, 100)}%`;
      });
    }
  }

  // Enhanced Toast Notifications
  showToast(message, type = 'info', duration = 4000) {
    const toastContainer = document.querySelector('.toast-container') || this.createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    toastContainer.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, duration);

    // Add entrance animation
    requestAnimationFrame(() => {
      toast.classList.add('toast-show');
    });
  }

  createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 400px;
    `;
    document.body.appendChild(container);
    return container;
  }

  // Achievement Animation
  showAchievement(achievement) {
    const modal = document.createElement('div');
    modal.className = 'achievement-modal';
    modal.innerHTML = `
      <div class="achievement-content">
        <div class="achievement-header">
          <span class="achievement-icon">🏆</span>
          <h2>Achievement Unlocked!</h2>
        </div>
        <div class="achievement-body">
          <h3>${achievement.name}</h3>
          <p>${achievement.description}</p>
          <div class="achievement-reward">+${achievement.points} points</div>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="achievement-close">
          Awesome! 🎉
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    // Add celebration animation
    this.triggerCelebration();

    // Auto-close after 10 seconds
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 10000);
  }

  triggerCelebration() {
    // Create confetti effect
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        this.createConfetti();
      }, i * 50);
    }
  }

  createConfetti() {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.cssText = `
      position: fixed;
      width: 10px;
      height: 10px;
      background: ${this.getRandomColor()};
      left: ${Math.random() * 100}vw;
      top: -10px;
      z-index: 10000;
      animation: confetti-fall 3s linear forwards;
      pointer-events: none;
    `;

    document.body.appendChild(confetti);

    setTimeout(() => confetti.remove(), 3000);
  }

  getRandomColor() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#fd79a8'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Offline Support
  enableOfflineSupport() {
    // Register service worker for offline functionality
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Handle online/offline events
    window.addEventListener('online', () => {
      this.showToast('Back online! Syncing data...', 'success');
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.showToast('You\'re offline. Data will sync when reconnected.', 'warning');
    });
  }

  async syncOfflineData() {
    const offlineActions = JSON.parse(localStorage.getItem('offline_actions') || '[]');
    
    for (const action of offlineActions) {
      try {
        await this.apiRequest(action.endpoint, action.options);
      } catch (error) {
        console.error('Failed to sync offline action:', error);
      }
    }

    localStorage.removeItem('offline_actions');
    this.showToast(`Synced ${offlineActions.length} offline actions`, 'success');
  }

  // Input Validation & Security
  validateInput(input, type) {
    const validators = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      username: /^[a-zA-Z0-9_]{3,20}$/,
      password: /^.{8,}$/
    };

    return validators[type] ? validators[type].test(input) : true;
  }

  sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }
}

// Initialize the global API instance
window.ecoAPI = new EcoSaverAPI();

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  window.ecoAPI.updateUI();
  window.ecoAPI.enableOfflineSupport();
  
  // Add enhanced CSS for new features
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    .toast-container .toast {
      background: rgba(0,0,0,0.9);
      color: white;
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 0.5rem;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    
    .toast.toast-show {
      transform: translateX(0);
    }
    
    .toast-success { background: linear-gradient(135deg, #4CAF50, #45a049); }
    .toast-error { background: linear-gradient(135deg, #f44336, #d32f2f); }
    .toast-warning { background: linear-gradient(135deg, #ff9800, #f57c00); }
    .toast-info { background: linear-gradient(135deg, #2196F3, #1976D2); }
    
    .toast-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .toast-close {
      margin-left: auto;
      background: none;
      border: none;
      color: white;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0 0.5rem;
    }
    
    .achievement-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: modal-fade-in 0.5s ease;
    }
    
    .achievement-content {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      border-radius: 1rem;
      text-align: center;
      color: white;
      max-width: 400px;
      animation: modal-bounce-in 0.5s ease;
    }
    
    @keyframes modal-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes modal-bounce-in {
      from { transform: scale(0.5); }
      to { transform: scale(1); }
    }
    
    @keyframes confetti-fall {
      to {
        transform: translateY(100vh) rotate(360deg);
        opacity: 0;
      }
    }
    
    .level-progress {
      height: 8px;
      background: linear-gradient(90deg, #4CAF50, #8BC34A);
      border-radius: 4px;
      transition: width 1s ease;
    }
  `;
  document.head.appendChild(styleSheet);
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EcoSaverAPI;
}