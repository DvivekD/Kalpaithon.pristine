<div align="center">

<img src="https://img.icons8.com/fluency/96/plant-under-sun.png" alt="Fasal Logo" width="80"/>

# 🌾 Project Title: FASAL
### AI-Powered Farm Decision Engine

*From seed to sale. Every decision, scored.*

<br/>

[![Built at Kalpaithon](https://img.shields.io/badge/Built%20at-Kalpaithon%20'26-1D9E75?style=for-the-badge&logo=hackthebox&logoColor=white)](https://github.com/DvivekD/Kalpaithon.pristine)
[![Status](https://img.shields.io/badge/Status-Live%20MVP-22C55E?style=for-the-badge&logo=vercel&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#license)

<br/>

One location permission. Three stages. A complete season companion for Karnataka farmers.

<br/>

[🚀 Quick Start](#-quick-start) · [📖 Architecture](#-architecture) · [🤖 Telegram Bot](https://t.me/Kisaan1207bot) · [📋 API Docs](#-api-endpoints)

</div>

---

## 📌 Problem Statement
Small-scale farmers in Karnataka lack access to data-driven insights, leading to a **₹90,000 Crore annual loss** in harvest waste and a **40% revenue drop** due to poor crop selection and selling timing.

## 🔍 Detailed Description of the Problem
The Indian agricultural sector, particularly for small and marginal farmers (86% of the workforce), is plagued by three major "guesswork" bottlenecks:
1. **Informed Planting**: Farmers often plant crops based on tradition or local hearsay rather than real-time soil health, weather forecasts, and market demand data.
2. **Growth Management**: Lack of scientific guidance during the growth cycle leads to inefficient water usage and delayed responses to weather anomalies.
3. **Market Timing**: Post-harvest waste and the inability to predict price fluctuations force farmers to sell at suboptimal prices, often immediately after harvest when supply is highest.

## 💡 Proposed Solution
**FASAL** is an AI-powered decision engine that provides a 360-degree seasonal companion for farmers. By integrating **Gemini 2.5 Flash AI** with real-time weather and spatial market data, it offers:
*   **Plan**: Ranking 12+ viable crops by success percentage and input cost.
*   **Grow**: A dynamic, week-by-week scientific growing timeline with weather-aware alerts.
*   **Sell**: A real-time Market Scorer (**SELL / WAIT / STORE**) that calculates net profit based on 14-day trends and proximity to local buyers.

---

## ✨ Three Stages — One Complete Season

| | Stage | What it does |
|:---:|:---|:---|
| 🌱 | **PLAN** — Crop Predictor | AI ranks **12 viable crops** by success %, shows input cost per acre, flags anything below 65% |
| 🌿 | **GROW** — Timeline Engine | Week-by-week AI growing plan from planting date, live weather alerts, harvest signal detection |
| 💰 | **SELL** — Market Scorer | **SELL / WAIT / STORE** decision from 14-day mandi trends, weather overlay, shelf life, net profit |

> 🧠 **Memory Layer** — Every season is stored and powers next-season crop rotation suggestions with confidence scoring.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FASAL PLATFORM                         │
├──────────────────┬──────────────────┬───────────────────────┤
│   React + Vite   │  Express.js API  │  Telegram Bot (Py)   │
│   TailwindCSS    │  Supabase Auth   │  @Kisaan1207bot      │
│   Recharts       │  PostgreSQL+RLS  │  Multilingual        │
│   React Router   │  Gemini 2.5 AI   │  Multilingual        │
└───────┬──────────┴────────┬─────────┴──────────┬────────────┘
        │                   │                    │
        ▼                   ▼                    ▼
   ┌─────────┐      ┌──────────────┐     ┌──────────────┐
   │ Browser │      │  Open-Meteo  │     │  Gemini AI   │
   │         │      │  Nominatim   │     │  2.5 Flash   │
   │         │      │  Unsplash    │     │              │
   │         │      │  Overpass    │     │              │
   └─────────┘      └──────────────┘     └──────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|:---:|:---|:---|
| 🎨 | **React 18** · Vite · Tailwind CSS | Frontend SPA with responsive UI |
| ✨ | **Framer Motion & CSS** | Smooth page transitions & Glassmorphism |
| 🌐 | **Google Translate API** | Global language support (English, Hindi, Kannada) |
| ⚡ | **Canvas API** | 60FPS high-performance reactive particle background |
| ⚙️ | **Node.js** · Express.js | REST API backend |
| 🗄️ | **Supabase** (PostgreSQL + Auth + RLS) | Database, authentication, row-level security |
| 🤖 | **Gemini** — 2.5 Flash | AI crop analysis & recommendations |
| 🌦️ | **Open-Meteo** | Real-time weather + 30-day history |
| 📍 | **Nominatim** · Overpass | Geocoding + local buyer spatial queries |
| 📸 | **Unsplash API** | Dynamic crop photography |
| 💬 | **python-telegram-bot** | Multilingual Telegram interface |
| 📊 | **Recharts** · React Leaflet | Charts & interactive maps |

---

## 🚀 Quick Start

**Prerequisites:** `Node.js ≥ 18` · `npm ≥ 9` · `Python 3.9+` (for Telegram bot)

### 1. Clone & Install

```bash
git clone https://github.com/DvivekD/Kalpaithon.pristine.git
cd Kalpaithon.pristine

# Backend
cd fasal/backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Environment Variables

Create `fasal/backend/.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
GEMINI_API_KEY=your_gemini_key
UNSPLASH_ACCESS_KEY=your_unsplash_key
PORT=3001
```

Create `fasal/frontend/.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:3001/api
```

### 3. Database Setup

Run `fasal/backend/schema.sql` in the [Supabase SQL Editor](https://supabase.com/dashboard). This creates 5 tables with RLS policies.

### 4. Seed & Run

```bash
# Seed demo data
cd fasal/backend && node seed.js
# → demo@fasal.app / demo1234

# Start backend (terminal 1)
node index.js                    # http://localhost:3001

# Start frontend (terminal 2)
cd ../frontend && npm run dev    # http://localhost:5174
```

---

## 📡 API Endpoints

### 🔐 Auth
| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/api/auth/register` | Create account + Farmer ID |
| `POST` | `/api/auth/login` | Email or Farmer ID login |

### 🌱 Predict — Stage 1
| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/api/predict` | AI crop analysis — 12 crops ranked |
| `GET` | `/api/predict/latest` | Last prediction (cached) |
| `PATCH` | `/api/predict/:id/select` | Select crop + set planting date |
| `GET` | `/api/predict/next-season` | AI rotation suggestion |

### 🌿 Timeline — Stage 2
| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/api/timeline` | Generate week-by-week plan |
| `GET` | `/api/timeline/active` | Current growing timeline |
| `PATCH` | `/api/timeline/advance` | Progress to next week |

### 💰 Sell — Stage 3
| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/api/sell` | Sell window analysis |
| `GET` | `/api/buyers` | Find buyers within 50km |

### 👤 Profile & History
| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/api/profile/setup` | Onboarding wizard |
| `GET` | `/api/profile` | Farmer profile |
| `GET` | `/api/history` | Past season data |

---

## 🤖 Telegram Bot

<div align="center">

[![Telegram](https://img.shields.io/badge/Chat_on-Telegram-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/Kisaan1207bot)

**@Kisaan1207bot** — Multilingual: English 🇬🇧 · ಕನ್ನಡ · हिन्दी

</div>

| Command | Description |
|:---|:---|
| `/start` | Language selection + location setup |
| `/weather` | Current weather for your location |
| `/crop` | AI crop recommendation |
| `/market` | Latest mandi prices |
| `/help` | All available commands |

---

## 📁 Project Structure

```
fasal/
├── backend/
│   ├── index.js                # Express server
│   ├── routes/
│   │   ├── predict.js          # 🌱 Stage 1 — Crop AI
│   │   ├── timeline.js         # 🌿 Stage 2 — Growing plan
│   │   ├── sell.js             # 💰 Stage 3 — Sell scoring
│   │   ├── profile.js          # Onboarding + profile
│   │   └── history.js          # Season history
│   ├── lib/                    # Groq, weather, unsplash, etc.
│   ├── data/                   # Static fallback JSONs
│   ├── schema.sql              # PostgreSQL schema + RLS
│   └── seed.js                 # Demo data seeder
├── frontend/
│   ├── src/pages/
│   │   ├── Landing.jsx         # Hero + stats
│   │   ├── Plan.jsx            # Stage 1 — Crop cards
│   │   ├── Grow.jsx            # Stage 2 — Timeline
│   │   ├── Sell.jsx            # Stage 3 — Score + charts
│   │   ├── Dashboard.jsx       # Layout + sidebar
│   │   └── ...                 # Login, Register, Onboarding, etc.
│   ├── lib/                    # API client, Supabase
│   └── index.css               # Design system + animations
└── My_Agri_Telegram_bot-main/
    └── app.py                  # Telegram bot (Python)
```

---

## 📊 Database Schema

```sql
farmer_profiles     →  User data, GPS, soil type, water source
crop_predictions    →  AI crop rankings per season (JSONB)
grow_timelines      →  Week-by-week tasks + weather alerts
sell_decisions      →  Sell scores, mandi data, net profit
season_history      →  Historical data powering AI memory
```

> 🔒 All tables use **Row Level Security** — each user can only access their own data.

---

## 🎨 Design Tokens

| Token | Value | Usage |
|:---|:---|:---|
| Primary | `#1D9E75` | Actions, success states |
| Charcoal | `#1E2D2F` | Text primary |
| Amber | `#EF9F27` | Warnings, medium scores |
| Coral | `#E8593C` | Danger, low scores |
| Font | **Inter** | All typography |

---

## 👥 Team

| Name | USN |
|:---|:---|
| **Sai Vivek K N** | 1KI25CS102 |
| **Sohan TS** | 1KI25CS114 |
| **Vishnu TN** | 1KI25CS135 |

---

<div align="center">

### 🏆 Built at Kalpaithon 2026

*24 hours · 3 people · One mission: make Indian farming data-driven.*

<br/>

[![Hackathon](https://img.shields.io/badge/Kalpaithon-2026-1D9E75?style=flat-square)](https://github.com/DvivekD/Kalpaithon.pristine)
[![Track](https://img.shields.io/badge/Track-AgriTech%20%2F%20AI-EF9F27?style=flat-square)](#)
[![Duration](https://img.shields.io/badge/Built%20in-24%20Hours-E8593C?style=flat-square)](#)

<br/>

**Made with 🌾 for Karnataka's farmers**

[![GitHub stars](https://img.shields.io/github/stars/DvivekD/Kalpaithon.pristine?style=social)](https://github.com/DvivekD/Kalpaithon.pristine)

</div>
