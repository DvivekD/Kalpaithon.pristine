<div align="center">

<img src="https://img.icons8.com/fluency/96/plant-under-sun.png" alt="Fasal Logo" width="80"/>

# 🌾 FASAL

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

## 📌 The Problem

> **₹90,000 Crore** lost annually in post-harvest waste. **86%** of Indian farmers are small/marginal with no access to data-driven decisions. **40%** revenue lost from wrong sell timing alone.

Karnataka's farmers make three critical decisions every season — *what to plant, how to grow it, and when to sell.* Each one is currently based on guesswork. **Fasal fixes all three with AI.**

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
│   React Router   │  Groq LLM        │  EN / KN / HI        │
└───────┬──────────┴────────┬─────────┴──────────┬────────────┘
        │                   │                    │
        ▼                   ▼                    ▼
   ┌─────────┐      ┌──────────────┐     ┌──────────────┐
   │ Browser │      │  Open-Meteo  │     │  Groq AI     │
   │         │      │  Nominatim   │     │  LLaMA 3.3   │
   │         │      │  Unsplash    │     │  70B          │
   │         │      │  Overpass    │     │              │
   └─────────┘      └──────────────┘     └──────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|:---:|:---|:---|
| 🎨 | **React 18** · Vite · Tailwind CSS | Frontend SPA with responsive UI |
| ⚙️ | **Node.js** · Express.js | REST API backend |
| 🗄️ | **Supabase** (PostgreSQL + Auth + RLS) | Database, authentication, row-level security |
| 🤖 | **Groq** — LLaMA 3.3 70B Versatile | AI crop analysis & recommendations |
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
GROQ_API_KEY=your_groq_key
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
