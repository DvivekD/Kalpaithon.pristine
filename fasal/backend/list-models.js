import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function test() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
  try {
    const res = await axios.get(url);
    console.log("Models:", res.data.models.map(m => m.name));
  } catch (e) {
    console.log("Status:", e.response?.status);
    console.log("Data:", JSON.stringify(e.response?.data, null, 2));
  }
}

test();
