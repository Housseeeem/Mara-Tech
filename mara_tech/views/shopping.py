"""Shopping API views - Assistant vocal IBSAR pour recherche de lieux proches."""

import json
import logging
import os
from math import asin, cos, radians, sin, sqrt

import requests
from django.http import HttpRequest, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from openai import OpenAI

logger = logging.getLogger(__name__)

# Initialisation du client OpenAI avec clé depuis variable d'environnement
openai_api_key = os.getenv("OPENAI_API_KEY")
openai_base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
openai_model = os.getenv("OPENAI_MODEL", "hosted_vllm/llava-1.5-7b-hf")

if not openai_api_key:
    logger.error("⚠️ OPENAI_API_KEY non définie dans les variables d'environnement")
    logger.error("   Veuillez ajouter OPENAI_API_KEY=votre-clé dans le fichier .env")
else:
    logger.info("✅ OPENAI_API_KEY trouvée (longueur: %d)", len(openai_api_key))

logger.info("📝 Configuration OpenAI:")
logger.info("   - Base URL: %s", openai_base_url)
logger.info("   - Model: %s", openai_model)

# Initialiser le client OpenAI avec base_url personnalisée si nécessaire
if openai_api_key:
    if openai_base_url != "https://api.openai.com/v1":
        # URL personnalisée (pour VLLM ou autres serveurs)
        client = OpenAI(api_key=openai_api_key, base_url=openai_base_url)
        logger.info("✅ Client OpenAI initialisé avec URL personnalisée: %s", openai_base_url)
    else:
        # URL OpenAI standard
        client = OpenAI(api_key=openai_api_key)
        logger.info("✅ Client OpenAI initialisé avec URL standard")
else:
    client = None
    logger.error("❌ Client OpenAI non initialisé - l'API ne fonctionnera pas")

SYSTEM_PROMPT = """Tu es un assistant vocal IBSAR pour malvoyants en Tunisie, comme un guide personnel bienveillant.

🎯 TON COMPORTEMENT:
- Tu es chaleureux, patient et rassurant
- Tu parles naturellement comme un ami qui aide
- Tu détectes automatiquement où est l'utilisateur
- Tu cherches en temps réel les lieux les plus proches
- Conversation ILLIMITÉE - jamais de fin
- Tu comprends les demandes même si elles sont incomplètes

📋 SERVICES QUE TU OFFRES:
1. 🛒 Supermarché/Épicerie (lait, pain, courses...)
2. 💊 Pharmacie (médicaments, doliprane...)
3. 🏪 Boutique (vêtements, rideaux, décoration...)
4. 📝 Aide générale (création de compte, informations, orientation...)

🗣️ COMMENT TU PARLES:
- Sois CONCIS (1-3 phrases courtes)
- Pour les lieux: donne le lieu LE PLUS PROCHE en priorité
- Mentionne 1-2 alternatives maximum
- Toujours donner NOM + DISTANCE (en mètres si <1km, en km sinon)
- Ne répète JAMAIS l'adresse complète vocalement (trop long pour aveugle)
- Si tu ne comprends pas, demande poliment des précisions

📌 EXEMPLES DE BONNES RÉPONSES (réponds DIRECTEMENT, sans guillemets ni préfixe):
User: "Je veux du lait"
Réponse: D'accord ! Le supermarché le plus proche est MG Maxi à 200 mètres de vous. Je peux vous y guider ?

User: "Rideau rouge"
Réponse: Pour un rideau rouge, je vous conseille la boutique Dar Déco à 850 mètres. Voulez-vous les coordonnées ?

User: "Où je suis ?"
Réponse: Vous êtes à ESPRIT, El Ghazala, Ariana. Que cherchez-vous ?

User: "je cherche des nouveaux produits"
Réponse: Je peux vous aider ! Pour des produits nouveaux, je vous suggère le supermarché Super U à 500 mètres, ou Cash & Carry à 1,2 kilomètres. Lequel vous intéresse ?

⚠️ RÈGLES ABSOLUES:
- Utilise UNIQUEMENT les données fournies dans le contexte pour les lieux
- Si aucun lieu trouvé → Je n'ai trouvé aucun [type] dans les 5 kilomètres
- NE PAS inventer d'adresses
- Sois bref vocalement
- Réponds DIRECTEMENT sans guillemets, sans préfixe "Tu:" ou "Assistant:"
- Pour les listes, utilise des phrases naturelles, pas de numérotation (ex: "Je vous suggère Super U, Cash & Carry, ou Frutésol" au lieu de "1. Super U 2. Cash & Carry")"""


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcule la distance GPS en kilomètres entre deux points."""
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    return round(6371 * c, 2)


def reverse_geocode(lat: float, lng: float) -> str:
    """Geocoding inversé Nominatim - GRATUIT."""
    try:
        url = "https://nominatim.openstreetmap.org/reverse"
        params = {
            "lat": lat,
            "lon": lng,
            "format": "json",
            "addressdetails": 1,
            "zoom": 18,
            "accept-language": "fr",
        }
        headers = {"User-Agent": "IBSAR-Assistant/1.0"}

        response = requests.get(url, params=params, headers=headers, timeout=8)
        data = response.json()
        address = data.get("address", {})

        # Extraction intelligente du lieu
        location = (
            address.get("amenity")
            or address.get("building")
            or address.get("university")
            or address.get("school")
            or address.get("neighbourhood")
            or address.get("suburb")
            or address.get("quarter")
            or address.get("road")
            or "position actuelle"
        )

        # Ajout ville
        city = address.get("city") or address.get("town") or address.get("municipality") or ""
        suburb = address.get("suburb") or address.get("city_district") or ""

        # Construction nom complet
        parts = [location]
        if suburb and suburb not in location:
            parts.append(suburb)
        if city and city not in location and city != suburb:
            parts.append(city)

        full_name = ", ".join(parts)
        logger.info(f"📍 Lieu détecté: {full_name}")
        return full_name

    except Exception as e:
        logger.error(f"❌ Erreur geocoding: {e}")
        return "votre position"


def search_nearby_places(lat: float, lng: float, place_type: str) -> list[dict]:
    """Recherche Overpass API - 100% GRATUIT."""
    try:
        overpass_url = "http://overpass-api.de/api/interpreter"

        osm_tags = {
            "supermarket": "shop=supermarket",
            "grocery": "shop=convenience",
            "pharmacy": "amenity=pharmacy",
            "clothes": "shop=clothes",
            "curtains": "shop=curtain",
            "decoration": "shop=interior_decoration",
            "fabric": "shop=fabric",
        }

        tag = osm_tags.get(place_type, "shop")

        query = f"""
        [out:json][timeout:15];
        (
          node[{tag}](around:5000,{lat},{lng});
          way[{tag}](around:5000,{lat},{lng});
        );
        out center 30;
        """

        logger.info(f"🔍 Recherche: {place_type} ({tag})")

        response = requests.post(overpass_url, data={"data": query}, timeout=20)
        data = response.json()

        places = []
        for elem in data.get("elements", [])[:40]:
            if "tags" not in elem:
                continue

            name = elem["tags"].get("name", "")
            if not name or name == "Sans nom":
                continue

            lat_p = elem.get("lat") or elem.get("center", {}).get("lat")
            lon_p = elem.get("lon") or elem.get("center", {}).get("lon")

            if not lat_p or not lon_p:
                continue

            dist = haversine_distance(lat, lng, lat_p, lon_p)
            dist_m = int(dist * 1000)

            # Adresse simplifiée
            tags = elem["tags"]
            addr_parts = []
            if "addr:street" in tags:
                addr_parts.append(tags["addr:street"])
            if "addr:city" in tags:
                addr_parts.append(tags["addr:city"])

            address = ", ".join(addr_parts) if addr_parts else "Adresse non disponible"

            places.append(
                {
                    "name": name,
                    "address": address,
                    "distance": dist,
                    "distance_m": dist_m,
                    "lat": lat_p,
                    "lng": lon_p,
                    "phone": tags.get("phone", ""),
                }
            )

        places.sort(key=lambda x: x["distance"])
        logger.info(f"✅ {len(places)} lieu(x) trouvé(s)")
        return places[:6]

    except Exception as e:
        logger.error(f"❌ Erreur Overpass: {e}")
        return []


def detect_search(message: str, lat: float, lng: float) -> tuple[list[dict], str | None]:
    """Détection intelligente + recherche."""
    msg = message.lower()

    # Mots-clés
    food = [
        "lait",
        "pain",
        "yaourt",
        "fromage",
        "eau",
        "jus",
        "café",
        "sucre",
        "riz",
        "pâtes",
        "huile",
        "fruits",
        "légumes",
        "viande",
        "poisson",
        "courses",
        "épicerie",
    ]
    pharma = [
        "pharmacie",
        "médicament",
        "doliprane",
        "paracétamol",
        "aspirine",
        "pansement",
        "sirop",
        "صيدلية",
        "دواء",
    ]
    shop = ["rideau", "vêtement", "habit", "robe", "chemise", "tissu", "décoration", "meuble", "محل", "ملابس", "ستارة"]

    places = []
    search_type = None

    # Détection
    if any(w in msg for w in food):
        logger.info("🎯 → Supermarché")
        places = search_nearby_places(lat, lng, "supermarket")
        if not places:
            places = search_nearby_places(lat, lng, "grocery")
        search_type = "SUPERMARCHÉ"

    elif any(w in msg for w in pharma):
        logger.info("🎯 → Pharmacie")
        places = search_nearby_places(lat, lng, "pharmacy")
        search_type = "PHARMACIE"

    elif any(w in msg for w in shop):
        logger.info("🎯 → Boutique")
        if "rideau" in msg or "ستارة" in msg:
            places = search_nearby_places(lat, lng, "curtains")
            if not places:
                places = search_nearby_places(lat, lng, "decoration")
            search_type = "BOUTIQUE (rideaux/déco)"
        elif "vêtement" in msg or "habit" in msg:
            places = search_nearby_places(lat, lng, "clothes")
            search_type = "BOUTIQUE (vêtements)"
        else:
            places = search_nearby_places(lat, lng, "decoration")
            search_type = "BOUTIQUE"

    return places, search_type


@csrf_exempt
@require_POST
def chat(request: HttpRequest) -> JsonResponse:
    """Endpoint pour le chat vocal de l'assistant shopping."""
    if not client:
        logger.error("OPENAI_API_KEY non configurée - client OpenAI non initialisé")
        return JsonResponse(
            {"error": "Service OpenAI non configuré. OPENAI_API_KEY manquante. Vérifiez votre fichier .env"},
            status=503,
        )

    try:
        data = json.loads(request.body)
        user_message = data.get("message", "")
        conversation_history = data.get("history", [])
        user_location = data.get("location", {})

        logger.info(f"\n{'='*50}")
        logger.info(f"📩 Message: {user_message}")
        logger.info(f"📍 GPS: ({user_location.get('lat')}, {user_location.get('lng')})")
        
        if not user_message:
            return JsonResponse(
                {"error": "Message vide reçu"},
                status=400,
            )

        # Ajouter message user
        conversation_history.append({"role": "user", "content": user_message})

        # Contexte
        context = ""
        places = []
        location_name = None

        if user_location.get("lat") and user_location.get("lng"):
            lat = user_location["lat"]
            lng = user_location["lng"]

            # Geocoding
            location_name = reverse_geocode(lat, lng)
            context = f"\n\n📍 POSITION: {location_name}\n(Lat: {lat:.5f}, Lng: {lng:.5f})"

            # Recherche
            places, search_type = detect_search(user_message, lat, lng)

            if places:
                context += f"\n\n🎯 RÉSULTATS ({search_type}):\n"
                for i, p in enumerate(places[:3], 1):  # Top 3 seulement
                    dist_text = f"{p['distance_m']}m" if p["distance_m"] < 1000 else f"{p['distance']}km"
                    context += f"{i}. {p['name']} — {dist_text}\n"
                    if p["phone"]:
                        context += f"   Tel: {p['phone']}\n"

        # Prompt
        full_prompt = SYSTEM_PROMPT + context

        logger.info("🤖 Appel GPT...")

        # OpenAI - Utiliser le modèle configuré dans les variables d'environnement
        try:
            logger.info(f"🤖 Appel avec le modèle: {openai_model}")
            response = client.chat.completions.create(
                model=openai_model,
                messages=[
                    {"role": "system", "content": full_prompt},
                    *conversation_history,
                ],
                temperature=0.7,
                max_tokens=300,
            )

            assistant_msg = response.choices[0].message.content
            
            # Nettoyer la réponse pour la synthèse vocale
            # Enlever les guillemets, les préfixes "Tu:", etc.
            assistant_msg = assistant_msg.strip()
            # Enlever les préfixes comme "Tu:" ou "Assistant:"
            if assistant_msg.startswith('Tu:') or assistant_msg.startswith('tu:'):
                assistant_msg = assistant_msg[3:].strip()
            if assistant_msg.startswith('Assistant:') or assistant_msg.startswith('assistant:'):
                assistant_msg = assistant_msg[10:].strip()
            # Enlever les guillemets au début et à la fin
            if assistant_msg.startswith('"') and assistant_msg.endswith('"'):
                assistant_msg = assistant_msg[1:-1].strip()
            if assistant_msg.startswith("'") and assistant_msg.endswith("'"):
                assistant_msg = assistant_msg[1:-1].strip()
            # Enlever les numéros de liste pour la lecture vocale (1., 2., etc.)
            import re
            # Enlever les numéros au début des lignes (1., 2., etc.)
            assistant_msg = re.sub(r'^\d+\.\s*', '', assistant_msg, flags=re.MULTILINE)
            # Enlever les listes numérotées dans le texte (1. ..., 2. ..., etc.)
            assistant_msg = re.sub(r'\n\d+\.\s*', '. ', assistant_msg)
            # Remplacer les retours à la ligne multiples par des points
            assistant_msg = re.sub(r'\n+', '. ', assistant_msg)
            # Nettoyer les espaces multiples
            assistant_msg = re.sub(r'\s+', ' ', assistant_msg).strip()
            
            logger.info(f"✅ Réponse reçue (nettoyée): {assistant_msg}")
            logger.info(f"{'='*50}\n")
            
        except Exception as openai_error:
            error_str = str(openai_error).lower()
            logger.error(f"❌ Erreur OpenAI avec {openai_model}: {openai_error}")
            
            # Si c'est une erreur d'authentification
            if "api key" in error_str or "authentication" in error_str or "401" in error_str:
                assistant_msg = "Erreur d'authentification avec OpenAI. Vérifiez votre clé API."
                return JsonResponse(
                    {"error": "Erreur d'authentification OpenAI", "response": assistant_msg},
                    status=503,
                )
            # Si c'est "model not found"
            elif "model not found" in error_str or "404" in error_str:
                assistant_msg = f"Modèle {openai_model} non trouvé. Vérifiez OPENAI_MODEL dans .env"
                logger.error(f"❌ Modèle {openai_model} non disponible")
                return JsonResponse(
                    {"error": f"Modèle {openai_model} non trouvé", "response": assistant_msg},
                    status=503,
                )
            else:
                # Autre erreur
                assistant_msg = "Désolé, je rencontre un problème technique. Pouvez-vous réessayer ?"
                logger.exception("❌ Erreur inattendue OpenAI")
                return JsonResponse(
                    {
                        "error": str(openai_error),
                        "response": assistant_msg,
                    },
                    status=500,
                )

        # Historique
        conversation_history.append({"role": "assistant", "content": assistant_msg})

        return JsonResponse(
            {
                "response": assistant_msg,
                "history": conversation_history,
                "places": places[:3],  # Top 3
                "location": user_location,
                "location_name": location_name,
            }
        )

    except json.JSONDecodeError as e:
        logger.error("❌ Erreur JSON: %s", e)
        return JsonResponse({"error": "JSON invalide.", "details": str(e)}, status=400)
    except Exception as e:
        logger.exception("❌ ERREUR dans chat shopping")
        error_details = {
            "error": str(e),
            "error_type": type(e).__name__,
            "response": "Désolé, erreur technique. Répétez svp.",
            "history": conversation_history if "conversation_history" in locals() else [],
        }
        # En mode DEBUG, on envoie plus de détails
        from django.conf import settings
        if settings.DEBUG:
            import traceback
            error_details["traceback"] = traceback.format_exc()
        return JsonResponse(error_details, status=500)


def shopping_page(request: HttpRequest):
    """Vue pour servir la page HTML de l'assistant shopping."""
    return render(request, "shopping.html")

