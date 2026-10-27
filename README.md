<div align="center">

# 🔬 ProbePeer

### From research question to reproducible manuscript.

**Every claim in your paper, traceable to the evidence behind it.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-probepeer.ai.studio-7B1E3A?style=for-the-badge)](https://probepeer.ai.studio)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](#-license)

![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10-3776AB?logo=python&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tests](https://img.shields.io/badge/tested_with-Vitest-6E9F18?logo=vitest&logoColor=white)

[**Launch Live Demo**](https://probepeer.ai.studio) · [**Quick Start**](#-quick-start) · [**How It Works**](#-how-it-works) · [**Limitations**](#️-known-limitations)

</div>

---

## ✨ Why ProbePeer?

Most research workflows are scattered across browser tabs, notebooks, spreadsheets, and word processors. By the time a manuscript is written, the link between the **original question**, the **analysis actually run**, and the **numbers actually reported** can be hard to audit, even for the author.

ProbePeer closes that gap. It puts literature discovery, dataset feasibility, frozen analysis plans, statistical execution, and manuscript drafting into **one structured workflow**, built on a single principle:

> **Scientific claims should be traceable to the evidence that supports them.**

The goal isn't to write papers faster. It's to make the process behind a paper **easier to inspect, understand, and reproduce.**

## 👥 Who it's for

- **Students and early-career researchers** who want a disciplined workflow from day one
- **Research groups** who want analysis decisions documented before results exist
- **Reviewers and collaborators** who want to verify where a reported number came from
- **Anyone** who has ever asked, "Which version of the analysis produced this table?"

## 🧭 How it works

```text
Research Question
       │
       ▼
Literature Discovery ········ OpenAlex / Crossref
       │
       ▼
Dataset Feasibility ········· CSV inspection
       │
       ▼
Frozen Analysis Plan ········ SHA-256 integrity check
       │
       ▼
Python Execution Pipeline
       │
       ▼
Recorded Statistical Results
       │
       ▼
Evidence-Linked Manuscript
       │
       ▼
Reproducibility Export (ZIP)
```

| Stage | What happens | Why it matters |
|---|---|---|
| **01 · Literature discovery** | Retrieves scholarly records through the OpenAlex and Crossref APIs. | Research starts from identifiable sources, not citations that merely look plausible. Human review of relevance and accuracy is still required. |
| **02 · Dataset feasibility** | Upload a CSV and inspect structure, missingness, and statistical characteristics. | Know what your data can support *before* deciding what it appears to show. |
| **03 · Frozen analysis plans** | Specify models and stopping conditions up front. Freezing generates a SHA-256 hash of the plan. | Pre-specified decisions make later deviations easier to spot. A hash is an integrity check; it does not by itself prevent p-hacking or prove when a plan was created. |
| **04 · Python execution** | Runs generated Python 3 scripts via a Node.js child process with restricted environment variables and timeouts. | Results come from an identifiable computation, not from prose generation. |
| **05 · Evidence-linked drafting** | Drafts a manuscript whose statistical results come from recorded execution outputs. | The narrative and the numbers agree, and you can inspect the underlying results. AI-generated text remains a draft that needs your review. |
| **06 · Reproducibility export** | Exports a ZIP with data, code, checksums, and a provenance manifest. | A project should leave behind more than a final document. |

## 🛡️ Built around research integrity

| Principle | Implementation |
|---|---|
| **Source traceability** | Scholarly metadata retrieval via OpenAlex and Crossref |
| **Methodological transparency** | Explicit statistical plans and documented stopping conditions |
| **Analytical integrity** | SHA-256 plan-integrity checks |
| **Computational provenance** | Recorded execution outputs linked to reported results |
| **Portability** | Downloadable artifacts and provenance manifests |

> These mechanisms support reproducible workflows. They do **not** independently guarantee scientific validity. Data quality, statistical assumptions, methodological appropriateness, and interpretation remain the researcher's responsibility.

## 🧰 Technology stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS (Botanical Merlot design system) |
| Data ingestion | PapaParse |
| Export generation | JSZip |
| Backend | Node.js, Express |
| Statistical execution | Python 3.10 |
| AI integration | Gemini API |
| Literature metadata | OpenAlex, Crossref |
| Research data integration | Zenodo |
| Testing | Vitest |

## 🚀 Quick start

**Prerequisites:** Node.js 18+, Python 3.10+, and a [Gemini API key](https://aistudio.google.com/apikey).

```bash
# 1. Clone
git clone https://github.com/susxmitha/ProbePeer.git
cd ProbePeer

# 2. Install dependencies
npm install

# 3. Configure environment
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env
echo "PORT=3000" >> .env

# 4. Run
npm run dev
```

Then open `http://localhost:3000`.

### Run the tests

```bash
npm run test
```

The Vitest suite covers statistical validation and utility functions.

## ⚠️ Known limitations

Honest engineering means saying what the tool does *not* do yet.

- **Execution sandbox:** The live demo on AI Studio uses a JavaScript fallback engine for statistical computation because the preview environment lacks Python. The full Python 3.10 pipeline can be deployed via the included Dockerfile.
- **Synthetic benchmark:** The default 300-row cohort is synthetic. The pipeline processes it like real data, but results must not be interpreted as clinical conclusions.
- **API constraints:** Live literature searches are subject to OpenAlex and Crossref rate limits. The app handles rate-limited requests gracefully.
- **AI-assisted drafting:** Generated manuscript text is a starting point. Interpretation, citations, and conclusions require researcher review.

## 🗺️ Roadmap

- [ ] Hardened sandbox for multi-tenant execution
- [ ] Additional statistical model templates
- [ ] Support for more dataset formats beyond CSV
- [ ] Citation-verification checks against retrieved metadata
- [ ] Exportable plan-and-results audit report

## 🤝 Contributing

Contributions, issues, and ideas are welcome.

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes and run `npm run test`
4. Open a pull request describing what you changed and why

Found a bug or have a feature idea? [Open an issue](https://github.com/susxmitha/ProbePeer/issues).

## 📄 License

Released under the [MIT License](LICENSE).

---

<div align="center">

**If ProbePeer helps your research, consider giving it a ⭐**

*Make the process behind your paper as trustworthy as the paper itself.*

</div>
