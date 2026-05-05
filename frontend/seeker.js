let currentAlias = "Guest";
const CRISIS_KEYWORDS = ["suicide", "kill myself", "end it", "hurt myself", "die", "death"];

async function verifyEntry() {
    const email = document.getElementById('user-email').value;
    const captcha = document.getElementById('gate-captcha').checked;

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    if (!captcha) {
        alert("Please confirm you are a human seeking support.");
        return;
    }

    try {
        const res = await fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        
        currentAlias = data.alias;
        document.getElementById('session-alias').innerText = currentAlias;
        document.getElementById('gate-overlay').classList.add('hidden');
        
        initBoard();
    } catch (e) { 
        console.error("Verification error:", e);
        alert("Verification failed. Please try again later.");
    }
}

async function submitPost() {
    const content = document.getElementById('post-content').value;
    if (!content) return;

    try {
        await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, alias: currentAlias })
        });

        document.getElementById('post-content').value = '';
        document.getElementById('crisis-banner').classList.add('hidden');
        document.getElementById('crisis-tag').classList.add('hidden');
        fetchPosts();
    } catch (e) { console.error("Post error:", e); }
}

async function fetchPosts() {
    try {
        const res = await fetch('/api/posts');
        const posts = await res.json();
        
        const feed = document.getElementById('posts-feed');
        if (!feed) return;

        feed.innerHTML = posts.map(p => `
            <div class="post-card card ${p.priority === 'High' ? 'high-priority' : ''}" style="margin-bottom: 24px;">
                <div class="post-alias">${p.alias}</div>
                <div class="post-time">${p.timestamp}</div>
                <div class="post-body">${p.content}</div>
                <div class="post-footer">
                    <span><i data-lucide="message-square" size="14"></i> ${(p.replies || []).length}</span>
                    <span><i data-lucide="thumbs-up" size="14"></i> 0 helpful</span>
                    <a href="#" onclick="alert('Thread view coming soon!')">View Thread →</a>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    } catch (e) { console.error("Fetch posts error:", e); }
}

async function logMood(score) {
    try {
        await fetch('/api/mood', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score })
        });
        alert("Mood logged anonymously. Thank you for checking in.");
    } catch (e) { console.error("Mood log error:", e); }
}

async function fetchGrounding() {
    try {
        const res = await fetch('/api/grounding');
        const data = await res.json();
        const gList = document.getElementById('grounding-list');
        if (gList) {
            gList.innerHTML = data.map(g => `
                <div style="padding: 12px; background: var(--bg-light); border-radius: 12px;">
                    <h4 style="font-size: 0.9rem; margin-bottom: 4px;">${g.title}</h4>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">${g.content}</p>
                </div>
            `).join('');
        }
    } catch (e) { console.error("Grounding fetch error:", e); }
}

document.addEventListener('DOMContentLoaded', () => {
    const postArea = document.getElementById('post-content');
    if (postArea) {
        postArea.addEventListener('input', () => {
            const content = postArea.value.toLowerCase();
            const isCrisis = CRISIS_KEYWORDS.some(word => content.includes(word));
            const banner = document.getElementById('crisis-banner');
            const tag = document.getElementById('crisis-tag');
            
            if (isCrisis) {
                if (banner) banner.classList.remove('hidden');
                if (tag) tag.classList.remove('hidden');
            } else {
                if (banner) banner.classList.add('hidden');
                if (tag) tag.classList.add('hidden');
            }
        });
    }
});

function initBoard() {
    fetchPosts();
    fetchGrounding();
}

// Ensure initBoard is NOT called until verification is complete
// (Removing the auto-init if no overlay logic to strictly enforce the gate)
