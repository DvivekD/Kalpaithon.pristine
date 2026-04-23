<div align="center">

<img src="https://img.icons8.com/fluency/96/plant-under-sun.png" alt="Fasal Logo" width="96"/>

# 🌾 FASAL — AI Farm Decision Engine

### *From seed to sale. Every decision, scored.*

[![Built at Kalpaithon](https://img.shields.io/badge/Built%20at-Kalpaithon%20'26-1D9E75?style=for-the-badge&logo=hackthebox&logoColor=white)](https://github.com/DvivekD/Kalpaithon.pristine)
[![Status](https://img.shields.io/badge/Status-Live%20MVP-22C55E?style=for-the-badge&logo=vercel&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#license)

<br/>

**One location permission. Three stages. A complete season companion for Karnataka farmers.**

[🚀 Live Demo](#quick-start) · [📖 Documentation](#architecture) · [🤖 Telegram Bot](https://t.me/Kisaan1207bot) · [📋 API Reference](#api-endpoints)

---

<img width="900" alt="Fasal Dashboard" src="https://img.shields.io/badge/STAGE_1:_PLAN-Rank_12_crops_by_AI_success_%25-1D9E75?style=flat-square&logo=seedling"/> <img alt="STAGE 2" src="https://img.shields.io/badge/STAGE_2:_GROW-Week_by_week_AI_timeline-EF9F27?style=flat-square&logo=pagespeedinsights"/> <img alt="STAGE 3" src="https://img.shields.io/badge/STAGE_3:_SELL-Smart_sell_window_scoring-E8593C?style=flat-square&logo=cashapp"/>

</div>

---

## 📌 The Problem

> **₹90,000 Crore** lost annually in post-harvest waste. **86%** of Indian farmers are small/marginal with no access to data-driven decisions. **40%** revenue lost from wrong sell timing alone.

Karnataka's farmers make three critical decisions every season — *what to plant, how to grow it, and when to sell.* Each one is currently based on guesswork. **Fasal fixes all three with AI.**

---

## ✨ What Fasal Does

<table>
<tr>
<td width="33%" align="center">

### 🌱 Stage 1 — **PLAN**

AI ranks **12 viable crops** by agronomic success % using real soil, weather & humidity data. Shows input cost/acre. Flags anything below 65%.

</td>
<td width="33%" align="center">

### 🌿 Stage 2 — **GROW**

Week-by-week AI-generated growing timeline from planting date. Live weather alerts trigger field action nudges. Harvest signal unlocks Stage 3.

</td>
<td width="33%" align="center">

### 💰 Stage 3 — **SELL**

**SELL / WAIT / STORE** score powered by 14-day mandi price trends, weather overlay, shelf life & storage cost. Net profit after all costs.

</td>
</tr>
</table>

<details>
<summary><b>🧠 Memory Layer</b> — Every season stored, powers next season suggestions</summary>
<br/>

After each season, Fasal stores crop performance, costs, revenue, and market data. This history powers:
- **Crop rotation suggestions** with soil health scoring
- **Confidence-rated next-season picks** based on your specific farm's track record
- **Trend analysis** across seasons for smarter long-term planning

</details>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FASAL PLATFORM                           │
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
   │ (PWA)   │      │  Nominatim   │     │  LLaMA 3.3   │
   │         │      │  Unsplash    │     │  70B          │
   │         │      │  Overpass    │     │              │
   └─────────┘      └──────────────┘     └──────────────┘
```

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology | Purpose |
|:---:|:---|:---|
| 🎨 | **React 18** + **Vite** + **Tailwind CSS** | Frontend SPA with responsive UI |
| ⚙️ | **Node.js** + **Express.js** | REST API backend |
| 🗄️ | **Supabase** (PostgreSQL + Auth + RLS) | Database, auth, row-level security |
| 🤖 | **Groq** (LLaMA 3.3 70B Versatile) | AI crop analysis & recommendations |
| 🌦️ | **Open-Meteo API** | Real-time weather + 30-day history |
| 📍 | **Nominatim** + **Overpass** | Geocoding + local buyer finder |
| 📸 | **Unsplash API** | Dynamic crop photography |
| 💬 | **python-telegram-bot** | Multilingual Telegram interface |
| 📊 | **Recharts** | Data visualizations & charts |
| 🗺️ | **React Leaflet** | Interactive buyer maps |

</div>

---

## 🚀 Quick Start

### Prerequisites

```
Node.js ≥ 18  •  npm ≥ 9  •  Python 3.9+ (for Telegram bot)
```

### 1️⃣ Clone & Install

```bash
git clone https://github.com/DvivekD/Kalpaithon.pristine.git
cd Kalpaithon.pristine

# Backend
cd fasal/backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2️⃣ Environment Variables

**`fasal/backend/.env`**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
GROQ_API_KEY=your_groq_key
UNSPLASH_ACCESS_KEY=your_unsplash_key
PORT=3001
```

**`fasal/frontend/.env`**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:3001/api
```

### 3️⃣ Setup Database

```sql
-- Run fasal/backend/schema.sql in Supabase SQL Editor
-- Creates 5 tables with Row Level Security policies
```

### 4️⃣ Seed & Run

```bash
# Seed demo data
cd fasal/backend && node seed.js
# → Login: demo@fasal.app / demo1234

# Start backend
node index.js          # → http://localhost:3001

# Start frontend (new terminal)
cd fasal/frontend
npm run dev            # → http://localhost:5174
```

---

## 📡 API Endpoints

<details>
<summary><b>🔐 Auth</b></summary>

| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/api/auth/register` | Create account + Farmer ID |
| `POST` | `/api/auth/login` | Email/Farmer ID login |

</details>

<details>
<summary><b>👤 Profile</b></summary>

| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/api/profile/setup` | Onboarding (location → soil → water) |
| `GET` | `/api/profile` | Get farmer profile |

</details>

<details>
<summary><b>🌱 Predict (Stage 1)</b></summary>

| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/api/predict` | AI crop analysis (12 crops ranked) |
| `GET` | `/api/predict/latest` | Last prediction (cached) |
| `PATCH` | `/api/predict/:id/select` | Select crop + planting date |
| `GET` | `/api/predict/next-season` | AI rotation suggestion |

</details>

<details>
<summary><b>🌿 Timeline (Stage 2)</b></summary>

| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/api/timeline` | Generate week-by-week plan |
| `GET` | `/api/timeline/active` | Current growing timeline |
| `PATCH` | `/api/timeline/advance` | Progress to next week |

</details>

<details>
<summary><b>💰 Sell (Stage 3)</b></summary>

| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/api/sell` | Sell window analysis |
| `GET` | `/api/buyers` | Find buyers within 50km |

</details>

---

## 🤖 Telegram Bot — @Kisaan1207bot

<div align="center">

[![Telegram Bot](https://img.shields.io/badge/Telegram-@Kisaan1207bot-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/Kisaan1207bot)

**Multilingual** · English 🇬🇧 · ಕನ್ನಡ 🇮🇳 · हिन्दी 🇮🇳

</div>

| Command | Description |
|:---|:---|
| `/start` | Language selection + location setup |
| `/weather` | Current weather for your location |
| `/crop` | AI crop recommendation |
| `/market` | Latest mandi prices |
| `/help` | All available commands |

---

## 📊 Database Schema

```sql
farmer_profiles     -- User data, location, soil, water source
crop_predictions    -- AI crop rankings per season (JSONB)
grow_timelines      -- Week-by-week growing tasks + alerts
sell_decisions       -- Sell scores, mandi data, net profit
season_history      -- Historical performance for AI learning
```

> All tables use **Row Level Security** — users can only access their own data.

---

## 📁 Project Structure

```
fasal/
├── backend/
│   ├── index.js              # Express server entry
│   ├── routes/
│   │   ├── predict.js        # Stage 1 — Crop AI engine
│   │   ├── timeline.js       # Stage 2 — Growing timeline
│   │   ├── sell.js           # Stage 3 — Sell scoring
│   │   ├── profile.js        # Farmer profile + onboarding
│   │   └── history.js        # Season history
│   ├── lib/
│   │   ├── groq.js           # LLaMA 3.3 70B integration
│   │   ├── weather.js        # Open-Meteo helper
│   │   ├── unsplash.js       # Parallel photo fetching
│   │   ├── agmarknet.js      # Mandi price analytics
│   │   ├── overpass.js       # Buyer spatial queries
│   │   ├── nominatim.js      # Geocoding
│   │   └── supabase.js       # DB client
│   ├── data/                 # Static fallback JSON files
│   ├── schema.sql            # Full PostgreSQL schema + RLS
│   └── seed.js               # Demo data seeder
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx   # Hero + stats + 3 stages
│   │   │   ├── Register.jsx  # Sign up + Farmer ID
│   │   │   ├── Login.jsx     # Auth page
│   │   │   ├── Onboarding.jsx# 3-step wizard
│   │   │   ├── Dashboard.jsx # Layout + sidebar + weather
│   │   │   ├── Plan.jsx      # Stage 1 — Crop cards + rings
│   │   │   ├── Grow.jsx      # Stage 2 — Timeline + alerts
│   │   │   ├── Sell.jsx      # Stage 3 — Score + charts
│   │   │   ├── History.jsx   # Past seasons
│   │   │   └── Profile.jsx   # Farmer ID card + settings
│   │   ├── lib/api.js        # Axios instance
│   │   ├── App.jsx           # Router setup
│   │   └── index.css         # Design system + animations
│   └── vite.config.js
└── My_Agri_Telegram_bot-main/
    ├── app.py                # Telegram bot (Python)
    └── .env                  # Bot tokens
```

---

## 🎨 Design System

| Token | Value | Usage |
|:---|:---|:---|
| `--green-primary` | `#1D9E75` | Primary actions, success |
| `--green-dark` | `#0F6E56` | Hover states |
| `--charcoal` | `#1E2D2F` | Text primary |
| `--amber` | `#EF9F27` | Warnings, medium scores |
| `--coral` | `#E8593C` | Danger, low scores |
| Font | **Inter** | All typography |
| Corners | `12px` | Cards and containers |

---

## 👥 Team

<div align="center">

| | Name | Role |
|:---:|:---|:---|
| 👨‍💻 | **Vivek D** | Full-stack + AI Integration |
| 👨‍💻 | **Team Member** | Backend + Telegram Bot |

</div>

---

## 🏆 Built at Kalpaithon 2026

> 24-hour hackathon. 2 people. One mission: **make Indian farming data-driven.**

<div align="center">

[![Hackathon](https://img.shields.io/badge/Hackathon-Kalpaithon_2026-1D9E75?style=for-the-badge&logo=hackthebox&logoColor=white)](#)
[![Track](https://img.shields.io/badge/Track-AgriTech_/_AI-EF9F27?style=for-the-badge&logo=openai&logoColor=white)](#)
[![Duration](https://img.shields.io/badge/Built_in-24_Hours-E8593C?style=for-the-badge&logo=clockify&logoColor=white)](#)

</div>

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with 🌾 for Karnataka's farmers**

*From seed to sale. Every decision, scored.*

<br/>

[![Star this repo](https://img.shields.io/github/stars/DvivekD/Kalpaithon.pristine?style=social)](https://github.com/DvivekD/Kalpaithon.pristine)

</div>
