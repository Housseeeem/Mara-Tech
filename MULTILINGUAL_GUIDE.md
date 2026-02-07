# Système Multilingue - Mara Tech

## Vue d'ensemble

L'application Mara Tech prend désormais en charge trois langues :
- 🇫🇷 **Français** (par défaut)
- 🇬🇧 **Anglais**
- 🇸🇦 **Arabe**

## Fonctionnalités

### 1. Sélection de langue
- Un sélecteur de langue est disponible dans la barre de navigation (icône 🌐)
- Le choix de la langue est sauvegardé dans le navigateur (localStorage)
- La langue persiste même après actualisation de la page

### 2. Interface traduite
- Tous les éléments de l'interface utilisent le système de traduction
- Les textes sont automatiquement mis à jour lors du changement de langue
- Support du mode RTL (right-to-left) pour l'arabe

### 3. Assistant vocal multilingue
- La synthèse vocale utilise la langue sélectionnée
- Les codes vocaux sont adaptés pour chaque langue :
  - Français : `fr-FR`
  - Anglais : `en-US`
  - Arabe : `ar-SA`

### 4. Reconnaissance vocale
- La reconnaissance vocale s'adapte automatiquement à la langue choisie
- Les mots-clés de commande sont traduits pour chaque langue
- Mots "oui/non" adaptés par langue

## Fichiers modifiés

### Nouveau fichier créé
- **`frontend/modules/translations.js`** : Module de traductions avec :
  - Dictionnaire de traductions pour les 3 langues
  - Configuration des langues (codes, direction du texte)
  - Fonctions utilitaires (`t()`, `setLanguage()`, `updateTranslations()`)

### Fichiers modifiés
- **`frontend/index.html`** :
  - Ajout du sélecteur de langue dans le navbar
  - Ajout d'attributs `data-i18n` sur les éléments traduisibles
  - Import du module translations.js

- **`frontend/script.js`** :
  - Fonctions de gestion du changement de langue
  - Adaptation de `speakText()` pour utiliser la langue sélectionnée
  - Fonctions helper pour les mots-clés multilingues
  - Mise à jour de la reconnaissance vocale
  - Traduction des messages d'erreur et d'état

## Utilisation

### Pour l'utilisateur

1. **Changer de langue** :
   - Cliquer sur l'icône 🌐 dans la barre de navigation
   - Sélectionner la langue désirée (Français, English, العربية)
   - L'interface se traduit automatiquement

2. **Assistant vocal** :
   - L'assistant utilise automatiquement la langue sélectionnée
   - Commandes vocales adaptées à chaque langue
   - Réponses vocales dans la langue choisie

### Pour les développeurs

#### Ajouter une nouvelle traduction

1. Ajouter la clé de traduction dans `translations.js` :
```javascript
const translations = {
    fr: {
        ma_cle: "Mon texte en français",
    },
    en: {
        ma_cle: "My text in English",
    },
    ar: {
        ma_cle: "النص بالعربية",
    }
};
```

2. Utiliser la clé dans le HTML :
```html
<button data-i18n="ma_cle">Texte par défaut</button>
```

3. Ou dans le JavaScript :
```javascript
const texte = t('ma_cle');
speakText(t('ma_cle'));
```

#### Fonctions utilitaires

- **`t(key)`** : Récupère la traduction pour une clé
- **`setLanguage(lang)`** : Change la langue de l'application
- **`getCurrentLanguageConfig()`** : Récupère la configuration de la langue actuelle
- **`getRecognitionLang()`** : Récupère le code de reconnaissance vocale
- **`getYesWords()`**, **`getNoWords()`** : Récupère les mots-clés "oui/non" pour la langue
- **`getBankingWords()`**, **`getShoppingWords()`** : Récupère les mots-clés de section

#### Attributs HTML pour la traduction

- **`data-i18n`** : Pour le contenu textuel
- **`data-i18n-html`** : Pour le contenu HTML
- **`data-i18n-title`** : Pour l'attribut title
- **`data-i18n-aria`** : Pour l'attribut aria-label

## Structure des translations

```javascript
languageConfig = {
    fr: { 
        code: 'fr',         // Code de langue
        speechCode: 'fr-FR', // Code pour la synthèse vocale
        dir: 'ltr',         // Direction du texte
        name: 'Français'    // Nom de la langue
    },
    // ... autres langues
}
```

## Support RTL (Right-to-Left)

Pour l'arabe, le système applique automatiquement :
- `dir="rtl"` sur l'élément `<html>`
- Adaptation automatique de la mise en page

## Événements

L'application déclenche un événement personnalisé lors du changement de langue :
```javascript
document.addEventListener('languageChanged', (event) => {
    console.log('Nouvelle langue:', event.detail.language);
    // Réagir au changement de langue
});
```

## Tests

Pour tester le système multilingue :

1. Ouvrir l'application
2. Cliquer sur l'icône 🌐
3. Sélectionner chaque langue
4. Vérifier :
   - [ ] L'interface se traduit
   - [ ] Le texte du sélecteur affiche le code de la langue
   - [ ] La synthèse vocale utilise la bonne langue
   - [ ] La reconnaissance vocale comprend les commandes
   - [ ] La direction du texte est correcte (RTL pour l'arabe)

## Compatibilité

- **Navigateurs** : Chrome, Firefox, Edge, Safari (dernières versions)
- **Synthèse vocale** : Web Speech API
- **Reconnaissance vocale** : Web Speech API (Chrome/Edge recommandés)

## Notes importantes

1. La reconnaissance vocale peut varier en qualité selon le navigateur et la langue
2. Certaines voix peuvent ne pas être disponibles sur tous les systèmes
3. L'arabe nécessite des polices appropriées pour un affichage correct
4. Les mots-clés de reconnaissance sont adaptés mais peuvent nécessiter des ajustements selon l'usage

## Améliorations futures possibles

- [ ] Ajouter plus de langues
- [ ] Améliorer les traductions existantes
- [ ] Ajouter une traduction automatique via API
- [ ] Permettre à l'utilisateur de personnaliser les commandes vocales
- [ ] Ajouter des sous-titres pour les messages vocaux
