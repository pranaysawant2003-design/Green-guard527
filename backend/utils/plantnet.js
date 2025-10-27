// backend/utils/plantnet.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const PLANTNET_API_KEY = '2b10sxfpKk3NSzbKSl67m96cTe';

async function identifyPlant(imagePath) {
  const form = new FormData();
  form.append('organs', 'auto'); // or use 'leaf', 'flower', etc., for stricter matching
  form.append('images', fs.createReadStream(imagePath)); // the uploaded image

  const url = `https://my-api.plantnet.org/v2/identify/all?api-key=${PLANTNET_API_KEY}`;

  try {
    const response = await axios.post(url, form, { headers: form.getHeaders() });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message);
  }
}

module.exports = { identifyPlant };
