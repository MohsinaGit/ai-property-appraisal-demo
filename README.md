# Site & Sum — AI-Assisted Property Appraisal (Demo)

A small frontend demo showing how LLM/SLM integrations can support a
real workflow — client fills in property details, AI drafts a structured
appraisal report, and an admin can type plain-English instructions to
have the report revised, without touching the underlying code.

> **Note:** This is an illustrative demo, not a real valuation service.
> Nothing is persisted — it's a frontend showcase, not a data platform.

**Live demo:** https://aiappraisalreport.netlify.app

---

## What it does

1. A client fills in property details — address, type, size, condition,
   and optionally some comparable sales — and generates a report.
2. A Netlify serverless function prompts the AI to reason through the
   details like a property appraiser, returning a structured report
   (summary, key features, comparables commentary, valuation approach,
   estimated value).
3. An **admin panel** below the report lets the admin type a free-text
   instruction — e.g. *"Adjust the estimated value to $780,000"* or
   *"Add a sentence noting the kitchen was renovated in 2025"* — and
   the AI regenerates the report following that instruction, keeping the
   same structure.

## Architecture

```
┌─────────────┐      POST /generate-report      ┌────────────────────┐
│   Browser    │ ───────────────────────────────▶│  Netlify Function   │
│ (index.html, │                                  │ generate-report.js  │
│   app.js)    │◀─────────── JSON report ─────────│                     │
└─────────────┘                                  └──────────┬──────────┘
                                                              │
                                                              ▼
                                                    ┌────────────────────┐
                                                    │   LLM/SLM API      │
                                                    │ (drafts / revises  │
                                                    │  the report)       │
                                                    └────────────────────┘
```

## Tech stack

- **Frontend:** vanilla HTML / CSS / JS
- **AI:** LLM/SLM integration — prompted for structured output and instruction-following revisions
- **Backend:** Netlify Functions (serverless — keeps the API key off the client)
- **Hosting:** Netlify
- **In production work:** Supabase (database), DocuSeal (e-signatures), Resend (email delivery), RAG-based report generation

## Why this build

This is a standalone, from-scratch demo of a report generation and
admin revision loop — rebuilt with sample data and a new design.
No client code or content is involved.

## Running it locally

1. Copy `.env.example` to `.env` and add your own API key:
   ```
   ANTHROPIC_API_KEY=
   ```
2. Start the dev server (requires the [Netlify CLI](https://docs.netlify.com/cli/get-started/)):
   ```bash
   npm install -g netlify-cli
   netlify dev
   ```
3. Open the local URL, fill in a property, and generate a report.

## Project structure

```
property-appraisal-tool/
├── index.html                      # UI
├── styles.css                      # styling
├── app.js                          # form handling + report rendering
├── netlify/functions/
│   └── generate-report.js          # LLM/SLM API call (initial + revision prompts)
├── netlify.toml                    # Netlify build config
└── .env.example                    # required environment variable
```

## About me

I am an AI Application Developer with 6+ years of experience in
software testing and QA. I work with businesses to design and build
AI-powered applications — integrating LLM/SLM capabilities into real
workflows to automate and improve how businesses operate.

[Live demo](https://aiappraisalreport.netlify.app)

# ai-property-appraisal-demo
