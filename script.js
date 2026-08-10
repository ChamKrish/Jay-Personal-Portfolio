// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile nav toggle
const navToggle = document.getElementById('nav-toggle');
const primaryNav = document.getElementById('primary-nav');

navToggle.addEventListener('click', () => {
    const isOpen = primaryNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        primaryNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
    });
});

// Scroll-reveal animation
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

// Safety net: a reveal transition can get stuck partway if the tab is backgrounded
// mid-animation. Force any lingering elements to their visible state once the tab
// is foregrounded, and as a last resort a few seconds after load.
function forceRevealIfStuck() {
    document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            el.classList.add('is-visible');
            revealObserver.unobserve(el);
        }
    });
}
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) forceRevealIfStuck();
});
setTimeout(forceRevealIfStuck, 2500);

revealEls.forEach(el => revealObserver.observe(el));

// Active nav link on scroll (+ sliding pill indicator)
const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.nav-link');
const navPill = document.getElementById('nav-pill');

function movePillTo(link) {
    if (!navPill || !link) return;
    const navRect = link.closest('nav').getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    navPill.style.left = `${linkRect.left - navRect.left - 14}px`;
    navPill.style.width = `${linkRect.width + 28}px`;
    navPill.style.opacity = '1';
}

const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        const link = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
        if (entry.isIntersecting) {
            if (link) {
                navLinks.forEach(l => l.classList.remove('is-active'));
                link.classList.add('is-active');
                movePillTo(link);
            }
            applyTint(entry.target.id);
        }
    });
}, { rootMargin: '-40% 0px -50% 0px' });

sections.forEach(section => sectionObserver.observe(section));

// ---------- Per-section ambient background tint ----------
const sectionTints = {
    home: ['rgba(139,92,246,0.16)', 'rgba(255,153,0,0.1)'],
    experience: ['rgba(139,92,246,0.14)', 'rgba(255,153,0,0.14)'],
    'open-source': ['rgba(99,102,241,0.14)', 'rgba(118,185,0,0.1)'],
    projects: ['rgba(59,130,246,0.13)', 'rgba(255,153,0,0.1)'],
    skills: ['rgba(139,92,246,0.13)', 'rgba(99,102,241,0.1)'],
    education: ['rgba(139,92,246,0.12)', 'rgba(255,43,214,0.08)'],
    terminal: ['rgba(255,153,0,0.12)', 'rgba(139,92,246,0.1)'],
    contact: ['rgba(255,43,214,0.12)', 'rgba(139,92,246,0.12)']
};
// Plain "r,g,b" companions to the tints above, used to recolor the ambient
// particle background so it keeps shifting as you scroll instead of going flat.
const sectionParticleColors = {
    home: '139,92,246',
    experience: '139,92,246',
    'open-source': '99,102,241',
    projects: '59,130,246',
    skills: '139,92,246',
    education: '255,43,214',
    terminal: '255,153,0',
    contact: '255,43,214'
};
let particleColor = '139,92,246';
const bgTint = document.getElementById('bg-tint');
function applyTint(sectionId) {
    const tint = sectionTints[sectionId];
    if (tint && bgTint) {
        bgTint.style.setProperty('--tint-a', tint[0]);
        bgTint.style.setProperty('--tint-b', tint[1]);
    }
    if (sectionParticleColors[sectionId]) particleColor = sectionParticleColors[sectionId];
}

window.addEventListener('resize', () => {
    const active = document.querySelector('.nav-link.is-active');
    if (active) movePillTo(active);
});

// ---------- Persistent ambient particle background (spans the whole page) ----------
(() => {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width, height, particles;
    const mouse = { x: null, y: null };

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        const count = Math.min(140, Math.floor((width * height) / 11000));
        particles = Array.from({ length: count }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            r: Math.random() * 1.8 + 0.6
        }));
    }

    function step() {
        ctx.clearRect(0, 0, width, height);
        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;
        }
        for (let i = 0; i < particles.length; i++) {
            const a = particles[i];
            for (let j = i + 1; j < particles.length; j++) {
                const b = particles[j];
                const dx = a.x - b.x, dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 130) {
                    ctx.strokeStyle = `rgba(${particleColor},${0.16 * (1 - dist / 130)})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
            if (mouse.x !== null) {
                const dx = a.x - mouse.x, dy = a.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 160) {
                    ctx.strokeStyle = `rgba(255,43,214,${0.3 * (1 - dist / 160)})`;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }
        }
        for (const p of particles) {
            ctx.fillStyle = `rgba(${particleColor},0.75)`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }
        if (!prefersReducedMotion) requestAnimationFrame(step);
    }

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    step();
    if (prefersReducedMotion) {
        // draw a single static frame instead of animating
        step();
    }
})();

// ---------- Scroll progress bar ----------
const scrollProgress = document.getElementById('scroll-progress');
function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (scrollProgress) scrollProgress.style.width = `${pct}%`;
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

// ---------- Scramble-decode reveal for card titles (replays every time it re-enters view) ----------
(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    const glyphs = '!<>-_\\/[]{}=+*^?#01';
    const titles = document.querySelectorAll('.exp-card h3, .oss-card h3, .proj-card h3');
    titles.forEach(h3 => { h3.dataset.finalText = h3.textContent; });

    function decode(el) {
        if (el.dataset.animating === '1') return;
        el.dataset.animating = '1';
        const finalText = el.dataset.finalText;
        const totalFrames = 16;
        let frame = 0;
        function tick() {
            const revealCount = Math.round((frame / totalFrames) * finalText.length);
            let out = '';
            for (let i = 0; i < finalText.length; i++) {
                if (i < revealCount || finalText[i] === ' ') out += finalText[i];
                else out += glyphs[Math.floor(Math.random() * glyphs.length)];
            }
            el.textContent = out;
            frame++;
            if (frame <= totalFrames) {
                requestAnimationFrame(tick);
            } else {
                el.textContent = finalText;
                el.dataset.animating = '0';
            }
        }
        tick();
    }

    const titleObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) decode(entry.target);
        });
    }, { threshold: 0.4 });

    document.querySelectorAll('.exp-card h3, .oss-card h3, .proj-card h3').forEach(h3 => {
        titleObserver.observe(h3);
    });
})();

// ---------- Card tilt-on-hover ----------
document.querySelectorAll('.exp-card, .oss-card, .proj-card').forEach(card => {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
    });
});

// ---------- Skills section cursor spotlight ----------
const skillsSection = document.getElementById('skills');
if (skillsSection) {
    skillsSection.addEventListener('mousemove', e => {
        const rect = skillsSection.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        skillsSection.style.setProperty('--spot-x', `${x}%`);
        skillsSection.style.setProperty('--spot-y', `${y}%`);
    });
}

// ---------- Command palette ----------
const paletteOverlay = document.getElementById('palette-overlay');
const paletteInput = document.getElementById('palette-input');
const paletteResults = document.getElementById('palette-results');
const paletteTrigger = document.getElementById('palette-trigger');
const paletteItems = paletteResults ? Array.from(paletteResults.querySelectorAll('li')) : [];
let paletteIndex = 0;

function openPalette() {
    paletteOverlay.hidden = false;
    paletteInput.value = '';
    filterPalette('');
    paletteInput.focus();
}
function closePalette() {
    paletteOverlay.hidden = true;
}
function filterPalette(query) {
    const q = query.trim().toLowerCase();
    let visibleIndex = 0;
    paletteItems.forEach((item, i) => {
        const match = item.textContent.toLowerCase().includes(q);
        item.toggleAttribute('data-hidden', !match);
        item.classList.remove('is-selected');
        if (match && visibleIndex === 0) {
            item.classList.add('is-selected');
        }
        if (match) visibleIndex++;
    });
    paletteIndex = 0;
}
function visibleItems() {
    return paletteItems.filter(i => !i.hasAttribute('data-hidden'));
}
function selectPaletteItem(item) {
    if (!item) return;
    const href = item.dataset.href;
    closePalette();
    if (item.dataset.external) {
        window.open(href, href.startsWith('mailto:') ? '_self' : '_blank', 'noopener,noreferrer');
    } else {
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    }
}

if (paletteTrigger) {
    paletteTrigger.addEventListener('click', openPalette);
    paletteInput.addEventListener('input', () => filterPalette(paletteInput.value));
    paletteOverlay.addEventListener('click', e => {
        if (e.target === paletteOverlay) closePalette();
    });
    paletteResults.addEventListener('click', e => {
        const li = e.target.closest('li');
        if (li) selectPaletteItem(li);
    });
    document.addEventListener('keydown', e => {
        const isMod = e.ctrlKey || e.metaKey;
        if (isMod && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            paletteOverlay.hidden ? openPalette() : closePalette();
        } else if (!paletteOverlay.hidden) {
            const items = visibleItems();
            if (e.key === 'Escape') {
                closePalette();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                paletteIndex = Math.min(paletteIndex + 1, items.length - 1);
                items.forEach(i => i.classList.remove('is-selected'));
                items[paletteIndex]?.classList.add('is-selected');
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                paletteIndex = Math.max(paletteIndex - 1, 0);
                items.forEach(i => i.classList.remove('is-selected'));
                items[paletteIndex]?.classList.add('is-selected');
            } else if (e.key === 'Enter') {
                selectPaletteItem(items[paletteIndex]);
            }
        }
    });
}

// ---------- Interactive terminal ----------
(() => {
    const termBody = document.getElementById('term-body');
    const termInput = document.getElementById('term-input');
    if (!termBody || !termInput) return;

    // Values here mirror the rest of the page; keep in sync if content changes.
    const commands = {
        help: 'Available commands: <strong>whoami</strong>, <strong>experience</strong>, <strong>opensource</strong>, <strong>projects</strong>, <strong>skills</strong>, <strong>education</strong>, <strong>contact</strong>, <strong>resume</strong>, <strong>clear</strong>',
        whoami: "Jayanth Sai Yarlagadda — software engineer. M.S. Software Engineering @ San José State University. Open to full-time SWE roles.",
        experience: 'Microsoft — SWE Intern, Security Platform &amp; AI (May–Aug 2026): built FluxBridge, a multi-tenant security telemetry pipeline on AKS.<br>AWS Academy — Cloud Intern (2023): secure 2-tier AWS deployment, ~40% less over-permissioned IAM access.',
        opensource: 'aws/aws-lambda-runtime-interface-emulator #185 · rapidsai/cudf #23286 (cudfgrep) · openai/harmony #148 &amp; #149 · NVIDIA/garak #1955 · openai/tiktoken #590',
        projects: 'comma.ai Controls Challenge · Production-Ready Cloud Infrastructure (Terraform/Docker/AWS) · Mobile Edge Computing (iFogSim)',
        skills: 'Python, Java, C++, C#, Go, Rust, JavaScript/TypeScript · AWS, Azure, Kubernetes, Terraform, Docker · OpenTelemetry, Prometheus, Grafana',
        education: 'San José State University — M.S. Software Engineering (2025–2026) · SRM Institute of Science and Technology — B.Tech CSE (2020–2024)',
        contact: 'Email: <a href="mailto:jayanthyarlagadda@gmail.com">jayanthyarlagadda@gmail.com</a> · <a href="https://www.linkedin.com/in/jay-yarlagadda/" target="_blank" rel="noopener noreferrer">LinkedIn</a> · <a href="https://github.com/JayYarlagadda" target="_blank" rel="noopener noreferrer">GitHub</a>',
        sudo: 'Nice try. Permission denied — but I appreciate the confidence.',
        coffee: '☕ error: coffee.exe not found on this machine. Try a Bay Area café instead.'
    };
    commands.resume = () => {
        const a = document.createElement('a');
        a.href = 'assets/Jayanth_Resume.pdf';
        a.download = '';
        document.body.appendChild(a);
        a.click();
        a.remove();
        return 'Downloading résumé…';
    };

    function printOutput(html) {
        const line = document.createElement('div');
        line.className = 'term-line';
        const out = document.createElement('span');
        out.className = 'term-out';
        out.innerHTML = html; // only ever called with our own authored strings above
        line.appendChild(out);
        termBody.appendChild(line);
        termBody.scrollTop = termBody.scrollHeight;
    }

    function printEcho(text) {
        const line = document.createElement('div');
        line.className = 'term-line';
        const prompt = document.createElement('span');
        prompt.className = 'term-prompt';
        prompt.textContent = '$ ';
        const echo = document.createElement('span');
        echo.className = 'term-echo';
        echo.textContent = text; // user input rendered as plain text only, never HTML
        line.appendChild(prompt);
        line.appendChild(echo);
        termBody.appendChild(line);
        termBody.scrollTop = termBody.scrollHeight;
    }

    const history = [];
    let historyIndex = -1;

    function runCommand(raw) {
        const cmd = raw.trim();
        if (!cmd) return;
        printEcho(cmd);
        history.push(cmd);
        historyIndex = history.length;

        const key = cmd.toLowerCase();
        if (key === 'clear') {
            termBody.innerHTML = '';
            return;
        }
        const entry = commands[key];
        if (typeof entry === 'function') {
            printOutput(entry());
        } else if (typeof entry === 'string') {
            printOutput(entry);
        } else {
            printOutput('command not found. Type <strong>help</strong> for a list.');
        }
    }

    termInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            runCommand(termInput.value);
            termInput.value = '';
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                termInput.value = history[historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < history.length - 1) {
                historyIndex++;
                termInput.value = history[historyIndex];
            } else {
                historyIndex = history.length;
                termInput.value = '';
            }
        }
    });

    document.querySelectorAll('.term-quick-cmds button').forEach(btn => {
        btn.addEventListener('click', () => {
            runCommand(btn.dataset.cmd);
            termInput.focus();
        });
    });

    document.querySelector('.term-window')?.addEventListener('click', () => termInput.focus());
})();

// Footer year already set above; no contact form on this page anymore —
// Email / LinkedIn / GitHub are plain links, nothing to wire up here.
