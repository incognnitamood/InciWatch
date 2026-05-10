# InciWatch Demo

InciWatch is an AI-powered incident intelligence agent that simulates a live incident response workflow. It listens for incoming alerts, semantically matches them against past historical incidents, and surfaces relevant context to the resolver—drastically reducing Mean Time To Resolution (MTTR) by eliminating manual investigation.

The dashboard simulates a DevOps environment featuring an incoming alert simulator, a live Slack-like thread, and an incident memory store. Built on Node.js and a Groq-powered LLM backend, this repository serves as a fully functional proof-of-concept for the InciWatch platform.

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure your environment variables. Open `.env` and add your Groq API key:
   ```env
   GROQ_API_KEY=your_key_here
   ```
3. Start the application:
   ```bash
   node server.js
   ```
4. Access the dashboard at `http://localhost:3000`

## Architecture Overview

- `server.js`: Express backend that serves the application and processes API requests to Groq.
- `incidents.yaml`: Durable memory store pre-seeded with historical incidents.
- `public/index.html`: Main demo UI dashboard featuring the simulated environment.
- `public/style.css`: Styling that applies the dark-themed, professional internal DevOps tool look.
- `public/app.js`: Frontend logic that handles UI state, animations, API requests, and demo sequencing.
- `.env`: Environment variables configuration.

## Demo Flow

Use the "Run Demo Sequence" button in the Alert Simulator panel to automate a typical scenario:
1. A P1 alert for the payments-service is triggered.
2. InciWatch queries its incident memory via the Groq LLM API.
3. A Context Card is shown detailing the top historical matches and suggesting a resolution.
4. The simulated system logs the resolution and updates the memory.
5. A second alert fires, repeating the workflow for varied service types.
