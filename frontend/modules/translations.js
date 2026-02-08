/**
 * Internationalization Module
 * Supports French (fr), English (en), and Arabic (ar)
 */

const translations = {
    fr: {
        // Navigation
        nav_home: "Accueil",
        nav_about: "À propos",
        nav_banking: "Banque",
        nav_shopping: "Shopping",
        nav_camera: "Caméra",
        
        // Home Section
        home_greeting: "Salut! Je suis Eliana Jade",
        home_tagline: "Où la voix devient vision autonome",
        home_banking_btn: "Banque",
        home_shopping_btn: "Shopping",
        
        // Vision & Camera
        camera_title: "Vision & Caméra",
        camera_start: "Démarrer la Caméra",
        camera_check: "Vérifier la Vision",
        camera_close: "Fermer la Caméra",
        camera_assistant: "Assistant Vocal",
        camera_test_title: "Mode Test - 3 Niveaux de Vision",
        camera_test_desc: "Testez les trois niveaux de vision:",
        camera_test_normal: "Normal",
        camera_test_weak: "Faible",
        camera_test_very_weak: "Très Faible",
        
        // Accessibility Panel
        acc_panel_title: "♿ Mode Accessibilité",
        acc_panel_desc: "Changez de niveau ou désactivez:",
        acc_panel_disable: "↩️ Désactiver",
        
        // About Section
        about_intro: "Introduction",
        about_title: "À propos de nous",
        about_description: "Je suis une développeuse Frontend expérimentée avec plus d'une décennie d'expertise professionnelle dans le domaine. Tout au long de ma carrière, j'ai eu le privilège de collaborer avec des organisations prestigieuses, contribuant à leur succès et leur croissance.",
        about_languages_title: "Langages",
        about_languages_desc: "HTML, CSS, JavaScript React Js, Next Js",
        about_education_title: "Éducation",
        about_education_desc: "B.Tech en Informatique",
        about_projects_title: "Projets",
        about_projects_desc: "Plus de 5 projets réalisés",
        about_tools: "Outils que j'utilise",
        
        // Banking Section
        banking_title: "Services Bancaires",
        banking_subtitle: "Gérez vos transactions en toute sécurité",
        banking_overview: "Aperçu du Compte",
        banking_balance: "Solde Actuel",
        banking_account_type: "Type de Compte",
        banking_account_number: "Numéro de Compte",
        banking_quick_actions: "Actions Rapides",
        banking_new_transaction: "Nouvelle Transaction",
        banking_view_history: "Voir l'Historique",
        banking_check_balance: "Vérifier le Solde",
        banking_voice_banking: "Banking Vocal",
        banking_recipient: "Destinataire",
        banking_amount: "Montant",
        banking_description: "Description",
        banking_cancel: "Annuler",
        banking_submit: "Soumettre",
        banking_voice_start: "Démarrer Transaction Vocale",
        banking_confirm_send: "Confirmer & Envoyer",
        banking_transaction_summary: "Résumé de Transaction",
        banking_voice_instruction: "Cliquez sur \"Démarrer Transaction Vocale\" pour commencer",
        banking_history_title: "Historique des Transactions",
        banking_date: "Date",
        banking_type: "Type",
        banking_credit: "Crédit",
        banking_debit: "Débit",
        banking_back_main: "Retour Principal",
        banking_balance_text: "Votre solde actuel est :",
        
        // Speech/Voice Assistant
        speech_click_activate: "🎤 Cliquez n'importe où pour activer l'assistant vocal",
        speech_language_question: "Bienvenue. Quelle langue préférez-vous? Dites français, anglais ou arabe.",
        speech_say_language: "Dites français, anglais ou arabe.",
        speech_language_set: "Langue définie en",
        speech_welcome: "Bienvenue",
        speech_features_available: "Voici les fonctionnalités disponibles: Banque, Shopping. Quelle section voulez-vous visiter?",
        speech_open_camera: "Voulez-vous ouvrir la caméra pour vérifier votre vision? Dites oui ou non.",
        speech_say_yes_no: "Dites oui pour ouvrir la caméra ou non pour passer.",
        speech_vision_passed: "Vision passée.",
        speech_voice_nav: "Navigation vocale...",
        speech_not_understood: "Je n'ai pas compris.",
        speech_say_banking_shopping: "Dites Banque ou Shopping.",
        speech_nothing_heard: "Je n'ai rien entendu.",
        speech_say_check: "Dites vérifier pour lancer l'analyse.",
        speech_return_main_menu: "Retour au menu principal.",
        speech_welcome_to: "Bienvenue dans",
        speech_say_option_or_return: "Dites une autre option ou retour pour revenir.",
        speech_opened: "ouvert.",
        
        // Camera/Vision Messages
        vision_camera_ready: "Caméra prête.",
        vision_checking: "Vérification en cours...",
        vision_score: "Score de vision:",
        vision_normal: "Vision normale. Pas d'aide nécessaire.",
        vision_low: "Vision faible. Aide activée.",
        vision_very_low: "Vision très faible. Aide maximale activée.",
        vision_blind_detected: "Non-voyant détecté.",
        vision_error: "Erreur lors de la vérification.",
        vision_not_ready: "Caméra non prête.",
        vision_opening_camera: "Ouverture de la caméra.",
        vision_camera_opened: "Caméra ouverte. Dites oui pour analyser votre vision.",
        vision_say_yes_analyze: "Dites oui pour lancer l'analyse.",
        vision_analysis_result: "Résultat:",
        vision_say_close_or_keep: "Dites fermer pour fermer la caméra ou non pour la garder ouverte.",
        vision_camera_closed: "La caméra est fermée.",
        vision_confirm_result: "Confirmez-vous le résultat?",
        vision_say_yes_confirm: "Dites oui pour confirmer ou non pour annuler.",
        vision_result_confirmed: "Résultat confirmé.",
        vision_result_not_confirmed: "Résultat non confirmé.",
        vision_camera_open: "Caméra reste ouverte.",
        vision_cannot_open: "Impossible d'ouvrir la caméra.",
        vision_analysis_skipped: "Analyse passée.",
        vision_permission_denied: "Permission refusée - Veuillez autoriser l'accès à la caméra",
        vision_not_found: "Aucune caméra détectée sur votre ordinateur",
        vision_not_readable: "La caméra est utilisée par une autre application",
        vision_error_access: "Erreur lors de l'accès à la caméra",
        
        // Theme
        theme_toggle: "Basculer le thème",
        
        // Common
        common_yes: "oui",
        common_no: "non",
        common_cancel: "annuler",
        common_ok: "d'accord",
        common_back: "retour",
        common_next: "suivant",
        common_loading: "Chargement...",
        common_error: "Erreur",
        common_success: "Succès",
        
        // Language names
        lang_french: "Français",
        lang_english: "Anglais",
        lang_arabic: "العربية",
    },
    
    en: {
        // Navigation
        nav_home: "Home",
        nav_about: "About us",
        nav_banking: "Banking",
        nav_shopping: "Shopping",
        nav_camera: "Camera",
        
        // Home Section
        home_greeting: "Hi! I'm Eliana Jade",
        home_tagline: "Where voice becomes autonomous vision",
        home_banking_btn: "Banking",
        home_shopping_btn: "Shopping",
        
        // Vision & Camera
        camera_title: "Vision & Camera",
        camera_start: "Start Camera",
        camera_check: "Check Vision",
        camera_close: "Close Camera",
        camera_assistant: "Voice Assistant",
        camera_test_title: "🧪 Test Mode - 3 Vision Levels",
        camera_test_desc: "Test three vision levels:",
        camera_test_normal: "✓ Normal (85)",
        camera_test_weak: "⚠️ Weak (50)",
        camera_test_very_weak: "✗ Very Weak (25)",
        
        // Accessibility Panel
        acc_panel_title: "♿ Accessibility Mode",
        acc_panel_desc: "Change level or disable:",
        acc_panel_disable: "↩️ Disable",
        
        // About Section
        about_intro: "Introduction",
        about_title: "About us",
        about_description: "I am an experienced Frontend Developer with over a decade of professional expertise in the field. Throughout my career, I have had the privilege of collaborating with prestigious organizations, contributing to their success and growth.",
        about_languages_title: "Languages",
        about_languages_desc: "HTML, CSS, JavaScript React Js, Next Js",
        about_education_title: "Education",
        about_education_desc: "B.Tech in Computer Science",
        about_projects_title: "Projects",
        about_projects_desc: "Built more than 5 projects",
        about_tools: "Tools I use",
        
        // Banking Section
        banking_title: "Banking Services",
        banking_subtitle: "Manage your transactions securely",
        banking_overview: "Account Overview",
        banking_balance: "Current Balance",
        banking_account_type: "Account Type",
        banking_account_number: "Account Number",
        banking_quick_actions: "Quick Actions",
        banking_new_transaction: "New Transaction",
        banking_view_history: "View History",
        banking_check_balance: "Check Balance",
        banking_voice_banking: "Voice Banking",
        banking_recipient: "Recipient",
        banking_amount: "Amount",
        banking_description: "Description",
        banking_cancel: "Cancel",
        banking_submit: "Submit",
        banking_voice_start: "Start Voice Transaction",
        banking_confirm_send: "Confirm & Send",
        banking_transaction_summary: "Transaction Summary",
        banking_voice_instruction: "Click \"Start Voice Transaction\" to begin",
        banking_history_title: "Transaction History",
        banking_date: "Date",
        banking_type: "Type",
        banking_credit: "Credit",
        banking_debit: "Debit",
        banking_back_main: "Back to Main",
        banking_balance_text: "Your current balance is:",
        
        // Speech/Voice Assistant
        speech_click_activate: "🎤 Click anywhere to activate voice assistant",
        speech_welcome: "Welcome",
        speech_features_available: "Here are the available features: Banking, Shopping. Which section do you want to visit?",
        speech_open_camera: "Do you want to open the camera to check your vision? Say yes or no.",
        speech_say_yes_no: "Say yes to open the camera or no to skip.",
        speech_vision_passed: "Vision skipped.",
        speech_voice_nav: "Voice navigation...",
        speech_not_understood: "I didn't understand.",
        speech_say_banking_shopping: "Say Banking or Shopping.",
        speech_nothing_heard: "I didn't hear anything.",
        speech_say_check: "Say check to start the analysis.",
        speech_return_main_menu: "Return to main menu.",
        speech_welcome_to: "Welcome to",
        speech_say_option_or_return: "Say another option or back to return.",
        speech_opened: "opened.",
        
        // Camera/Vision Messages
        vision_camera_ready: "Camera ready.",
        vision_checking: "Checking...",
        vision_score: "Vision score:",
        vision_normal: "Normal vision. No assistance needed.",
        vision_low: "Low vision. Assistance enabled.",
        vision_very_low: "Very low vision. Maximum assistance enabled.",
        vision_blind_detected: "Blind person detected.",
        vision_error: "Error during check.",
        vision_not_ready: "Camera not ready.",
        vision_opening_camera: "Opening camera.",
        vision_camera_opened: "Camera opened. Say yes to analyze your vision.",
        vision_say_yes_analyze: "Say yes to start the analysis.",
        vision_analysis_result: "Result:",
        vision_say_close_or_keep: "Say close to close the camera or no to keep it open.",
        vision_camera_closed: "Camera is closed.",
        vision_confirm_result: "Do you confirm the result?",
        vision_say_yes_confirm: "Say yes to confirm or no to cancel.",
        vision_result_confirmed: "Result confirmed.",
        vision_result_not_confirmed: "Result not confirmed.",
        vision_camera_open: "Camera stays open.",
        vision_cannot_open: "Cannot open camera.",
        vision_analysis_skipped: "Analysis skipped.",
        vision_permission_denied: "Permission denied - Please allow camera access",
        vision_not_found: "No camera detected on your computer",
        vision_not_readable: "Camera is being used by another application",
        vision_error_access: "Error accessing camera",
        
        // Theme
        theme_toggle: "Toggle theme",
        
        // Common
        common_yes: "yes",
        common_no: "no",
        common_cancel: "cancel",
        common_ok: "ok",
        common_back: "back",
        common_next: "next",
        common_loading: "Loading...",
        common_error: "Error",
        common_success: "Success",
        
        // Language names
        lang_french: "French",
        lang_english: "English",
        lang_arabic: "العربية",
    },
    
    ar: {
        // Navigation
        nav_home: "الرئيسية",
        nav_about: "من نحن",
        nav_banking: "الخدمات المصرفية",
        nav_shopping: "التسوق",
        nav_camera: "الكاميرا",
        
        // Home Section
        home_greeting: "مرحباً! أنا إليانا جايد",
        home_tagline: "حيث يصبح الصوت رؤية مستقلة",
        home_banking_btn: "الخدمات المصرفية",
        home_shopping_btn: "التسوق",
        
        // Vision & Camera
        camera_title: "الرؤية والكاميرا",
        camera_start: "تشغيل الكاميرا",
        camera_check: "فحص الرؤية",
        camera_close: "إغلاق الكاميرا",
        camera_assistant: "المساعد الصوتي",
        camera_test_title: "🧪 وضع الاختبار - 3 مستويات رؤية",
        camera_test_desc: "اختبر مستويات الرؤية الثلاثة:",
        camera_test_normal: "✓ عادي (85)",
        camera_test_weak: "⚠️ ضعيف (50)",
        camera_test_very_weak: "✗ ضعيف جداً (25)",
        
        // Accessibility Panel
        acc_panel_title: "♿ وضع إمكانية الوصول",
        acc_panel_desc: "تغيير المستوى أو التعطيل:",
        acc_panel_disable: "↩️ تعطيل",
        
        // About Section
        about_intro: "مقدمة",
        about_title: "من نحن",
        about_description: "أنا مطورة واجهة أمامية ذات خبرة مع أكثر من عقد من الخبرة المهنية في هذا المجال. طوال مسيرتي المهنية، حظيت بشرف التعاون مع منظمات مرموقة، والمساهمة في نجاحها ونموها.",
        about_languages_title: "اللغات",
        about_languages_desc: "HTML, CSS, JavaScript React Js, Next Js",
        about_education_title: "التعليم",
        about_education_desc: "بكالوريوس في علوم الحاسوب",
        about_projects_title: "المشاريع",
        about_projects_desc: "أكثر من 5 مشاريع محققة",
        about_tools: "الأدوات التي أستخدمها",
        
        // Banking Section
        banking_title: "الخدمات المصرفية",
        banking_subtitle: "إدارة معاملاتك بأمان",
        banking_overview: "نظرة عامة على الحساب",
        banking_balance: "الرصيد الحالي",
        banking_account_type: "نوع الحساب",
        banking_account_number: "رقم الحساب",
        banking_quick_actions: "إجراءات سريعة",
        banking_new_transaction: "معاملة جديدة",
        banking_view_history: "عرض السجل",
        banking_check_balance: "التحقق من الرصيد",
        banking_voice_banking: "الخدمات المصرفية الصوتية",
        banking_recipient: "المستلم",
        banking_amount: "المبلغ",
        banking_description: "الوصف",
        banking_cancel: "إلغاء",
        banking_submit: "إرسال",
        banking_voice_start: "بدء المعاملة الصوتية",
        banking_confirm_send: "تأكيد وإرسال",
        banking_transaction_summary: "ملخص المعاملة",
        banking_voice_instruction: "انقر على \"بدء المعاملة الصوتية\" لبدء",
        banking_history_title: "سجل المعاملات",
        banking_date: "التاريخ",
        banking_type: "النوع",
        banking_credit: "إيداع",
        banking_debit: "سحب",
        banking_back_main: "العودة للرئيسية",
        banking_balance_text: "رصيدك الحالي هو:",
        
        // Speech/Voice Assistant
        speech_click_activate: "🎤 انقر في أي مكان لتفعيل المساعد الصوتي",
        speech_welcome: "مرحباً",
        speech_features_available: "هذه هي الميزات المتاحة: الخدمات المصرفية، التسوق. أي قسم تريد زيارته؟",
        speech_open_camera: "هل تريد فتح الكاميرا للتحقق من رؤيتك؟ قل نعم أو لا.",
        speech_say_yes_no: "قل نعم لفتح الكاميرا أو لا للتخطي.",
        speech_vision_passed: "تم تخطي الرؤية.",
        speech_voice_nav: "التنقل الصوتي...",
        speech_not_understood: "لم أفهم.",
        speech_say_banking_shopping: "قل الخدمات المصرفية أو التسوق.",
        speech_nothing_heard: "لم أسمع شيئاً.",
        speech_say_check: "قل فحص لبدء التحليل.",
        speech_return_main_menu: "العودة إلى القائمة الرئيسية.",
        speech_welcome_to: "مرحباً بك في",
        speech_say_option_or_return: "قل خياراً آخر أو رجوع للعودة.",
        speech_opened: "تم الفتح.",
        
        // Camera/Vision Messages
        vision_camera_ready: "الكاميرا جاهزة.",
        vision_checking: "جارٍ الفحص...",
        vision_score: "درجة الرؤية:",
        vision_normal: "رؤية عادية. لا حاجة للمساعدة.",
        vision_low: "رؤية ضعيفة. تم تفعيل المساعدة.",
        vision_very_low: "رؤية ضعيفة جداً. تم تفعيل المساعدة الكاملة.",
        vision_blind_detected: "تم اكتشاف شخص كفيف.",
        vision_error: "خطأ أثناء الفحص.",
        vision_not_ready: "الكاميرا غير جاهزة.",
        vision_opening_camera: "جارٍ فتح الكاميرا.",
        vision_camera_opened: "الكاميرا مفتوحة. قل نعم لتحليل رؤيتك.",
        vision_say_yes_analyze: "قل نعم لبدء التحليل.",
        vision_analysis_result: "النتيجة:",
        vision_say_close_or_keep: "قل إغلاق لإغلاق الكاميرا أو لا للإبقاء عليها مفتوحة.",
        vision_camera_closed: "الكاميرا مغلقة.",
        vision_confirm_result: "هل تؤكد النتيجة؟",
        vision_say_yes_confirm: "قل نعم للتأكيد أو لا للإلغاء.",
        vision_result_confirmed: "تم تأكيد النتيجة.",
        vision_result_not_confirmed: "لم يتم تأكيد النتيجة.",
        vision_camera_open: "الكاميرا تبقى مفتوحة.",
        vision_cannot_open: "لا يمكن فتح الكاميرا.",
        vision_analysis_skipped: "تم تخطي التحليل.",
        vision_permission_denied: "تم رفض الإذن - يرجى السماح بالوصول إلى الكاميرا",
        vision_not_found: "لم يتم اكتشاف كاميرا على جهازك",
        vision_not_readable: "الكاميرا قيد الاستخدام من قبل تطبيق آخر",
        vision_error_access: "خطأ في الوصول إلى الكاميرا",
        
        // Theme
        theme_toggle: "تبديل المظهر",
        
        // Common
        common_yes: "نعم",
        common_no: "لا",
        common_cancel: "إلغاء",
        common_ok: "حسناً",
        common_back: "رجوع",
        common_next: "التالي",
        common_loading: "جارٍ التحميل...",
        common_error: "خطأ",
        common_success: "نجح",
        
        // Language names
        lang_french: "الفرنسية",
        lang_english: "الإنجليزية",
        lang_arabic: "العربية",
    }
};

// Language configuration with speech codes
const languageConfig = {
    fr: { code: 'fr', speechCode: 'fr-FR', dir: 'ltr', name: 'Français' },
    en: { code: 'en', speechCode: 'en-US', dir: 'ltr', name: 'English' },
    ar: { code: 'ar', speechCode: 'ar-SA', dir: 'rtl', name: 'العربية' }
};

// Current language (default: French)
let currentLanguage = localStorage.getItem('selectedLanguage') || 'fr';

/**
 * Get translation for a key
 * @param {string} key - Translation key
 * @returns {string} - Translated text
 */
function t(key) {
    return translations[currentLanguage]?.[key] || translations.fr[key] || key;
}

/**
 * Get current language configuration
 * @returns {object} - Language config
 */
function getCurrentLanguageConfig() {
    return languageConfig[currentLanguage];
}

/**
 * Set application language
 * @param {string} lang - Language code (fr, en, ar)
 */
function setLanguage(lang) {
    if (!languageConfig[lang]) {
        console.warn(`Language ${lang} not supported, falling back to French`);
        lang = 'fr';
    }
    
    currentLanguage = lang;
    localStorage.setItem('selectedLanguage', lang);
    
    // Update HTML lang and dir attributes
    document.documentElement.setAttribute('lang', languageConfig[lang].code);
    document.documentElement.setAttribute('dir', languageConfig[lang].dir);
    
    // Update all translatable elements
    updateTranslations();
    
    // Trigger custom event for other modules to react
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    
    console.log(`Language changed to: ${languageConfig[lang].name}`);
}

/**
 * Update all translatable elements in the DOM
 */
function updateTranslations() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = t(key);
        
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.placeholder = translation;
        } else {
            element.textContent = translation;
        }
    });
    
    // Update all elements with data-i18n-html attribute (for HTML content)
    document.querySelectorAll('[data-i18n-html]').forEach(element => {
        const key = element.getAttribute('data-i18n-html');
        element.innerHTML = t(key);
    });
    
    // Update all elements with data-i18n-title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        element.setAttribute('title', t(key));
    });
    
    // Update all elements with data-i18n-aria attribute
    document.querySelectorAll('[data-i18n-aria]').forEach(element => {
        const key = element.getAttribute('data-i18n-aria');
        element.setAttribute('aria-label', t(key));
    });
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
    setLanguage(currentLanguage);
});
