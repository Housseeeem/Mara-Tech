# Guide de Débogage - Assistant Shopping IBSAR

## Problèmes Courants et Solutions

### 1. Erreur "Service OpenAI non configuré"

**Cause** : La clé API OpenAI n'est pas définie dans le fichier `.env`

**Solution** :
1. Créez ou modifiez le fichier `.env` à la racine du projet
2. Ajoutez votre clé OpenAI et la configuration :
   ```
   OPENAI_API_KEY=sk-proj-votre-clé-ici
   OPENAI_BASE_URL=https://api.openai.com/v1
   OPENAI_MODEL=hosted_vllm/llava-1.5-7b-hf
   ```
   
   **Note** : 
   - Si vous utilisez un serveur VLLM local, définissez `OPENAI_BASE_URL` (ex: `http://localhost:8000/v1`)
   - Le modèle par défaut est `hosted_vllm/llava-1.5-7b-hf`, mais vous pouvez le changer avec `OPENAI_MODEL`
3. Redémarrez le serveur Django

### 2. Erreur CORS (Cross-Origin)

**Cause** : Le frontend (port 3000) ne peut pas communiquer avec Django (port 8000)

**Solution** : Vérifiez que `CORS_ALLOW_ALL_ORIGINS = DEBUG` est activé dans `settings.py` (déjà configuré)

### 3. Erreur 404 ou "Not Found"

**Cause** : L'URL de l'API est incorrecte

**Solution** : Vérifiez que :
- Le serveur Django tourne sur `http://localhost:8000`
- L'URL dans `shopping.html` est `http://localhost:8000/api/chat/`

### 4. Erreur de connexion réseau

**Cause** : Le serveur Django n'est pas démarré

**Solution** :
```bash
python manage.py runserver
```

### 5. Erreur "JSON invalide"

**Cause** : Le format de la requête est incorrect

**Solution** : Vérifiez la console du navigateur (F12) pour voir les détails

## Comment Déboguer

### Étape 1 : Vérifier les logs Django

Regardez la console où Django tourne pour voir les erreurs détaillées.

### Étape 2 : Vérifier la console du navigateur

1. Ouvrez les outils de développement (F12)
2. Allez dans l'onglet "Console"
3. Regardez les messages d'erreur en rouge

### Étape 3 : Tester l'API directement

Testez l'endpoint avec curl ou Postman :
```bash
curl -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "bonjour", "history": [], "location": {"lat": 36.8065, "lng": 10.1815}}'
```

### Étape 4 : Vérifier les variables d'environnement

```bash
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('OPENAI_API_KEY:', 'DÉFINIE' if os.getenv('OPENAI_API_KEY') else 'MANQUANTE')"
```

## Messages d'erreur courants

- **"Service OpenAI non configuré"** → Ajoutez OPENAI_API_KEY dans .env
- **"HTTP 503"** → Problème avec OpenAI (clé invalide ou quota dépassé)
- **"HTTP 400"** → Format de requête incorrect
- **"HTTP 500"** → Erreur serveur, vérifiez les logs Django
- **"Failed to fetch"** → Problème de connexion réseau ou CORS

