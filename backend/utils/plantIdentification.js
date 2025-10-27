const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Plant identification service using PlantNet API
class PlantIdentificationService {
  constructor() {
    // PlantNet API - free plant identification service
    this.apiKey = '2b10sxfpKk3NSzbKSl67m96cTe';
    this.baseUrl = 'https://my-api.plantnet.org/v2/identify/all';
  }

  async identifyPlant(imagePath) {
    try {
      console.log('Attempting plant identification for:', imagePath);
      
      // Check if file is WebP - PlantNet doesn't support WebP
      const ext = path.extname(imagePath).toLowerCase();
      if (ext === '.webp') {
        console.log('WebP format detected - PlantNet API does not support WebP. Skipping identification.');
        return {
          success: false,
          error: 'WebP format not supported by PlantNet API. Please use JPG or PNG.'
        };
      }
      
      // Create form data with correct PlantNet v2 API parameters
      const form = new FormData();
      form.append('organs', 'auto'); // auto-detect plant organ type
      form.append('images', fs.createReadStream(imagePath));

      const apiUrl = `${this.baseUrl}?api-key=${this.apiKey}`;
      console.log('PlantNet API URL:', apiUrl);

      const response = await axios.post(apiUrl, form, {
        headers: form.getHeaders(),
        timeout: 15000, // 15 second timeout
      });

      console.log('PlantNet API response status:', response.status);

      if (response.data.results && response.data.results.length > 0) {
        const topResult = response.data.results[0];
        const plantData = {
          success: true,
          data: {
            commonName: topResult.species.commonNames?.[0] || topResult.species.scientificNameWithoutAuthor,
            scientificName: topResult.species.scientificNameWithoutAuthor,
            confidence: Math.round(topResult.score * 100),
            family: topResult.species.family?.scientificNameWithoutAuthor,
            genus: topResult.species.genus?.scientificNameWithoutAuthor,
            alternativeNames: topResult.species.commonNames || []
          }
        };
        console.log('Plant identified successfully:', plantData.data.commonName);
        return plantData;
      } else {
        console.log('No plant identified');
        return {
          success: false,
          error: 'No plant could be identified from the image'
        };
      }
    } catch (error) {
      console.error('PlantNet API error:', error.message);
      console.error('Error details:', error.response?.status, error.response?.statusText);
      
      return {
        success: false,
        error: 'Plant identification service is currently unavailable'
      };
    }
  }
}
//Plantcare API
module.exports = new PlantIdentificationService();
