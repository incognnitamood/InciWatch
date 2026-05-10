# InciWatch (Demo)

InciWatch is a small, end-to-end demo that simulates an on-call incident workflow: you “fire” a new alert, the backend queries a Large Language Model (LLM) with your historical incident log, and the UI displays the most relevant past incidents plus a suggested path to resolution.

## Problem

During an incident, responders lose time to:

- Searching through old tickets / runbooks / postmortems
- Figuring out who resolved similar issues before
- Reconstructing context under pressure

## Solution

InciWatch provides a lightweight “incident memory” and a semantic matching layer:

- Stores historical incidents in a simple YAML file (`incidents.yaml`)
- Accepts new alerts from the UI
- Prompts an LLM to return the top 3 most similar incidents (with match reasoning + suggested resolution)
- Lets you log a resolution back into the YAML “memory” store

## Setup

### Prerequisites

- Node.js 18+ (the backend relies on `fetch`)
- A Groq API key

### Install

```bash
npm install
```

### Configure environment

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_key_here
```

## Instructions

Start the server:

```bash
npm start
```

Open the dashboard:

- http://localhost:3000

## Usage

### Using the dashboard

1. In **Alert Simulator**, select **Severity** and **Service**, and enter **Alert Text**.
2. Click **Fire Alert**.
3. InciWatch will respond in the live thread with a **Context** card containing similar incidents, match rationale, and a suggested resolver / estimated time.
4. Click **+ Log Resolution** to append a new resolved incident into `incidents.yaml`.

### Run the built-in demo

Use **Run Demo Sequence** in the Alert Simulator panel to automate a short scenario.

### API endpoints (local)

- `GET /api/incidents` — returns the current incident “memory” from `incidents.yaml`
- `POST /api/alert` — submits a new alert and returns LLM-matched incident context
- `POST /api/resolve` — appends a resolved incident to `incidents.yaml`

## Architecture Overview

- `server.js`: Express backend that serves the UI and exposes the API routes. The `/api/alert` route calls Groq’s OpenAI-compatible Chat Completions endpoint and requests `response_format: { type: 'json_object' }`.
- `incidents.yaml`: Durable incident memory store pre-seeded with example incidents.
- `public/index.html`: Main demo UI (alert simulator, live thread, incident memory panel, intelligence report view).
- `public/app.js`: Frontend behavior (submits alerts, renders context cards, loads memory, generates the report UI).
- `public/style.css`: UI styling.

## AI Disclosure

See [ai_disclosure.md](ai_disclosure.md).
