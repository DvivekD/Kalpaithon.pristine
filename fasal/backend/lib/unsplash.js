import axios from 'axios';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const unsplashIds = require('../data/crop-unsplash-ids.json');

const cache = new Map();

const CROP_SEARCH_TERMS = {
  "Tomato": "tomato farm harvest india",
  "Onion": "onion harvest field india",
  "Ragi": "finger millet ragi farm karnataka",
  "Maize": "maize corn harvest farm india",
  "Groundnut": "groundnut peanut harvest india",
  "Potato": "potato harvest farm india",
  "Cotton": "cotton field harvest india",
  "Sugarcane": "sugarcane field india farm",
  "Banana": "banana plantation india",
  "Turmeric": "turmeric harvest farm india",
  "Jowar": "sorghum jowar field india",
  "Sunflower": "sunflower field farm india",
  "Soybean": "soybean field harvest",
  "Chilli": "red chilli farm india harvest",
  "Cabbage": "cabbage farm harvest india",
  "Paddy": "rice paddy field karnataka",
  "Brinjal": "eggplant brinjal farm india",
  "Okra": "okra bhindi farm india"
};

const CROP_TYPE_COLORS = {
  vegetable: "#4CAF50",
  grain: "#FF9800",
  cash_crop: "#9C27B0",
  spice: "#F44336"
};

export async function getCropPhoto(cropName) {
  if (cache.has(cropName)) return cache.get(cropName);

  const searchTerm = CROP_SEARCH_TERMS[cropName] || unsplashIds[cropName] || `${cropName} farm india`;
  try {
    const res = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query: searchTerm, per_page: 3, orientation: 'landscape', content_filter: 'high' },
      headers: { 'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
      timeout: 8000
    });
    const photo = res.data.results[0];
    if (photo) {
      const data = {
        photo_url: photo.urls.regular,
        photo_thumb: photo.urls.small,
        photo_credit: photo.user.name
      };
      cache.set(cropName, data);
      return data;
    }
    cache.set(cropName, null);
    return null;
  } catch (e) {
    console.error(`Unsplash error for ${cropName}:`, e.message);
    cache.set(cropName, null);
    return null;
  }
}

// Parallel fetch for all crops
export async function getCropPhotosParallel(cropNames) {
  const results = await Promise.all(cropNames.map(name => getCropPhoto(name)));
  const map = {};
  cropNames.forEach((name, i) => { map[name] = results[i]; });
  return map;
}

// Legacy compat
export async function getCropPhotos(cropNames) {
  return getCropPhotosParallel(cropNames);
}
