/**
 * Security Engine for Educational Platform
 * Protects video content from screen recording and unauthorized access.
 */

const Security = {
    watermarkElement: null,
    watermarkInterval: null,

    init() {
        this.preventInspect();
        this.initFocusProtection();
        console.log("Security Engine Initialized");
    },

    // 1. Prevent Inspect & Shortcuts
    preventInspect() {
        document.addEventListener('contextmenu', e => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            e.preventDefault();
        });
        document.addEventListener('keydown', e => {
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
                (e.ctrlKey && e.key === 'u')
            ) {
                e.preventDefault();
                alert("تم تعطيل أدوات المطور لحماية المحتوى.");
            }
        });
    },

    // 2. Focus Protection (Blur on exit)
    initFocusProtection() {
        window.addEventListener('blur', () => {
            const wrapper = document.querySelector('.video-wrapper');
            if (wrapper) wrapper.classList.add('security-blur');
        });

        window.addEventListener('focus', () => {
            const wrapper = document.querySelector('.video-wrapper');
            if (wrapper) wrapper.classList.remove('security-blur');
        });
    },

    // 3. Dynamic Watermark
    startWatermark(code) {
        if (this.watermarkInterval) clearInterval(this.watermarkInterval);

        const wrapper = document.querySelector('.video-wrapper');
        if (!wrapper) return;

        // Create watermark if not exists
        if (!this.watermarkElement) {
            this.watermarkElement = document.createElement('div');
            this.watermarkElement.id = 'watermark';
            wrapper.appendChild(this.watermarkElement);
        }

        this.watermarkElement.textContent = code;

        const moveWatermark = () => {
            const x = Math.random() * 80 + 5; // 5% to 85%
            const y = Math.random() * 80 + 5;
            this.watermarkElement.style.left = `${x}%`;
            this.watermarkElement.style.top = `${y}%`;
            this.watermarkElement.style.opacity = (Math.random() * 0.2 + 0.1).toString();
        };

        moveWatermark();
        this.watermarkInterval = setInterval(moveWatermark, 5000 + Math.random() * 5000); // 5-10s
    },

    // 4. Verification Check
    validateCode(inputCode, targetLesson) {
        const storedLessons = JSON.parse(localStorage.getItem('school_lessons') || '[]');
        const lesson = storedLessons.find(l => l.id === targetLesson.id);
        return lesson && lesson.code === inputCode;
    }
};

Security.init();
window.Security = Security;
