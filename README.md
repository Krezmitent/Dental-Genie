# 🚀 Dental Genie - AI Diagnosis Platform

Dental Genie is an AI-powered full-stack platform designed to assist dental professionals in diagnosing pathologies from dental radiographs (X-rays).

This repository is a **Monorepo** consisting of three distinct microservices:
1. **`frontend/`**: The modern web interface (React + Vite)
2. **`backend/`**: The API & Database Gateway (Node.js + Express + Firebase + Gemini AI)
3. **`ai-service/`**: The Core Neural Network Engine (Python + YOLOv11)

---

## 🛠️ Prerequisites

Before you start, make sure you have the following installed:
- **Node.js** (v18 or higher)
- **Python** (3.8 or higher)
- A **Firebase** Account (for Authentication and Database)
- A **Google Gemini API Key** (for dynamic AI PDF Summaries)

---

## 🔒 Environment Setup

**WARNING: NEVER COMMIT SECRETS TO GITHUB.** 
This repository contains a root `.gitignore` to prevent secret leakage, but always double-check.

### 1. Backend Environment (`backend/.env`)
Create a file named `.env` inside the `backend/` folder:
```env
PORT=5000
AI_SERVICE_URL=http://127.0.0.1:8000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key-Here\n-----END PRIVATE KEY-----"
GEMINI_API_KEY=your_gemini_api_key
```
*(Alternatively, place your `firebase-service-account.json` in the `backend/` folder. It is ignored by Git by default).*

### 2. Frontend Environment (`frontend/.env`)
Create a file named `.env` inside the `frontend/` folder:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🚀 Running the Project Locally

You will need to open **three separate terminals**, one for each microservice.

### Terminal 1: AI Service (Python)
The AI service runs the object detection model.
```bash
cd ai-service
# 1. Create a virtual environment
python -m venv venv

# 2. Activate it (Windows)
.\venv\Scripts\activate
# (Mac/Linux: source venv/bin/activate)

# 3. Install requirements
pip install -r requirements.txt

# 4. Start the server
python app.py
```
*The AI service will run on `http://127.0.0.1:8000`*

### Terminal 2: Backend (Node.js)
The backend manages data, handles file uploads, and coordinates with the AI.
```bash
cd backend
# 1. Install dependencies
npm install

# 2. Start the server
npm run dev
# (or node server.js)
```
*The Backend API will run on `http://localhost:5000`*

### Terminal 3: Frontend (React)
The frontend provides the interactive user dashboard.
```bash
cd frontend
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```
*The Frontend will be accessible at `http://localhost:5173` (or the port Vite provides).*

---

## 📖 Deployment

Because this is a Monorepo, you do **not** need to split these folders into different repositories. You can deploy this exact repository directly:

1. **Frontend**: Deploy to **Vercel** (Set Root Directory to `frontend`)
2. **Backend**: Deploy to **Render** (Set Root Directory to `backend`)
3. **AI Service**: Deploy to **Render** or **Google Cloud Run** (Set Root Directory to `ai-service`)

*For full deployment instructions, refer to the included `deployment_guide.md`.*
