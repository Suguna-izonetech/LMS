# 🎓 iZone LMS — Enterprise Learning Management System

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-1.0-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-ORM-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supported-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

An enterprise-grade, multi-tenant **Learning Management System (LMS)** designed for educational institutes, academies, and online learning providers. **iZone LMS** separates responsibilities across **4 distinct login portals** (Platform Admin, Institute Admin, Teacher, Student) to manage courses, live interactive classes, student performance, assessments, CRM leads, billing, automated workflows, and certificates.

---

## 🌟 4 Primary Login Portals

### 🛡️ 1. Platform Admin Portal (`Admin`)
- **SaaS Ecosystem Oversight**: Platform-level health metrics, total institutes, cross-tenant user directory, and revenue analytics.
- **Tenant Provisioning**: Onboard new institutes, assign custom subdomains/domains, and configure storage/seat quotas.
- **Explore Plans & Add-ons**: Manage platform features (`OnDomain Custom Domains`, `iOS & Android Apps`, `WhatsApp Gateway`, `Zoom SDK`, `WordPress Connector`).

### 👑 2. Institute Admin Portal (`InstituteAdmin`)
- **Course & Curriculum Builder**: Create and configure courses, batches, pre-recorded video modules, and syllabus structures.
- **CRM Lead Pipeline**: Capture leads (`New`, `Contacted`, `Follow-up`, `Converted`), assign staff, log call follow-ups, and convert leads to registered students with one click (`/crm/leads/{id}/enroll`).
- **Automated Workflows Engine**: Configure trigger-action automation recipes (`Lead Created`, `Student Enrolled`, `Payment Received`) with execution log tracking and test simulation runners.
- **Financial Suite & Certificates**: Configure GST billing, tax rates, invoice generation, and certificate templates.

### 👩‍🏫 3. Teacher / Instructor Portal (`Teacher`)
- **Instructor Dashboard**: Overview of assigned courses, total enrolled students, pending assignment grading, and today's live classes.
- **Live Class Management**: Schedule live interactive sessions (Zoom, Google Meet, or Custom providers), track student attendance (`Present`, `Absent`, `Late`), and share session recordings.
- **Assessments & Quizzes**: Build custom quizzes with multiple question types, automated answer checking, and score tracking.
- **Task & Assignment Hub**: Post tasks, set submission deadlines, evaluate student solution files, and provide feedback.
- **Digital Library**: Upload course handouts, slides, syllabus PDFs, and reference e-books.

### 🎓 4. Student / Learner Portal (`Student`)
- **Student Learning Dashboard**: Progress metrics across enrolled courses, today's live classes with instant **"Join Live Class"** buttons, pending tasks, active quizzes, and earned certificates.
- **Interactive Class & Video Consumption**: Join scheduled virtual classes with one click and stream video lectures organized by module syllabus.
- **Assessments & Submissions**: Attempt timed interactive quizzes with instant score calculation, and upload assignment solution files before deadlines.
- **Certificates**: View and download official verified course completion certificates (`CERT-YYYYMMDD-XXXX`).

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
│   │   ├── routers/         # API endpoints (auth, institute_admin, teacher, student)
│   │   ├── schemas/         # Pydantic data validation schemas
│   │   ├── services/        # Business logic services (reports, workflows)
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
    │   ├── components/      # Reusable UI components, tables, modals & layouts
    │   ├── context/         # Auth & Toast global React Context providers
    │   ├── hooks/           # Custom React hooks
    │   ├── pages/           # Admin & Teacher & Student page views
    │   │   ├── student/     # Dedicated learner portal submodules
    │   │   └── teacher/     # Dedicated instructor portal submodules
    │   ├── App.tsx          # Main Application router & role guard routes
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
   DATABASE_URL=sqlite:///./test.db
   SECRET_KEY=your-super-secret-jwt-key
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   REFRESH_TOKEN_EXPIRE_DAYS=7
   ```

5. **Initialize and Seed Database**:
   Populate the database with default schemas, permissions, roles, and sample data across all 4 logins:
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

| Role | Username / Email | Password | Primary Access Scope |
| :--- | :--- | :--- | :--- |
| **Platform Admin** | `    ` (or `platform_admin`) | `password123` | Multi-Tenant Platform Administration & SaaS Add-ons |
| **Institute Admin** | `instituteadmin@kite.lms` (or `institute_admin`) | `password123` | Institute Curriculum, CRM Pipeline, Workflows & Billing |
| **Teacher / Instructor** | `teacher@kite.lms` (or `teacher`) | `password123` | Course Delivery, Live Classes, Quizzes & Attendance |
| **Student** | `student@kite.lms` (or `student`) | `password123` | Student Learning Portal, Live Class Join, Quiz Attempts |

---

## 📜 NPM Commands (Frontend)

| Command | Description |
| :--- | :--- |
| `npm run dev` | Launches Vite local development server with HMR. |
| `npm run build` | Runs TypeScript type-checks (`tsc -b`) and compiles production bundle. |
| `npm run lint` | Runs `oxlint` for high-speed code linting. |
| `npm run preview` | Serves the production build locally for verification. |

---

## 📡 API Endpoints Overview

The backend exposes RESTful endpoints grouped by domain under `/api`:

- **Authentication (`/api/auth`)**:
  - `POST /api/auth/login` — Authenticate user & issue JWT Access/Refresh tokens
  - `POST /api/auth/institute/login` — Authenticate Institute Admin user
  - `POST /api/auth/refresh` — Refresh expired access tokens
- **Institute Admin Portal (`/api/institute-admin`)**:
  - `/api/institute-admin/courses` — CRUD operations for courses, batches, and modules
  - `/api/institute-admin/users` — Manage user roles, permissions, and accounts
  - `/api/institute-admin/crm/leads` — Manage prospective student CRM leads & follow-ups
  - `POST /api/institute-admin/crm/leads/{id}/enroll` — Convert lead to enrolled student
  - `/api/institute-admin/workflows` — CRUD, toggle status, and test trigger automated workflows
  - `/api/institute-admin/billing` — Invoices, transactions, and GST billing configurations
- **Teacher Portal (`/api/teacher`)**:
  - `/api/teacher/courses` — View assigned courses & modules
  - `/api/teacher/live-classes` — Schedule and conduct live interactive classes
  - `/api/teacher/quizzes` — Build quizzes, questions, and view student scores
  - `/api/teacher/attendance` — Mark and export class attendance records
- **Student Portal (`/api/student`)**:
  - `/api/student/dashboard` — Overview of enrolled courses, today's live classes, tasks, and certificates
  - `/api/student/courses` — View enrolled courses, syllabus, and video modules
  - `/api/student/live-classes` — View scheduled live classes & instant join meeting links
  - `/api/student/quizzes` — View and attempt interactive timed quizzes
  - `/api/student/tasks` — View task instructions & upload solution file submissions
  - `/api/student/certificates` — Claim and download course completion certificates

---

## 📄 License

This project is proprietary and confidential. Unauthorized copying, distribution, or modification is strictly prohibited.
