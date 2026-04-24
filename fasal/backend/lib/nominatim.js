import axios from 'axios';

export async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
  const res = await axios.get(url, {
    headers: { 'User-Agent': 'Fasal/1.0 (hackathon project)' },
    timeout: 10000
  });
  const addr = res.data.address;
  console.log('Nominatim Raw Address:', JSON.stringify(addr, null, 2));
  
  // In Karnataka, 'county' is usually the District name (e.g. Tumakuru, Kolar)
  // 'state_district' is a backup.
  const district = addr.county || addr.state_district || addr.city_district || addr.city || addr.town || addr.suburb || 'Unknown';
  let cleanedDistrict = district.replace(/ district| taluk| taluka| city| corporation/gi, '').trim();

  // Mapping consistency
  if (cleanedDistrict === 'Tumakuru' || cleanedDistrict === 'Tipaturu') cleanedDistrict = 'Tumkur';
  if (cleanedDistrict === 'Bangalore') cleanedDistrict = 'Bengaluru Urban';
  if (cleanedDistrict === 'Bangalore Rural') cleanedDistrict = 'Bengaluru Rural';
  if (cleanedDistrict === 'Mysore') cleanedDistrict = 'Mysuru';
  if (cleanedDistrict === 'Belgaum') cleanedDistrict = 'Belagavi';
  if (cleanedDistrict === 'Gulbarga') cleanedDistrict = 'Kalaburagi';
  
  return {
    district: cleanedDistrict,
    state: addr.state || 'Karnataka',
    display_name: res.data.display_name
  };
}

export async function forwardGeocode(query) {
  // Restrict to India, and prioritize Karnataka region
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=in&format=json&addressdetails=1&limit=5`;
  const res = await axios.get(url, {
    headers: { 'User-Agent': 'Fasal/1.0 (hackathon project)' },
    timeout: 10000
  });
  
  return res.data.map(item => {
    const addr = item.address || {};
    const district = addr.county || addr.state_district || addr.city || addr.town || 'Unknown';
    return {
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      display_name: item.display_name,
      district,
      state: addr.state || 'Unknown'
    };
  });
}
