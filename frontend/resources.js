let breathingActive = false;
let breathingInterval;

async function fetchLibrary() {
    try {
        const hRes = await fetch('/api/resources/helplines');
        const helplines = await hRes.json();
        const hGrid = document.getElementById('helpline-grid');
        
        if (hGrid) {
            hGrid.innerHTML = [...helplines.global, ...helplines.pakistan].map(h => `
                <div class="helpline-card-pro">
                    <span class="region-tag">${h.region}</span>
                    <h4>${h.name}</h4>
                    <div class="number">${h.number}</div>
                    <button class="btn btn-primary" style="background: #134e4a; border-radius: 100px; padding: 12px 30px;">Call Now</button>
                </div>
            `).join('');
        }

        const eRes = await fetch('/api/resources/education');
        const education = await eRes.json();
        const eGrid = document.getElementById('education-grid');
        
        if (eGrid) {
            eGrid.innerHTML = education.map(e => `
                <div class="card">
                    <span class="pill pill-verified" style="margin-bottom: 12px; display: inline-block;">${e.category}</span>
                    <h3 class="serif" style="font-size: 1.6rem; margin-bottom: 12px;">${e.title}</h3>
                    <p style="font-size: 0.9rem; color: var(--text-body); margin-bottom: 20px;">${e.content}</p>
                    <button class="btn btn-outline btn-sm">Read Article →</button>
                </div>
            `).join('');
        }
    } catch (e) { console.error("Library load error:", e); }
}

function toggleBreathing() {
    const circle = document.getElementById('breathing-circle');
    const instruction = document.getElementById('breathing-instruction');
    const btn = event.currentTarget;
    
    if (breathingActive) {
        clearInterval(breathingInterval);
        circle.style.transform = 'scale(1)';
        instruction.innerText = 'Stopped';
        btn.innerText = 'Start Breathing Tool';
        breathingActive = false;
    } else {
        breathingActive = true;
        btn.innerText = 'Stop Breathing Tool';
        let state = 0; 
        instruction.innerText = 'Prepare...';
        
        breathingInterval = setInterval(() => {
            if (state === 0) {
                circle.style.transform = 'scale(1.8)';
                instruction.innerText = 'Inhale deeply...';
            } else if (state === 1) {
                instruction.innerText = 'Hold...';
            } else if (state === 2) {
                circle.style.transform = 'scale(1)';
                instruction.innerText = 'Exhale slowly...';
            } else if (state === 3) {
                instruction.innerText = 'Pause...';
            }
            state = (state + 1) % 4;
        }, 4000);
    }
}

function savePlan() {
    const help = document.getElementById('plan-help').value;
    const contacts = document.getElementById('plan-contacts').value;
    localStorage.setItem('crisis_plan', JSON.stringify({ help, contacts, date: new Date().toLocaleDateString() }));
    alert("Your Safety Plan has been saved locally.");
}

function loadPlan() {
    const plan = JSON.parse(localStorage.getItem('crisis_plan'));
    if (plan) {
        const helpEl = document.getElementById('plan-help');
        const contactsEl = document.getElementById('plan-contacts');
        if (helpEl) helpEl.value = plan.help;
        if (contactsEl) contactsEl.value = plan.contacts;
    }
}

window.onload = () => {
    fetchLibrary();
    loadPlan();
};
