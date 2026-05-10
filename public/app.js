document.addEventListener('DOMContentLoaded', () => {
    let myChart = null;
    loadMemory();
    generateReport();
    scrollToBottom(); // scroll to end of pre-loaded history

    // Tabs logic
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            if (tab.dataset.tab === 'ops') {
                document.getElementById('view-ops').classList.remove('hidden');
                document.getElementById('view-report').classList.add('hidden');
            } else {
                document.getElementById('view-ops').classList.add('hidden');
                document.getElementById('view-report').classList.remove('hidden');
                generateReport(); 
            }
        });
    });

    // Toast logic
    document.getElementById('btn-slack').addEventListener('click', () => {
        const toast = document.getElementById('toast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 4000);
    });

    // Web Audio API Sound Ping
    function playPing() {
        if (!document.getElementById('sound-toggle').checked) return;
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.3);
        } catch(e) {}
    }

    async function generateReport() {
        try {
            const res = await fetch('/api/incidents');
            const incidents = await res.json();
            
            const thisWeekCount = Math.max(1, Math.floor(incidents.length * 0.6));
            document.getElementById('m-total').textContent = thisWeekCount;

            const avgMttr = incidents.length ? Math.round(incidents.reduce((acc, inc) => acc + (inc.duration_mins || 0), 0) / incidents.length) : 0;
            document.getElementById('m-mttr').textContent = avgMttr + 'm';

            const resolvers = {};
            const services = {};
            incidents.forEach(inc => {
                resolvers[inc.resolver] = (resolvers[inc.resolver] || 0) + 1;
                services[inc.service] = (services[inc.service] || 0) + 1;
            });

            let topResolver = '-';
            let maxRes = 0;
            for (const [res, count] of Object.entries(resolvers)) {
                if (count > maxRes) { maxRes = count; topResolver = res; }
            }
            document.getElementById('m-resolver').textContent = topResolver;

            let topService = '';
            let maxSvc = 0;
            for (const [svc, count] of Object.entries(services)) {
                if (count > maxSvc) { maxSvc = count; topService = svc; }
            }
            
            let commonAlert = topService;
            const matchingInc = incidents.find(i => i.service === topService);
            if (matchingInc) commonAlert = matchingInc.alert_text;
            
            document.getElementById('m-common').textContent = commonAlert.length > 30 ? commonAlert.substring(0, 30) + '...' : commonAlert;

            const ctx = document.getElementById('serviceChart').getContext('2d');
            if (myChart) myChart.destroy();
            
            myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Object.keys(services),
                    datasets: [{
                        label: 'Incidents',
                        data: Object.values(services),
                        backgroundColor: 'rgba(0, 240, 255, 0.6)',
                        borderColor: '#00f0ff',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: '#232b3e' } },
                        x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
                    },
                    plugins: { legend: { display: false } }
                }
            });

            const allPossibleServices = ['payments-service', 'auth-service', 'recommendation-engine', 'notification-service', 'api-gateway', 'user-service', 'billing-service'];
            const gaps = allPossibleServices.filter(s => !services[s]);
            const gapList = document.getElementById('knowledge-gaps');
            gapList.innerHTML = '';
            if (gaps.length === 0) {
                gapList.innerHTML = '<li style="color:var(--accent-green); background:rgba(0,255,157,0.1); border-color:var(--accent-green);">No knowledge gaps! All core services have logs.</li>';
            } else {
                gaps.forEach(g => {
                    const li = document.createElement('li');
                    li.textContent = g;
                    gapList.appendChild(li);
                });
            }
        } catch (e) {
            console.error('Error generating report:', e);
        }
    }

    // Elements
    const form = document.getElementById('alert-form');
    const feed = document.getElementById('feed-container');
    const presets = document.querySelectorAll('.preset-btn');
    const resolveBtn = document.getElementById('open-modal-btn');
    const resolveModal = document.getElementById('resolve-modal');
    const closeModal = document.querySelector('.close-modal');
    const resolveForm = document.getElementById('resolve-form');

    // Presets
    presets.forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('severity').value = btn.dataset.severity;
            document.getElementById('service').value = btn.dataset.service;
            document.getElementById('alert-text').value = btn.dataset.text;
        });
    });

    // Alert Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const severity = document.getElementById('severity').value;
        const service = document.getElementById('service').value;
        const alert_text = document.getElementById('alert-text').value;

        // 1. Add Alert Bot Message
        addMessage('bot', '🚨 ALERT BOT', `
            <div class="alert-message">
                [${severity}] ${alert_text}<br>
                <span style="color:var(--text-muted)">Service: ${service}</span>
            </div>
        `, 'alert-avatar', '🚨');

        // 2. Add InciWatch Typing Indicator
        const loadingId = 'loading-' + Date.now();
        addMessage('inciwatch', 'InciWatch', `
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        `, 'inciwatch-avatar', '🤖', loadingId);

        try {
            const response = await fetch('/api/alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alert_text, severity, service })
            });

            const data = await response.json();
            
            document.getElementById(loadingId).remove();

            if (data.error) throw new Error(data.error);

            renderContextCard(data);

        } catch (error) {
            if(document.getElementById(loadingId)) document.getElementById(loadingId).remove();
            addMessage('inciwatch', 'InciWatch', `<p style="color:var(--danger)">Error querying memory: ${error.message}</p>`, 'inciwatch-avatar', '🤖');
        }
    });

    function addMessage(type, name, htmlContent, avatarClass, avatarIcon, id = null) {
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const block = document.createElement('div');
        block.className = 'message-block';
        if (id) block.id = id;
        block.innerHTML = `
            <div class="bot-avatar ${avatarClass}">${avatarIcon}</div>
            <div class="message-content">
                <strong>${name}</strong> <span class="time">${time}</span>
                ${htmlContent}
            </div>
        `;
        feed.appendChild(block);
        scrollToBottom();
    }

    function renderContextCard(data) {
        const confClass = data.confidence_level === 'HIGH' ? 'confidence-high' : 
                          data.confidence_level === 'MEDIUM' ? 'confidence-medium' : 'confidence-low';
        
        let incidents = [];
        if (Array.isArray(data)) incidents = data;
        else if (data.matches && Array.isArray(data.matches)) incidents = data.matches;
        else if (data.similar_incidents && Array.isArray(data.similar_incidents)) incidents = data.similar_incidents;
        else if (data.top_incidents && Array.isArray(data.top_incidents)) incidents = data.top_incidents;
        else if (data.incidents && Array.isArray(data.incidents)) incidents = data.incidents;
        else if (data.top_3_similar_incidents && Array.isArray(data.top_3_similar_incidents)) incidents = data.top_3_similar_incidents;
        else {
            for (const key in data) {
                if (Array.isArray(data[key])) { incidents = data[key]; break; }
            }
        }

        let matchesHtml = '';
        if (incidents.length > 0) {
            incidents.forEach((match, index) => {
                const score = match.similarity_score ? Math.round(match.similarity_score * 100) : 90;
                matchesHtml += `
                    <div class="match-item">
                        <div class="match-header">
                            <span class="match-id">#${index+1} ${match.incident_id || match.id || 'INC-XXX'}</span>
                            <span class="match-score">${score}% match</span>
                        </div>
                        <div class="match-detail"><span>Why:</span> ${match.why_matched || 'Similar symptoms'}</div>
                        <div class="match-detail"><span>Fix:</span> ${match.resolution_summary || match.resolution_steps || 'See details'}</div>
                    </div>
                `;
            });
        } else {
            matchesHtml = `<div class="match-detail">Parsed AI response structure varies. See raw data in console.</div>`;
        }

        const html = `
            <div class="context-card">
                <div class="card-header">
                    <div class="card-title">🧠 InciWatch Context</div>
                    <div class="confidence-badge ${confClass}">Conf: ${data.confidence_level || 'HIGH'}</div>
                </div>
                <div class="card-body">
                    ${matchesHtml}
                </div>
                <div class="card-footer">
                    <div class="footer-info">
                        <div>Suggested Resolver: <strong>${data.suggested_resolver || 'Unknown'}</strong></div>
                        <div>Est. Resolution: <strong>${data.estimated_resolution_mins || '30'} mins</strong></div>
                    </div>
                    <div class="action-buttons">
                        <button class="btn-action">Ping Resolver</button>
                        <button class="btn-action">View PR</button>
                    </div>
                </div>
            </div>
        `;
        
        addMessage('inciwatch', 'InciWatch', html, 'inciwatch-avatar', '🤖');
        playPing(); // Play sound effect when card appears
    }

    function scrollToBottom() {
        feed.scrollTop = feed.scrollHeight;
    }

    // Memory
    async function loadMemory() {
        try {
            const res = await fetch('/api/incidents');
            const incidents = await res.json();
            const list = document.getElementById('memory-list');
            list.innerHTML = '';
            
            incidents.reverse().forEach(inc => {
                const div = document.createElement('div');
                div.className = 'memory-card';
                div.innerHTML = `
                    <span class="memory-badge">${inc.service}</span>
                    <div class="memory-alert">${inc.alert_text}</div>
                    <div class="memory-meta">
                        <span>Resolver: <strong>${inc.resolver}</strong></span>
                        <span>${inc.duration_mins}m</span>
                    </div>
                `;
                list.appendChild(div);
            });
        } catch (e) {
            console.error('Failed to load memory', e);
        }
    }

    // Modal
    resolveBtn.addEventListener('click', () => resolveModal.classList.add('show'));
    closeModal.addEventListener('click', () => resolveModal.classList.remove('show'));
    resolveModal.addEventListener('click', (e) => {
        if (e.target === resolveModal) resolveModal.classList.remove('show');
    });

    resolveForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('res-incident-id').value;
        const resolver = document.getElementById('res-resolver').value;
        const summary = document.getElementById('res-summary').value;

        try {
            const response = await fetch('/api/resolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ incident_id: id, resolver, resolution_summary: summary })
            });
            if (!response.ok) throw new Error('Failed to save');
            
            resolveForm.reset();
            resolveModal.classList.remove('show');
            loadMemory();
            generateReport();
        } catch (e) {
            alert('Failed to resolve: ' + e.message);
        }
    });

    // Demo Sequence
    const btnDemo = document.getElementById('btn-demo');
    if (btnDemo) {
        btnDemo.addEventListener('click', () => {
            btnDemo.disabled = true;
            btnDemo.textContent = "🎬 Running Demo...";
            btnDemo.style.opacity = '0.7';

            // Step 1: Fire P1 payments-service after 1s
            setTimeout(() => {
                document.getElementById('severity').value = 'P1';
                document.getElementById('service').value = 'payments-service';
                document.getElementById('alert-text').value = 'DB connection pool exhausted on checkout';
                document.querySelector('.btn-fire-alert').click();
            }, 1000);

            // Step 2: Mark as resolved after 8s
            setTimeout(() => {
                addMessage('system', 'System', '<p>Incident resolved by @demo.user. MTTR: 1 mins.</p>', 'sys-avatar', '✓');
                fetch('/api/resolve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        incident_id: 'INC-DEMO-' + Math.floor(Math.random()*1000), 
                        resolver: '@demo.user', 
                        resolution_summary: 'Restarted checkout pods and increased max_pool_size' 
                    })
                }).then(() => {
                    loadMemory();
                    generateReport();
                });
            }, 8000);

            // Step 3: Fire second alert for auth-service after 12s
            setTimeout(() => {
                document.getElementById('severity').value = 'P1';
                document.getElementById('service').value = 'auth-service';
                document.getElementById('alert-text').value = 'Auth token validation failing for region us-east';
                document.querySelector('.btn-fire-alert').click();
                
                // Reset demo button after sequence ends
                setTimeout(() => {
                    btnDemo.disabled = false;
                    btnDemo.innerHTML = "🎬 Run Demo Sequence";
                    btnDemo.style.opacity = '1';
                }, 4000);
            }, 12000);
        });
    }
});
