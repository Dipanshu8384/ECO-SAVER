const slider = document.querySelector("#env-slider .slides");
  const slides = slider.querySelectorAll(".slide");
  const prev = document.querySelector("#env-slider .prev");
  const next = document.querySelector("#env-slider .next");
  const dotsContainer = document.querySelector("#env-slider .dots");
  let index = 0;

  // Create dots
  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "w-3 h-3 rounded-full bg-gray-400";
    dot.addEventListener("click", () => showSlide(i));
    dotsContainer.appendChild(dot);
  });
  const dots = dotsContainer.querySelectorAll("button");

  function showSlide(i) {
    index = (i + slides.length) % slides.length;
    slider.style.transform = `translateX(${-index * 100}%)`;
    dots.forEach((d, j) => {
      d.className = j === index ? "w-3 h-3 rounded-full bg-[#20c4b6]" : "w-3 h-3 rounded-full bg-gray-400";
    });
  }

  prev.addEventListener("click", () => showSlide(index - 1));
  next.addEventListener("click", () => showSlide(index + 1));

  // Auto-play
  setInterval(() => showSlide(index + 1), 4000);

  showSlide(0);


document.addEventListener('DOMContentLoaded', function() {
    // Dropdown menu logic
    const menuButton = document.getElementById('menuButton');
    const menuDropdown = document.getElementById('menuDropdown');
    if (menuButton && menuDropdown) {
      menuButton.addEventListener('click', function(e) {
        e.stopPropagation();
        menuDropdown.classList.toggle('hidden');
      });
      document.addEventListener('click', function(e) {
        if (!menuButton.contains(e.target) && !menuDropdown.contains(e.target)) {
          menuDropdown.classList.add('hidden');
        }
      });
    }

    // Profile Dropdown Toggle
    const profileAvatar = document.getElementById('profileAvatar');
    const profileDropdown = document.getElementById('profileDropdown');
    const profileDropdownArea = document.getElementById('profileDropdownArea');
    if (profileAvatar && profileDropdown && profileDropdownArea) {
      profileAvatar.onclick = function(e) {
        e.stopPropagation();
        profileDropdown.classList.toggle('hidden');
      };
      document.body.addEventListener('click', function(e) {
        if (!profileDropdownArea.contains(e.target)) {
          profileDropdown.classList.add('hidden');
        }
      });
    }

    // User Profile Data & Update Function
    let userProfile = {
      name: "Aman Sharma",
      email: "aman@email.com",
      ecoPoints: 120,
      badges: ["Green Beginner", "Eco-Warrior"],
      level: "Eco-Warrior"
    };
    // If user info exists in localStorage, use it
    const storedUser = localStorage.getItem('ecoUser');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        userProfile = Object.assign(userProfile, parsed);
      } catch (e) {}
    }
    // Find the user's leaderboard entry
    function updateLeaderboardPoints() {
      if (typeof leaderboardData !== 'undefined') {
        let userIdx = leaderboardData.findIndex(u => u.name === userProfile.name);
        if (userIdx === -1) {
          // Add user to leaderboard if not present
          leaderboardData.push({
            name: userProfile.name,
            avatar: "avtar1.png",
            ecoPoints: userProfile.ecoPoints,
            badges: userProfile.badges.slice(),
          });
          userIdx = leaderboardData.length - 1;
        } else {
          leaderboardData[userIdx].ecoPoints = userProfile.ecoPoints;
          leaderboardData[userIdx].badges = userProfile.badges.slice();
        }
        renderLeaderboard();
      }
    }
    function updateProfileInfo() {
      document.getElementById('profileName').textContent = userProfile.name;
      document.getElementById('profileEmail').textContent = userProfile.email;
      document.getElementById('profileLevel').textContent = userProfile.level;
      document.getElementById('profilePoints').textContent = userProfile.ecoPoints;
      document.getElementById('ecoPointsNum').textContent = userProfile.ecoPoints;
    }
    updateProfileInfo();

    // Eco-Points System: Earn points on log action
    window.logEcoAction = function() {
      userProfile.ecoPoints += 10;
      updateProfileInfo();
      updateLeaderboardPoints();
      document.getElementById('ecoPointsDisplay').classList.add('bg-[#aeffd9]');
      setTimeout(() => document.getElementById('ecoPointsDisplay').classList.remove('bg-[#aeffd9]'), 500);
      if (userProfile.ecoPoints >= 200 && !userProfile.badges.includes("Eco Hero")) {
        userProfile.badges.push("Eco Hero");
        alert("Congrats! Unlocked badge: Eco Hero");
        updateLeaderboardPoints();
      }
    };

    // Dark Mode Toggle with localStorage persistence
    const darkModeToggle = document.getElementById('darkModeToggle');
    const iconSun = document.getElementById('iconSun');
    const iconMoon = document.getElementById('iconMoon');
    // On page load, check localStorage
    if (localStorage.getItem('darkMode') === 'enabled') {
      document.body.classList.add('dark');
      if (iconSun && iconMoon) {
        iconSun.classList.add('hidden');
        iconMoon.classList.remove('hidden');
      }
    }
    if (darkModeToggle && iconSun && iconMoon) {
      darkModeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        if (isDark) {
          localStorage.setItem('darkMode', 'enabled');
          iconSun.classList.add('hidden');
          iconMoon.classList.remove('hidden');
        } else {
          localStorage.setItem('darkMode', 'disabled');
          iconSun.classList.remove('hidden');
          iconMoon.classList.add('hidden');
        }
      });
    }
    // Leaderboard Demo Data & Rendering
    const leaderboardData = [
      {
        name: "Aman Sharma",
        avatar: "avtar1.png",
        ecoPoints: 120,
        badges: ["Green Beginner", "Eco-Warrior"],
      },
      {
        name: "Priya Singh",
        avatar: "avtar2.png",
        ecoPoints: 210,
        badges: ["Eco Hero", "Green Beginner"],
      },
      {
        name: "Rohan Patel",
        avatar: "avtar3.png",
        ecoPoints: 180,
        badges: ["Eco-Warrior"],
      },
      {
        name: "Sneha Verma",
        avatar: "avtar4.png",
        ecoPoints: 95,
        badges: ["Green Beginner"],
      },
      {
        name: "Vikas Kumar",
        avatar: "avtar5.png",
        ecoPoints: 60,
        badges: [],
      },
    ];

    function renderLeaderboard() {
      const list = document.getElementById('leaderboardList');
      if (!list) return;
      // Sort by ecoPoints descending
      const sorted = leaderboardData.slice().sort((a, b) => b.ecoPoints - a.ecoPoints);
      list.innerHTML = '';
      sorted.forEach((user, idx) => {
        let rankClass = '';
        if (idx === 0) rankClass = 'gold';
        else if (idx === 1) rankClass = 'silver';
        else if (idx === 2) rankClass = 'bronze';
        list.innerHTML += `
          <li class="leaderboard-row ${rankClass}">
            <span class="rank">${idx + 1}</span>
            <img src="${user.avatar}" alt="${user.name}" class="avatar" onerror="this.src='avtar1.png'"/>
            <span class="name">${user.name}</span>
            <span class="eco-points">${user.ecoPoints} pts</span>
            ${user.badges.map(badge => `<span class="badge">${badge}</span>`).join('')}
          </li>
        `;
      });
    }
    renderLeaderboard();
    // ...existing code...
  });