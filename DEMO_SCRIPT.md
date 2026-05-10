# InciWatch - 3-Minute Demo Script

## 00:00 - 00:30: Introduction
**Visual:** Screen showing the blank InciWatch Dashboard ("Live Monitor" tab).
**Audio:** "Welcome to InciWatch. Today, downtime costs enterprise companies an average of $5,600 per minute. The longer it takes to find the root cause, the more money is lost. InciWatch is an AI incident intelligence agent designed to instantly connect new alerts to past resolutions, cutting Mean Time To Resolution (MTTR) by 40 to 60 percent. Let me show you how."

## 00:30 - 01:15: Firing the First Alert
**Action:** Click the "🎬 Run Demo Sequence" button.
**Visual:** A P1 alert for `payments-service` fires automatically. The Slack thread shows the incoming alert, followed by the InciWatch typing indicator and spinner ("Querying incident memory...").
**Audio:** "Here, we simulate a critical P1 alert regarding a database connection pool exhaustion in our payments service. Instantly, InciWatch intercepts the alert and queries its durable incident memory using our Groq LLM backend. Within seconds, it analyzes the context..."

## 01:15 - 02:00: The Context Card & Resolution
**Visual:** The Context Card appears in the center panel, highlighting a high-confidence match with INC-001.
**Audio:** "...and surfaces a Context Card. It found a 94% match with a previous incident where the exact same connection leak occurred. It tells us the root cause—a bad PR—and points us directly to the resolution steps. It even suggests pinging the original resolver, Priya. Instead of spending 45 minutes digging through logs and old Slack threads, the on-call engineer has the exact fix instantly."
**Action:** The system automatically logs the incident as resolved. The right-hand Incident Memory panel updates to reflect the new entry.

## 02:00 - 02:30: Intelligence Report & Analytics
**Action:** Click the "📊 Intelligence Report" tab.
**Visual:** The dashboard shifts to show the weekly digest, MTTR stats, and the affected services chart.
**Audio:** "Beyond real-time response, InciWatch provides actionable analytics. Our Intelligence Report aggregates historical data to show average MTTR, identify the most problematic services, and highlight knowledge gaps where teams lack documentation. This predictive layer allows engineering managers to proactively allocate resources."

## 02:30 - 03:00: Conclusion
**Action:** Click the "📤 Push to Slack" button.
**Visual:** A toast notification appears ("Weekly digest sent to #incidents...").
**Audio:** "With one click, we can push these insights directly to Slack for leadership review. InciWatch transforms incident response from a reactive panic into a streamlined, knowledge-driven workflow. Thank you for watching."
