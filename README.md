# 🏙️ CivicFixAi - Smart City Issue Resolution Platform

**CivicFixAi** is a modern civic engagement platform designed to bridge the gap between citizens, authorities, and contractors. Powered by **Google Gemini**, it analyzes reported issues (like potholes or water leakage) in real-time to prioritize severity and suggest fixes.

![Project Status](https://img.shields.io/badge/Status-Live-success)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Firebase%20%7C%20Gemini-blue)

## 🚀 Features

### 🧑‍🤝‍🧑 For Citizens
* **AI-Powered Reporting:** Upload a photo and let **Google Gemini** analyze the severity and suggest precautions.
* **One-Click Login:** Secure authentication via Google.
* **Live Tracking:** Monitor the status of your report (Reported → Accepted → In Progress → Resolved).
* **Smart Chatbot:** Integrated AI assistant for quick help.

### 👷 For Contractors
* **Secure Dashboard:** Access restricted to verified agencies via specific Google Workspaces.
* **Job claiming (FCFS):** First-Come-First-Serve job acceptance model.
* **Revenue Tracking:** Real-time earnings and job history logs.

### 👮 For Admins
* **Command Center:** Global view of all city issues.
* **AI Analytics:** Visual charts showing resolution rates and critical zones.
* **Smart Dispatch:** Assign budgets and route tasks to specific departments (Electrician, Road Works, etc.).

## 🛠️ Tech Stack

* **Frontend:** React.js (Vite), Tailwind CSS, Framer Motion
* **Backend:** Firebase (Firestore, Auth, Storage)
* **AI Engine:** Google Gemini (via `gemini-1.5-flash` / `gemini-pro`)
* **Icons:** Lucide React

## ⚙️ Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/CivicFixAi.git](https://github.com/YOUR_USERNAME/CivicFixAi.git)
    cd CivicFixAi
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory and add your keys:
    ```env
    VITE_GEMINI_API_KEY=your_google_ai_key
    VITE_FIREBASE_API_KEY=your_firebase_key
    # ... add other firebase config keys
    ```

4.  **Run Locally**
    ```bash
    npm run dev
    ```

## 📸 Screenshots
*(Add screenshots of your Dashboard and Reporting Screen here)*

---
*Built for the Google AI Hackathon 2025.*