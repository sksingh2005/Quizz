# Full Stack Quiz Platform

A production-ready test platform built with Next.js, MongoDB, Redis, WebSockets, and BullMQ.

## Features

- **Admin Dashboard**: Create tests, upload DOCX/PDF, manage batches.
- **File Parsing**: Automatically extracts questions from uploaded documents (DOCX and PDF).
- **Test Engine**: Server-authoritative timer, autosave, secure test taking.
- **Proctoring**: Real-time AI face detection during tests using MediaPipe.
- **Real-time Sync**: Live test control and status updates using Socket.io & Redis Pub/Sub.
- **Auto-Grading**: Instant results for objective questions.
- **AI Explanations**: Google Gemini integration for personalized feedback.
- **Rich Text Support**: Full support for rendering Markdown and LaTeX (Math equations).
- **Manual Grading**: Queue for subjective questions (UI placeholder).

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (for MongoDB, Redis, and production deployment)

---

## Environment Variables

All required environment variables are documented in the `.env.example` file. Copy it to create your local config:

```bash
cp .env.example .env.local
```

Below is a detailed breakdown of every variable:

### Database

| Variable | Description | Default |
| --- | --- | --- |
| `MONGODB_URI` | MongoDB connection string. Use `mongo` as the hostname inside Docker, or `localhost` for local dev. For production, use a MongoDB Atlas URI. | `mongodb://admin:password@localhost:27017/quizzapp?authSource=admin` |

### Redis

| Variable | Description | Default |
| --- | --- | --- |
| `REDIS_URL` | Redis connection string used by BullMQ (job queues) and Socket.io (pub/sub for real-time sync). Use `redis` as the hostname inside Docker. | `redis://localhost:6379` |

### NextAuth.js (Authentication)

| Variable | Description | Default |
| --- | --- | --- |
| `NEXTAUTH_SECRET` | Secret key used to encrypt session tokens. **Generate a strong one** with: `openssl rand -base64 32` | `secret` |
| `NEXTAUTH_URL` | The canonical URL of the app. Must match the domain users will access. | `http://localhost:3000` |

### Google Gemini AI

| Variable | Description | Default |
| --- | --- | --- |
| `GOOGLE_API_KEY` | API key for Google Gemini, used for AI-powered explanations. Get yours from [Google AI Studio](https://makersuite.google.com/app/apikey). | *(none – required)* |

### Cloudinary (Image Uploads)

Used for hosting images embedded in quiz questions. Create a free account at [cloudinary.com](https://cloudinary.com). Find your credentials in **Dashboard > Settings > API Keys**.

| Variable | Description | Default |
| --- | --- | --- |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name (server-side). | *(none – required)* |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Same cloud name, exposed to the browser for client-side image URLs. | *(none – required)* |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key (server-side only). | *(none – required)* |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret (server-side only). **Keep this private.** | *(none – required)* |

### PDF Parse Worker

Controls the background job queue that processes uploaded DOCX/PDF files.

| Variable | Description | Default |
| --- | --- | --- |
| `PDF_PARSE_QUEUE_ENABLED` | Enable/disable the BullMQ parsing queue. | `true` |
| `PDF_PARSE_WORKER_CONCURRENCY` | Number of concurrent parsing workers. | `2` |
| `PDF_PARSE_WAIT_MS` | Max time (ms) to wait for a parse job to complete. | `30000` |
| `PDF_MAX_FILE_SIZE_MB` | Maximum allowed file size for uploads (in MB). | `20` |
| `PDF_PARSE_MAX_CONCURRENT_PER_ADMIN` | Max concurrent parse jobs per admin user. | `3` |

### Anti-Cheat

| Variable | Description | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_MAX_WARNINGS` | Number of tab-switch / focus-loss warnings before a student is auto-submitted. Exposed to the browser. | `15` |

### Admin Access

| Variable | Description | Default |
| --- | --- | --- |
| `ADMIN_EMAILS` | Comma-separated list of email addresses authorized to register as admin via the web UI. Only emails in this list can sign up through `/admin-signup`. | `admin@nitj.ac.in` |

**Example:**
```env
ADMIN_EMAILS=professor1@nitj.ac.in,professor2@nitj.ac.in,hod@nitj.ac.in
```

#### How to create an Admin account

Setting up an admin is a **two-step process**:

1. **Step 1 (Developer):** Add the admin's email to `ADMIN_EMAILS` in your `.env` / `.env.local` file and restart the server.
   ```env
   ADMIN_EMAILS=prof1@nitj.ac.in,prof2@nitj.ac.in
   ```

2. **Step 2 (Admin):** The admin visits `/admin-signup` in the browser, fills in their name, email, and password, and submits the form. Their account is created in the database with the `admin` role.

After signing up, the admin can log in at `/login` like any other user — they will be automatically redirected to the Admin Dashboard (`/admin`).

> **Important:** The `ADMIN_EMAILS` whitelist only controls **who is allowed to register** as admin. It does NOT automatically create accounts — the admin must sign up themselves. If someone's email is not in the whitelist, the signup will be rejected.

---

## Setup (Local Development)

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start Infrastructure** (MongoDB & Redis):
    ```bash
    docker-compose up -d mongo redis
    ```
    > This starts only the database containers. The MongoDB container is pre-configured with username `admin` and password `password` (matching the default `MONGODB_URI`).

3.  **Configure Environment**:
    ```bash
    cp .env.example .env.local
    ```
    Edit `.env.local` and fill in your API keys for **Google Gemini** and **Cloudinary**. The database and Redis defaults will work out of the box with Docker.

4.  **Run Development Server**:
    The dev server uses a custom entry point (`src/server.ts`) that runs both Next.js and the Socket.io WebSocket server.
    ```bash
    npm run dev
    ```

5.  **Run Worker (in separate terminal)**:
    *Note: In a real production setup, this would be a separate process.*
    For local dev, you can create a script to run the worker or rely on the API triggering it (current implementation is synchronous for submit, async for expiry needs worker script).

---

## Docker Deployment (Production)

The project includes a multi-stage `Dockerfile` and a `docker-compose.yml` to run the entire stack in containers.

### Quick Start

1.  **Configure environment variables**:
    Create a `.env` file in the project root (Docker Compose reads `.env` automatically):
    ```bash
    cp .env.example .env
    ```
    Edit `.env` and set your production values — at minimum:
    - `NEXTAUTH_SECRET` — a strong random secret
    - `GOOGLE_API_KEY` — your Gemini API key
    - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — your Cloudinary credentials

2.  **Build and start all services**:
    ```bash
    docker-compose up -d --build
    ```
    This will:
    - Build the app image from the local `Dockerfile`
    - Start MongoDB 7 with authentication (`admin` / `password`)
    - Start Redis 7
    - Start the Quiz App on port `3000`

3.  **Verify**:
    ```bash
    docker-compose ps
    ```
    The app should be healthy and accessible at `http://localhost:3000`.

### Docker Architecture

```
┌────────────────────────────────────────────────────┐
│  docker-compose.yml                                │
│                                                    │
│  ┌──────────┐   ┌──────────┐   ┌───────────────┐  │
│  │  MongoDB  │   │  Redis   │   │   Quiz App    │  │
│  │  mongo:7  │   │ redis:7  │   │  (Dockerfile) │  │
│  │  :27017   │◄──│  :6379   │◄──│    :3000      │  │
│  └──────────┘   └──────────┘   └───────────────┘  │
│     ▲ auth:                       │                │
│     admin/password                │ build: .       │
└────────────────────────────────────────────────────┘
```

### Dockerfile Details

The `Dockerfile` uses a **multi-stage build** for a lean production image:

| Stage | Purpose |
| --- | --- |
| `base` | Sets up Node 20 Alpine with working directory |
| `deps` | Installs all npm dependencies |
| `builder` | Builds the Next.js app (standalone output) and compiles `server.ts` |
| `runtime-deps` | Installs only the runtime dependencies needed by the custom server (`socket.io`, `ioredis`) |
| `runner` | Final image — copies built assets, runs as non-root `nextjs` user with health check |

### Overriding Environment Variables

All environment variables in `docker-compose.yml` use the `${VAR:-default}` syntax, which means:
- If the variable is set in a `.env` file (or host environment), that value is used.
- Otherwise, the default value after `:-` is used.

This allows you to override any variable without modifying `docker-compose.yml`:

```bash
# .env (in project root, read by Docker Compose)
NEXTAUTH_SECRET=my-super-secret-key
GOOGLE_API_KEY=AIzaSy...
CLOUDINARY_CLOUD_NAME=my-cloud
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abcdef
```

---

## Usage

- **Landing Page** (`/`): Choose between Student Portal and Admin Portal.
- **Student Sign Up** (`/signup`): Students register with name, email, password, roll number, and batch.
- **Admin Sign Up** (`/admin-signup`): Admins register with name, email, and password. Only emails listed in `ADMIN_EMAILS` are authorized.
- **Login** (`/login`): Shared login for both students and admins. After login, users are automatically redirected based on their role.
- **Admin Dashboard** (`/admin`): Create tests, manage batches, grade submissions.
- **Student Dashboard** (`/dashboard`): Take tests, view results, get AI feedback.
- Upload format: Supported formats include DOCX and PDF. See the expected structure in the documentation or sample files.

## Tech Stack

- **Frontend**: Next.js (App Router), TailwindCSS, Shadcn UI, Zustand.
- **Backend**: Custom Node.js Server (HTTP + Socket.io), Next.js API Routes.
- **Database**: MongoDB (Mongoose).
- **Caching & Pub/Sub**: Redis.
- **Queue**: BullMQ.
- **AI Integration**: Google Gemini.
- **Proctoring**: MediaPipe (Face Detection).
- **Media Storage**: Cloudinary.
- **Rendering**: React Markdown, KaTeX (Math).
