# ProbePeer — Scientific Research Workspace & Decision Graph

ProbePeer is an integrated, reproducible scientific research platform designed to help researchers progress from an uncertain inquiry to a defensible, empirical, and evidence-linked body of scientific work.

---

## 1. Project Overview

Scientific progression requires transparent continuity: candidate research questions must be grounded in verified literature gaps, datasets must be audited for feasibility and confounding risks, analysis plans must be frozen to prevent post-hoc $p$-hacking/HARKing, computational execution must audit diagnostic assertions, and manuscript claims must link directly to underlying evidence.

### The Research Decision Graph
At the center of ProbePeer is the **Research Decision Graph**, a typed, versioned network tracking scientific objects and their relationships:
- **Node Types**: Research Questions, Hypotheses, Literature Sources, Evidence Statements, Candidate Gaps, Datasets, Variables, Analysis Protocols, Execution Runs, Quantitative Results, and Manuscript Sections.
- **Edge Relationships**: `supports`, `contradicts`, `derived_from`, `depends_on`, `executed_as`, `validated_by`, `reported_in`.
- **Downstream Dependency Tracer**: When an upstream dataset or method changes, ProbePeer cascades dependency warnings to all affected downstream results and manuscript sections, preventing undetected discrepancies.

---

## 2. Local Development Setup

### Prerequisites
- **Node.js**: v20 or v22 LTS
- **Python**: 3.10+ (Standard library modules used: `math`, `statistics`, `csv`, `json`, `sqlite3`, `random`, `re`)

### Setup Commands
```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables (create .env from .env.example)
cp .env.example .env

# 3. Start development server (Full-stack Express + Vite on port 3000)
npm run dev

# 4. Open in browser
# http://localhost:3000
```

### Verification & Testing
```bash
# Type check and lint check
npm run lint

# Production bundle compilation
npm run build
```

---

## 3. Production Deployment Instructions

### Google Cloud Run Deployment
ProbePeer is configured as a full-stack containerized service. In production, Node.js serves both API endpoints and the compiled Vite static assets from `/dist`.

1. **Build Container & Deploy to Cloud Run**:
```bash
# Build the production bundle
npm run build

# Deploy via gcloud CLI
gcloud run deploy probepeer \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,PORT=8080"
```
*Note*: Cloud Run injects `$PORT` dynamically. `server.ts` automatically binds to `process.env.PORT || 3000`.

2. **Configure Gemini API Key**:
Set the `GEMINI_API_KEY` secret in Cloud Run environment variables or Google Secret Manager:
```bash
gcloud run services update probepeer \
  --set-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

### Firebase App Hosting / Hosting
1. Build client bundle: `npm run build`.
2. Connect backend Cloud Functions or Cloud Run service handling `/api/*` routes.
3. Deploy frontend static assets from `dist/` with SPA rewrite rules to `index.html`.

---

## 4. Known Limitations & Real vs. Simulated Capabilities

To ensure complete scientific honesty and transparency:

| Feature / Subsystem | Current Implementation Status | Operational Boundaries |
|---|---|---|
| **Scholarly Literature Retrieval** | **REAL** | Queries live **OpenAlex**, **Crossref REST**, and **arXiv** APIs with automatic DOI deduplication. Handles HTTP 429 rate limits gracefully. |
| **Evidence Extraction & Gaps** | **REAL** | Synthesizes evidence strictly from retrieved abstracts using Gemini 2.5 Flash. LLM is strictly constrained from inventing DOIs. |
| **Dataset Statistical Profiling** | **REAL** | Parses RFC 4180 CSV files using PapaParse. Computes exact row counts, column types, missingness, duplicates, means, std deviations, and leakage warnings dynamically. |
| **Feasibility Assessment** | **REAL** | Dynamically analyzes dataset sample size power, continuous vs. categorical features, detected confounders, and outputs exact supported vs. unsupported claims. |
| **Python Execution Runner** | **REAL** | Executes in an isolated child process using the system's **Python 3.10** runtime with strict timeout guards (15s) and memory constraints. Computes real Pearson $r$, regression slopes, confidence intervals, and dynamic SVG scatterplots from dataset rows. |
| **Third-Party Python Libraries** | **LIMITATION** | Python standard library (`math`, `statistics`, `csv`, `json`) is native in the host environment. Heavy third-party packages (`torch`, `biopython`, `statsmodels`) require connecting a dedicated containerized worker (e.g. Celery / Ray / Cloud Run Jobs). |
| **Data Persistence** | **REAL** | Dual-tier persistence: instant synchronous `localStorage` caching paired with atomic server JSON store (`/data/projects.json`), preserving active project and view across browser reloads. |
| **Project Artifact Export** | **REAL** | Generates standard `.zip` archive containing `analysis_script.py`, `dataset.csv`, `execution_results.json`, `manuscript.md`, and `decision_graph.json` via JSZip. |

---

## 5. Environment Variables (`.env.example`)

```bash
# GEMINI_API_KEY: Server-side Gemini AI key (automatically injected in AI Studio)
GEMINI_API_KEY="your-gemini-api-key"

# PORT: Server listening port (defaults to 3000, overridden by Cloud Run $PORT)
PORT=3000

# NODE_ENV: Set to "production" in deployed instances
NODE_ENV="production"

# APP_URL: Base URL of hosted applet
APP_URL="http://localhost:3000"
```
