# ScalerCart: High-Performance Amazon Clone

E-commerce application built to demonstrate high-availability patterns, advanced search engineering, and modular full-stack architecture. ScalerCart replicates the Amazon user experience while implementing a sophisticated semantic recommendation engine and a hybrid search pipeline handling over 33,000 products.

---

[![Watch the ScalerCart Project Video](https://img.youtube.com/vi/QTc1Nc-77Iw/hqdefault.jpg)](https://youtu.be/QTc1Nc-77Iw)

---
## 🌐 Live Deployment

- **Frontend (Vercel):** https://e-commerce-omega-nine-43.vercel.app
- **Backend API (Render):** https://e-commerce-y277.onrender.com
- **API Health Check:** https://e-commerce-y277.onrender.com/api/v1/health
- **OpenAPI Docs:** https://e-commerce-y277.onrender.com/docs


---

## 🧩 Production Topology

ScalerCart is deployed as a cloud-native split stack:

- **Vercel** serves the React SPA with client-side routing.
- **Render** hosts the FastAPI backend and applies migrations at startup.
- **Neon PostgreSQL** powers persistent transactional data in production.
- **Artifact-driven Search Layer** (lexical + semantic files) enables fast ranking and recommendations.

This architecture mirrors real-world product deployment patterns and cleanly separates presentation, business logic, and data layers.

---

## 🏗️ System Architecture

ScalerCart is built using a modern decoupled architecture:

- **Frontend**: React.js (Vite) with a modular component architecture, implementing localized state management and high-fidelity Amazon UI patterns.
- **Backend**: FastAPI (Python 3.10+) leveraging asynchronous request handling and a non-blocking service startup lifecycle.
- **Search Engine**: A hybrid pipeline combining **RapidFuzz** (Lexical/Fuzzy match) and **FAISS** (Semantic Vector match).
- **Database**: SQL-standard relational schema (SQLite for local portability, PostgreSQL/Neon in cloud) featuring 10+ relational tables including inventory tracking and precomputed recommendation mappings.

---

## ✅ Capability Matrix

- **Catalog Experience**: Category navigation, search, sorting, filtering, and detail pages.
- **Commerce Flow**: Cart, checkout, payment initiation/verification, order success, and order history.
- **Post-Order Operations**: Order cancel, return/replace request workflows, and status progression.
- **Customer Account**: Address management, wishlist operations, notifications center, profile updates.
- **Recommendation Intelligence**: Personalized/fallback recommendations + similar-products feed.
- **Operational UX**: Backend connection status/wake trigger from UI, resilient loading, and cloud-friendly behavior.

---

## 🧠 Engineering Highlights

### 1. Hybrid Search & Semantic Vector Engine

Unlike basic search implementations that rely on simple `ILIKE` queries, ScalerCart utilizes a dual-engine approach:

- **Lexical Layer**: Uses `Rapidfuzz` to handle typos and category-level intent matching (e.g., matching "Electrnic" to "Electronics").
- **Semantic Layer**: Leverages a **FAISS (Facebook AI Similarity Search)** index. Product descriptions are embedded into 384-dimensional vectors using the `all-MiniLM-L6-v2` transformer model, allowing for "meaning-based" search results.

### 2. Scalable Recommendation Pipeline

To handle context-aware recommendations for **33,000+ products** without runtime performance hits:

- **Precomputed State**: Similarities are pre-calculated using vector spatial joins and stored in a indexed SQL table (`product_recommendations`).
- **Optimization**: The generation script uses batch-processed FAISS reconstruction and SQLAlchemy bulk-insert mappings, ensuring even large datasets are processed in under 60 seconds.

### 3. Production-Ready Lifecycle Management

- **Non-Blocking Startup**: Heavy ML artifacts (Transformers/Index) are loaded into memory using a dedicated thread executor during the FastAPI `lifespan` event, ensuring the API remains responsive immediately upon boot.
- **Transactional Integrity**: Checkout flows utilize DB transactions to ensure atomic inventory decrements and order placements, preventing "ghost stock" issues.

### 4. Resilience in Deployed Environments

- **Frontend State Recovery**: Cart state is persisted and rehydrated for smoother multi-page cloud usage.
- **Route Stability**: SPA rewrite support avoids deep-link 404s on hosted frontend routes.
- **Graceful Degradation**: UI uses partial-failure tolerant loading patterns for key multi-endpoint pages.

---

## 🛠️ Technology Stack

| Layer                | Technology                             |
| -------------------- | -------------------------------------- |
| **Frontend**         | React, Vite, Lucide Icons, Axios       |
| **Backend**          | FastAPI, Pydantic, SQLAlchemy, Uvicorn |
| **Machine Learning** | FAISS, Sentence-Transformers, NumPy    |
| **Database**         | Postgres, SQLite3                      |
| **DevOps**           | Git, Docker                            |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Docker

### Local Development Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/Ayush-D2004/E-Commerce.git
   cd E-Commerce
   ```

2. **Backend Setup**:

   ```bash
   cd backend
   python -m venv venv
   venv/Scripts/activate
   pip install -r requirements.txt
   python scripts/ingest_data.py
   python scripts/generate_recommendations.py
   python app/main.py
   ```

3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🔎 API Quick Verification

After backend startup, use these quick checks:

```bash
curl https://e-commerce-y277.onrender.com/api/v1/health
curl "https://e-commerce-y277.onrender.com/api/v1/products?page=1&page_size=5"
curl https://e-commerce-y277.onrender.com/api/v1/recommendations/personalized
```

Expected:

- `/health` returns `{"status":"ok"}`
- `/products` returns paginated items with pricing/rating/image fields
- `/recommendations/personalized` returns personalized or fallback trending items

---

## 📊 Database Schema Design

The relational schema was designed for high modularity:

- **Catalog**: `Product`, `Category`, `ProductImage`, `ProductSpec`
- **User Activity**: `Cart`, `Wishlist`, `User`
- **Sales Flow**: `Order`, `OrderItem`, `Payment`, `Inventory`
- **Intelligence**: `ProductRecommendation` (Foreign key join table for semantic similarity)

---

## 📝 Assumptions & Notes

- **Authentication**: To focus on e-commerce flow, the system assumes a "Default User" (ID: 1) is constantly logged in.
- **Inventory**: Stock is automatically replenished during the ingestion phase for testing purposes.
- **Data Source**: Dataset sourced from 33,000+ real-world retail listings for authenticity in search/recommendations.

---

## 🛣️ Roadmap

- Real authentication and per-user server-side cart ownership
- Payments hardening with webhooks and retries
- Media optimization/CDN strategy for product images
- Seller/admin panel for catalog and inventory operations
- Observability stack (structured logs, metrics, tracing)
