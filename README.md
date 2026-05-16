# Full Stack Quiz Platform

A production-ready test platform built with Next.js, MongoDB, Redis, and BullMQ.

## Features

- **Admin Dashboard**: Create tests, upload DOCX/PDF, manage batches.
- **File Parsing**: Automatically extracts questions from uploaded documents.
- **Test Engine**: Server-authoritative timer, autosave, secure test taking.
- **Auto-Grading**: Instant results for objective questions.
- **AI Explanations**: Google Gemini integration for personalized feedback.
- **Manual Grading**: Queue for subjective questions (UI placeholder).

## Prerequisites

- Node.js 18+
- Docker (for MongoDB & Redis)

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start Infrastructure**:
    ```bash
    docker-compose up -d
    ```

3.  **Configure Environment**:
    Create `.env.local`:
    ```env
    MONGODB_URI=mongodb://localhost:27017/quizzapp
    REDIS_URL=redis://localhost:6379
    NEXTAUTH_SECRET=your-secret-key
    NEXTAUTH_URL=http://localhost:3000
    GOOGLE_API_KEY=your-gemini-api-key
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

5.  **Run Worker (in separate terminal)**:
    *Note: In a real production setup, this would be a separate process.*
    For local dev, you can create a script to run the worker or just rely on the API triggering it (current implementation is synchronous for submit, async for expiry needs worker script).

## Usage

- Access Admin UI at `/admin`.
- Access User Dashboard at `/dashboard`.
- Upload format: See `sample-upload.docx` (create one based on the spec).

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TailwindCSS, Shadcn UI.
- **Backend**: Next.js API Routes.
- **Database**: MongoDB (Mongoose).
- **Queue**: BullMQ + Redis.
- **AI**: Google Gemini.
