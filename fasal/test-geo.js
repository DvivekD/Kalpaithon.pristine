import { reverseGeocode } from './backend/lib/nominatim.js';

async function test() {
  const geo = await reverseGeocode(13.26314758669694, 76.45469078465705);
  console.log(geo);
}

test();
