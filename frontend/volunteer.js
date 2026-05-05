async function submitHelperApp() {
    const name = document.getElementById('h-name').value;
    const exp = document.getElementById('h-exp').value;
    const ref = document.getElementById('h-ref-name').value;
    const captcha = true; // Assuming captcha check is pass for demo

    if (!name || !exp || !ref) {
        alert("Please complete all fields.");
        return;
    }

    try {
        const email = document.getElementById('h-email') ? document.getElementById('h-email').value : "volunteer@email.com";
        const motivation = document.getElementById('h-motivation') ? document.getElementById('h-motivation').value : "I want to help.";

        await fetch('/api/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name, 
                email, 
                experience: exp, 
                motivation: motivation,
                references: ref 
            })
        });
        alert("Application submitted! We will contact your reference shortly.");
        mockLoginVerified(name);
    } catch (e) { console.error("Application error:", e); }
}

function mockLoginVerified(name = "New Helper") {
    const viewDash = document.getElementById('view-dashboard');
    const viewApply = document.getElementById('view-apply');
    
    if (viewApply) viewApply.classList.add('hidden');
    if (viewDash) {
        viewDash.classList.remove('hidden');
        viewDash.innerHTML = `
            <header class="view-header" style="text-align: center; margin-bottom: 60px;">
                <h1 class="section-title">Helper <span class="teal">Workspace</span></h1>
                <p class="section-subtitle">Welcome back, ${name}. Your responses save lives.</p>
            </header>

            <section class="stat-row">
                <div class="card stat-card">
                    <div class="stat-number">0</div>
                    <div class="stat-label">Total Responses</div>
                </div>
                <div class="stat-card card">
                    <div class="stat-number">500</div>
                    <div class="stat-label">Available Points</div>
                </div>
            </section>

            <div class="dash-layout">
                <div class="dash-main">
                    <h2 class="serif" style="font-size: 2rem; margin-bottom: 25px;">Active Crisis Feed</h2>
                    <div id="crisis-feed" class="feed"></div>
                </div>
            </div>
        `;
        fetchCrisisFeed();
    }
}

async function fetchCrisisFeed() {
    try {
        const res = await fetch('/api/posts');
        const posts = await res.json();
        const crisisFeed = document.getElementById('crisis-feed');
        if (!crisisFeed) return;

        const crisisPosts = posts.filter(p => p.priority === 'High');
        crisisFeed.innerHTML = crisisPosts.map(p => `
            <div class="post-card card high-priority" style="margin-bottom: 24px;">
                <div class="post-alias">${p.alias}</div>
                <div class="post-time">${p.timestamp}</div>
                <div class="post-body">${p.content}</div>
                <div style="margin-top: 20px;">
                    <textarea placeholder="Write a supportive response..." style="height: 100px; margin-bottom: 10px;"></textarea>
                    <button class="btn btn-primary btn-sm">Send Response</button>
                </div>
            </div>
        `).join('');
    } catch (e) { console.error("Feed error:", e); }
}

async function fetchLeaderboard() {
    try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        const tbody = document.getElementById('leader-tbody');
        if (tbody) {
            tbody.innerHTML = data.map((h, i) => `
                <tr>
                    <td>#${i+1}</td>
                    <td>${h.name}</td>
                    <td>${h.points.toLocaleString()}</td>
                    <td><span class="pill ${h.status === 'Verified' ? 'pill-verified' : 'pill-pending'}">${h.status}</span></td>
                </tr>
            `).join('');
        }
    } catch (e) { console.error("Leaderboard error:", e); }
}

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    const target = document.getElementById('view-' + viewId);
    if (target) target.classList.remove('hidden');
}
