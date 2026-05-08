const express = require('express');
const cors = require('cors');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load incidents
const loadIncidents = () => {
    try {
        const fileContents = fs.readFileSync(path.join(__dirname, 'incidents.yaml'), 'utf8');
        return yaml.load(fileContents) || [];
    } catch (e) {
        console.error('Error loading incidents.yaml:', e);
        return [];
    }
};

// Save incidents
const saveIncidents = (incidents) => {
    try {
        const yamlStr = yaml.dump(incidents);
        fs.writeFileSync(path.join(__dirname, 'incidents.yaml'), yamlStr, 'utf8');
    } catch (e) {
        console.error('Error saving incidents.yaml:', e);
    }
};

app.get('/api/incidents', (req, res) => {
    const incidents = loadIncidents();
    res.json(incidents);
});

app.post('/api/alert', async (req, res) => {
    try {
        const { alert_text, severity, service } = req.body;
        
        if (!alert_text || !service) {
            return res.status(400).json({ error: 'alert_text and service are required' });
        }

        const incidents = loadIncidents();
        const incidentsYaml = yaml.dump(incidents);
        const prompt = `You are InciWatch, an incident intelligence agent. Given a new alert and a history of past incidents, find the top 3 most semantically similar past incidents. For each match return: incident id, similarity_score (0-1), why_matched (1 sentence), and a resolution_summary. Also return: suggested_resolver (from the best match), estimated_resolution_mins, and a confidence_level (HIGH/MEDIUM/LOW). Respond ONLY in JSON.

New Alert:
Alert Text: ${alert_text}
Severity: ${severity || 'Unknown'}
Service: ${service}

Past Incidents (YAML):
${incidentsYaml}`;

        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey || groqApiKey === 'your_key_here') {
             return res.status(500).json({ error: 'Valid GROQ_API_KEY is not set in .env' });
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
                temperature: 0.2
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Groq API Error:', errorData);
            return res.status(500).json({ error: 'Failed to query Groq API' });
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        res.json(JSON.parse(content));
    } catch (error) {
        console.error('Error in /api/alert:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/resolve', (req, res) => {
    try {
        const { incident_id, resolution_summary, resolver } = req.body;
        
        if (!incident_id || !resolution_summary || !resolver) {
            return res.status(400).json({ error: 'incident_id, resolution_summary, and resolver are required' });
        }

        const incidents = loadIncidents();
        
        const newIncident = {
            id: incident_id,
            alert_text: req.body.alert_text || "Resolved incident",
            service: req.body.service || "unknown",
            root_cause: req.body.root_cause || "Not specified",
            resolution_steps: resolution_summary,
            resolver: resolver,
            duration_mins: req.body.duration_mins || 0,
            pr_link: req.body.pr_link || "",
            timestamp: new Date().toISOString()
        };

        incidents.push(newIncident);
        saveIncidents(incidents);

        res.json({ success: true, message: "Memory updated" });
    } catch (error) {
        console.error('Error in /api/resolve:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
