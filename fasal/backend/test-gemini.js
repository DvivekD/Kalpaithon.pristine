import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function test() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
  try {
    const res = await axios.post(url, {
      contents: [{ parts: [{ text: "hi" }] }]
    });
    console.log("Success!");
  } catch (e) {
    console.log("Status:", e.response?.status);
    console.log("Data:", JSON.stringify(e.response?.data, null, 2));
  }
}

test();
