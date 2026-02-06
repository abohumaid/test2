/**
 * Security Engine for Educational Platform
 * Protects video content from screen recording and unauthorized access.
 */

const Security = {
    watermarkInstances: [],
    intervals: [],

    init() {
        this.preventInspect();
        this.initFocusProtection();
        this.monitorEnvironment();
        console.log("Security Engine V2 (Aggressive) Initialized");
    },

    // 1. Prevent Inspect & Shortcuts
    preventInspect() {
        document.addEventListener('contextmenu', e => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            e.preventDefault();
        });
        document.addEventListener('keydown', e => {
            const forbiddenKeys = ['F12', 'PrintScreen'];
            if (
                forbiddenKeys.includes(e.key) ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
                (e.ctrlKey && (e.key === 'u' || e.key === 'p'))
            ) {
                e.preventDefault();
                this.triggerAlert("تم تعطيل هذه الخاصية لحماية المحتوى.");
            }
        });
    },

    // 2. Focus & Visibility Protection
    initFocusProtection() {
        const toggleShield = (show) => {
            const wrapper = document.querySelector('.video-wrapper');
            if (!wrapper) return;
            if (show) wrapper.classList.add('security-blur');
            else wrapper.classList.remove('security-blur');
        };

        window.addEventListener('blur', () => toggleShield(true));
        window.addEventListener('focus', () => toggleShield(false));
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) toggleShield(true);
        });
    },

    // 3. Environment Monitoring
    monitorEnvironment() {
        // DevTools Detection
        const checkDevTools = () => {
            const threshold = 160;
            if (window.outerWidth - window.innerWidth > threshold ||
                window.outerHeight - window.innerHeight > threshold) {
                this.triggerAlert("تم اكتشاف محاولة تلاعب بالمتصفح. يرجى المتابعة بشكل طبيعي.");
            }
        };
        setInterval(checkDevTools, 2000);

        // Frame Rate (FPS) Monitoring - Screen recording usually drops FPS
        let lastTime = performance.now();
        let frames = 0;
        const checkFPS = () => {
            frames++;
            const now = performance.now();
            if (now >= lastTime + 1000) {
                const fps = frames;
                if (fps < 20 && document.visibilityState === 'visible') {
                    // Possible recording or lag - trigger interference
                    document.querySelector('.security-noise')?.classList.add('aggressive');
                } else {
                    document.querySelector('.security-noise')?.classList.remove('aggressive');
                }
                frames = 0;
                lastTime = now;
            }
            requestAnimationFrame(checkFPS);
        };
        requestAnimationFrame(checkFPS);
    },

    // 4. Multi-instance Watermark
    startWatermark(code) {
        this.stopWatermark();
        const wrapper = document.querySelector('.video-wrapper');
        if (!wrapper) return;

        // Create 3 watermark instances
        for (let i = 0; i < 3; i++) {
            const el = document.createElement('div');
            el.className = 'security-watermark';
            el.textContent = code;
            wrapper.appendChild(el);
            this.watermarkInstances.push(el);

            const move = () => {
                const x = Math.random() * 80 + 5;
                const y = Math.random() * 80 + 5;
                el.style.left = `${x}%`;
                el.style.top = `${y}%`;
                el.style.opacity = (Math.random() * 0.15 + 0.05).toString();
                el.style.transform = `scale(${0.8 + Math.random() * 0.4}) rotate(${Math.random() * 20 - 10}deg)`;
            };

            move();
            this.intervals.push(setInterval(move, 3000 + Math.random() * 4000));
        }

        // Add Interference Layer
        const noise = document.createElement('div');
        noise.className = 'security-noise';
        wrapper.appendChild(noise);
        this.watermarkInstances.push(noise);
    },

    stopWatermark() {
        this.intervals.forEach(clearInterval);
        this.intervals = [];
        this.watermarkInstances.forEach(el => el.remove());
        this.watermarkInstances = [];
    },

    triggerAlert(msg) {
        const existing = document.querySelector('.security-alert');
        if (existing) return;

        const alertEl = document.createElement('div');
        alertEl.className = 'security-alert';
        alertEl.innerHTML = `<div class="card">${msg}</div>`;
        document.body.appendChild(alertEl);

        setTimeout(() => alertEl.remove(), 3000);
    },

    validateCode(inputCode, targetLesson) {
        const storedLessons = JSON.parse(localStorage.getItem('school_lessons') || '[]');
        const lesson = storedLessons.find(l => l.id === targetLesson.id);
        return lesson && lesson.code === inputCode;
    }
};

Security.init();
window.Security = Security;
