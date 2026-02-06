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
function applyProtection() {
    // 1. Disable Right Click
    document.addEventListener('contextmenu', e => e.preventDefault());

    // 2. Disable Key Shortcuts (F12, Ctrl+Shift+I, etc.)
    document.addEventListener('keydown', e => {
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
            (e.ctrlKey && e.key === 'u') || // Block View Source
            (e.ctrlKey && e.key === 's') || // Block Save Page
            (e.metaKey && e.shiftKey && e.key === '4') || // MacOS screenshot
            e.key === 'PrintScreen'
        ) {
            e.preventDefault();
            return false;
        }
    });

    // 3. DevTools Detection - Debugger Loop
    setInterval(() => {
        const startTime = performance.now();
        debugger; // If DevTools is open, it will pause here
        const endTime = performance.now();
        if (endTime - startTime > 100) {
            document.body.innerHTML = "<h1 style='color:white; text-align:center; padding-top:20%; font-family:sans-serif;'>⚠️ تم كشف محاولة اختراق! يرجى إغلاق أدوات المطور (Inspect Element) وإعادة تحميل الصفحة.</h1>";
        }
    }, 1000);

    // 4. Blur on Focus Loss (Prevent Screen Capture by switching windows)
    window.addEventListener('blur', () => {
        document.body.classList.add('protection-blur');
        toggleBlackout(true);
    });

    window.addEventListener('focus', () => {
        document.body.classList.remove('protection-blur');
        toggleBlackout(false);
    });

    // 5. Console log warning
    console.log("%cتحذير! محاولة تصوير الشاشة أو سرقة المحتوى ستعرض حسابك للحظر.", "color: red; font-size: 20px; font-weight: bold;");
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
