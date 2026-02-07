#!/usr/bin/env python
"""
Script de test pour diagnostiquer les problèmes de l'API Shopping
"""

import os
import sys
from pathlib import Path

# Ajouter le répertoire parent au path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Charger les variables d'environnement
from dotenv import load_dotenv
load_dotenv(BASE_DIR / ".env")

print("=" * 60)
print("🔍 DIAGNOSTIC API SHOPPING IBSAR")
print("=" * 60)

# Test 1: Vérifier la clé OpenAI
print("\n1️⃣ Vérification de la clé OpenAI...")
openai_key = os.getenv("OPENAI_API_KEY")
if openai_key:
    print(f"   ✅ OPENAI_API_KEY trouvée (longueur: {len(openai_key)})")
    print(f"   📝 Préfixe: {openai_key[:10]}...")
else:
    print("   ❌ OPENAI_API_KEY NON TROUVÉE")
    print("   💡 Solution: Ajoutez OPENAI_API_KEY=votre-clé dans le fichier .env")

# Test 2: Vérifier l'import OpenAI
print("\n2️⃣ Vérification de l'import OpenAI...")
try:
    from openai import OpenAI
    print("   ✅ Module OpenAI importé avec succès")
    
    if openai_key:
        try:
            client = OpenAI(api_key=openai_key)
            print("   ✅ Client OpenAI initialisé avec succès")
        except Exception as e:
            print(f"   ❌ Erreur lors de l'initialisation: {e}")
    else:
        print("   ⚠️  Client OpenAI non initialisé (clé manquante)")
except ImportError as e:
    print(f"   ❌ Erreur d'import: {e}")
    print("   💡 Solution: pip install openai")

# Test 3: Vérifier les autres dépendances
print("\n3️⃣ Vérification des dépendances...")
dependencies = {
    "requests": "requests",
    "django": "django",
}
for name, module in dependencies.items():
    try:
        __import__(module)
        print(f"   ✅ {name} installé")
    except ImportError:
        print(f"   ❌ {name} NON installé")
        print(f"   💡 Solution: pip install {name}")

# Test 4: Test de l'API (si tout est OK)
print("\n4️⃣ Test de l'API OpenAI...")
if openai_key:
    try:
        client = OpenAI(api_key=openai_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Test"}],
            max_tokens=10,
        )
        print("   ✅ Test API OpenAI réussi!")
        print(f"   📝 Réponse: {response.choices[0].message.content}")
    except Exception as e:
        print(f"   ❌ Erreur lors du test API: {e}")
        print(f"   💡 Vérifiez que votre clé API est valide et a des crédits")
else:
    print("   ⚠️  Test API ignoré (clé manquante)")

# Test 5: Vérifier Django
print("\n5️⃣ Vérification de Django...")
try:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mara_tech.settings')
    import django
    django.setup()
    print("   ✅ Django configuré correctement")
    
    # Tester l'import de la vue
    from mara_tech.views.shopping import chat, client as shopping_client
    if shopping_client:
        print("   ✅ Vue shopping importée, client OpenAI initialisé")
    else:
        print("   ❌ Vue shopping importée, mais client OpenAI NON initialisé")
except Exception as e:
    print(f"   ⚠️  Django non configuré: {e}")
    print("   💡 Ce n'est pas grave si vous testez juste l'API")

print("\n" + "=" * 60)
print("📋 RÉSUMÉ")
print("=" * 60)

if openai_key:
    print("✅ La clé OpenAI est configurée")
    print("💡 Si vous avez toujours des erreurs, vérifiez:")
    print("   1. Que le serveur Django tourne (python manage.py runserver)")
    print("   2. Que le frontend pointe vers http://localhost:8000/api/chat/")
    print("   3. Les logs Django pour voir l'erreur exacte")
else:
    print("❌ La clé OpenAI n'est PAS configurée")
    print("💡 ACTION REQUISE:")
    print("   1. Créez/modifiez le fichier .env à la racine du projet")
    print("   2. Ajoutez: OPENAI_API_KEY=sk-proj-votre-clé-ici")
    print("   3. Redémarrez le serveur Django")

print("=" * 60)

