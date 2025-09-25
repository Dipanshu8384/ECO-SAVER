// 🌟 ECOSAVER UNIFIED CROSS-PLATFORM SYSTEM 🌟
// This file synchronizes all pages and creates a seamless ecosystem

class EcoSaverUnifiedSystem {
    constructor() {
        this.currentUser = this.loadUserData();
        this.ecoPoints = parseInt(localStorage.getItem('ecoPoints')) || 1250;
        this.level = parseInt(localStorage.getItem('userLevel')) || 1;
        this.achievements = JSON.parse(localStorage.getItem('achievements')) || [];
        this.syncInterval = null;
        this.init();
    }

    init() {
        this.setupUniversalNavigation();
        this.syncDataAcrossPages();
        this.initializeThemeSystem();
        this.setupProgressTracking();
        this.initializeNotificationSystem();
        this.startRealTimeSync();
    }

    // 🌟 UNIVERSAL NAVIGATION SYSTEM 🌟
    setupUniversalNavigation() {
        const pages = {
            'index.html': '🏠 Home',
            'dashboard.html': '📊 Dashboard', 
            'games-hub.html': '🎮 Games',
            'eco-habit-tracking.html': '✅ Habits',
            'carbon-footprint-tracker.html': '🌱 Carbon Tracker',
            'educational-library.html': '📚 Library',
            'community-action.html': '👥 Community',
            'ecoawarenesshub.html': '💡 Awareness Hub'
        };

        // Inject universal navigation if not present
        if (!document.querySelector('.ecosaver-nav')) {
            this.injectUniversalNav(pages);
        }
        
        this.setupSmartNavigation();
    }

    injectUniversalNav(pages) {
        const navHTML = `
            <div class="ecosaver-nav" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 10000;
                background: rgba(26, 74, 55, 0.95);
                backdrop-filter: blur(20px);
                border-bottom: 2px solid rgba(88, 214, 141, 0.3);
                padding: 1rem 2rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all 0.3s ease;
            ">
                <div class="ecosaver-logo" style="
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    color: #58d68d;
                    font-family: 'Poppins', sans-serif;
                    font-weight: 700;
                    font-size: 1.5rem;
                ">
                    <span style="font-size: 2rem;">🌱</span>
                    EcoSaver Platform
                </div>
                
                <div class="ecosaver-nav-links" style="
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                    flex-wrap: wrap;
                ">
                    ${Object.entries(pages).map(([page, title]) => `
                        <a href="${page}" class="nav-link" style="
                            color: #4a9b8e;
                            text-decoration: none;
                            padding: 0.5rem 1rem;
                            border-radius: 25px;
                            transition: all 0.3s ease;
                            font-weight: 600;
                            white-space: nowrap;
                        " onmouseover="this.style.background='rgba(88, 214, 141, 0.2)'; this.style.color='#58d68d'" 
                           onmouseout="this.style.background='transparent'; this.style.color='#4a9b8e'">
                            ${title}
                        </a>
                    `).join('')}
                </div>

                <div class="ecosaver-user-panel" style="
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                ">
                    <div class="eco-points-display" style="
                        background: rgba(88, 214, 141, 0.2);
                        color: #58d68d;
                        padding: 0.5rem 1rem;
                        border-radius: 25px;
                        font-weight: 600;
                        border: 1px solid rgba(88, 214, 141, 0.3);
                    ">
                        🏆 <span id="universalPoints">${this.ecoPoints}</span> pts
                    </div>
                    
                    <div class="level-display" style="
                        background: rgba(74, 155, 142, 0.2);
                        color: #4a9b8e;
                        padding: 0.5rem 1rem;
                        border-radius: 25px;
                        font-weight: 600;
                        border: 1px solid rgba(74, 155, 142, 0.3);
                    ">
                        ⚡ Level ${this.level}
                    </div>

                    <button class="theme-toggle" onclick="ecoSaverSystem.toggleGlobalTheme()" style="
                        background: rgba(241, 196, 15, 0.2);
                        border: 1px solid rgba(241, 196, 15, 0.3);
                        color: #f1c40f;
                        padding: 0.5rem;
                        border-radius: 50%;
                        cursor: pointer;
                        width: 40px;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='rgba(241, 196, 15, 0.3)'"
                       onmouseout="this.style.background='rgba(241, 196, 15, 0.2)'">
                        <span id="themeIcon">🌙</span>
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('afterbegin', navHTML);
        
        // Adjust body padding to account for fixed nav
        document.body.style.paddingTop = '80px';
    }

    // 🌟 SMART NAVIGATION SYSTEM 🌟
    setupSmartNavigation() {
        // Highlight current page
        const currentPage = window.location.pathname.split('/').pop();
        const currentLink = document.querySelector(`a[href="${currentPage}"]`);
        if (currentLink) {
            currentLink.style.background = 'rgba(88, 214, 141, 0.3)';
            currentLink.style.color = '#58d68d';
        }

        // Add breadcrumb navigation
        this.addBreadcrumbs();
    }

    addBreadcrumbs() {
        const breadcrumbHTML = `
            <div class="ecosaver-breadcrumbs" style="
                background: rgba(26, 74, 55, 0.1);
                padding: 0.5rem 2rem;
                margin-top: 80px;
                color: #4a9b8e;
                font-size: 0.9rem;
            ">
                <span onclick="this.style.color='#58d68d'" style="cursor: pointer;">
                    🏠 Home
                </span> > 
                <span style="color: #58d68d; font-weight: 600;">
                    ${this.getCurrentPageTitle()}
                </span>
            </div>
        `;
        
        if (!document.querySelector('.ecosaver-breadcrumbs')) {
            document.body.insertAdjacentHTML('afterbegin', breadcrumbHTML);
        }
    }

    getCurrentPageTitle() {
        const currentPage = window.location.pathname.split('/').pop();
        const pageTitles = {
            'index.html': '🏠 Landing',
            'dashboard.html': '📊 Dashboard',
            'games-hub.html': '🎮 Gaming Hub',
            'eco-habit-tracking.html': '✅ Habit Tracker',
            'carbon-footprint-tracker.html': '🌱 Carbon Tracker',
            'educational-library.html': '📚 Learning Library',
            'community-action.html': '👥 Community',
            'ecoawarenesshub.html': '💡 Awareness Hub'
        };
        return pageTitles[currentPage] || '🌱 EcoSaver';
    }

    // 🌟 CROSS-PLATFORM DATA SYNCHRONIZATION 🌟
    syncDataAcrossPages() {
        // Sync points across all pages
        this.updatePointsDisplay();
        
        // Sync achievements
        this.updateAchievements();
        
        // Sync user progress
        this.updateUserProgress();
        
        // Setup real-time sync
        this.setupStorageListener();
    }

    updatePointsDisplay() {
        const pointDisplays = document.querySelectorAll('#universalPoints, #ecoPointsNum, .points-display');
        pointDisplays.forEach(display => {
            if (display) display.textContent = this.ecoPoints.toLocaleString();
        });
    }

    updateAchievements() {
        const achievementDisplay = document.querySelector('.achievements-display');
        if (achievementDisplay) {
            achievementDisplay.innerHTML = this.achievements.map(achievement => 
                `<span class="achievement-badge">${achievement.icon} ${achievement.name}</span>`
            ).join('');
        }
    }

    setupStorageListener() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'ecoPoints') {
                this.ecoPoints = parseInt(e.newValue);
                this.updatePointsDisplay();
            }
            if (e.key === 'achievements') {
                this.achievements = JSON.parse(e.newValue);
                this.updateAchievements();
            }
        });
    }

    // 🌟 UNIVERSAL THEME SYSTEM 🌟
    initializeThemeSystem() {
        const savedTheme = localStorage.getItem('globalTheme') || 'dark';
        this.applyGlobalTheme(savedTheme);
    }

    toggleGlobalTheme() {
        const currentTheme = localStorage.getItem('globalTheme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyGlobalTheme(newTheme);
        localStorage.setItem('globalTheme', newTheme);
        
        this.showNotification(`🎨 ${newTheme === 'dark' ? 'Dark' : 'Light'} theme activated across all pages!`);
    }

    applyGlobalTheme(theme) {
        document.body.classList.toggle('light-theme', theme === 'light');
        document.body.classList.toggle('dark-theme', theme === 'dark');
        
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    // 🌟 PROGRESS TRACKING SYSTEM 🌟
    setupProgressTracking() {
        this.trackPageVisits();
        this.trackUserEngagement();
        this.updateProgressBars();
    }

    trackPageVisits() {
        const currentPage = window.location.pathname.split('/').pop();
        const visits = JSON.parse(localStorage.getItem('pageVisits')) || {};
        visits[currentPage] = (visits[currentPage] || 0) + 1;
        localStorage.setItem('pageVisits', JSON.stringify(visits));
        
        // Award points for exploration
        if (visits[currentPage] === 1) {
            this.addEcoPoints(25, `🗺️ Discovered ${this.getCurrentPageTitle()}`);
        }
    }

    trackUserEngagement() {
        let engagementTime = 0;
        const startTime = Date.now();
        
        const trackEngagement = () => {
            engagementTime = Date.now() - startTime;
            
            // Award points for engagement milestones
            if (engagementTime > 60000 && !this.hasEngagementAward('1min')) { // 1 minute
                this.addEcoPoints(10, '⏰ 1 minute engagement bonus');
                this.setEngagementAward('1min');
            }
            if (engagementTime > 300000 && !this.hasEngagementAward('5min')) { // 5 minutes
                this.addEcoPoints(25, '⏰ 5 minute engagement bonus');
                this.setEngagementAward('5min');
            }
        };

        setInterval(trackEngagement, 10000); // Check every 10 seconds
    }

    // 🌟 NOTIFICATION SYSTEM 🌟
    initializeNotificationSystem() {
        this.createNotificationContainer();
    }

    createNotificationContainer() {
        if (!document.querySelector('.ecosaver-notifications')) {
            const notificationHTML = `
                <div class="ecosaver-notifications" style="
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    z-index: 10001;
                    max-width: 350px;
                    pointer-events: none;
                "></div>
            `;
            document.body.insertAdjacentHTML('beforeend', notificationHTML);
        }
    }

    showNotification(message, type = 'success') {
        const notificationContainer = document.querySelector('.ecosaver-notifications');
        if (!notificationContainer) return;

        const notificationId = 'notification-' + Date.now();
        const colors = {
            success: { bg: 'rgba(88, 214, 141, 0.9)', border: '#58d68d' },
            info: { bg: 'rgba(74, 155, 142, 0.9)', border: '#4a9b8e' },
            warning: { bg: 'rgba(241, 196, 15, 0.9)', border: '#f1c40f' },
            error: { bg: 'rgba(231, 76, 60, 0.9)', border: '#e74c3c' }
        };

        const color = colors[type] || colors.success;

        const notificationHTML = `
            <div id="${notificationId}" class="ecosaver-notification" style="
                background: ${color.bg};
                border: 2px solid ${color.border};
                border-radius: 15px;
                padding: 1rem 1.5rem;
                margin-bottom: 1rem;
                color: white;
                font-weight: 600;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                transform: translateX(100%);
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                pointer-events: auto;
                cursor: pointer;
                backdrop-filter: blur(10px);
            ">
                ${message}
            </div>
        `;

        notificationContainer.insertAdjacentHTML('beforeend', notificationHTML);

        const notification = document.getElementById(notificationId);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Click to dismiss
        notification.addEventListener('click', () => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 400);
        });

        // Auto dismiss
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 400);
            }
        }, 5000);
    }

    // 🌟 UTILITY FUNCTIONS 🌟
    addEcoPoints(points, reason = '') {
        this.ecoPoints += points;
        localStorage.setItem('ecoPoints', this.ecoPoints);
        this.updatePointsDisplay();
        
        if (reason) {
            this.showNotification(`+${points} Eco Points! ${reason}`);
        }

        // Check for level up
        this.checkLevelUp();
        
        // Trigger cross-page sync
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'ecoPoints',
            newValue: this.ecoPoints.toString()
        }));
    }

    checkLevelUp() {
        const newLevel = Math.floor(this.ecoPoints / 1000) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            localStorage.setItem('userLevel', this.level);
            this.showNotification(`🎉 Level Up! You're now Level ${this.level}!`, 'success');
            
            // Update level display
            const levelDisplays = document.querySelectorAll('.level-display');
            levelDisplays.forEach(display => {
                if (display) display.innerHTML = `⚡ Level ${this.level}`;
            });
        }
    }

    loadUserData() {
        return JSON.parse(localStorage.getItem('currentUser')) || {
            name: 'Eco Warrior',
            level: 1,
            joinDate: new Date().toISOString()
        };
    }

    hasEngagementAward(milestone) {
        const currentPage = window.location.pathname.split('/').pop();
        const awards = JSON.parse(localStorage.getItem('engagementAwards')) || {};
        return awards[currentPage]?.includes(milestone);
    }

    setEngagementAward(milestone) {
        const currentPage = window.location.pathname.split('/').pop();
        const awards = JSON.parse(localStorage.getItem('engagementAwards')) || {};
        if (!awards[currentPage]) awards[currentPage] = [];
        awards[currentPage].push(milestone);
        localStorage.setItem('engagementAwards', JSON.stringify(awards));
    }

    // 🌟 REAL-TIME SYNCHRONIZATION 🌟
    startRealTimeSync() {
        this.syncInterval = setInterval(() => {
            this.syncDataAcrossPages();
        }, 5000); // Sync every 5 seconds
    }

    updateUserProgress() {
        const progressData = {
            points: this.ecoPoints,
            level: this.level,
            achievements: this.achievements.length,
            pagesVisited: Object.keys(JSON.parse(localStorage.getItem('pageVisits')) || {}).length
        };

        // Update any progress indicators on the page
        Object.entries(progressData).forEach(([key, value]) => {
            const elements = document.querySelectorAll(`[data-progress="${key}"]`);
            elements.forEach(el => el.textContent = value);
        });
    }
}

// 🌟 INITIALIZE UNIFIED SYSTEM 🌟
let ecoSaverSystem;

document.addEventListener('DOMContentLoaded', () => {
    ecoSaverSystem = new EcoSaverUnifiedSystem();
    console.log('🌱 EcoSaver Unified System Active - Cross-platform features enabled!');
});

// 🌟 GLOBAL FUNCTIONS FOR ALL PAGES 🌟
window.addEcoPoints = (points, reason) => {
    if (ecoSaverSystem) ecoSaverSystem.addEcoPoints(points, reason);
};

window.showEcoNotification = (message, type) => {
    if (ecoSaverSystem) ecoSaverSystem.showNotification(message, type);
};

window.logEcoAction = (actionName, points = 20) => {
    if (ecoSaverSystem) {
        ecoSaverSystem.addEcoPoints(points, `🌟 ${actionName} completed!`);
    }
};

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EcoSaverUnifiedSystem;
}