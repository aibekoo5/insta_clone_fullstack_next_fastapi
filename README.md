# Lifegram Fullstack Project

Lifegram is a social network similar to Instagram. Project FastAPI (backend) and Next.designed with js (frontend) technologies. Easy to install via Docker.

## 🐳 Docker Hub Images

- 🔗 Backend: [aibekkemel/lifegram-backend](https://hub.docker.com/r/aibekkemel/lifegram-backend)
- 🔗 Frontend: [aibekkemel/lifegram-frontend](https://hub.docker.com/r/aibekkemel/lifegram-frontend)

## 🚀 Launch (within 1 minute)

### 1. Download repository

```bash
git clone https://github.com/aibekoo5/lifegram-fullstack.git
cd lifegram-fullstack
If GitHub does not exist, the archive (.zip) download and extract it.

2. Running Docker Compose
bash
Копировать
Редактировать
docker compose up
The first time you download it may take a while (a few minutes).

3. Application
🌐 Frontend: http://localhost:3000

📡 Backend API: http://localhost:8000/docs — Swagger

⚙️ Dependencies
Docker and Docker Compose must be installed:

🐳 Docker Desktop (Windows/Linux/Mac)

⚠️ Environment variables (for example)
.env can also be transferred via the file, but docker-compose.written in yaml:

env
Копировать
Редактировать
# Database Settings (PostgreSQL)
DATABASE_URL=postgresql+asyncpg://postgres:123465@db:5432/lifegram

# Email
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=email@example.com
SMTP_PASSWORD=password
EMAIL_FROM=email@example.com

# Frontend
FRONTEND_URL=http://localhost:3000

# Password reset
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES=30

# Admin User
FIRST_ADMIN_EMAIL=admin@example.com
FIRST_ADMIN_USERNAME=admin
FIRST_ADMIN_PASSWORD=Admin777


# Development/Production Mode
ENVIRONMENT=development

# Rate Limiting (optional)
RATE_LIMIT=100/minute

📁 File structure
bash
Копировать
Редактировать
lifegram-fullstack/
│
├── backend_fastapi/       # FastAPI backend
├── frontend_next/         # Next.js frontend
├── docker-compose.yaml    # All services configuration
└── README.md              # Instructions

📦Manual installation of Docker Images (if desired)
bash
Копировать
Редактировать
docker pull aibekkemel/lifegram-backend
docker pull aibekkemel/lifegram-frontend

🧑‍💻 Made by: Aibek Kemel
Thank you for your attention! If you have any questions — I am open 🌟
=======
# insta_clone_fullstack_next_fastapi
