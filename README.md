# Yutori Car (ゆとり車両)
### Real-Time Car-Level Crowding & Pareto-Optimal Door Recommendation Engine

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![ODPT API](https://img.shields.io/badge/Data-ODPT%20v4-FF9900)](https://developer.odpt.org/)
[![Groq AI](https://img.shields.io/badge/AI%20Copilot-Groq%20Inference-F05A28)](https://groq.com/)

Yutori Car is an intelligent Tokyo subway boarding optimization platform. It resolves the classic **Tokyo Commuter Dilemma** (the trade-off between transfer walking speed and physical passenger crush) by ingesting live transit telemetry from the **Open Data for Public Transportation (ODPT)** API, projecting station platforms into discrete 1D spatial coordinate graphs, and evaluating the **Pareto-Optimal Boarding Door** in real-time.

---

## 1. Problem Formulation: The Tokyo Commuter Dilemma

Greater Tokyo operates the highest passenger density transit network in the world. However, passenger load along an 8-car or 10-car train is profoundly non-uniform:
- **The Speed Trap**: Cars directly adjacent to platform stairs or transfer corridors (e.g. at Shinjuku, Otemachi, Shibuya) frequently exceed 180%–200% capacity (crush load). Commuters suffer severe discomfort and bottleneck delays while boarding and alighting.
- **The Comfort Penalty**: Boarding an empty end car provides physical comfort, but exiting 150m away from the transfer staircase can add 3 to 6 minutes of platform navigation, causing missed train connections.

**Yutori Car** balances this trade-off quantitatively. Rather than merely showing static timetables, it computes the exact car and door index (e.g., *Car 4, Door 2*) that satisfies the commuter's customizable preference curve between physical space and transfer speed.

---

## 2. Mathematical Optimization Model

Yutori Car models the commuter decision as a **Multi-Objective Combinatorial Optimization** problem over discrete 1D spatial platform coordinates.

### Objective Function
For each candidate door $(c, d)$ where $c \in \{1, \dots, N\}$ (car index) and $d \in \{1, \dots, M\}$ (door index):

$$J(c, d) = w_{\text{speed}} \cdot D_{\text{norm}}(c, d, \text{Egress}) + w_{\text{comfort}} \cdot C_{\text{norm}}(c)$$

Where:
- $w_{\text{speed}}, w_{\text{comfort}} \in [0, 1]$ subject to $w_{\text{speed}} + w_{\text{comfort}} = 1$ (User Preference Slider).
- $D_{\text{norm}}(c, d, \text{Egress})$ is the normalized walking distance from door $(c, d)$ to the destination transfer point (stairs, escalator, elevator).
- $C_{\text{norm}}(c)$ is the normalized crowding factor for car $c$ ingested from ODPT load factor telemetry.

### 1D Platform Coordinate Projection
Platforms are mapped as 1D linear metric spaces $[0, L_{\text{plat}}]$ in meters:
$$X_{\text{door}}(c, d) = (c - 1) \cdot (L_{\text{car}} + L_{\text{gap}}) + \text{DoorOffset}(d)$$
$$D(c, d, \text{Egress}) = |X_{\text{door}}(c, d) - X_{\text{egress}}|$$

### Pareto Frontier Determination
A candidate door $(c_1, d_1)$ dominates $(c_2, d_2)$ if:
$$D(c_1, d_1) \le D(c_2, d_2) \quad \text{and} \quad C(c_1) \le C(c_2)$$
with at least one strict inequality. Only non-dominated solutions are returned to the interactive UI.

---

## 3. System Architecture

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│       ODPT API (v4)             │       │   Curated Platform Graph        │
│  - Real-time train positions    │       │   - 1D Platform egress metrics  │
│  - Line service disruptions     │       │   - Escalator/Stairs offsets    │
│  - Car load factors             │       │   - Accessibility coordinates   │
└────────────────┬────────────────┘       └────────────────┬────────────────┘
                 │                                         │
                 ▼                                         ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                       Next.js App Server Engine                           │
│  • Parallel Ingestion Core: /api/optimize, /api/stations, /api/lines      │
│  • Discrete Pareto Optimization Engine: Fast sub-millisecond solver       │
│  • Edge-cached In-memory Spatial Lookups                                  │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
┌───────────────────────────────────┐    ┌───────────────────────────────────┐
│     AI Transit Copilot (Groq)     │    │     Interactive UI Layer          │
│  - Ultra-low latency (~200ms)     │    │  - Real-time Car Crowding Heatmap │
│  - Grounded tactical rationales   │    │  - Mobile PWA Standalone Support  │
│  - Bilingual JA/EN explanations   │    │  - Pareto Priority Slider         │
│  - Interactive platform Q&A       │    │  - Egress Landmark Picker         │
└───────────────────────────────────┘    └───────────────────────────────────┘
```

---

## 4. Key Engineering Features

- **Live Transit Telemetry**: Integrates official Open Data for Public Transportation (ODPT) feeds covering Tokyo Metro, Toei Subway, and JR East interchanges.
- **Explainable AI Transit Copilot**: Powered by Groq ultra-low-latency inference (`qwen/qwen3.8-27b`), the copilot produces fact-grounded tactical boarding briefings in English and Japanese.
- **Physical Station Landmark Modeling**: Curated 1D coordinate maps for key Tokyo interchange hubs (Otemachi, Tokyo, Shinjuku, Shibuya, Ginza) with fallback architectural projections for all stations.
- **Zero API Key Leakage**: Server-side Next.js route handlers strictly isolate credentials (`.env.local` is never sent to the client bundle or committed to Git).
- **Progressive Web App (PWA)**: Includes manifest configuration for installability on mobile devices with fullscreen standalone UI.

---

## 5. Local Setup & Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/SushilRaj0177/Yutori-Transit.git
   cd Yutori-Transit
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Add your keys:
   ```env
   ODPT_CONSUMER_KEY=your_odpt_consumer_key
   ODPT_CHALLENGE_KEY=your_odpt_challenge_key
   GROQ_API_KEY=your_groq_api_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. Build for production:
   ```bash
   npm run build
   npm run start
   ```

---

## 6. Deployment on Vercel

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Under **Project Settings > Environment Variables**, add:
   - `ODPT_CONSUMER_KEY`
   - `ODPT_CHALLENGE_KEY`
   - `GROQ_API_KEY`
4. Deploy! Vercel will build and serve the application globally with edge caching.

---

## 7. Research & Academic Trajectory

Developed as part of academic preparation for semester exchange research at **Waseda University** (School of Fundamental Science and Engineering) focusing on **Intelligent Spatial Systems, Urban Computational Mobility, and Software Dependability**.
