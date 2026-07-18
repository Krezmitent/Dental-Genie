# Dental Diagnosis & Clinic Management System

This is a production-grade, three-tier application built with React, Node.js, and Python (FastAPI) to provide AI-assisted dental diagnosis and clinic management.

## Project Structure

*   `/frontend` - React.js SPA (Vite, Tailwind CSS, Framer Motion)
*   `/backend` - Node.js REST API (Express, MongoDB, Cloudinary, JWT)
*   `/ai-service` - Python Inference Engine (FastAPI, YOLOv5)

---

## Prerequisites

Before running the application, ensure you have the following installed:
1.  **Node.js** (v18+)
2.  **Python** (v3.8+)
3.  **MongoDB Cloud Account** (or a local MongoDB instance)
4.  **Cloudinary Account** (for free image hosting)

---

## Step 1: Set up the Backend (Node.js)

The backend handles users, authentication, appointments, and orchestrates the AI service.

1.  Open a terminal and navigate to the backend directory:
    ```bash
    cd backend
    npm install
    ```
2.  Create a `.env` file in the `backend/` directory with the following variables:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_super_secret_jwt_key_123
    
    # Get these from your Cloudinary Dashboard
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    
    # The URL where the Python AI service will run
    AI_SERVICE_URL=http://127.0.0.1:8000
    ```
3.  Start the backend server:
    ```bash
    npm run dev
    ```

---

## Step 2: Set up the AI Service (Python/FastAPI)

The AI service receives image URLs from the backend, downloads them, and runs them through a YOLOv5 model.

1.  Open a **new** terminal and navigate to the AI service directory:
    ```bash
    cd ai-service
    ```
2.  Create and activate a virtual environment (recommended):
    ```bash
    python -m venv venv
    
    # Windows:
    .\venv\Scripts\activate
    # Mac/Linux:
    # source venv/bin/activate
    ```
3.  Install the dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  **Regarding the ML Model:**
    *   **Demo Mode (No download required):** By default, if the system doesn't find a model file, it will safely run in "Demo Mode", returning highly realistic mock predictions so you can test the frontend UI without needing a 200MB model file.
    *   **Production Mode:** To use real AI, download a trained YOLOv5 PyTorch weights file and place it at `ai-service/models/best.pt`.
5.  Start the FastAPI server:
    ```bash
    uvicorn main:app --reload --port 8000
    ```

---

## Step 3: Set up the Frontend (React/Vite)

The frontend is the UI for Patients, Dentists, and Admins.

1.  Open a **third** terminal and navigate to the frontend directory:
    ```bash
    cd frontend
    npm install
    ```
2.  Create a `.env` file in the `frontend/` directory:
    ```env
    VITE_API_URL=http://localhost:5000/api
    ```
3.  Start the React development server:
    ```bash
    npm run dev
    ```
4.  Open your browser to the URL provided by Vite (usually `http://localhost:5173`).

---

## Testing the Flow

1.  Go to the frontend and **Register** as a `Patient`.
2.  Log in and navigate to the **AI Diagnosis** page.
3.  Upload an image (any JPEG/PNG). 
4.  The React app will send the image to Node.js -> Node.js uploads it to Cloudinary -> Node.js sends the Cloudinary URL to FastAPI -> FastAPI processes it and returns bounding boxes -> Node.js saves the report to MongoDB -> React polls and displays the results!
