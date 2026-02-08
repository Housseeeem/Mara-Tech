document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired');
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark')
    } else {
        document.documentElement.classList.remove('dark')
    }

    updateThemeToggleState();
    updateAccessibilityToggleState();
    setMobileMenuState(false);

    // Initialize language display
    const currentLangText = document.getElementById('currentLangText');
    if (currentLangText) {
        const savedLang = localStorage.getItem('selectedLanguage') || 'fr';
        currentLangText.textContent = savedLang.toUpperCase();
    }

    // Load accessibility preference - default to moderate accessibility mode
    const savedAccessibility = localStorage.getItem('accessibilityMode') || 'medium';
    if (savedAccessibility === 'medium') {
        applyMediumAccessibilityMode();
        setAccessibilityPanelVisible(true);
    } else if (savedAccessibility === 'extreme') {
        applyAccessibilityMode();
        setAccessibilityPanelVisible(true);
    } else if (savedAccessibility === 'normal') {
        disableAccessibilityMode();
    }

    // Pre-load voices
    if ('speechSynthesis' in window) {
        speechSynthesis.getVoices();
        speechSynthesis.onvoiceschanged = () => {
            console.log('Voices loaded:', speechSynthesis.getVoices().length);
        };
    }

    // Always require a click to unlock audio on each page load
    showStartPrompt();
});

function showStartPrompt() {
    const visionStatus = document.getElementById('visionStatus');
    if (visionStatus) {
        visionStatus.innerHTML = `
            <p style="font-size: 1.1em; font-weight: bold; cursor: pointer;">${t('speech_click_activate')}</p>
        `;
    }

    const handler = () => {
        console.log('Click detected - launching language selection first');
        document.removeEventListener('click', handler);
        document.removeEventListener('touchstart', handler);

        // Unlock audio with a tiny silent utterance FIRST (user gesture context)
        const unlock = new SpeechSynthesisUtterance('.');
        unlock.volume = 0.01;
        unlock.rate = 10;
        speechSynthesis.speak(unlock);

        visionAssistantActive = true;
        visionAssistantRetries = 0;
        assistantPhase = 'language';

        setVisionStatus('Assistant vocal actif.');
        // Always ask for language preference in French first
        speakTextInFrench('Bienvenue. Quelle langue préférez-vous? Dites français, anglais ou arabe.', {
            onend: () => {
                console.log('Language question ended, listening for language choice');
                listenForLanguageChoice();
            }
        });
    };

    document.addEventListener('click', handler);
    document.addEventListener('touchstart', handler);
}

const navbar = document.getElementById("navbar");
const navLink = document.getElementById("navLink");
const mobileMenu = document.getElementById("mobileMenu");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const accessibilityToggleBtn = document.getElementById("accessibilityToggleBtn");

function setAriaPressed(button, isPressed) {
    if (!button) return;
    button.setAttribute('aria-pressed', isPressed ? 'true' : 'false');
}

function updateThemeToggleState() {
    setAriaPressed(themeToggleBtn, document.documentElement.classList.contains('dark'));
}

function updateAccessibilityToggleState() {
    const isActive = document.body.classList.contains('accessibility-mode') || document.body.classList.contains('medium-accessibility-mode');
    setAriaPressed(accessibilityToggleBtn, isActive);
}

function setMobileMenuState(isOpen) {
    if (!mobileMenu) return;
    mobileMenu.style.transform = isOpen ? 'translateX(-16rem)' : 'translateX(0)';
    mobileMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    if (mobileMenuBtn) {
        mobileMenuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
}

function setAccessibilityPanelVisible(isVisible) {
    const panel = document.getElementById('accessibilityControlPanel');
    if (!panel) return;
    panel.style.display = isVisible ? 'block' : 'none';
    panel.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
}

function openMenu() {
    setMobileMenuState(true);
}

function closeMenu() {
    setMobileMenuState(false);
}

function toggleTheme() {
    document.documentElement.classList.toggle('dark');

    if (document.documentElement.classList.contains('dark')) {
        localStorage.theme = 'dark';
    } else {
        localStorage.theme = 'light';
    }

    updateThemeToggleState();
}

// ===== LANGUAGE FUNCTIONS =====

/**
 * Toggle language selector menu
 */
function toggleLanguageMenu() {
    const menu = document.getElementById('languageMenu');
    const btn = document.getElementById('langToggleBtn');

    if (!menu || !btn) return;

    const isHidden = menu.classList.contains('hidden');
    menu.classList.toggle('hidden');
    btn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
}

/**
 * Change application language
 * @param {string} lang - Language code (fr, en, ar)
 */
function changeLanguage(lang) {
    setLanguage(lang);

    // Update language button text
    const currentLangText = document.getElementById('currentLangText');
    if (currentLangText) {
        currentLangText.textContent = lang.toUpperCase();
    }

    // Close language menu
    const menu = document.getElementById('languageMenu');
    if (menu) {
        menu.classList.add('hidden');
    }

    // Update language button state
    const btn = document.getElementById('langToggleBtn');
    if (btn) {
        btn.setAttribute('aria-expanded', 'false');
    }
}

// Close language menu when clicking outside
document.addEventListener('click', (e) => {
    const languageSelector = document.getElementById('languageSelector');
    const menu = document.getElementById('languageMenu');

    if (languageSelector && menu && !languageSelector.contains(e.target)) {
        menu.classList.add('hidden');
        const btn = document.getElementById('langToggleBtn');
        if (btn) {
            btn.setAttribute('aria-expanded', 'false');
        }
    }
});


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
let isBlind = false;
let visionAssistantActive = false;
let visionAssistantRetries = 0;
const visionAssistantMaxRetries = 2;
let assistantPhase = 'idle'; // 'idle' | 'language' | 'vision' | 'features' | 'section'

function setVisionStatus(message) {
    const status = document.getElementById('visionStatus');
    if (status) {
        status.textContent = message;
    }
}

// ===== MULTI-LANGUAGE HELPERS =====

/**
 * Get "yes" keywords for current language
 * @returns {Array<string>} - Array of yes keywords
 */
function getYesWords() {
    const lang = currentLanguage || 'fr';
    const yesWords = {
        fr: ['oui', 'ouvre', 'ouvrir', 'camera', 'cam', 'caméra', 'ok', 'd\'accord', 'accord'],
        en: ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'open', 'camera', 'cam'],
        ar: ['نعم', 'أجل', 'طيب', 'حسناً', 'موافق', 'افتح', 'كاميرا']
    };
    return yesWords[lang] || yesWords.fr;
}

/**
 * Get "no" keywords for current language
 * @returns {Array<string>} - Array of no keywords
 */
function getNoWords() {
    const lang = currentLanguage || 'fr';
    const noWords = {
        fr: ['non', 'annuler', 'stop', 'passer', 'pas'],
        en: ['no', 'nope', 'cancel', 'skip', 'pass'],
        ar: ['لا', 'إلغاء', 'توقف', 'تخطي']
    };
    return noWords[lang] || noWords.fr;
}

/**
 * Get close/fermer keywords for current language
 * @returns {Array<string>} - Array of close keywords
 */
function getCloseWords() {
    const lang = currentLanguage || 'fr';
    const words = {
        fr: ['fermer', 'close', 'arrete', 'arreter', 'ferme'],
        en: ['close', 'shut', 'stop', 'end'],
        ar: ['إغلاق', 'أغلق', 'توقف', 'أوقف']
    };
    return words[lang] || words.fr;
}

/**
 * Get banking keywords for current language
 * @returns {Array<string>} - Array of banking keywords
 */
function getBankingWords() {
    const lang = currentLanguage || 'fr';
    const words = {
        fr: ['banking', 'banque', 'bank', 'bancaire'],
        en: ['banking', 'bank', 'banks'],
        ar: ['بنك', 'خدمات مصرفية', 'مصرفي', 'banking']
    };
    return words[lang] || words.fr;
}

/**
 * Get shopping keywords for current language
 * @returns {Array<string>} - Array of shopping keywords
 */
function getShoppingWords() {
    const lang = currentLanguage || 'fr';
    const words = {
        fr: ['shopping', 'shop', 'achats', 'magasin'],
        en: ['shopping', 'shop', 'store'],
        ar: ['تسوق', 'شراء', 'متجر', 'shopping']
    };
    return words[lang] || words.fr;
}

/**
 * Get speech recognition language code
 * @returns {string} - Speech recognition language code
 */
function getRecognitionLang() {
    const langConfig = getCurrentLanguageConfig();
    return langConfig ? langConfig.speechCode : 'fr-FR';
}


function speakText(text, options = {}) {
    if (!('speechSynthesis' in window)) {
        console.warn('speechSynthesis not available');
        return;
    }

    if (!text || text.trim() === '') {
        console.warn('speakText called with empty text');
        return;
    }

    // Get language from current language config (from translations.js)
    const langConfig = getCurrentLanguageConfig();
    const defaultLang = langConfig ? langConfig.speechCode : 'fr-FR';

    const { lang = defaultLang, rate = 0.95, onend = null } = options;

    // WORKAROUND: speechSynthesis gets stuck after first use
    // Cancel, wait, then speak fresh
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;

    console.log(`Speaking (${lang}): ${text}`);

    if (onend) {
        utterance.onend = () => {
            console.log('Speech ended successfully');
            onend();
        };
    }

    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        // If error, still try to call onend so the flow continues
        if (onend && event.error !== 'canceled') {
            console.log('Calling onend despite error to continue flow');
            onend();
        }
    };

    // Delay speak slightly after cancel to avoid stuck state
    setTimeout(() => {
        try {
            speechSynthesis.speak(utterance);

            // WORKAROUND: Chrome/Edge bug where long utterances pause silently
            // Keep poking speechSynthesis to prevent it from pausing
            const keepAlive = setInterval(() => {
                if (!speechSynthesis.speaking) {
                    clearInterval(keepAlive);
                    return;
                }
                speechSynthesis.pause();
                speechSynthesis.resume();
            }, 5000);

        } catch (err) {
            console.error('Error calling speechSynthesis.speak:', err);
        }
    }, 150);
}

/**
 * Speak text always in French (for language selection prompt)
 */
function speakTextInFrench(text, options = {}) {
    if (!('speechSynthesis' in window)) {
        console.warn('speechSynthesis not available');
        return;
    }

    const { rate = 0.95, onend = null } = options;

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR'; // Always French
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;

    console.log(`Speaking in French: ${text}`);

    if (onend) {
        utterance.onend = () => {
            console.log('French speech ended successfully');
            onend();
        };
    }

    utterance.onerror = (event) => {
        console.error('French speech synthesis error:', event.error);
        if (onend && event.error !== 'canceled') {
            onend();
        }
    };

    setTimeout(() => {
        try {
            speechSynthesis.speak(utterance);
        } catch (err) {
            console.error('Error calling speechSynthesis.speak:', err);
        }
    }, 150);
}

/**
 * Listen for language choice (français, anglais, arabe)
 */
function listenForLanguageChoice() {
    console.log('listenForLanguageChoice called');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.error('SpeechRecognition not available');
        setVisionStatus('Reconnaissance vocale non supportée sur ce navigateur.');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR'; // Listen in French for language keywords
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    let gotResult = false;
    let didTimeout = false;

    setVisionStatus('Dites français, anglais ou arabe...');
    console.log('Starting language choice recognition');
    recognition.start();

    const safetyTimer = setTimeout(() => {
        didTimeout = true;
        try {
            recognition.stop();
        } catch (err) {
            console.warn('Recognition stop failed:', err);
        }
    }, 6000);

    recognition.onstart = () => {
        console.log('Language recognition started');
    };

    recognition.onresult = (event) => {
        gotResult = true;
        clearTimeout(safetyTimer);
        const transcript = event.results[0][0].transcript;
        const normalizedTranscript = normalizeSpeechText(transcript);
        console.log('Language choice result:', { transcript, normalizedTranscript });

        // Check which language was mentioned
        let selectedLang = null;
        if (normalizedTranscript.includes('francais') || normalizedTranscript.includes('français')) {
            selectedLang = 'fr';
        } else if (normalizedTranscript.includes('anglais') || normalizedTranscript.includes('english')) {
            selectedLang = 'en';
        } else if (normalizedTranscript.includes('arabe') || normalizedTranscript.includes('arabic')) {
            selectedLang = 'ar';
        }

        if (selectedLang) {
            console.log('Language selected:', selectedLang);
            // Set the language
            changeLanguage(selectedLang);

            // Confirm in French
            const langNames = { fr: 'français', en: 'anglais', ar: 'arabe' };
            speakTextInFrench(`Langue définie en ${langNames[selectedLang]}.`, {
                onend: () => {
                    // Now continue with vision assistant flow
                    continueToVisionAssistant();
                }
            });
            return;
        }

        // If not understood, retry
        visionAssistantRetries += 1;
        if (visionAssistantRetries <= visionAssistantMaxRetries) {
            console.log('Language not understood, retrying');
            speakTextInFrench('Je n\'ai pas compris. Dites français, anglais ou arabe.', {
                onend: () => listenForLanguageChoice()
            });
        } else {
            console.log('Max retries reached, defaulting to French');
            changeLanguage('fr');
            continueToVisionAssistant();
        }
    };

    recognition.onerror = (event) => {
        clearTimeout(safetyTimer);
        console.error('Language recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setVisionStatus('Micro non autorisé.');
        } else {
            setVisionStatus(`Erreur micro: ${event.error}`);
        }
        // Default to French and continue
        changeLanguage('fr');
        continueToVisionAssistant();
    };

    recognition.onend = () => {
        clearTimeout(safetyTimer);
        if (!gotResult) {
            console.log('Language recognition ended without result');
            visionAssistantRetries += 1;
            if (visionAssistantRetries <= visionAssistantMaxRetries) {
                speakTextInFrench('Je n\'ai rien entendu. Dites français, anglais ou arabe.', {
                    onend: () => listenForLanguageChoice()
                });
            } else {
                // Default to French and continue
                changeLanguage('fr');
                continueToVisionAssistant();
            }
        }
    };
}

/**
 * Continue to vision assistant after language selection
 * Always go through vision module before features
 */
function continueToVisionAssistant() {
    console.log('Continuing to vision assistant');
    visionAssistantRetries = 0; // Reset retries for next phase
    assistantPhase = 'vision';

    // Always ask about vision (removed the visionDone check)
    setVisionStatus('Assistant vocal actif.');
    speakText(t('speech_welcome') + '. ' + t('speech_open_camera'), {
        onend: () => {
            console.log('Welcome message ended, listening for response');
            listenForAssistantCommand({
                yesWords: getYesWords(),
                noWords: getNoWords(),
                promptText: t('speech_say_yes_no'),
                recognitionLang: getRecognitionLang(),
                onYes: () => handleAssistantOpenCamera(),
                onNo: () => {
                    sessionStorage.setItem('visionAssistantDone', 'true');
                    endVisionAssistant(t('speech_vision_passed'));
                    setTimeout(() => startFeatureAssistant(), 800);
                }
            });
        }
    });
}

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
        return true;
    } catch (err) {
        if (err.name === 'NotAllowedError') {
            alert(t('vision_permission_denied'));
        } else if (err.name === 'NotFoundError') {
            alert(t('vision_not_found'));
        } else if (err.name === 'NotReadableError') {
            alert(t('vision_not_readable'));
        } else {
            console.error('Erreur caméra:', err);
            alert(t('vision_error_access'));
        }
        return false;
    }
}

function stopCamera() {
    const video = document.getElementById('videoStream');
    const stream = (video && video.srcObject) ? video.srcObject : currentStream;

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        if (video) {
            video.srcObject = null;
        }
    }

    currentStream = null;
    const checkBtn = document.getElementById('checkBtn');
    const visionStatus = document.getElementById('visionStatus');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');

    if (checkBtn) checkBtn.disabled = true;
    if (visionStatus) visionStatus.textContent = '';
    if (startBtn) startBtn.style.display = 'inline-block';
    if (stopBtn) stopBtn.style.display = 'none';

    console.log('Caméra désactivée');
}

async function checkVision(options = {}) {
    const { assistantMode = false } = options;
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

        // Determine vision level based on score and blind detection
        let label = '';
        isBlind = data.is_blind || false;

        if (isBlind) {
            label = 'Non-voyant détecté';
        } else if (data.score >= 70) {
            label = 'Vision normale';
        } else if (data.score >= 40) {
            label = 'Vision faible';
        } else {
            label = 'Vision tres faible';
        }

        const reason = data.reason && data.reason !== 'fallback' ? ` — ${data.reason}` : '';
        const src = data.source === 'vlm' ? ' [IA]' : '';
        status.textContent = `${label} (score: ${data.score})${reason}${src}`;

        // Store vision score and status
        visionScore = data.score;
        hasLowVision = data.score < 70;

        if (assistantMode) {
            const spokenLabel = isBlind ? 'Non-voyant détecté' : (data.score >= 70 ? t('vision_normal').split('.')[0] : (data.score >= 40 ? t('vision_low').split('.')[0] : t('vision_very_low').split('.')[0]));
            const message = `${t('vision_analysis_result')} ${spokenLabel}. ${t('vision_say_close_or_keep')}`;
            speakText(message, {
                cancelPrevious: true,
                onend: () => {
                    listenForAssistantCommand({
                        yesWords: getCloseWords(),
                        noWords: getNoWords(),
                        promptText: t('vision_say_close_or_keep'),
                        recognitionLang: getRecognitionLang(),
                        onYes: () => {
                            stopCamera();
                            const scoreLabel = isBlind ? 'Non-voyant détecté' : (visionScore >= 70 ? t('vision_normal').split('.')[0] : (visionScore >= 40 ? t('vision_low').split('.')[0] : t('vision_very_low').split('.')[0]));
                            const confirmMessage = `${t('vision_camera_closed')} ${t('vision_confirm_result')} ${scoreLabel}, score ${visionScore}. ${t('vision_say_yes_confirm')}`;
                            speakText(confirmMessage, {
                                cancelPrevious: true,
                                onend: () => {
                                    listenForAssistantCommand({
                                        yesWords: getYesWords(),
                                        noWords: getNoWords(),
                                        promptText: t('vision_say_yes_confirm'),
                                        recognitionLang: getRecognitionLang(),
                                        onYes: () => {
                                            sessionStorage.setItem('visionAssistantDone', 'true');
                                            endVisionAssistant(t('vision_result_confirmed'));
                                            setTimeout(() => startFeatureAssistant(), 1000);
                                        },
                                        onNo: () => {
                                            sessionStorage.setItem('visionAssistantDone', 'true');
                                            endVisionAssistant(t('vision_result_not_confirmed'));
                                            setTimeout(() => startFeatureAssistant(), 1000);
                                        }
                                    });
                                }
                            });
                        },
                        onNo: () => {
                            sessionStorage.setItem('visionAssistantDone', 'true');
                            endVisionAssistant(t('vision_camera_open'));
                            // Transition to feature assistant
                            setTimeout(() => startFeatureAssistant(), 1000);
                        }
                    });
                }
            });
        } else {
            speakResult(data.score >= 70, data.score, data.reason);
        }
    } catch (err) {
        console.error('Erreur vision:', err);
        status.textContent = 'Erreur réseau ou serveur.';
    }
}

function startVisionVoiceAssistant(forceStart = false) {
    console.log('startVisionVoiceAssistant called', { forceStart, visionAssistantActive, assistantPhase });

    if (visionAssistantActive && !forceStart) {
        console.log('Assistant already active, skipping');
        return;
    }
    if (!('speechSynthesis' in window)) {
        console.error('speechSynthesis not available');
        setVisionStatus('Synthese vocale non supportee sur ce navigateur.');
        return;
    }

    // Check if vision was already done this session
    const visionDone = sessionStorage.getItem('visionAssistantDone');
    if (visionDone && !forceStart) {
        // Skip vision, go straight to feature navigation
        console.log('Vision already done this session, going to features');
        startFeatureAssistant();
        return;
    }

    visionAssistantActive = true;
    visionAssistantRetries = 0;
    assistantPhase = 'vision';
    const message = t('speech_welcome') + '. ' + t('speech_open_camera');
    console.log('Setting status and speaking:', message);
    setVisionStatus('Assistant vocal actif.');
    speakText(message, {
        cancelPrevious: true,
        onend: () => {
            console.log('Speech ended, listening for command');
            listenForAssistantCommand({
                yesWords: getYesWords(),
                noWords: getNoWords(),
                promptText: t('speech_say_yes_no'),
                recognitionLang: getRecognitionLang(),
                onYes: () => handleAssistantOpenCamera(),
                onNo: () => {
                    // Vision skipped, mark done and move to features
                    sessionStorage.setItem('visionAssistantDone', 'true');
                    endVisionAssistant(t('speech_vision_passed'));
                    setTimeout(() => startFeatureAssistant(), 800);
                }
            });
        }
    });
}

async function handleAssistantOpenCamera() {
    setVisionStatus(t('vision_opening_camera'));
    const ok = await startCamera();
    if (!ok) {
        endVisionAssistant(t('vision_cannot_open'));
        setTimeout(() => startFeatureAssistant(), 800);
        return;
    }
    speakText(t('vision_camera_opened'), {
        cancelPrevious: true,
        onend: () => {
            listenForAssistantCommand({
                yesWords: getYesWords(),
                noWords: getNoWords(),
                promptText: t('vision_say_yes_analyze'),
                recognitionLang: getRecognitionLang(),
                onYes: () => checkVision({ assistantMode: true }),
                onNo: () => {
                    sessionStorage.setItem('visionAssistantDone', 'true');
                    endVisionAssistant(t('vision_analysis_skipped'));
                    setTimeout(() => startFeatureAssistant(), 800);
                }
            });
        }
    });
}

function normalizeSpeechText(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function listenForAssistantCommand({ yesWords, noWords, promptText, onYes, onNo, recognitionLang = 'fr-FR', timeoutMs = 6000 }) {
    console.log('listenForAssistantCommand called', { promptText, yesWords, noWords });
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.error('SpeechRecognition not available');
        setVisionStatus('Reconnaissance vocale non supportee sur ce navigateur.');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = recognitionLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    let gotResult = false;
    let didTimeout = false;

    setVisionStatus(promptText || 'Ecoute en cours...');
    console.log('Starting speech recognition');
    recognition.start();

    const safetyTimer = setTimeout(() => {
        didTimeout = true;
        try {
            recognition.stop();
        } catch (err) {
            console.warn('Recognition stop failed:', err);
        }
    }, timeoutMs);

    recognition.onstart = () => {
        console.log('Speech recognition started');
    };

    recognition.onresult = (event) => {
        gotResult = true;
        clearTimeout(safetyTimer);
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        const normalizedTranscript = normalizeSpeechText(transcript);
        const normalizedYesWords = yesWords.map(normalizeSpeechText);
        const normalizedNoWords = noWords.map(normalizeSpeechText);
        console.log('Speech result:', { transcript, normalizedTranscript, confidence, yesWords, noWords });

        const isYes = normalizedYesWords.some(word => normalizedTranscript.includes(word));
        const isNo = normalizedNoWords.some(word => normalizedTranscript.includes(word));

        console.log('Matching result:', { isYes, isNo });

        if (isYes) {
            console.log('Yes detected, calling onYes');
            onYes();
            return;
        }
        if (isNo) {
            console.log('No detected, calling onNo');
            onNo();
            return;
        }

        visionAssistantRetries += 1;
        if (visionAssistantRetries <= visionAssistantMaxRetries) {
            console.log('Retrying, attempt', visionAssistantRetries);
            const retryMessage = t('speech_not_understood') + '. ' + t('speech_say_yes_no');
            speakText(retryMessage, {
                cancelPrevious: true,
                onend: () => listenForAssistantCommand({ yesWords, noWords, promptText, onYes, onNo })
            });
        } else {
            console.log('Max retries reached');
            endVisionAssistant('Assistant vocal termine.');
        }
    };

    recognition.onerror = (event) => {
        clearTimeout(safetyTimer);
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setVisionStatus('Micro non autorise. Cliquez sur "Assistant Vocal" pour relancer.');
        } else {
            setVisionStatus(`Erreur micro: ${event.error}`);
        }
        endVisionAssistant();
    };

    recognition.onend = () => {
        clearTimeout(safetyTimer);
        if (!gotResult) {
            const reason = didTimeout ? 'timeout' : 'no-result';
            console.log('Speech recognition ended without result:', reason);
            visionAssistantRetries += 1;
            if (visionAssistantRetries <= visionAssistantMaxRetries) {
                speakText(t('speech_nothing_heard') + ' ' + t('speech_say_check'), {
                    cancelPrevious: true,
                    onend: () => listenForAssistantCommand({ yesWords, noWords, promptText, onYes, onNo })
                });
            } else {
                endVisionAssistant('Assistant vocal termine.');
            }
        }
    };
}

function endVisionAssistant(message) {
    if (message) {
        setVisionStatus(message);
    }
    visionAssistantActive = false;
    assistantPhase = 'idle';
}

// ===== PHASE 2: FEATURE NAVIGATION ASSISTANT =====
const featureOptions = [
    {
        name: 'Banking', keywords: ['banking', 'banque', 'compte', 'bank', 'bancaire', 'banques'], target: '#banking',
        subOptions: [
            { name: 'Voir le solde', keywords: ['solde', 'balance', 'argent', 'combien'], action: 'viewBalance' },
            { name: 'Faire une transaction', keywords: ['transaction', 'envoyer', 'transferer', 'transfert', 'payer'], action: 'showTransactionForm' },
            { name: 'Historique des transactions', keywords: ['historique', 'history', 'liste', 'transactions'], action: 'showTransactions' },
            { name: 'Retour', keywords: ['retour', 'back', 'menu', 'revenir'], action: 'backToFeatures' }
        ]
    },
    {
        name: 'Shopping', keywords: ['shopping', 'shop', 'acheter', 'courses', 'magasin'], target: '#shopping',
        subOptions: []
    }
];

function startFeatureAssistant() {
    assistantPhase = 'features';
    visionAssistantActive = true;
    visionAssistantRetries = 0;

    const names = featureOptions.map(f => f.name).join(', ');
    const message = `${t('speech_features_available').replace('Banking, Shopping', names)}`;
    setVisionStatus(`Fonctionnalites: ${names}`);

    speakText(message, {
        cancelPrevious: true,
        onend: () => {
            listenForFeatureChoice();
        }
    });
}

function listenForFeatureChoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        setVisionStatus('Reconnaissance vocale non supportee.');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = getRecognitionLang();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    let gotResult = false;
    let didTimeout = false;

    setVisionStatus('En ecoute... Dites le nom d\'une section.');
    console.log('Starting feature choice recognition');
    recognition.start();

    const safetyTimer = setTimeout(() => {
        didTimeout = true;
        try {
            recognition.stop();
        } catch (err) {
            console.warn('Recognition stop failed:', err);
        }
    }, 6000);

    recognition.onstart = () => {
        console.log('Feature choice recognition started');
    };

    recognition.onresult = (event) => {
        gotResult = true;
        clearTimeout(safetyTimer);
        const transcript = event.results[0][0].transcript;
        const normalizedTranscript = normalizeSpeechText(transcript);
        console.log('Feature choice result:', { transcript, normalizedTranscript });

        let matched = null;
        let bestScore = 0;

        for (const feature of featureOptions) {
            for (const kw of feature.keywords) {
                const normalizedKw = normalizeSpeechText(kw);
                if (normalizedTranscript.includes(normalizedKw) && normalizedKw.length > bestScore) {
                    bestScore = normalizedKw.length;
                    matched = feature;
                }
            }
        }

        if (matched) {
            console.log('Feature matched:', matched.name);
            navigateToSection(matched);
        } else {
            console.log('No feature matched for transcript:', transcript);
            visionAssistantRetries += 1;
            if (visionAssistantRetries <= visionAssistantMaxRetries) {
                speakText(t('speech_not_understood') + '. ' + t('speech_say_banking_shopping'), {
                    cancelPrevious: true,
                    onend: () => listenForFeatureChoice()
                });
            } else {
                endVisionAssistant('Assistant termine. Utilisez les boutons pour naviguer.');
            }
        }
    };

    recognition.onerror = (event) => {
        clearTimeout(safetyTimer);
        console.error('Feature choice recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setVisionStatus('Micro non autorise. Cliquez sur "Assistant Vocal" pour relancer.');
            endVisionAssistant();
        } else if (event.error === 'no-speech') {
            // Handle no-speech error with retry
            visionAssistantRetries += 1;
            if (visionAssistantRetries <= visionAssistantMaxRetries) {
                console.log('No speech detected, retrying...');
                speakText(t('speech_nothing_heard') + '. ' + t('speech_say_banking_shopping'), {
                    cancelPrevious: true,
                    onend: () => listenForFeatureChoice()
                });
            } else {
                setVisionStatus(`Erreur micro: ${event.error}`);
                endVisionAssistant('Assistant termine. Utilisez les boutons pour naviguer.');
            }
        } else {
            setVisionStatus(`Erreur micro: ${event.error}`);
            visionAssistantRetries += 1;
            if (visionAssistantRetries <= visionAssistantMaxRetries) {
                speakText(t('speech_not_understood') + '. ' + t('speech_say_banking_shopping'), {
                    cancelPrevious: true,
                    onend: () => listenForFeatureChoice()
                });
            } else {
                endVisionAssistant();
            }
        }
    };

    recognition.onend = () => {
        clearTimeout(safetyTimer);
        if (!gotResult) {
            const reason = didTimeout ? 'timeout' : 'no-result';
            console.log('Feature choice recognition ended without result:', reason);
            visionAssistantRetries += 1;
            if (visionAssistantRetries <= visionAssistantMaxRetries) {
                speakText(t('speech_nothing_heard') + '. ' + t('speech_say_banking_shopping'), {
                    cancelPrevious: true,
                    onend: () => listenForFeatureChoice()
                });
            } else {
                endVisionAssistant('Assistant termine. Utilisez les boutons pour naviguer.');
            }
        }
    };
}

function navigateToSection(feature) {
    // Scroll to the section
    const element = document.querySelector(feature.target);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }

    if (feature.subOptions && feature.subOptions.length > 0) {
        // Read sub-options for this section
        assistantPhase = 'section';
        visionAssistantRetries = 0;
        const subNames = feature.subOptions.filter(s => s.action !== 'backToFeatures').map(s => s.name).join(', ');
        const message = `${t('speech_welcome_to')} ${feature.name}. Voici les options: ${subNames}. ${t('speech_say_option_or_return').replace('une autre option ou', '')}`;
        setVisionStatus(`${feature.name}: ${subNames}`);

        speakText(message, {
            cancelPrevious: true,
            onend: () => {
                listenForSectionCommand(feature);
            }
        });
    } else {
        // No sub-options, just announce arrival
        speakText(`${t('speech_welcome_to')} ${feature.name}.`, {
            cancelPrevious: true,
            onend: () => {
                endVisionAssistant(`Section ${feature.name} ouverte.`);
            }
        });
    }
}

// ===== PHASE 3: SECTION-SPECIFIC VOICE GUIDE =====
function listenForSectionCommand(feature) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        setVisionStatus('Reconnaissance vocale non supportee.');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = getRecognitionLang();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    let gotResult = false;
    let didTimeout = false;

    setVisionStatus('En ecoute... Choisissez une option.');
    console.log('Starting section command recognition');
    recognition.start();

    const safetyTimer = setTimeout(() => {
        didTimeout = true;
        try {
            recognition.stop();
        } catch (err) {
            console.warn('Recognition stop failed:', err);
        }
    }, 6000);

    recognition.onstart = () => {
        console.log('Section command recognition started');
    };

    recognition.onresult = (event) => {
        gotResult = true;
        clearTimeout(safetyTimer);
        const transcript = event.results[0][0].transcript;
        const normalizedTranscript = normalizeSpeechText(transcript);
        console.log('Section command result:', { transcript, normalizedTranscript });

        let matched = null;
        let bestScore = 0;

        for (const sub of feature.subOptions) {
            for (const kw of sub.keywords) {
                const normalizedKw = normalizeSpeechText(kw);
                if (normalizedTranscript.includes(normalizedKw) && normalizedKw.length > bestScore) {
                    bestScore = normalizedKw.length;
                    matched = sub;
                }
            }
        }

        if (matched) {
            if (matched.action === 'backToFeatures') {
                speakText(t('speech_return_main_menu'), {
                    cancelPrevious: true,
                    onend: () => {
                        startFeatureAssistant();
                    }
                });
            } else {
                // Execute the action
                executeSectionAction(matched, feature);
            }
        } else {
            visionAssistantRetries += 1;
            if (visionAssistantRetries <= visionAssistantMaxRetries) {
                const subNames = feature.subOptions.map(s => s.name).join(', ');
                speakText(t('speech_not_understood') + ' ' + `Les options sont: ${subNames}.`, {
                    cancelPrevious: true,
                    onend: () => listenForSectionCommand(feature)
                });
            } else {
                endVisionAssistant('Assistant termine. Utilisez les boutons.');
            }
        }
    };

    recognition.onerror = (event) => {
        clearTimeout(safetyTimer);
        console.error('Section command recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setVisionStatus('Micro non autorise. Cliquez sur "Assistant Vocal" pour relancer.');
            endVisionAssistant();
        } else if (event.error === 'no-speech') {
            // Handle no-speech error with retry
            visionAssistantRetries += 1;
            if (visionAssistantRetries <= visionAssistantMaxRetries) {
                console.log('No speech detected, retrying...');
                const subNames = feature.subOptions.map(s => s.name).join(', ');
                speakText(t('speech_nothing_heard') + ' ' + `Les options sont: ${subNames}.`, {
                    cancelPrevious: true,
                    onend: () => listenForSectionCommand(feature)
                });
            } else {
                setVisionStatus(`Erreur micro: ${event.error}`);
                endVisionAssistant('Assistant termine. Utilisez les boutons.');
            }
        } else {
            setVisionStatus(`Erreur micro: ${event.error}`);
            visionAssistantRetries += 1;
            if (visionAssistantRetries <= visionAssistantMaxRetries) {
                const subNames = feature.subOptions.map(s => s.name).join(', ');
                speakText(t('speech_not_understood') + ' ' + `Les options sont: ${subNames}.`, {
                    cancelPrevious: true,
                    onend: () => listenForSectionCommand(feature)
                });
            } else {
                endVisionAssistant();
            }
        }
    };

    recognition.onend = () => {
        clearTimeout(safetyTimer);
        if (!gotResult) {
            const reason = didTimeout ? 'timeout' : 'no-result';
            console.log('Section command recognition ended without result:', reason);
            visionAssistantRetries += 1;
            if (visionAssistantRetries <= visionAssistantMaxRetries) {
                const subNames = feature.subOptions.map(s => s.name).join(', ');
                speakText(t('speech_nothing_heard') + ' ' + `Les options sont: ${subNames}.`, {
                    cancelPrevious: true,
                    onend: () => listenForSectionCommand(feature)
                });
            } else {
                endVisionAssistant('Assistant termine. Utilisez les boutons.');
            }
        }
    };
}

function executeSectionAction(subOption, feature) {
    setVisionStatus(`Execution: ${subOption.name}...`);

    // Call the corresponding function by name
    if (typeof window[subOption.action] === 'function') {
        window[subOption.action]();
    }

    // For transaction form, don't interrupt - it has its own voice flow
    // The transaction module will handle the voice conversation
    if (subOption.action === 'showTransactionForm') {
        // Pause the assistant and let the transaction flow take over
        // The user can say "retour" after completing or canceling the transaction
        setVisionStatus('Transaction en cours... Dites "retour" pour revenir au menu.');

        // Set up a listener that will resume the assistant after transaction completes
        window.onTransactionComplete = function () {
            visionAssistantRetries = 0;
            speakText(t('speech transaction done') || 'Transaction terminée. ' + t('speech_say_option_or_return'), {
                cancelPrevious: true,
                onend: () => {
                    listenForSectionCommand(feature);
                }
            });
        };
        return; // Don't announce other options during transaction
    }

    speakText(`${subOption.name} ${t('speech_opened')} ${t('speech_say_option_or_return')}`, {
        cancelPrevious: true,
        onend: () => {
            visionAssistantRetries = 0;
            listenForSectionCommand(feature);
        }
    });
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
    { name: 'Shopping', keywords: ['shopping', 'shop', 'acheter', 'courses', 'magasin', 'market'], target: '#shopping' }
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
        voiceIndicator.setAttribute('role', 'status');
        voiceIndicator.setAttribute('aria-live', 'polite');
        voiceIndicator.setAttribute('aria-atomic', 'true');
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
            setAccessibilityPanelVisible(true);
        }, 500);
    } else {
        // Extreme accessibility mode
        setTimeout(() => {
            applyAccessibilityMode();
            setAccessibilityPanelVisible(true);
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

    // Save preference to localStorage
    localStorage.setItem('accessibilityMode', 'medium');

    // Show confirmation message (only if not during initial page load)
    if (document.body.classList.contains('medium-accessibility-mode') && localStorage.getItem('accessibilityMode') === 'medium') {
        const announcement = new SpeechSynthesisUtterance('Mode accessibilité modéré activé. Les éléments ont été légèrement agrandis.');
        announcement.lang = 'fr-FR';
        announcement.rate = 0.9;
        if (speechSynthesis && speechSynthesis.pending === false) {
            speechSynthesis.speak(announcement);
        }
    }

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

    // Save preference to localStorage
    localStorage.setItem('accessibilityMode', 'extreme');

    // Show confirmation message
    const announcement = new SpeechSynthesisUtterance('Mode accessibilité activé. Les textes ont été agrandis et les contrastes améliorés.');
    announcement.lang = 'fr-FR';
    announcement.rate = 0.9;
    if (speechSynthesis && speechSynthesis.pending === false) {
        speechSynthesis.speak(announcement);
    }
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
        setAccessibilityPanelVisible(true);
    }

    updateAccessibilityToggleState();
}

// Function to disable accessibility mode
function disableAccessibilityMode() {
    document.body.classList.remove('accessibility-mode');
    document.body.classList.remove('medium-accessibility-mode');
    setAccessibilityPanelVisible(false);
    updateAccessibilityToggleState();

    // Save preference to localStorage
    localStorage.setItem('accessibilityMode', 'normal');
}