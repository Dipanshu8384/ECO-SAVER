(function () {
  // ---------- Slider ----------
  const sliderRoot = document.querySelector("#env-slider");
  if (sliderRoot) {
    const slider = sliderRoot.querySelector(".slides");
    const slides = sliderRoot.querySelectorAll(".slide");
    const prev = sliderRoot.querySelector(".prev");
    const next = sliderRoot.querySelector(".next");
    const dotsContainer = sliderRoot.querySelector(".dots");
    let index = 0;
    let autoplayTimer = null;

    if (slider && slides.length && dotsContainer) {
      dotsContainer.innerHTML = "";
      slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
        dot.className = "w-3 h-3 rounded-full bg-gray-400 transition-colors";
        dot.addEventListener("click", () => {
          showSlide(i);
          resetAutoplay();
        });
        dotsContainer.appendChild(dot);
      });
      const dots = dotsContainer.querySelectorAll("button");

      function showSlide(i) {
        index = (i + slides.length) % slides.length;
        slider.style.transform = `translateX(${-index * 100}%)`;
        dots.forEach((d, j) => {
          d.className = j === index
            ? "w-3 h-3 rounded-full bg-[#20c4b6] transition-colors"
            : "w-3 h-3 rounded-full bg-gray-400 transition-colors";
        });
      }

      function resetAutoplay() {
        if (autoplayTimer) clearInterval(autoplayTimer);
        autoplayTimer = setInterval(() => showSlide(index + 1), 4000);
      }

      prev?.addEventListener("click", () => { showSlide(index - 1); resetAutoplay(); });
      next?.addEventListener("click", () => { showSlide(index + 1); resetAutoplay(); });

      // Pause on hover, resume on leave
      sliderRoot.addEventListener("mouseenter", () => autoplayTimer && clearInterval(autoplayTimer));
      sliderRoot.addEventListener("mouseleave", resetAutoplay);

      showSlide(0);
      resetAutoplay();
    }
  }

  // ---------- Main App ----------
  document.addEventListener("DOMContentLoaded", function () {
    // Dropdown menu logic
    const menuButton = document.getElementById("menuButton");
    const menuDropdown = document.getElementById("menuDropdown");
    if (menuButton && menuDropdown) {
      menuButton.addEventListener("click", function (e) {
        e.stopPropagation();
        menuDropdown.classList.toggle("hidden");
      });
      document.addEventListener("click", function (e) {
        if (!menuButton.contains(e.target) && !menuDropdown.contains(e.target)) {
          menuDropdown.classList.add("hidden");
        }
      });
    }

    // Profile dropdown toggle
    const profileAvatar = document.getElementById("profileAvatar");
    const profileDropdown = document.getElementById("profileDropdown");
    const profileDropdownArea = document.getElementById("profileDropdownArea");
    if (profileAvatar && profileDropdown && profileDropdownArea) {
      profileAvatar.addEventListener("click", function (e) {
        e.stopPropagation();
        profileDropdown.classList.toggle("hidden");
      });
      document.body.addEventListener("click", function (e) {
        if (!profileDropdownArea.contains(e.target)) {
          profileDropdown.classList.add("hidden");
        }
      });
    }

    // ---------- User Profile ----------
    const STORAGE_KEY = "ecoUser";
    let userProfile = {
      name: "Aman Sharma",
      email: "aman@email.com",
      ecoPoints: 120,
      badges: ["Green Beginner", "Eco-Warrior"],
      level: "Eco-Warrior"
    };

    function loadProfile() {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      try {
        const parsed = JSON.parse(stored);
        userProfile = Object.assign({}, userProfile, parsed);
      } catch (e) {
        console.warn("Failed to parse stored profile, using defaults.", e);
      }
    }

    function saveProfile() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
      } catch (e) {
        console.warn("Failed to persist profile.", e);
      }
    }

    loadProfile();

    function updateLeaderboardPoints() {
      let userIdx = leaderboardData.findIndex(u => u.name === userProfile.name);
      if (userIdx === -1) {
        leaderboardData.push({
          name: userProfile.name,
          avatar: "avtar1.png",
          ecoPoints: userProfile.ecoPoints,
          badges: userProfile.badges.slice(),
        });
      } else {
        leaderboardData[userIdx].ecoPoints = userProfile.ecoPoints;
        leaderboardData[userIdx].badges = userProfile.badges.slice();
      }
      renderLeaderboard();
    }

    function updateProfileInfo() {
      const els = {
        profileName: userProfile.name,
        profileEmail: userProfile.email,
        profileLevel: userProfile.level,
        profilePoints: userProfile.ecoPoints,
        ecoPointsNum: userProfile.ecoPoints
      };
      Object.entries(els).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      });
    }

    updateProfileInfo();

    // Eco-points system
    window.logEcoAction = function (points = 10) {
      userProfile.ecoPoints += points;
      updateProfileInfo();
      updateLeaderboardPoints();
      saveProfile();

      const display = document.getElementById("ecoPointsDisplay");
      if (display) {
        display.classList.add("bg-[#aeffd9]");
        setTimeout(() => display.classList.remove("bg-[#aeffd9]"), 500);
      }

      if (userProfile.ecoPoints >= 200 && !userProfile.badges.includes("Eco Hero")) {
        userProfile.badges.push("Eco Hero");
        saveProfile();
        updateLeaderboardPoints();
        alert("Congrats! Unlocked badge: Eco Hero");
      }
    };

    // ---------- Dark Mode ----------
    const darkModeToggle = document.getElementById("darkModeToggle");
    const iconSun = document.getElementById("iconSun");
    const iconMoon = document.getElementById("iconMoon");

    function applyDarkMode(isDark) {
      document.body.classList.toggle("dark", isDark);
      if (iconSun && iconMoon) {
        iconSun.classList.toggle("hidden", isDark);
        iconMoon.classList.toggle("hidden", !isDark);
      }
    }

    applyDarkMode(localStorage.getItem("darkMode") === "enabled");

    if (darkModeToggle) {
      darkModeToggle.addEventListener("click", function () {
        const isDark = !document.body.classList.contains("dark");
        applyDarkMode(isDark);
        localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
      });
    }

    // ---------- Leaderboard ----------
    const leaderboardData = [
      { name: "Aman Sharma", avatar: "avtar1.png", ecoPoints: 120, badges: ["Green Beginner", "Eco-Warrior"] },
      { name: "Priya Singh", avatar: "avtar2.png", ecoPoints: 210, badges: ["Eco Hero", "Green Beginner"] },
      { name: "Rohan Patel", avatar: "avtar3.png", ecoPoints: 180, badges: ["Eco-Warrior"] },
      { name: "Sneha Verma", avatar: "avtar4.png", ecoPoints: 95, badges: ["Green Beginner"] },
      { name: "Vikas Kumar", avatar: "avtar5.png", ecoPoints: 60, badges: [] },
    ];

    function escapeHtml(str) {
      const div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    }

    function renderLeaderboard() {
      const list = document.getElementById("leaderboardList");
      if (!list) return;

      const sorted = leaderboardData.slice().sort((a, b) => b.ecoPoints - a.ecoPoints);
      const frag = document.createDocumentFragment();

      sorted.forEach((user, idx) => {
        let rankClass = "";
        if (idx === 0) rankClass = "gold";
        else if (idx === 1) rankClass = "silver";
        else if (idx === 2) rankClass = "bronze";

        const li = document.createElement("li");
        li.className = `leaderboard-row ${rankClass}`;
        li.innerHTML = `
          <span class="rank">${idx + 1}</span>
          <img src="${escapeHtml(user.avatar)}" alt="${escapeHtml(user.name)}" class="avatar" onerror="this.onerror=null;this.src='avtar1.png'"/>
          <span class="name">${escapeHtml(user.name)}</span>
          <span class="eco-points">${user.ecoPoints} pts</span>
          ${user.badges.map(b => `<span class="badge">${escapeHtml(b)}</span>`).join("")}
        `;
        frag.appendChild(li);
      });

      list.innerHTML = "";
      list.appendChild(frag);
    }

    updateLeaderboardPoints();
  });
})();
