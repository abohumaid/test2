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
// Security Logic
function applyProtection() {
    // 1. Mandatory Environment Check
    if (!checkBrowserAndGPU()) return;

    // 2. Disable Key Shortcuts (except F12 for owner/inspect)
    document.addEventListener('keydown', e => {
        if (
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
            (e.ctrlKey && e.key === 'u') ||
            (e.ctrlKey && e.key === 's') ||
            (e.metaKey && e.shiftKey && e.key === '4') ||
            e.key === 'PrintScreen'
        ) {
            if (e.key !== 'F12') {
                e.preventDefault();
                return false;
            }
        }
    });

    // 3. Focus/Visibility Protection
    window.addEventListener('blur', () => {
        document.body.classList.add('protection-blur');
        toggleBlackout(true);
    });
    window.addEventListener('focus', () => {
        document.body.classList.remove('protection-blur');
        toggleBlackout(false);
    });

    // 4. Enhanced Recording Protection
    applyEnhancedProtection();

    console.log("%cSECURITY: Widevine DRM & Hardware Protection Active.", "color: green; font-size: 15px; font-weight: bold;");
}

function checkBrowserAndGPU() {
    const ua = navigator.userAgent;
    const isWindows = /Windows/i.test(ua);
    const isChrome = /Chrome/i.test(ua) && !/Edg/i.test(ua) && !/OPR/i.test(ua);
    const isEdge = /Edg/i.test(ua);

    if (!isWindows || (!isChrome && !isEdge)) {
        document.body.innerHTML = `
            <div style="background:#0f172a; color:white; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:2rem; font-family:sans-serif;">
                <h1 style="color:#ef4444; margin-bottom:1rem;">⚠️ الوصول مرفوض!</h1>
                <p style="font-size:1.2rem; max-width:600px;">هذا المحتوى محمي بنظام DRM. يرجى استخدام متصفح <b>Google Chrome</b> أو <b>Microsoft Edge</b> على نظام <b>Windows</b> فقط.</p>
                <div style="margin-top:2rem; padding:1rem; border:1px solid rgba(255,255,255,0.1); border-radius:10px;">
                    يرجى التأكد أيضاً من تفعيل ميزة <b>Hardware Acceleration</b> من إعدادات المتصفح لضمان عمل الحماية.
                </div>
            </div>
        `;
        return false;
    }

    // GPU Hardware Acceleration check
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
        alert("يرجى تفعيل Hardware Acceleration في المتصفح لتشغيل الفيديو الأمن.");
        return false;
    }
    return true;
}

async function initDRMPlayer(videoElement, manifestUri, licenseServerUri) {
    if (!shaka.Player.isBrowserSupported()) {
        console.error('Browser not supported for DRM');
        return;
    }

    const player = new shaka.Player(videoElement);

    // Configure DRM Licenses
    player.configure({
        drm: {
            servers: {
                'com.widevine.alpha': licenseServerUri
            }
        }
    });

    try {
        await player.load(manifestUri);
        console.log('The video has now been loaded!');
    } catch (e) {
        console.error('Error loading DRM content', e);
    }
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

        // Mobile Specific: Block Long-press (Context Menu) on the player area
        playerArea.addEventListener('contextmenu', e => {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile) {
                e.preventDefault();
                return false;
            }
        });
    }

    // E. Block Picture-in-Picture (PiP)
    document.addEventListener('enterpictureinpicture', (event) => {
        if (document.exitPictureInPicture) {
            document.exitPictureInPicture();
        }
        alert('⚠️ وضع النافذة العائمة (PiP) محظور لدواعي أمنية!');
    }, true);

    // F. FPS Check for recording stress
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

    // G. Block Copying
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
