import axios from 'axios';

const FALLBACK_BUYERS = [
  { name: 'APMC Tipturu Main Market', type: 'AGGREGATOR', distance_km: 4.2, address: 'BH Road, Tipturu', lat: 13.26, lon: 76.48 },
  { name: 'Kisan FPO Processing Hub', type: 'FPO', distance_km: 12.8, address: 'Industrial Area, Tipturu', lat: 13.28, lon: 76.52, phone: '+91 98765 43210' },
  { name: 'The Grand Taj Hotel', type: 'HOTEL', distance_km: 18.5, address: 'Tumkur Road', lat: 13.32, lon: 76.44 },
  { name: 'AgriTrade Hub Bangalore', type: 'AGGREGATOR', distance_km: 45.2, address: 'Yeshwantpur', lat: 13.02, lon: 77.54, phone: '+91 80234 56789' },
  { name: 'Spice Route Diner & Resort', type: 'HOTEL', distance_km: 32.1, address: 'National Highway 48', lat: 13.18, lon: 76.68 },
  { name: 'Reliance Fresh Supermarket', type: 'RETAIL', distance_km: 8.4, address: 'Main Street', lat: 13.24, lon: 76.42 }
];

export async function findBuyers(lat, lon) {
  const query = `[out:json];
(
  node["amenity"~"marketplace|restaurant|hotel|food_court"](around:50000,${lat},${lon});
  node["shop"~"supermarket|greengrocer|market|wholesale"](around:50000,${lat},${lon});
  node["office"="cooperative"](around:50000,${lat},${lon});
  node["industrial"~"factory|agri_processing"](around:50000,${lat},${lon});
  node["name"~"APMC|FPO|Mandi|Market|Processing|Trade",i](around:50000,${lat},${lon});
  node["tourism"="hotel"](around:50000,${lat},${lon});
);
out body;`;

  try {
    const res = await axios.post(
      'https://overpass-api.de/api/interpreter',
      `data=${encodeURIComponent(query)}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
    );

    let elements = res.data.elements || [];
    
    if (elements.length === 0) {
      return FALLBACK_BUYERS.map(b => ({
        ...b,
        distance_km: Math.round(haversine(lat, lon, b.lat, b.lon) * 10) / 10
      })).sort((a, b) => a.distance_km - b.distance_km);
    }

    return elements
      .map(el => {
        const dist = haversine(lat, lon, el.lat, el.lon);
        const tags = el.tags || {};
        
        let mappedType = 'AGGREGATOR';
        const name = (tags.name || '').toLowerCase();
        const shop = (tags.shop || '').toLowerCase();
        const amenity = (tags.amenity || '').toLowerCase();

        if (tags.tourism === 'hotel' || amenity === 'hotel' || amenity === 'restaurant') mappedType = 'HOTEL';
        else if (tags.office === 'cooperative' || name.includes('fpo') || name.includes('coop')) mappedType = 'FPO';
        else if (shop === 'supermarket' || shop === 'market') mappedType = 'RETAIL';
        
        return {
          name: tags.name || 'Agri-Business Center',
          type: mappedType,
          distance_km: Math.round(dist * 10) / 10,
          address: tags['addr:full'] || tags['addr:street'] || tags['addr:city'] || 'Location identified',
          lat: el.lat,
          lon: el.lon,
          phone: tags.phone || tags['contact:phone'] || null
        };
      })
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, 20);
  } catch (e) {
    console.error('Overpass error:', e.message);
    return FALLBACK_BUYERS.map(b => ({
      ...b,
      distance_km: Math.round(haversine(lat, lon, b.lat, b.lon) * 10) / 10
    })).sort((a, b) => a.distance_km - b.distance_km);
  }
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export { haversine };
