let lastPostCount = 0;
let lastAlertCount = 0;

async function fetchAdminData() {
    try {
        const sRes = await fetch('/api/admin/stats');
        const stats = await sRes.json();
        
        const mapping = {
            'total_posts': 'stat-total_posts',
            'resolved_posts': 'stat-resolved_posts',
            'verified_helpers': 'stat-verified_helpers',
            'pending_apps': 'stat-pending_apps',
            'total_responses': 'stat-total_responses',
            'lives_touched': 'stat-lives_touched',
            'top_points': 'stat-top_points'
        };
        
        Object.entries(mapping).forEach(([dataKey, elementId]) => {
            const el = document.getElementById(elementId);
            if (el && stats[dataKey] !== undefined) {
                el.innerText = stats[dataKey].toLocaleString();
            }
        });

        const openPosts = (stats.total_posts || 0) - (stats.resolved_posts || 0);
        if (document.getElementById('stat-open_posts')) {
            document.getElementById('stat-open_posts').innerText = `${openPosts} active posts`;
        }
        
        const badge = document.getElementById('pending-count-badge');
        if (badge) {
            badge.innerText = `${stats.pending_apps} pending review`;
        }

        // Real-time alerts
        if (lastPostCount !== 0 && stats.total_posts > lastPostCount) {
            showNotification("Activity Update", "New community posts detected.", "message-square");
        }
        if (lastAlertCount !== 0 && stats.high_risk_posts > lastAlertCount) {
            showNotification("CRITICAL ALERT", "AI detected a high-risk crisis post.", "zap", true);
        }
        if (lastPostCount === 0) showNotification("System Online", "Real-time AI monitoring active.", "shield");

        lastPostCount = stats.total_posts;
        lastAlertCount = stats.high_risk_posts;

        // Load Applications
        const appContainer = document.getElementById('applications-container');
        if (appContainer) {
            const aRes = await fetch('/api/admin/applications');
            const apps = await aRes.json();
            if (apps.length === 0) {
                appContainer.innerHTML = '<div class="card" style="text-align: center; padding: 40px; color: var(--text-muted);">No pending applications. Monitoring feeds...</div>';
            } else {
                renderApplications(apps, appContainer);
            }
        }
    } catch (e) { console.error("Admin Sync Error:", e); }
}

function renderApplications(apps, container) {
    container.innerHTML = apps.map(app => `
        <div class="app-review-card">
            <div class="app-review-header">
                <div>
                    <h3 class="serif" style="font-size: 1.8rem; margin-bottom: 4px;">${app.name}</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">${app.email} • Applied ${app.applied_days}</p>
                </div>
                <span class="pill pill-pending">Pending Review</span>
            </div>
            <div class="app-review-body">
                <div>
                    <div class="review-col-title">MOTIVATION STATEMENT</div>
                    <div class="review-text-block">${app.motivation}</div>
                </div>
                <div>
                    <div class="review-col-title">REFERENCES</div>
                    ${app.references.map(ref => `<div class="ref-card-mini"><h4>${ref.name}</h4><div class="quote">"${ref.quote}"</div></div>`).join('')}
                </div>
            </div>
            <div class="app-review-footer">
                <button class="btn btn-outline btn-sm" onclick="processApplication(${app.id}, 'reject')">Reject</button>
                <button class="btn btn-primary btn-sm" style="background: #134e4a;" onclick="processApplication(${app.id}, 'approve')">Approve & Activate</button>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

async function processApplication(id, action) {
    try {
        const res = await fetch(`/api/admin/applications/${id}/${action}`, { method: 'POST' });
        if (res.ok) {
            showNotification(action === 'approve' ? "Helper Activated" : "Application Rejected", 
                             action === 'approve' ? "New helper has been notified and granted access." : "Application has been removed.",
                             action === 'approve' ? "check" : "x");
            fetchAdminData(); // Refresh immediately
        }
    } catch (e) { console.error("Process error:", e); }
}

function showNotification(title, msg, icon = "zap", isCritical = false) {
    const alertBar = document.createElement('div');
    const color = isCritical ? '#ef4444' : '#134e4a';
    alertBar.style.cssText = `
        position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
        background: ${color}; color: white; padding: 16px 32px; border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 10000; font-weight: 500;
        display: flex; align-items: center; gap: 15px; animation: alertSlide 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        border: 2px solid rgba(255,255,255,0.2); min-width: 350px;
    `;
    alertBar.innerHTML = `
        <div style="background: rgba(255,255,255,0.2); padding: 8px; border-radius: 10px; display: flex;"><i data-lucide="${icon}" size="20"></i></div>
        <div>
            <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; opacity: 0.8; letter-spacing: 0.05em;">${title}</div>
            <div style="font-size: 0.95rem;">${msg}</div>
        </div>
    `;
    document.body.appendChild(alertBar);
    lucide.createIcons();
    setTimeout(() => {
        alertBar.style.transform = 'translateX(-50%) translateY(-20px)';
        alertBar.style.opacity = '0';
        alertBar.style.transition = '0.4s ease-in';
        setTimeout(() => alertBar.remove(), 400);
    }, 5000);
}

if (localStorage.getItem('admin_auth') !== 'true') {
    window.location.href = 'admin_login.html';
} else {
    window.onload = () => {
        fetchAdminData();
        setInterval(fetchAdminData, 5000);
    };
}
