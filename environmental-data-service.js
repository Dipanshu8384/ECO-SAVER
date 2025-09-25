// Real Environmental Data APIs - Works with your existing UI
// This adds REAL data to your beautiful charts and stats!

const axios = require('axios');

class EnvironmentalDataService {
  constructor() {
    // Real environmental APIs
    this.APIs = {
      carbonTracker: 'https://api.carbonintensity.org.uk/intensity',
      airQuality: 'https://api.openweathermap.org/data/2.5/air_pollution',
      weatherAPI: 'https://api.openweathermap.org/data/2.5/weather',
      // Add your API keys to environment variables
      OPENWEATHER_KEY: process.env.OPENWEATHER_API_KEY || 'your_api_key_here',
      NASA_KEY: process.env.NASA_API_KEY || 'DEMO_KEY'
    };
  }

  // Real Carbon Footprint Calculations
  calculateRealCarbonSavings(activity, amount = 1) {
    const carbonFactors = {
      // Transportation (kg CO2 per km)
      walk_instead_drive: 0.21 * amount, // Average car emissions
      bike_instead_drive: 0.21 * amount,
      public_transport: 0.21 * 0.5 * amount, // 50% reduction
      carpool: 0.21 * 0.5 * amount,
      work_from_home: 8.9, // Average daily commute
      
      // Energy (kg CO2 per kWh saved)
      led_bulb: 0.5 * amount,
      unplug_devices: 0.5 * 0.1 * amount,
      air_dry_clothes: 2.3, // Per load
      shorter_shower: 0.5 * amount, // Per minute saved
      thermostat_adjust: 0.8 * amount, // Per degree
      
      // Waste (kg CO2 per kg)
      recycle_paper: 1.1 * amount,
      recycle_plastic: 2.0 * amount,
      compost: 0.5 * amount,
      reduce_food_waste: 3.3 * amount,
      reusable_bags: 0.04 * amount,
      
      // Water (kg CO2 per liter saved)
      fix_leaky_faucet: 0.001 * amount,
      full_dishwasher: 0.001 * 12, // Average water saved
      rainwater_collection: 0.001 * amount,
      
      // Food (kg CO2)
      meatless_meal: 2.5,
      local_food: 0.5 * amount,
      grow_own_food: 1.0 * amount,
      reduce_packaging: 0.2 * amount
    };

    return carbonFactors[activity] || 0.5; // Default 0.5kg CO2
  }

  // Real Water Savings (liters)
  calculateWaterSavings(activity, amount = 1) {
    const waterFactors = {
      shorter_shower: 35 * amount, // Liters per minute
      fix_leaky_faucet: 3000 * amount, // Per month
      full_dishwasher: 27,
      rainwater_collection: 50 * amount,
      native_plants: 100 * amount, // Per plant per month
      drip_irrigation: 500 * amount,
      reusable_water_bottle: 167 * amount // Bottles per year
    };

    return waterFactors[activity] || 10; // Default 10L
  }

  // Real Energy Savings (kWh)
  calculateEnergySavings(activity, amount = 1) {
    const energyFactors = {
      led_bulb: 50 * amount, // kWh per year
      unplug_devices: 100 * amount,
      air_dry_clothes: 2.5,
      shorter_shower: 0.4 * amount, // Hot water heating
      solar_panel: 1500 * amount, // Per panel per year
      energy_efficient_appliances: 200 * amount
    };

    return energyFactors[activity] || 5; // Default 5kWh
  }

  // Get real air quality data
  async getAirQuality(lat = 28.6139, lon = 77.2090) { // Default: Delhi
    try {
      const response = await axios.get(
        `${this.APIs.airQuality}?lat=${lat}&lon=${lon}&appid=${this.APIs.OPENWEATHER_KEY}`
      );
      
      const data = response.data;
      const aqi = data.list[0].main.aqi;
      const components = data.list[0].components;
      
      return {
        success: true,
        aqi: aqi,
        quality: this.getAirQualityLevel(aqi),
        co: components.co,
        no2: components.no2,
        o3: components.o3,
        pm2_5: components.pm2_5,
        pm10: components.pm10,
        location: `${lat}, ${lon}`
      };
    } catch (error) {
      console.error('Air Quality API error:', error);
      return {
        success: false,
        aqi: 3, // Default moderate
        quality: 'Moderate',
        message: 'Using simulated data'
      };
    }
  }

  getAirQualityLevel(aqi) {
    const levels = {
      1: 'Good',
      2: 'Fair', 
      3: 'Moderate',
      4: 'Poor',
      5: 'Very Poor'
    };
    return levels[aqi] || 'Unknown';
  }

  // Get real weather data for environmental context
  async getEnvironmentalWeather(lat = 28.6139, lon = 77.2090) {
    try {
      const response = await axios.get(
        `${this.APIs.weatherAPI}?lat=${lat}&lon=${lon}&appid=${this.APIs.OPENWEATHER_KEY}&units=metric`
      );
      
      const data = response.data;
      
      return {
        success: true,
        temperature: data.main.temp,
        humidity: data.main.humidity,
        visibility: data.visibility / 1000, // km
        windSpeed: data.wind.speed,
        city: data.name,
        country: data.sys.country,
        description: data.weather[0].description
      };
    } catch (error) {
      console.error('Weather API error:', error);
      return {
        success: false,
        temperature: 25,
        humidity: 60,
        city: 'Your City',
        description: 'clear sky'
      };
    }
  }

  // Real-time eco tips based on current conditions
  async getContextualEcoTips(airQuality, weather) {
    const tips = [];

    if (airQuality.aqi >= 4) {
      tips.push({
        category: 'air_quality',
        tip: 'Air quality is poor today. Consider working from home to reduce vehicle emissions.',
        impact: 'Saves 8.9 kg CO₂',
        icon: '🏠'
      });
    }

    if (weather.temperature > 30) {
      tips.push({
        category: 'energy',
        tip: 'Hot day! Set AC to 26°C instead of 22°C to save energy.',
        impact: 'Saves 0.8 kg CO₂ per degree',
        icon: '❄️'
      });
    }

    if (weather.humidity > 80) {
      tips.push({
        category: 'water',
        tip: 'High humidity today - perfect for collecting rainwater!',
        impact: 'Can save 50L of water',
        icon: '🌧️'
      });
    }

    if (weather.windSpeed > 5) {
      tips.push({
        category: 'energy',
        tip: 'Windy day! Perfect for air-drying clothes instead of using dryer.',
        impact: 'Saves 2.3 kg CO₂',
        icon: '👕'
      });
    }

    return tips.length > 0 ? tips : [
      {
        category: 'general',
        tip: 'Perfect day to plant a tree! Trees absorb 22kg CO₂ annually.',
        impact: 'Absorbs 22 kg CO₂/year',
        icon: '🌱'
      }
    ];
  }

  // Real carbon intensity data (UK API, can be adapted)
  async getCarbonIntensity() {
    try {
      const response = await axios.get(this.APIs.carbonTracker);
      const intensity = response.data.data[0].intensity.actual || response.data.data[0].intensity.forecast;
      
      return {
        success: true,
        intensity: intensity, // gCO2/kWh
        level: this.getCarbonIntensityLevel(intensity),
        recommendation: this.getCarbonRecommendation(intensity)
      };
    } catch (error) {
      console.error('Carbon Intensity API error:', error);
      return {
        success: false,
        intensity: 300,
        level: 'Moderate',
        recommendation: 'Consider reducing energy usage during peak hours'
      };
    }
  }

  getCarbonIntensityLevel(intensity) {
    if (intensity < 100) return 'Very Low';
    if (intensity < 200) return 'Low';
    if (intensity < 300) return 'Moderate';
    if (intensity < 400) return 'High';
    return 'Very High';
  }

  getCarbonRecommendation(intensity) {
    if (intensity < 150) return 'Great time to use electricity! Grid is clean.';
    if (intensity < 300) return 'Moderate carbon intensity. Normal usage is fine.';
    return 'High carbon intensity. Consider delaying energy-intensive activities.';
  }

  // Generate personalized eco-challenges based on real data
  async generatePersonalizedChallenges(userLocation, userHabits = []) {
    const airQuality = await this.getAirQuality(userLocation.lat, userLocation.lon);
    const weather = await this.getEnvironmentalWeather(userLocation.lat, userLocation.lon);
    const tips = await this.getContextualEcoTips(airQuality, weather);

    const challenges = [
      {
        title: '5-Day Transport Challenge',
        description: 'Use eco-friendly transport for work commute',
        duration: 5,
        potentialSaving: {
          co2: this.calculateRealCarbonSavings('walk_instead_drive', 5),
          money: 250 // INR
        },
        difficulty: 'Medium'
      },
      {
        title: 'Energy Saver Week',
        description: 'Reduce electricity usage by 20%',
        duration: 7,
        potentialSaving: {
          co2: this.calculateRealCarbonSavings('led_bulb', 7),
          energy: this.calculateEnergySavings('unplug_devices', 7),
          money: 150
        },
        difficulty: 'Easy'
      },
      {
        title: 'Water Conservation Month',
        description: 'Save water through mindful usage',
        duration: 30,
        potentialSaving: {
          water: this.calculateWaterSavings('shorter_shower', 30),
          co2: this.calculateRealCarbonSavings('shorter_shower', 30),
          money: 300
        },
        difficulty: 'Easy'
      }
    ];

    // Add contextual challenges based on current conditions
    tips.forEach(tip => {
      challenges.push({
        title: `Today's Special: ${tip.category.toUpperCase()}`,
        description: tip.tip,
        duration: 1,
        potentialSaving: { impact: tip.impact },
        difficulty: 'Easy',
        contextual: true,
        icon: tip.icon
      });
    });

    return challenges;
  }

  // Real-time leaderboard with actual environmental impact
  calculateGlobalImpact(allUserHabits) {
    const totalCO2Saved = allUserHabits.reduce((sum, habit) => {
      return sum + this.calculateRealCarbonSavings(habit.action, habit.amount || 1);
    }, 0);

    const totalWaterSaved = allUserHabits.reduce((sum, habit) => {
      return sum + this.calculateWaterSavings(habit.action, habit.amount || 1);
    }, 0);

    const totalEnergySaved = allUserHabits.reduce((sum, habit) => {
      return sum + this.calculateEnergySavings(habit.action, habit.amount || 1);
    }, 0);

    return {
      co2SavedKg: Math.round(totalCO2Saved * 100) / 100,
      waterSavedLiters: Math.round(totalWaterSaved),
      energySavedKwh: Math.round(totalEnergySaved * 100) / 100,
      treesEquivalent: Math.round(totalCO2Saved / 22), // 22kg CO2 per tree per year
      carsOffRoad: Math.round(totalCO2Saved / 4600), // 4.6 tons CO2 per car per year
      housesCouldPower: Math.round(totalEnergySaved / 10950) // 10,950 kWh average per house per year
    };
  }
}

module.exports = EnvironmentalDataService;