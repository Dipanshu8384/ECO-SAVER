const vision = require('@google-cloud/vision');
const { Storage } = require('@google-cloud/storage');
const tf = require('@tensorflow/tfjs-node');
const sharp = require('sharp');
const axios = require('axios');

class AIVerificationSystem {
  constructor() {
    // Initialize Google Cloud Vision API
    this.visionClient = new vision.ImageAnnotatorClient({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: './config/google-cloud-key.json'
    });

    // Initialize Google Cloud Storage
    this.storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: './config/google-cloud-key.json'
    });

    this.bucket = this.storage.bucket(process.env.GOOGLE_CLOUD_STORAGE_BUCKET);

    // Load custom ML models for specific task verification
    this.loadCustomModels();
  }

  async loadCustomModels() {
    try {
      // Load pre-trained models for specific environmental tasks
      this.recyclingModel = await tf.loadLayersModel('./models/recycling-classifier/model.json');
      this.treeModel = await tf.loadLayersModel('./models/tree-detection/model.json');
      this.cleanupModel = await tf.loadLayersModel('./models/cleanup-verification/model.json');
      console.log('✅ Custom AI models loaded successfully');
    } catch (error) {
      console.warn('⚠️ Custom models not found, using Google Vision API only');
    }
  }

  // Main verification method
  async verifyTask(taskType, imageBase64, additionalData = {}) {
    try {
      console.log(`🔍 Starting AI verification for task: ${taskType}`);

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');

      // Optimize image for processing
      const optimizedImage = await this.optimizeImage(imageBuffer);

      // Multi-layer verification approach
      const verificationResults = await Promise.all([
        this.googleVisionAnalysis(optimizedImage, taskType),
        this.customModelAnalysis(optimizedImage, taskType),
        this.contextualAnalysis(optimizedImage, taskType, additionalData),
        this.metadataAnalysis(imageBase64, additionalData)
      ]);

      // Combine and weigh results
      const finalVerification = this.combineVerificationResults(verificationResults, taskType);

      // Store verification data for improvement
      await this.storeVerificationData(taskType, optimizedImage, finalVerification);

      return finalVerification;
    } catch (error) {
      console.error('AI Verification Error:', error);
      return {
        isValid: false,
        confidence: 0,
        error: error.message,
        fallbackReason: 'AI processing failed'
      };
    }
  }

  // Google Cloud Vision API Analysis
  async googleVisionAnalysis(imageBuffer, taskType) {
    try {
      const [result] = await this.visionClient.annotateImage({
        image: { content: imageBuffer },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 20 },
          { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
          { type: 'TEXT_DETECTION' },
          { type: 'SAFE_SEARCH_DETECTION' },
          { type: 'IMAGE_PROPERTIES' }
        ]
      });

      const labels = result.labelAnnotations || [];
      const objects = result.localizedObjectAnnotations || [];
      const textAnnotations = result.textAnnotations || [];
      const safeSearch = result.safeSearchAnnotation || {};

      // Task-specific keyword analysis
      const taskKeywords = this.getTaskKeywords(taskType);
      const relevantLabels = labels.filter(label => 
        taskKeywords.some(keyword => 
          label.description.toLowerCase().includes(keyword.toLowerCase())
        )
      );

      const relevantObjects = objects.filter(obj => 
        taskKeywords.some(keyword => 
          obj.name.toLowerCase().includes(keyword.toLowerCase())
        )
      );

      // Calculate confidence based on relevant detections
      const labelConfidence = relevantLabels.length > 0 ? 
        Math.max(...relevantLabels.map(l => l.score)) : 0;
      
      const objectConfidence = relevantObjects.length > 0 ? 
        Math.max(...relevantObjects.map(o => o.score)) : 0;

      const overallConfidence = Math.max(labelConfidence, objectConfidence);

      return {
        source: 'google_vision',
        confidence: overallConfidence,
        isRelevant: overallConfidence > 0.6,
        labels: labels.map(l => ({ name: l.description, confidence: l.score })),
        objects: objects.map(o => ({ name: o.name, confidence: o.score })),
        text: textAnnotations.map(t => t.description).join(' '),
        safeSearch: safeSearch,
        relevantItems: [...relevantLabels, ...relevantObjects]
      };
    } catch (error) {
      console.error('Google Vision API error:', error);
      return { source: 'google_vision', confidence: 0, error: error.message };
    }
  }

  // Custom ML Model Analysis
  async customModelAnalysis(imageBuffer, taskType) {
    try {
      const modelMap = {
        'recycling': this.recyclingModel,
        'tree_planting': this.treeModel,
        'cleanup': this.cleanupModel
      };

      const model = modelMap[taskType];
      if (!model) {
        return { source: 'custom_model', confidence: 0, available: false };
      }

      // Preprocess image for model
      const processedImage = await this.preprocessImageForModel(imageBuffer, taskType);
      
      // Run prediction
      const predictions = model.predict(processedImage);
      const predictionData = await predictions.data();
      const confidence = Math.max(...predictionData);

      return {
        source: 'custom_model',
        confidence: confidence,
        predictions: predictionData,
        isRelevant: confidence > 0.7,
        modelType: taskType
      };
    } catch (error) {
      console.error('Custom model analysis error:', error);
      return { source: 'custom_model', confidence: 0, error: error.message };
    }
  }

  // Contextual Analysis (GPS, time, weather, etc.)
  async contextualAnalysis(imageBuffer, taskType, additionalData) {
    try {
      const contextualFactors = {};

      // GPS location analysis
      if (additionalData.location) {
        contextualFactors.location = await this.analyzeLocation(
          additionalData.location, 
          taskType
        );
      }

      // Time analysis
      if (additionalData.timestamp) {
        contextualFactors.time = this.analyzeTimestamp(
          additionalData.timestamp, 
          taskType
        );
      }

      // Weather analysis (for outdoor tasks)
      if (additionalData.location && this.isOutdoorTask(taskType)) {
        contextualFactors.weather = await this.analyzeWeather(
          additionalData.location
        );
      }

      // Image metadata analysis
      const metadata = await this.extractImageMetadata(imageBuffer);
      contextualFactors.imageProperties = metadata;

      // Calculate contextual confidence
      const contextualConfidence = this.calculateContextualConfidence(
        contextualFactors, 
        taskType
      );

      return {
        source: 'contextual',
        confidence: contextualConfidence,
        factors: contextualFactors,
        isRelevant: contextualConfidence > 0.5
      };
    } catch (error) {
      console.error('Contextual analysis error:', error);
      return { source: 'contextual', confidence: 0, error: error.message };
    }
  }

  // Metadata Analysis (EXIF, file properties, etc.)
  async metadataAnalysis(imageBase64, additionalData) {
    try {
      const imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      
      // Extract EXIF data
      const metadata = await sharp(imageBuffer).metadata();
      
      const analysis = {
        source: 'metadata',
        confidence: 0.5, // Base confidence for having metadata
        factors: {
          hasExif: !!metadata.exif,
          hasGPS: !!(metadata.exif && this.extractGPSFromExif(metadata.exif)),
          imageSize: { width: metadata.width, height: metadata.height },
          format: metadata.format,
          quality: metadata.quality,
          timestamp: this.extractTimestampFromExif(metadata.exif)
        }
      };

      // Increase confidence based on metadata richness
      if (analysis.factors.hasExif) analysis.confidence += 0.2;
      if (analysis.factors.hasGPS) analysis.confidence += 0.2;
      if (analysis.factors.timestamp) analysis.confidence += 0.1;

      // Check for suspicious patterns (stock photos, manipulated images)
      const suspiciousFactors = await this.detectSuspiciousPatterns(imageBuffer, metadata);
      analysis.suspiciousFactors = suspiciousFactors;
      
      if (suspiciousFactors.length > 0) {
        analysis.confidence *= 0.5; // Reduce confidence if suspicious
      }

      return analysis;
    } catch (error) {
      console.error('Metadata analysis error:', error);
      return { source: 'metadata', confidence: 0, error: error.message };
    }
  }

  // Combine all verification results
  combineVerificationResults(results, taskType) {
    const [googleResult, customResult, contextualResult, metadataResult] = results;

    // Weighted scoring system
    const weights = {
      google_vision: 0.4,
      custom_model: customResult.available ? 0.35 : 0,
      contextual: 0.15,
      metadata: 0.1
    };

    // Adjust weights if custom model isn't available
    if (!customResult.available) {
      weights.google_vision = 0.6;
      weights.contextual = 0.25;
      weights.metadata = 0.15;
    }

    // Calculate weighted confidence
    let totalConfidence = 0;
    let totalWeight = 0;

    if (googleResult.confidence > 0) {
      totalConfidence += googleResult.confidence * weights.google_vision;
      totalWeight += weights.google_vision;
    }

    if (customResult.confidence > 0) {
      totalConfidence += customResult.confidence * weights.custom_model;
      totalWeight += weights.custom_model;
    }

    if (contextualResult.confidence > 0) {
      totalConfidence += contextualResult.confidence * weights.contextual;
      totalWeight += weights.contextual;
    }

    if (metadataResult.confidence > 0) {
      totalConfidence += metadataResult.confidence * weights.metadata;
      totalWeight += weights.metadata;
    }

    const finalConfidence = totalWeight > 0 ? totalConfidence / totalWeight : 0;

    // Apply task-specific thresholds
    const thresholds = {
      'recycling': 0.7,
      'tree_planting': 0.75,
      'cleanup': 0.65,
      'biking': 0.6,
      'walking': 0.5,
      'composting': 0.7,
      'energy_saving': 0.5,
      'water_conservation': 0.6
    };

    const threshold = thresholds[taskType] || 0.65;
    const isValid = finalConfidence >= threshold;

    // Create detailed explanation
    const explanation = this.generateExplanation(results, finalConfidence, isValid, taskType);

    return {
      isValid,
      confidence: finalConfidence,
      threshold,
      explanation,
      details: {
        googleVision: googleResult,
        customModel: customResult,
        contextual: contextualResult,
        metadata: metadataResult
      },
      recommendations: isValid ? [] : this.generateImprovementRecommendations(results, taskType),
      timestamp: new Date().toISOString()
    };
  }

  // Helper methods
  getTaskKeywords(taskType) {
    const keywords = {
      'recycling': ['plastic', 'bottle', 'container', 'recycle', 'bin', 'waste', 'garbage', 'trash'],
      'tree_planting': ['tree', 'plant', 'sapling', 'soil', 'shovel', 'gardening', 'forest', 'nature'],
      'cleanup': ['trash', 'litter', 'cleaning', 'garbage', 'waste', 'bag', 'gloves', 'park'],
      'biking': ['bicycle', 'bike', 'cycling', 'helmet', 'wheel', 'pedal', 'road', 'path'],
      'walking': ['walking', 'path', 'trail', 'steps', 'footpath', 'pedestrian', 'sidewalk'],
      'composting': ['compost', 'organic', 'food waste', 'bin', 'decompose', 'soil', 'garden'],
      'energy_saving': ['led', 'solar', 'energy', 'electricity', 'panel', 'efficient', 'power'],
      'water_conservation': ['water', 'conservation', 'saving', 'faucet', 'shower', 'rain', 'harvest']
    };

    return keywords[taskType] || [];
  }

  async optimizeImage(imageBuffer) {
    return sharp(imageBuffer)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
  }

  async preprocessImageForModel(imageBuffer, taskType) {
    // Convert to tensor format expected by the model
    const image = await sharp(imageBuffer)
      .resize(224, 224) // Standard input size for many models
      .raw()
      .toBuffer();

    const tensor = tf.tensor3d(new Uint8Array(image), [224, 224, 3])
      .div(255.0) // Normalize to [0,1]
      .expandDims(0); // Add batch dimension

    return tensor;
  }

  async analyzeLocation(location, taskType) {
    // Check if location is appropriate for the task
    const { lat, lng } = location;
    
    try {
      // Use reverse geocoding to get location details
      const response = await axios.get(`https://api.opencagedata.com/geocode/v1/json`, {
        params: {
          q: `${lat},${lng}`,
          key: process.env.OPENCAGE_API_KEY
        }
      });

      const locationData = response.data.results[0];
      if (!locationData) return { confidence: 0 };

      const components = locationData.components;
      const locationTypes = Object.keys(components);

      // Task-specific location scoring
      const locationScores = {
        'tree_planting': ['park', 'forest', 'garden', 'nature_reserve'],
        'cleanup': ['park', 'beach', 'street', 'public_space'],
        'biking': ['road', 'path', 'trail', 'bike_path'],
        'walking': ['path', 'trail', 'sidewalk', 'park']
      };

      const relevantTypes = locationScores[taskType] || [];
      const matches = relevantTypes.filter(type => 
        locationTypes.some(lt => lt.includes(type))
      );

      const confidence = matches.length > 0 ? 0.8 : 0.3;

      return {
        confidence,
        address: locationData.formatted,
        components: components,
        relevantForTask: matches.length > 0,
        matches
      };
    } catch (error) {
      console.error('Location analysis error:', error);
      return { confidence: 0.3, error: error.message };
    }
  }

  analyzeTimestamp(timestamp, taskType) {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    // Time-based scoring for different tasks
    const timeScores = {
      'tree_planting': hour >= 6 && hour <= 18 ? 0.8 : 0.4, // Daylight hours
      'cleanup': hour >= 7 && hour <= 19 ? 0.8 : 0.3, // Active hours
      'biking': hour >= 6 && hour <= 20 ? 0.8 : 0.5, // Safe cycling hours
      'walking': hour >= 6 && hour <= 21 ? 0.8 : 0.4 // Safe walking hours
    };

    const confidence = timeScores[taskType] || 0.5;

    return {
      confidence,
      hour,
      dayOfWeek,
      isAppropriateTime: confidence > 0.6
    };
  }

  async analyzeWeather(location) {
    try {
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
        params: {
          lat: location.lat,
          lon: location.lng,
          appid: process.env.OPENWEATHER_API_KEY,
          units: 'metric'
        }
      });

      const weather = response.data;
      const conditions = weather.weather[0].main.toLowerCase();

      // Weather appropriateness for outdoor tasks
      const goodConditions = ['clear', 'clouds', 'mist'];
      const confidence = goodConditions.includes(conditions) ? 0.8 : 0.3;

      return {
        confidence,
        conditions,
        temperature: weather.main.temp,
        description: weather.weather[0].description,
        isGoodWeather: confidence > 0.6
      };
    } catch (error) {
      console.error('Weather analysis error:', error);
      return { confidence: 0.5, error: error.message };
    }
  }

  async extractImageMetadata(imageBuffer) {
    const metadata = await sharp(imageBuffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      hasProfile: !!metadata.icc,
      orientation: metadata.orientation
    };
  }

  async detectSuspiciousPatterns(imageBuffer, metadata) {
    const suspicious = [];

    // Check for common stock photo patterns
    if (metadata.width && metadata.height) {
      const aspectRatio = metadata.width / metadata.height;
      const commonStockRatios = [16/9, 4/3, 3/2, 1/1];
      
      if (commonStockRatios.some(ratio => Math.abs(aspectRatio - ratio) < 0.01)) {
        suspicious.push('common_stock_photo_ratio');
      }
    }

    // Check for extremely high quality (possible professional photos)
    if (metadata.density && metadata.density > 300) {
      suspicious.push('very_high_resolution');
    }

    // Check file size vs dimensions (compressed vs uncompressed)
    const expectedSize = metadata.width * metadata.height * 3 * 0.1; // Rough estimate
    if (metadata.size && metadata.size < expectedSize * 0.05) {
      suspicious.push('extremely_compressed');
    }

    return suspicious;
  }

  calculateContextualConfidence(factors, taskType) {
    let confidence = 0.5; // Base confidence

    if (factors.location && factors.location.relevantForTask) {
      confidence += 0.2;
    }

    if (factors.time && factors.time.isAppropriateTime) {
      confidence += 0.1;
    }

    if (factors.weather && factors.weather.isGoodWeather) {
      confidence += 0.1;
    }

    if (factors.imageProperties) {
      confidence += 0.1; // Having metadata is good
    }

    return Math.min(confidence, 1.0);
  }

  isOutdoorTask(taskType) {
    return ['tree_planting', 'cleanup', 'biking', 'walking'].includes(taskType);
  }

  generateExplanation(results, confidence, isValid, taskType) {
    const [googleResult, customResult, contextualResult, metadataResult] = results;
    
    let explanation = `Task verification for ${taskType}: `;
    
    if (isValid) {
      explanation += `✅ VERIFIED (${(confidence * 100).toFixed(1)}% confidence). `;
    } else {
      explanation += `❌ NOT VERIFIED (${(confidence * 100).toFixed(1)}% confidence). `;
    }

    if (googleResult.relevantItems && googleResult.relevantItems.length > 0) {
      explanation += `Google Vision detected: ${googleResult.relevantItems.map(i => i.description || i.name).join(', ')}. `;
    }

    if (customResult.available && customResult.confidence > 0.5) {
      explanation += `Custom AI model confidence: ${(customResult.confidence * 100).toFixed(1)}%. `;
    }

    if (contextualResult.factors && contextualResult.factors.location && contextualResult.factors.location.relevantForTask) {
      explanation += `Location appears appropriate for this task. `;
    }

    return explanation;
  }

  generateImprovementRecommendations(results, taskType) {
    const recommendations = [];
    const [googleResult, customResult, contextualResult, metadataResult] = results;

    if (!googleResult.isRelevant) {
      recommendations.push(`Include more obvious ${taskType}-related objects in the photo`);
    }

    if (contextualResult.factors && contextualResult.factors.location && !contextualResult.factors.location.relevantForTask) {
      recommendations.push('Take the photo at a more appropriate location for this activity');
    }

    if (metadataResult.suspiciousFactors && metadataResult.suspiciousFactors.length > 0) {
      recommendations.push('Use original photos taken by yourself rather than downloaded images');
    }

    if (contextualResult.factors && contextualResult.factors.time && !contextualResult.factors.time.isAppropriateTime) {
      recommendations.push('Take the photo during more typical hours for this activity');
    }

    return recommendations;
  }

  async storeVerificationData(taskType, imageBuffer, verificationResult) {
    try {
      // Store for model improvement and analysis
      const filename = `verification_data/${taskType}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
      const file = this.bucket.file(filename);

      await file.save(imageBuffer, {
        metadata: {
          contentType: 'image/jpeg',
          metadata: {
            taskType,
            confidence: verificationResult.confidence,
            isValid: verificationResult.isValid,
            timestamp: new Date().toISOString()
          }
        }
      });

      console.log(`📊 Verification data stored: ${filename}`);
    } catch (error) {
      console.error('Failed to store verification data:', error);
    }
  }

  extractGPSFromExif(exifBuffer) {
    // Parse GPS data from EXIF (simplified implementation)
    try {
      // This would use a proper EXIF parsing library in production
      return null; // Placeholder
    } catch (error) {
      return null;
    }
  }

  extractTimestampFromExif(exifBuffer) {
    // Parse timestamp from EXIF (simplified implementation)
    try {
      // This would use a proper EXIF parsing library in production
      return null; // Placeholder
    } catch (error) {
      return null;
    }
  }
}

module.exports = AIVerificationSystem;