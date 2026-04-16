# ScalerCart: High-Performance Amazon Clone

E-commerce application built to demonstrate high-availability patterns, advanced search engineering, and modular full-stack architecture. ScalerCart replicates the Amazon user experience while implementing a sophisticated semantic recommendation engine and a hybrid search pipeline handling over 33,000 products.

---

## 🏗️ System Architecture

ScalerCart is built using a modern decoupled architecture:

- **Frontend**: React.js (Vite) with a modular component architecture, implementing localized state management and high-fidelity Amazon UI patterns.
- **Backend**: FastAPI (Python 3.10+) leveraging asynchronous request handling and a non-blocking service startup lifecycle.
- **Search Engine**: A hybrid pipeline combining **RapidFuzz** (Lexical/Fuzzy match) and **FAISS** (Semantic Vector match).
- **Database**: SQL-standard schema implemented via SQLite for portability, featuring 10+ relational tables including inventory tracking and precomputed recommendation mappings.

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

---

## 🛠️ Technology Stack

| Layer                | Technology                             |
| -------------------- | -------------------------------------- |
| **Frontend**         | React, Vite, Lucide Icons, Axios       |
| **Backend**          | FastAPI, Pydantic, SQLAlchemy, Uvicorn |
| **Machine Learning** | FAISS, Sentence-Transformers, NumPy    |
| **Database**         | SQLite3 (relational schema)            |
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
