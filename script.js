// Core Data Management
const STORAGE_KEY = 'educational_videos';
const CODES_KEY = 'lesson_access_codes';

// Simple Device Fingerprinting
function getDeviceID() {
    let id = localStorage.getItem('device_fingerprint');
    if (!id) {
        id = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem('device_fingerprint', id);
    }
    return id;
}

function getVideos() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveVideo(title, url) {
    const videos = getVideos();
    videos.push({ id: Date.now(), title, url });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
}

function deleteVideo(id) {
    let videos = getVideos();
    videos = videos.filter(v => v.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
}

// Code Management
function getCodes() {
    return JSON.parse(localStorage.getItem(CODES_KEY)) || [];
}

function saveCodes(codes) {
    localStorage.setItem(CODES_KEY, JSON.stringify(codes));
}

function generateRandomCode() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 15; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Security Logic
// Security Logic
function applyProtection() {
    // 1. Disable Key Shortcuts (F12, etc. - Optional, but keeping basic ones except F12)
    document.addEventListener('keydown', e => {
        if (
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
            (e.ctrlKey && e.key === 'u') || // Block View Source
            (e.ctrlKey && e.key === 's') || // Block Save Page
            (e.metaKey && e.shiftKey && e.key === '4') || // MacOS screenshot
            e.key === 'PrintScreen'
        ) {
            if (e.key !== 'F12') { // Let F12 work for Inspect
                e.preventDefault();
                return false;
            }
        }
    });

    // 2. Blur on Focus Loss (Prevent Screen Capture by switching windows)
    window.addEventListener('blur', () => {
        document.body.classList.add('protection-blur');
        toggleBlackout(true);
    });

    window.addEventListener('focus', () => {
        document.body.classList.remove('protection-blur');
        toggleBlackout(false);
    });

    // 3. Enhanced Recording Protection
    applyEnhancedProtection();

    // 4. Console log warning
    console.log("%cتحذير! محاولة تصوير الشاشة أو سرقة المحتوى ستعرض حسابك للحظر.", "color: red; font-size: 20px; font-weight: bold;");
}

function applyEnhancedProtection() {
    // A. Detect Visibility Change (Control Center / App Switcher)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            toggleBlackout(true);
        } else {
            setTimeout(() => toggleBlackout(false), 500);
        }
    });

    // B. Block MediaDevices Screen Capture API (Browser level)
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia = () => {
            alert('⚠️ محاولة تسجيل الشاشة محظورة!');
            toggleBlackout(true);
            return Promise.reject('Screen recording blocked');
        };
    }

    // C. Detect Window Resize (indicating split screen or recording prep)
    window.addEventListener('resize', () => {
        toggleBlackout(true);
        setTimeout(() => toggleBlackout(false), 1000);
    });

    // D. Detect Mouse Leave (Optional: Blackout if mouse leaves video area)
    const playerArea = document.getElementById('fullPlayer');
    if (playerArea) {
        playerArea.addEventListener('mouseleave', () => {
            // Only blackout if NOT using DevTools (approximated)
            if (!document.fullscreenElement) {
                toggleBlackout(true);
                setTimeout(() => toggleBlackout(false), 800);
            }
        });
    }

    // E. FPS Check for recording stress
    let lastTime = performance.now();
    let frames = 0;
    const checkFPS = () => {
        const now = performance.now();
        frames++;
        if (now > lastTime + 1000) {
            const fps = Math.round((frames * 1000) / (now - lastTime));
            if (fps < 15 && frames > 0) {
                // Severe lag detection - possibly recording
            }
            frames = 0;
            lastTime = now;
        }
        requestAnimationFrame(checkFPS);
    };
    requestAnimationFrame(checkFPS);

    // F. Block Copying
    document.addEventListener('copy', e => e.preventDefault());
}

// Helper: Extract Embed URL for YouTube and Google Drive
function getEmbedUrl(url) {
    let videoId = '';

    // 1. YouTube Support
    if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1].split('&')[0];
        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&controls=1`;
    } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&controls=1`;
    }

    // 2. Google Drive Support
    else if (url.includes('drive.google.com')) {
        // Find the ID between /d/ and /view (or the end)
        const driveRegex = /\/d\/([^\/]+)/;
        const match = url.match(driveRegex);
        if (match && match[1]) {
            videoId = match[1];
            return `https://drive.google.com/file/d/${videoId}/preview`;
        }
    }

    return url; // Assume it's already an embed link or other source
}

function toggleBlackout(show) {
    const blackout = document.getElementById('blackout');
    if (blackout) {
        blackout.style.display = show ? 'flex' : 'none';
        if (show) {
            // Optional: Pause video if possible via postMessage for YouTube/Drive
            const iframe = document.querySelector('iframe');
            if (iframe) iframe.style.pointerEvents = 'none';
        } else {
            const iframe = document.querySelector('iframe');
            if (iframe) iframe.style.pointerEvents = 'auto';
        }
    }
}
