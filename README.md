# Mara-Tech Hackathon Project

Django application built for the MaraTech Hackathon 2026. Focus on accessibility, inclusion numérique, and real-world social impact.

## Prerequisites

- Python 3.9+ installed
- PostgreSQL database (local or remote)
- Git

## Local Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Housseeeem/Mara-Tech.git
cd Mara-Tech
```

### 2. Create Virtual Environment

**On Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**On macOS/Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the project root with the following:

```
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=mara_tech_db
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432
```

**⚠️ Important:**
- Change `DJANGO_SECRET_KEY` to a secure random string (use `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`)
- Update `DB_PASSWORD` with your PostgreSQL password
- Update `DB_HOST` if database is remote

### 5. Create PostgreSQL Database

```sql
CREATE DATABASE mara_tech_db;
```

### 6. Run Migrations

```bash
python manage.py migrate
```

### 7. Create Superuser (Optional, for Admin Panel)

```bash
python manage.py createsuperuser
```

### 8. Start Development Server

```bash
python manage.py runserver
```

Server runs at: **http://127.0.0.1:8000/**

Admin panel: **http://127.0.0.1:8000/admin/**

## Project Structure

```
Mara-Tech/
├── mara_tech/          # Main Django project config
│   ├── settings.py     # Settings (env vars loaded here)
│   ├── urls.py         # URL routing
│   ├── wsgi.py         # WSGI app
│   └── asgi.py         # ASGI app
├── manage.py           # Django management script
├── requirements.txt    # Python dependencies
├── .env                # Environment variables (gitignored)
├── .gitignore          # Git ignore rules
├── Procfile            # Render deployment config
├── render.yaml         # Render deployment detailed config
└── railway.toml        # Railway deployment config
```

## Deployment

### Deploy to Render

1. Push changes to GitHub
2. Go to [render.com](https://render.com)
3. Connect GitHub repo
4. Create new Web Service
5. Set environment variables from your `.env`
6. Deploy

## Troubleshooting

**PostgreSQL connection error:**
- Verify PostgreSQL is running
- Check DB credentials in `.env`
- Ensure `DB_HOST` is correct

**ModuleNotFoundError:**
- Activate virtual environment: `.\.venv\Scripts\Activate.ps1` (Windows) or `source .venv/bin/activate` (macOS/Linux)
- Reinstall: `pip install -r requirements.txt`

**SECRET_KEY error:**
- `DJANGO_SECRET_KEY` is required in `.env`
- Generate one: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`

## Key Technologies

- **Django 6.0.2** – Web framework
- **PostgreSQL** – Database
- **Gunicorn** – Production WSGI server
- **Python-dotenv** – Environment configuration

## Notes for Hackathon

- This is a **development setup** – configure SECRET_KEY properly before deployment
- Database migrations are handled automatically on first `migrate`
- All environment variables must be set before running the server
- Focus on accessibility from the start – it's a hackathon requirement!

## Team

Built for MaraTech Hackathon 2026 by the team.

---

**Ready to code? Get setup and let's build something with impact!** 🚀
