# 🎓 KITE LMS — Enterprise Learning Management System

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-1.0-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-ORM-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supported-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

An enterprise-grade, multi-tenant **Learning Management System (LMS)** designed for educational institutes, academies, and online learning providers. **KITE LMS** equips administrators and educators with tools to manage courses, live classes, student performance, assessments, CRM leads, billing, workflows, and automated reporting.

---

## 🌟 Key Features

### 🏢 Multi-Tenant & RBAC Architecture
- **Institute Management**: Support for custom domains, subdomains, white-label branding, logos, and SEO metadata.
- **Dynamic Role-Based Access Control (RBAC)**: Granular permission assignments across custom roles (e.g., Institute Admin, Teacher, Student, Manager).

### 👑 Institute Admin Portal
- **Course & Curriculum Builder**: Create and configure courses, batches, pr-erecorded video modules, and syllabus structures.
- **User & Student Administration**: Manage student enrollments, instructor assignments, and user profiles.
- **CRM & Lead Management**: Capture, track, and convert prospective student leads with custom follow-ups.
- **Consultation Booking System**: Manage consultation slots, bookings, and customer inquiries.
- **Financial Suite**: Billing configuration, invoicing, transaction history, and subscription plans management.
- **Automated Workflows & Integrations**: Configure event-driven action workflows and third-party tools.
- **Certificates & Reports**: Generate completion certificates and inspect platform-wide audit analytics.

### 👩‍🏫 Teacher / Instructor Portal
- **Instructor Dashboard**: Overview of assigned courses, total enrolled students, pending tasks, and scheduled live classes.
- **Live Class Management**: Schedule live interactive sessions (Zoom, Google Meet, or Custom providers) and track student attendance.
- **Assessments & Quizzes**: Interactive quiz creator with multiple question types, automated grading, and score tracking.
- **Task & Assignment Hub**: Assign coursework, set submission deadlines, evaluate student submissions, and provide feedback.
- **Digital Library & Study Materials**: Upload course notes, presentation slides, syllabus PDFs, and reference books.
- **Communication Tools**: Real-time 1-on-1 chat, announcements newsfeed, and notification center.

---

## 🛠️ Technology Stack

### **Frontend** (`/frontend`)
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + PostCSS
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Linter**: [Oxlint](https://oxc.rs/docs/guide/usage/linter)

### **Backend** (`/backend`)
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/)
- **Database ORM**: [SQLAlchemy](https://www.sqlalchemy.org/)
- **Database Engine**: PostgreSQL / SQLite
- **Database Migrations**: [Alembic](https://alembic.sqlalchemy.org/)
- **Authentication**: JWT (JSON Web Tokens) via `python-jose` with Refresh Token rotation
- **Security**: `passlib` with `bcrypt` password hashing
- **Data Schemas**: `pydantic` v2

---

## 📂 Repository Structure

```
Learning-Management-System/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── core/            # Security, JWT auth, system settings
│   │   ├── crud/            # Database access layer
│   │   ├── db/              # Database session & engine configurations
│   │   ├── models/          # SQLAlchemy domain models (all_models.py)
│   │   ├── routers/         # API endpoints (auth, teacher, institute_admin)
│   │   ├── schemas/         # Pydantic data schemas
│   │   ├── services/        # Business logic services
│   │   └── main.py          # FastAPI main entrypoint & CORS middleware
│   ├── alembic/             # Database migration scripts
│   ├── uploads/             # Static uploaded files (documents, images)
│   ├── seed.py              # Initial database seeding script
│   ├── create_db.py         # Database creation script
│   ├── requirements.txt     # Python package dependencies
│   └── .env                 # Environment configuration
│
└── frontend/                 # React + TypeScript + Vite Application
    ├── public/              # Static public assets
    ├── src/
    │   ├── api/             # Axios API service instances & endpoints
    │   ├── components/      # Reusable UI components & layouts
    │   ├── context/         # Auth & global React Context providers
    │   ├── hooks/           # Custom React hooks
    │   ├── pages/           # Admin & Teacher page views
    │   │   └── teacher/     # Dedicated instructor views & submodules
    │   ├── App.tsx          # Main Application router & guard routes
    │   ├── main.tsx         # React DOM root entrypoint
    │   └── index.css        # Global CSS & Tailwind imports
    ├── package.json         # NPM scripts and dependencies
    └── vite.config.ts       # Vite project configuration
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python**: v3.10 or higher
- **PostgreSQL** *(Optional, SQLite works out of the box for development)*

---

### 1. Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   - **Windows**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up Environment Variables**:
   Create or edit the `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kite_lms
   # Note: For SQLite local development, you can use:
   # DATABASE_URL=sqlite:///./test.db
   SECRET_KEY=your-super-secret-jwt-key
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   REFRESH_TOKEN_EXPIRE_DAYS=7
   ```

5. **Initialize and Seed Database**:
   Populate the database with default schemas, permissions, roles, and sample data:
   ```bash
   python seed.py
   ```

6. **Run the Backend Server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - API Server running at: `http://localhost:8000`
   - Interactive Swagger API Docs: `http://localhost:8000/docs`
   - ReDoc API Documentation: `http://localhost:8000/redoc`

---

### 2. Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   - Frontend web server running at: `http://localhost:5173`

---

## 🔑 Demo Login Credentials

After running `python seed.py`, the following default test accounts are available:

| Role | Username / Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Institute Admin** | `admin@kite.lms` (or `admin`) | `password123` | Full Institute Administration & Management |
| **Teacher / Instructor** | `teacher@kite.lms` (or `teacher`) | `password123` | Course Management, Quizzes, Attendance, Live Classes |
| **Student** | `student@kite.lms` (or `student`) | `password123` | Student Portal Access |

---

## 📜 NPM Commands (Frontend)

| Command | Description |
| :--- | :--- |
| `npm run dev` | Launches Vite local development server with HMR. |
| `npm run build` | Runs TypeScript type-checks and compiles production build files. |
| `npm run lint` | Runs `oxlint` for high-speed code linting. |
| `npm run preview` | Serves the production build locally for verification. |

---

## 📡 API Endpoints Overview

The backend exposes RESTful endpoints grouped by domain:

- **Authentication (`/api`)**:
  - `POST /api/login` — Authenticate user & issue JWT Access/Refresh tokens
  - `POST /api/refresh` — Refresh expired access tokens
- **Institute Admin (`/api/admin`)**:
  - `/api/admin/courses` — CRUD operations for courses and batches
  - `/api/admin/users` — Manage user roles, permissions, and accounts
  - `/api/admin/leads` — Manage prospective student CRM leads
  - `/api/admin/billing` — Invoices, transactions, and subscription plans
- **Teacher Portal (`/teacher`)**:
  - `/teacher/courses` — View assigned courses & modules
  - `/teacher/live-classes` — Schedule and manage live interactive classes
  - `/teacher/quizzes` — Create quizzes, questions, and view student scores
  - `/teacher/attendance` — Mark and export class attendance records

---

## 📄 License

This project is proprietary and confidential. Unauthorized copying, distribution, or modification is strictly prohibited.
