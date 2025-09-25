const express = require('express');
const WebSocket = require('ws');
const os = require('os');
const fs = require('fs');

class RealTimeAnalytics {
  constructor() {
    this.metrics = new Map();
    this.connections = new Set();
    this.initializeMetrics();
    this.startMetricsCollection();
  }

  initializeMetrics() {
    this.metrics.set('system', {
      cpu: 0,
      memory: 0,
      disk: 0,
      uptime: 0
    });

    this.metrics.set('application', {
      activeUsers: 0,
      requests: 0,
      errors: 0,
      responseTime: 0,
      tasksCompleted: 0,
      treesPlanted: 0,
      co2Saved: 0
    });

    this.metrics.set('environmental', {
      totalImpact: 0,
      partnershipsActive: 0,
      verificationsToday: 0,
      achievementsUnlocked: 0
    });

    this.metrics.set('business', {
      revenue: 0,
      conversions: 0,
      premiumUsers: 0,
      churnRate: 0
    });
  }

  startMetricsCollection() {
    // Collect system metrics every 5 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 5000);

    // Collect application metrics every 10 seconds
    setInterval(() => {
      this.collectApplicationMetrics();
    }, 10000);

    // Collect environmental metrics every 30 seconds
    setInterval(() => {
      this.collectEnvironmentalMetrics();
    }, 30000);

    // Broadcast updates to connected clients
    setInterval(() => {
      this.broadcastMetrics();
    }, 2000);
  }

  collectSystemMetrics() {
    const system = {
      cpu: this.getCPUUsage(),
      memory: this.getMemoryUsage(),
      disk: this.getDiskUsage(),
      uptime: process.uptime(),
      timestamp: Date.now()
    };

    this.metrics.set('system', system);
  }

  getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return Math.max(0, Math.min(100, usage));
  }

  getMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    return {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
      percentage: Math.round((usedMemory / totalMemory) * 100)
    };
  }

  getDiskUsage() {
    try {
      const stats = fs.statSync('.');
      // This is a simplified disk usage calculation
      // In production, use a proper disk usage library
      return {
        total: 100 * 1024 * 1024 * 1024, // 100GB placeholder
        used: 50 * 1024 * 1024 * 1024,   // 50GB placeholder
        percentage: 50
      };
    } catch (error) {
      return { total: 0, used: 0, percentage: 0 };
    }
  }

  async collectApplicationMetrics() {
    // In a real application, these would come from database queries
    // and actual application monitoring
    
    const application = {
      activeUsers: Math.floor(Math.random() * 500) + 100,
      requests: Math.floor(Math.random() * 1000) + 500,
      errors: Math.floor(Math.random() * 10),
      responseTime: Math.floor(Math.random() * 200) + 50,
      tasksCompleted: Math.floor(Math.random() * 100) + 50,
      treesPlanted: Math.floor(Math.random() * 20) + 5,
      co2Saved: Math.floor(Math.random() * 500) + 100,
      timestamp: Date.now()
    };

    this.metrics.set('application', application);
  }

  async collectEnvironmentalMetrics() {
    const environmental = {
      totalImpact: Math.floor(Math.random() * 10000) + 5000,
      partnershipsActive: 6, // Fixed number of partnerships
      verificationsToday: Math.floor(Math.random() * 200) + 100,
      achievementsUnlocked: Math.floor(Math.random() * 50) + 20,
      timestamp: Date.now()
    };

    this.metrics.set('environmental', environmental);
  }

  broadcastMetrics() {
    const allMetrics = {
      system: this.metrics.get('system'),
      application: this.metrics.get('application'),
      environmental: this.metrics.get('environmental'),
      business: this.metrics.get('business'),
      timestamp: Date.now()
    };

    const message = JSON.stringify({
      type: 'metrics_update',
      data: allMetrics
    });

    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  // WebSocket connection handler
  handleConnection(ws) {
    this.connections.add(ws);
    
    // Send current metrics immediately
    const currentMetrics = {
      system: this.metrics.get('system'),
      application: this.metrics.get('application'),
      environmental: this.metrics.get('environmental'),
      business: this.metrics.get('business'),
      timestamp: Date.now()
    };

    ws.send(JSON.stringify({
      type: 'initial_metrics',
      data: currentMetrics
    }));

    ws.on('close', () => {
      this.connections.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.connections.delete(ws);
    });
  }

  // API endpoints for metrics
  getMetricsAPI() {
    const router = express.Router();

    // Get all metrics
    router.get('/metrics', (req, res) => {
      const allMetrics = {
        system: this.metrics.get('system'),
        application: this.metrics.get('application'),
        environmental: this.metrics.get('environmental'),
        business: this.metrics.get('business'),
        timestamp: Date.now()
      };

      res.json(allMetrics);
    });

    // Get system metrics only
    router.get('/metrics/system', (req, res) => {
      res.json(this.metrics.get('system'));
    });

    // Get application metrics only
    router.get('/metrics/application', (req, res) => {
      res.json(this.metrics.get('application'));
    });

    // Get environmental metrics only
    router.get('/metrics/environmental', (req, res) => {
      res.json(this.metrics.get('environmental'));
    });

    // Get business metrics only
    router.get('/metrics/business', (req, res) => {
      res.json(this.metrics.get('business'));
    });

    // Health check endpoint
    router.get('/health', (req, res) => {
      const systemMetrics = this.metrics.get('system');
      const applicationMetrics = this.metrics.get('application');

      const health = {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: systemMetrics.cpu,
        activeConnections: this.connections.size,
        lastUpdate: systemMetrics.timestamp,
        checks: {
          database: true, // In real app, test database connection
          redis: true,    // In real app, test Redis connection
          apis: true      // In real app, test external APIs
        }
      };

      // Mark as unhealthy if CPU > 90% or memory > 90%
      if (systemMetrics.cpu > 90 || systemMetrics.memory.percentage > 90) {
        health.status = 'degraded';
      }

      res.json(health);
    });

    // Performance metrics
    router.get('/metrics/performance', (req, res) => {
      const performance = {
        responseTime: {
          avg: Math.floor(Math.random() * 100) + 50,
          p95: Math.floor(Math.random() * 200) + 100,
          p99: Math.floor(Math.random() * 500) + 200
        },
        throughput: {
          requestsPerSecond: Math.floor(Math.random() * 100) + 20,
          requestsPerMinute: Math.floor(Math.random() * 6000) + 1200
        },
        errors: {
          rate: Math.random() * 0.01, // 1% error rate
          total: Math.floor(Math.random() * 50),
          breakdown: {
            '4xx': Math.floor(Math.random() * 30),
            '5xx': Math.floor(Math.random() * 20)
          }
        },
        timestamp: Date.now()
      };

      res.json(performance);
    });

    // User activity metrics
    router.get('/metrics/users', (req, res) => {
      const users = {
        active: {
          realTime: Math.floor(Math.random() * 500) + 100,
          today: Math.floor(Math.random() * 2000) + 500,
          thisWeek: Math.floor(Math.random() * 10000) + 2000,
          thisMonth: Math.floor(Math.random() * 50000) + 10000
        },
        growth: {
          daily: Math.floor(Math.random() * 100) + 20,
          weekly: Math.floor(Math.random() * 500) + 100,
          monthly: Math.floor(Math.random() * 2000) + 500
        },
        retention: {
          daily: 0.75 + Math.random() * 0.2,
          weekly: 0.60 + Math.random() * 0.2,
          monthly: 0.45 + Math.random() * 0.2
        },
        geographic: [
          { country: 'India', users: 15000, percentage: 45 },
          { country: 'United States', users: 8000, percentage: 24 },
          { country: 'United Kingdom', users: 3500, percentage: 10.5 },
          { country: 'Germany', users: 2500, percentage: 7.5 },
          { country: 'Canada', users: 2000, percentage: 6 },
          { country: 'Others', users: 2333, percentage: 7 }
        ],
        timestamp: Date.now()
      };

      res.json(users);
    });

    // Environmental impact metrics
    router.get('/metrics/impact', (req, res) => {
      const impact = {
        trees: {
          planted: Math.floor(Math.random() * 10000) + 5000,
          pledged: Math.floor(Math.random() * 50000) + 25000,
          byRegion: {
            asia: 3000,
            africa: 1500,
            southAmerica: 800,
            northAmerica: 500,
            europe: 200
          }
        },
        carbon: {
          offsetKg: Math.floor(Math.random() * 100000) + 50000,
          savedKg: Math.floor(Math.random() * 200000) + 100000,
          averagePerUser: Math.floor(Math.random() * 50) + 25
        },
        waste: {
          reducedKg: Math.floor(Math.random() * 50000) + 25000,
          recycledKg: Math.floor(Math.random() * 30000) + 15000,
          plasticSavedKg: Math.floor(Math.random() * 10000) + 5000
        },
        partnerships: {
          oneTreePlanted: {
            active: true,
            treesPlanted: 2500,
            lastUpdate: new Date().toISOString()
          },
          offsetEarth: {
            active: true,
            co2Offset: 15000,
            lastUpdate: new Date().toISOString()
          },
          oceanCleanup: {
            active: true,
            plasticRemoved: 1200,
            lastUpdate: new Date().toISOString()
          }
        },
        timestamp: Date.now()
      };

      res.json(impact);
    });

    // Alerts and notifications
    router.get('/alerts', (req, res) => {
      const alerts = [
        {
          id: 1,
          type: 'warning',
          title: 'High CPU Usage',
          message: 'CPU usage is above 80% for the last 10 minutes',
          timestamp: Date.now() - 600000,
          resolved: false
        },
        {
          id: 2,
          type: 'info',
          title: 'Partnership Update',
          message: 'One Tree Planted partnership planted 50 new trees',
          timestamp: Date.now() - 3600000,
          resolved: true
        },
        {
          id: 3,
          type: 'success',
          title: 'Milestone Reached',
          message: '10,000 users milestone achieved!',
          timestamp: Date.now() - 7200000,
          resolved: true
        }
      ];

      res.json(alerts);
    });

    return router;
  }

  // Log important events
  logEvent(type, data) {
    const event = {
      type,
      data,
      timestamp: new Date().toISOString()
    };

    console.log('📊 Analytics Event:', event);

    // In production, send to analytics service
    this.broadcastEvent(event);
  }

  broadcastEvent(event) {
    const message = JSON.stringify({
      type: 'event',
      data: event
    });

    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  // Custom metrics tracking
  trackCustomMetric(name, value, tags = {}) {
    const metric = {
      name,
      value,
      tags,
      timestamp: Date.now()
    };

    // Store custom metrics (in production, use a time-series database)
    if (!this.metrics.has('custom')) {
      this.metrics.set('custom', []);
    }

    const customMetrics = this.metrics.get('custom');
    customMetrics.push(metric);

    // Keep only last 1000 custom metrics
    if (customMetrics.length > 1000) {
      customMetrics.shift();
    }

    this.broadcastEvent({
      type: 'custom_metric',
      metric
    });
  }
}

module.exports = RealTimeAnalytics;