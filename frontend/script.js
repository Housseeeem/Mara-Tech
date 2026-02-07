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
let visionScore = null;
let hasLowVision = false;

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

        // Determine vision level based on score
        let label = '';
        if (data.score >= 70) {
            label = 'Vision normale';
        } else if (data.score >= 40) {
            label = 'Vision faible';
        } else {
            label = 'Vision très faible';
        }
        
        const reason = data.reason && data.reason !== 'fallback' ? ` — ${data.reason}` : '';
        const src = data.source === 'vlm' ? ' [IA]' : '';
        status.textContent = `${label} (score: ${data.score})${reason}${src}`;
        
        // Store vision score and status
        visionScore = data.score;
        hasLowVision = data.score < 70;
        
        speakResult(data.score >= 70, data.score, data.reason);
    } catch (err) {
        console.error('Erreur vision:', err);
        status.textContent = 'Erreur réseau ou serveur.';
    }
}

function speakResult(ok, score, reason) {
    const message = ok 
        ? `Vision normale, score ${score}` 
        : `Vision faible, score ${score}`;
    
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9;
    
    utterance.onend = () => {
        setTimeout(() => {
            listenForConfirmation();
        }, 500);
    };
    
    speechSynthesis.speak(utterance);
}

function listenForConfirmation() {
    const status = document.getElementById('visionStatus');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        status.innerHTML += '<br><span style="color: #999;">(Reconnaissance vocale non supportée)</span>';
        return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    // Create microphone indicator element
    let micIndicator = document.getElementById('micIndicator');
    if (!micIndicator) {
        micIndicator = document.createElement('div');
        micIndicator.id = 'micIndicator';
        status.parentNode.insertBefore(micIndicator, status.nextSibling);
    }
    
    micIndicator.innerHTML = '<div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ff6b6b; border-radius: 4px;"><span class="listening-indicator" style="color: #ff6b6b; font-weight: bold; font-size: 1.2em;">🎤 Enregistrement en cours...</span><br><span style="font-size: 0.95em; color: #555;">Dites "oui" ou "d\'accord"</span></div>';
    
    recognition.start();
    
    recognition.onstart = () => {
        console.log('Reconnaissance vocale démarrée');
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        const confidence = event.results[0][0].confidence;
        
        const confirmationWords = ['oui', 'ok', 'okay', 'd\'accord', 'accord', 'confirmer', 'confirme', 'valider', 'valide', 'yes'];
        const isConfirmed = confirmationWords.some(word => transcript.includes(word));
        
        micIndicator.innerHTML = `<div style="margin-top: 20px; padding: 15px; background: ${isConfirmed ? '#d4edda' : '#f8d7da'}; border-left: 4px solid ${isConfirmed ? '#28a745' : '#dc3545'}; border-radius: 4px;"><strong>Vous avez dit:</strong> "${transcript}"<br><strong>Confiance:</strong> ${(confidence * 100).toFixed(0)}%<br><strong>Résultat:</strong> ${isConfirmed ? '✓ Confirmé' : '✗ Non confirmé'}</div>`;
        
        // If confirmed, apply UI adaptations based on vision score level
        if (isConfirmed) {
            if (visionScore >= 70) {
                // Normal vision - no adaptation needed
                console.log('Vision normale - pas d\'adaptation');
            } else if (visionScore >= 40) {
                // Medium low vision
                setTimeout(() => {
                    applyMediumAccessibilityMode();
                    document.getElementById('accessibilityControlPanel').style.display = 'block';
                }, 1000);
            } else {
                // Extreme low vision
                setTimeout(() => {
                    applyAccessibilityMode();
                    document.getElementById('accessibilityControlPanel').style.display = 'block';
                }, 1000);
            }
        }
    };
    
    recognition.onerror = (event) => {
        micIndicator.innerHTML = `<div style="margin-top: 20px; padding: 15px; background: #f8d7da; border-left: 4px solid #dc3545; border-radius: 4px;"><strong style="color: #721c24;">Erreur:</strong> ${event.error}</div>`;
    };
    
    recognition.onend = () => {
        console.log('Reconnaissance vocale terminée');
    };
}

// ===== VOICE NAVIGATION SYSTEM =====
const voiceNavItems = [
    { name: 'Home', keywords: ['home', 'accueil', 'début'], target: '#top' },
    { name: 'About us', keywords: ['about', 'about us', 'à propos', 'about me'], target: '#about' },
    { name: 'Camera', keywords: ['camera', 'caméra', 'photo', 'appareil photo'], target: '#camera' },
    { name: 'Banking', keywords: ['banking', 'banque', 'compte', 'account', 'financial'], target: '#banking' },
    { name: 'Shopping', keywords: ['shopping', 'shop', 'acheter', 'courses', 'magasin', 'market'] , target: '#shopping' }
];

function getVoiceNavOptions() {
    return voiceNavItems.map(item => item.name).join(', ');
}

function startVoiceNavigation() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        alert('Reconnaissance vocale non supportée sur votre navigateur');
        return;
    }
    
    // Read available options
    const navMessage = `Available options: ${getVoiceNavOptions()}. Please say which section you want to visit.`;
    const utterance = new SpeechSynthesisUtterance(navMessage);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    
    utterance.onend = () => {
        setTimeout(() => {
            listenForNavigation();
        }, 500);
    };
    
    speechSynthesis.speak(utterance);
}

function listenForNavigation() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    // Create or update voice nav indicator
    let voiceIndicator = document.getElementById('voiceNavIndicator');
    if (!voiceIndicator) {
        voiceIndicator = document.createElement('div');
        voiceIndicator.id = 'voiceNavIndicator';
        document.body.appendChild(voiceIndicator);
    }
    
    voiceIndicator.innerHTML = `<div style="position: fixed; bottom: 30px; right: 30px; padding: 20px; background: #e7f3ff; border: 2px solid #0066cc; border-radius: 8px; z-index: 999; max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"><span class="listening-indicator" style="color: #0066cc; font-weight: bold; font-size: 1.1em;">🎤 Listening for navigation...</span><br><span style="font-size: 0.9em; color: #333; margin-top: 8px; display: block;">Say: ${getVoiceNavOptions()}</span></div>`;
    
    recognition.start();
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        const confidence = event.results[0][0].confidence;
        
        let matchedItem = null;
        let highestScore = 0;
        
        for (const item of voiceNavItems) {
            for (const keyword of item.keywords) {
                if (transcript.includes(keyword)) {
                    const score = keyword.length;
                    if (score > highestScore) {
                        highestScore = score;
                        matchedItem = item;
                    }
                }
            }
        }
        
        voiceIndicator.innerHTML = `<div style="position: fixed; bottom: 30px; right: 30px; padding: 20px; background: ${matchedItem ? '#d4edda' : '#f8d7da'}; border: 2px solid ${matchedItem ? '#28a745' : '#dc3545'}; border-radius: 8px; z-index: 999; max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"><strong>You said:</strong> "${transcript}"<br><strong>Confidence:</strong> ${(confidence * 100).toFixed(0)}%<br><strong>Navigating to:</strong> ${matchedItem ? matchedItem.name : 'No match found'}</div>`;
        
        if (matchedItem) {
            setTimeout(() => {
                window.location.hash = matchedItem.target;
                const element = document.querySelector(matchedItem.target);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
                
                // Announce navigation
                const navAnnounce = new SpeechSynthesisUtterance(`Navigating to ${matchedItem.name}`);
                navAnnounce.lang = 'en-US';
                speechSynthesis.speak(navAnnounce);
                
                setTimeout(() => {
                    voiceIndicator.remove();
                }, 3000);
            }, 1500);
        } else {
            setTimeout(() => {
                voiceIndicator.remove();
            }, 3000);
        }
    };
    
    recognition.onerror = (event) => {
        voiceIndicator.innerHTML = `<div style="position: fixed; bottom: 30px; right: 30px; padding: 20px; background: #f8d7da; border: 2px solid #dc3545; border-radius: 8px; z-index: 999; max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"><strong style="color: #721c24;">Error:</strong> ${event.error}</div>`;
        setTimeout(() => {
            voiceIndicator.remove();
        }, 3000);
    };
}

// ===== ACCESSIBILITY MODE FOR LOW VISION USERS =====
function testVisionScore(score) {
    const status = document.getElementById('visionStatus');
    let label = '';
    let mode = '';
    
    // Determine vision level
    if (score >= 70) {
        label = 'Vision normale';
        mode = 'normal';
    } else if (score >= 40) {
        label = 'Vision faible';
        mode = 'medium';
    } else {
        label = 'Vision très faible';
        mode = 'extreme';
    }
    
    // Simulate API response
    visionScore = score;
    hasLowVision = score < 70;
    
    status.textContent = `${label} (score: ${score}) [MODE TEST]`;
    
    // Apply appropriate mode
    if (score >= 70) {
        // Normal vision - disable accessibility
        disableAccessibilityMode();
        const announcement = new SpeechSynthesisUtterance(`Vision normale, score ${score}`);
        announcement.lang = 'fr-FR';
        announcement.rate = 0.9;
        speechSynthesis.speak(announcement);
    } else if (score >= 40) {
        // Medium accessibility mode
        setTimeout(() => {
            applyMediumAccessibilityMode();
            document.getElementById('accessibilityControlPanel').style.display = 'block';
        }, 500);
    } else {
        // Extreme accessibility mode
        setTimeout(() => {
            applyAccessibilityMode();
            document.getElementById('accessibilityControlPanel').style.display = 'block';
        }, 500);
    }
    
    // Show test indicator
    const colors = {
        normal: '#28a745',  // green
        medium: '#ff9800',  // orange
        extreme: '#dc3545'  // red
    };
    status.style.color = colors[mode];
    status.style.fontWeight = 'bold';
}

// ===== ACCESSIBILITY MODE FOR LOW VISION USERS =====
function applyMediumAccessibilityMode() {
    // Create or update medium accessibility stylesheet
    let mediumStyle = document.getElementById('mediumAccessibilityStyle');
    if (!mediumStyle) {
        mediumStyle = document.createElement('style');
        mediumStyle.id = 'mediumAccessibilityStyle';
        document.head.appendChild(mediumStyle);
    }
    
    mediumStyle.textContent = `
        /* Medium Vision Mode - Moderate Increases */
        body.medium-accessibility-mode {
            font-size: 16px !important;
            line-height: 1.6 !important;
        }
        
        body.medium-accessibility-mode h1 {
            font-size: 2.2em !important;
        }
        
        body.medium-accessibility-mode h2 {
            font-size: 1.8em !important;
        }
        
        body.medium-accessibility-mode h3 {
            font-size: 1.5em !important;
        }
        
        body.medium-accessibility-mode h4 {
            font-size: 1.2em !important;
        }
        
        body.medium-accessibility-mode button {
            font-size: 1.05em !important;
            padding: 12px 20px !important;
            border-width: 2px !important;
        }
        
        body.medium-accessibility-mode a {
            font-size: 1.05em !important;
        }
        
        body.medium-accessibility-mode input,
        body.medium-accessibility-mode textarea,
        body.medium-accessibility-mode select {
            font-size: 1.05em !important;
            padding: 12px !important;
            border-width: 2px !important;
        }
        
        body.medium-accessibility-mode .border {
            border-width: 2px !important;
        }
        
        body.medium-accessibility-mode li {
            margin-bottom: 8px !important;
        }
        
        /* Slight spacing increase */
        body.medium-accessibility-mode .gap-4 {
            gap: 1.2rem !important;
        }
        
        body.medium-accessibility-mode .gap-6 {
            gap: 1.5rem !important;
        }
        
        body.medium-accessibility-mode .p-6 {
            padding: 1.5rem !important;
        }
        
        body.medium-accessibility-mode .p-8 {
            padding: 1.8rem !important;
        }
        
        body.medium-accessibility-mode .rounded-lg {
            border-radius: 10px !important;
        }
        
        body.medium-accessibility-mode .rounded-2xl {
            border-radius: 14px !important;
        }
        
        /* Moderate contrast improvement */
        body.medium-accessibility-mode .border-gray-300 {
            border-color: #333 !important;
            border-width: 2px !important;
        }
        
        body.medium-accessibility-mode .dark\\:border-white\\/30 {
            border-color: #e0e0e0 !important;
            border-width: 2px !important;
        }
        
        /* Video slightly larger */
        body.medium-accessibility-mode video {
            min-height: 350px !important;
        }
        
        /* Cards with better borders */
        body.medium-accessibility-mode .rounded-2xl {
            border-width: 2px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
        }
    `;
    
    // Apply medium accessibility class to body
    document.body.classList.remove('accessibility-mode');
    document.body.classList.add('medium-accessibility-mode');
    
    // Show confirmation message
    const announcement = new SpeechSynthesisUtterance('Mode accessibilité modéré activé. Les éléments ont été légèrement agrandis.');
    announcement.lang = 'fr-FR';
    announcement.rate = 0.9;
    speechSynthesis.speak(announcement);
    
    // Show visual confirmation
    const confirmationDiv = document.createElement('div');
    confirmationDiv.style.cssText = `
        position: fixed;
        top: 100px;
        right: 30px;
        padding: 20px;
        background: #fff3cd;
        border: 3px solid #ff9800;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-size: 1.05em;
        font-weight: bold;
        max-width: 400px;
    `;
    confirmationDiv.innerHTML = `
        ⚠️ Mode accessibilité modéré activé<br>
        <span style="font-size: 0.9em; font-weight: normal; margin-top: 10px; display: block;">
            Les éléments ont été modérément agrandis pour une meilleure lisibilité.
        </span>
    `;
    document.body.appendChild(confirmationDiv);
    
    // Remove confirmation after 5 seconds
    setTimeout(() => {
        confirmationDiv.remove();
    }, 5000);
}

function applyAccessibilityMode() {
    // Create or update accessibility stylesheet
    let accessibilityStyle = document.getElementById('accessibilityStyle');
    if (!accessibilityStyle) {
        accessibilityStyle = document.createElement('style');
        accessibilityStyle.id = 'accessibilityStyle';
        document.head.appendChild(accessibilityStyle);
    }
    
    accessibilityStyle.textContent = `
        /* Low Vision Mode - Increased Sizes and Contrast */
        body.accessibility-mode {
            font-size: 18px !important;
            line-height: 1.8 !important;
        }
        
        body.accessibility-mode h1 {
            font-size: 3em !important;
        }
        
        body.accessibility-mode h2 {
            font-size: 2.5em !important;
        }
        
        body.accessibility-mode h3 {
            font-size: 2em !important;
        }
        
        body.accessibility-mode h4 {
            font-size: 1.5em !important;
        }
        
        body.accessibility-mode button {
            font-size: 1.2em !important;
            padding: 15px 24px !important;
            border-width: 3px !important;
        }
        
        body.accessibility-mode a {
            font-size: 1.1em !important;
        }
        
        body.accessibility-mode input,
        body.accessibility-mode textarea,
        body.accessibility-mode select {
            font-size: 1.1em !important;
            padding: 15px !important;
            border-width: 2px !important;
        }
        
        body.accessibility-mode .border {
            border-width: 3px !important;
        }
        
        body.accessibility-mode li {
            margin-bottom: 12px !important;
        }
        
        /* Increase spacing */
        body.accessibility-mode .gap-4 {
            gap: 1.5rem !important;
        }
        
        body.accessibility-mode .gap-6 {
            gap: 2rem !important;
        }
        
        body.accessibility-mode .p-6 {
            padding: 2rem !important;
        }
        
        body.accessibility-mode .p-8 {
            padding: 2.5rem !important;
        }
        
        body.accessibility-mode .rounded-lg {
            border-radius: 12px !important;
        }
        
        body.accessibility-mode .rounded-2xl {
            border-radius: 16px !important;
        }
        
        /* Improve contrast - darker borders */
        body.accessibility-mode .border-gray-300 {
            border-color: #000 !important;
            border-width: 2px !important;
        }
        
        body.accessibility-mode .dark\\:border-white\\/30 {
            border-color: #fff !important;
            border-width: 2px !important;
        }
        
        /* High contrast text */
        body.accessibility-mode {
            background-color: #fff !important;
            color: #000 !important;
        }
        
        body.accessibility-mode.dark {
            background-color: #1a1a1a !important;
            color: #fff !important;
        }
        
        /* Video and media larger */
        body.accessibility-mode video {
            min-height: 500px !important;
        }
        
        /* Cards with better visibility */
        body.accessibility-mode .rounded-2xl {
            border: 3px solid #000 !important;
            box-shadow: 0 8px 16px rgba(0,0,0,0.3) !important;
        }
        
        body.accessibility-mode.dark .rounded-2xl {
            border: 3px solid #fff !important;
        }
    `;
    
    // Apply accessibility class to body
    document.body.classList.remove('medium-accessibility-mode');
    document.body.classList.add('accessibility-mode');
    
    // Show confirmation message
    const announcement = new SpeechSynthesisUtterance('Mode accessibilité activé. Les textes ont été agrandis et les contrastes améliorés.');
    announcement.lang = 'fr-FR';
    announcement.rate = 0.9;
    speechSynthesis.speak(announcement);
    
    // Show visual confirmation
    const confirmationDiv = document.createElement('div');
    confirmationDiv.style.cssText = `
        position: fixed;
        top: 100px;
        right: 30px;
        padding: 20px;
        background: #d4edda;
        border: 3px solid #28a745;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-size: 1.1em;
        font-weight: bold;
        max-width: 400px;
    `;
    confirmationDiv.innerHTML = `
        ✓ Mode accessibilité activé<br>
        <span style="font-size: 0.9em; font-weight: normal; margin-top: 10px; display: block;">
            Les textes ont été agrandis et les contrastes améliorés pour une meilleure lisibilité.
        </span>
    `;
    document.body.appendChild(confirmationDiv);
    
    // Remove confirmation after 5 seconds
    setTimeout(() => {
        confirmationDiv.remove();
    }, 5000);
}

// Function to toggle accessibility mode on demand
function toggleAccessibilityMode() {
    const hasAccessibilityMode = document.body.classList.contains('accessibility-mode');
    const hasMediumMode = document.body.classList.contains('medium-accessibility-mode');
    
    if (hasAccessibilityMode || hasMediumMode) {
        disableAccessibilityMode();
    } else {
        // Default to medium mode when toggling on
        applyMediumAccessibilityMode();
        document.getElementById('accessibilityControlPanel').style.display = 'block';
    }
}

// Function to disable accessibility mode
function disableAccessibilityMode() {
    document.body.classList.remove('accessibility-mode');
    document.body.classList.remove('medium-accessibility-mode');
    document.getElementById('accessibilityControlPanel').style.display = 'none';
}