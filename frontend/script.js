document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark')
    } else {
        document.documentElement.classList.remove('dark')
    }
})
const navbar = document.getElementById("navbar");
const navLink = document.getElementById("navLink");
const mobileMenu = document.getElementById("mobileMenu");

function openMenu() {
    mobileMenu.style.transform = 'translateX(-16rem)';
}

function closeMenu() {
    mobileMenu.style.transform = 'translateX(0)';
}

function toggleTheme() {
    document.documentElement.classList.toggle('dark');

    if (document.documentElement.classList.contains('dark')) {
        localStorage.theme = 'dark';
    } else {
        localStorage.theme = 'light';
    }
}

window.addEventListener('scroll', () => {
    if (scrollY > 50) {
        navbar.classList.add('bg-white', 'bg-opacity-50', 'backdrop-blur-lg', 'shadow-sm', 'dark:bg-darkTheme', 'dark:shadow-white/20');
        navLink.classList.remove('bg-white', 'shadow-sm', 'bg-opacity-50', 'dark:border', 'dark:border-white/30', "dark:bg-transparent");
    } else {
        navbar.classList.remove('bg-white', 'bg-opacity-50', 'backdrop-blur-lg', 'shadow-sm', 'dark:bg-darkTheme', 'dark:shadow-white/20');
        navLink.classList.add('bg-white', 'shadow-sm', 'bg-opacity-50', 'dark:border', 'dark:border-white/30', "dark:bg-transparent");
    }
})

// Camera functions
const VISION_API_URL = 'http://localhost:8000/api/vision/quality/';
let currentStream = null;

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        });
        
        const video = document.getElementById('videoStream');
        video.srcObject = stream;
        currentStream = stream;
        
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('stopBtn').style.display = 'inline-block';
        document.getElementById('checkBtn').disabled = false;
        
        console.log('Caméra activée avec succès');
        
    } catch (err) {
        if (err.name === 'NotAllowedError') {
            alert('Permission refusée - Veuillez autoriser l\'accès à la caméra');
        } else if (err.name === 'NotFoundError') {
            alert('Aucune caméra détectée sur votre ordinateur');
        } else if (err.name === 'NotReadableError') {
            alert('La caméra est utilisée par une autre application');
        } else {
            console.error('Erreur caméra:', err);
            alert('Erreur lors de l\'accès à la caméra');
        }
    }
}

function stopCamera() {
    const video = document.getElementById('videoStream');
    const stream = video.srcObject;
    
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }

    currentStream = null;
    document.getElementById('checkBtn').disabled = true;
    document.getElementById('visionStatus').textContent = '';
    
    document.getElementById('startBtn').style.display = 'inline-block';
    document.getElementById('stopBtn').style.display = 'none';
    
    console.log('Caméra désactivée');
}

async function checkVision() {
    const status = document.getElementById('visionStatus');
    const video = document.getElementById('videoStream');

    if (!currentStream || !video.videoWidth) {
        status.textContent = 'Caméra non prête.';
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.85);

    status.textContent = 'Analyse en cours...';

    try {
        const response = await fetch(VISION_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: imageData })
        });

        const data = await response.json();
        if (!response.ok) {
            status.textContent = data.error || 'Erreur lors de l\'analyse.';
            return;
        }

        const label = data.ok ? 'Vision normale' : 'Vision faible';
        const reason = data.reason && data.reason !== 'fallback' ? ` — ${data.reason}` : '';
        const src = data.source === 'vlm' ? ' [IA]' : '';
        status.textContent = `${label} (score: ${data.score})${reason}${src}`;
    } catch (err) {
        console.error('Erreur vision:', err);
        status.textContent = 'Erreur réseau ou serveur.';
    }
}