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
        const exitAction = () => {
            const wrapper = document.querySelector('.video-wrapper');
            if (wrapper && !wrapper.classList.contains('security-blur')) {
                wrapper.classList.add('security-blur');
            }
            if (window.closePlayer) {
                console.warn("Security Breach: Closing Player");
                window.closePlayer();
            }
        };

        const toggleShield = (show) => {
            // Check if the current focused element is the iframe
            setTimeout(() => {
                const active = document.activeElement;
                const isIframe = active && (active.tagName === 'IFRAME' || active.id === 'videoPlayer');

                if (show && !isIframe) {
                    exitAction();
                }
            }, 200); // 200ms grace period for clicking/loading
        };

        window.addEventListener('blur', () => toggleShield(true));
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) toggleShield(true);
        });

        // Heartbeat Focus Check - More forgiving
        setInterval(() => {
            const playerOpen = document.getElementById('playerSection')?.style.display === 'block';
            if (playerOpen) {
                const active = document.activeElement;
                const isIframe = active && (active.tagName === 'IFRAME' || active.id === 'videoPlayer');

                if (!document.hasFocus() && !isIframe) {
                    this.triggerAlert("تم إيقاف الفيديو للأمان. يرجى المتابعة داخل المتصفح.");
                    exitAction();
                }
            }
        }, 3000);

        // Detection for Browser-native Screen Capture
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            navigator.mediaDevices.getDisplayMedia = async (options) => {
                this.triggerAlert("محاولة تسجيل الشاشة محظورة!");
                exitAction();
                throw new Error("Screen capture blocked by security policy.");
            };
        }
    },

    // 3. Environment Monitoring
    monitorEnvironment() {
        const checkDevTools = () => {
            const threshold = 160;
            if (window.outerWidth - window.innerWidth > threshold ||
                window.outerHeight - window.innerHeight > threshold) {
                this.triggerAlert("تم اكتشاف محاولة تلاعب بالمتصفح. يرجى المتابعة بشكل طبيعي.");
            }
        };
        setInterval(checkDevTools, 5000);

        // Frame Rate (FPS) Monitoring
        let lastTime = performance.now();
        let frames = 0;
        const checkFPS = () => {
            frames++;
            const now = performance.now();
            if (now >= lastTime + 1000) {
                const fps = frames;
                if (fps < 15 && document.visibilityState === 'visible') {
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
            this.intervals.push(setInterval(move, 4000 + Math.random() * 4000));
        }

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
        alertEl.innerHTML = `<div class="card" style="padding: 20px; max-width: 300px;">${msg}</div>`;
        document.body.appendChild(alertEl);

        setTimeout(() => alertEl.remove(), 3000);
    },

    showSafetyCheck(onProceed) {
        const backdrop = document.createElement('div');
        backdrop.className = 'safety-modal-backdrop';
        backdrop.innerHTML = `
            <div class="safety-content">
                <div class="safety-icon">⚠️</div>
                <h3>تنبيه أمني هام</h3>
                <p>للتمكن من مشاهدة الدرس، يرجى التأكد من إغلاق كافة تطبيقات "تسجيل الشاشة" (مثل DU Recorder). </p>
                <p style="font-size: 0.8rem; color: #ffbcbc;">إذا تم الكشف عن أي تلاعب، سيتم إغلاق الفيديو تلقائياً.</p>
                <button id="safetyProceedBtn">لقد أغلقت تطبيقات التسجيل - ابدأ</button>
            </div>
        `;
        document.body.appendChild(backdrop);

        document.getElementById('safetyProceedBtn').onclick = () => {
            backdrop.remove();
            if (onProceed) onProceed();
        };
    },

    validateCode(inputCode, targetLesson) {
        const storedLessons = JSON.parse(localStorage.getItem('school_lessons') || '[]');
        const lesson = storedLessons.find(l => l.id === targetLesson.id);
        return lesson && lesson.code === inputCode;
    }
};

Security.init();
window.Security = Security;
