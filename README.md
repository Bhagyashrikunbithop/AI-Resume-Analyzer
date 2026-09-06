# AI Resume Analyzer

An AI-powered web application that analyzes a candidate's resume against a given job description and provides an ATS-style compatibility score. The system uses Natural Language Processing (NLP), semantic similarity, and machine learning techniques to identify matching skills, missing skills, and areas for improvement.

---

## 📌 Overview

The **AI Resume Analyzer** helps students, fresh graduates, and job seekers evaluate how well their resume matches a specific job description.

Users can upload their resume in PDF format and provide a job description. The application extracts and processes the resume content, analyzes the job requirements, compares both using AI/NLP techniques, and presents the results through an easy-to-understand interface.

---

## ✨ Features

* Upload resume in PDF format
* Enter a job description
* AI-powered resume analysis
* ATS-style resume match score
* Resume and job description comparison
* Identify matching skills
* Identify missing skills
* Semantic similarity analysis
* Identify relevant keywords
* Provide resume improvement suggestions
* Display analysis results through a user-friendly dashboard
* User authentication and data management

---

## 🛠️ Technologies Used

### Frontend

* React
* TypeScript
* HTML5
* CSS3
* Tailwind CSS
* Vite

### Backend

* Python
* FastAPI
* Uvicorn
* Sentence Transformers
* spaCy
* Scikit-learn
* NumPy

### PDF Processing

* PyMuPDF
* pdfplumber

### Database & Authentication

* Supabase

### Development Tools

* Visual Studio Code
* Lovable
* GitHub

---

## 🧠 AI / NLP Components

### Sentence Transformers

Sentence Transformers are used to generate semantic embeddings for resume and job-description text. These embeddings help the system measure the contextual similarity between the resume and job requirements.

### spaCy

spaCy is used for Natural Language Processing and text-processing tasks.

### Scikit-learn

Scikit-learn is used for machine learning and similarity-related operations.

### PDF Text Extraction

The application uses **PyMuPDF** and **pdfplumber** to extract text from uploaded PDF resumes.

---

## 📁 Project Structure

```text
AI-Resume-Analyzer/
│
├── backend/
│   ├── requirements(1).txt
│   └── ... backend source files
│
├── src/
│   └── ... frontend source files
│
├── package.json
├── package-lock.json
├── README.md
└── ...
```

> **Note:** The exact files and folders may vary depending on the project configuration.

---

## 📦 Backend Requirements

The Python dependencies for the backend are stored in:

```text
backend/requirements(1).txt
```

The current requirements include:

```text
fastapi>=0.110
uvicorn[standard]>=0.27
python-multipart>=0.0.9
sentence-transformers>=2.6.0
spacy>=3.7
scikit-learn>=1.4
numpy>=1.26
PyMuPDF>=1.24
pdfplumber>=0.11
```

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/AI-Resume-Analyzer.git
```

Navigate to the project directory:

```bash
cd AI-Resume-Analyzer
```

---

### 2. Install Frontend Dependencies

Install the required Node.js packages:

```bash
npm install
```

---

### 3. Set Up the Backend

Navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment on Windows:

```bash
venv\Scripts\activate
```

---

### 4. Install Python Dependencies

Install the packages listed in the backend requirements file:

```bash
pip install -r "requirements(1).txt"
```

> **Recommended:** Rename `requirements(1).txt` to `requirements.txt` for a cleaner project structure. After renaming, use:
>
> ```bash
> pip install -r requirements.txt
> ```

---

## ▶️ Running the Application

The application consists of a **FastAPI backend** and a **React frontend**.

### Start the Backend

From the `backend` directory, start the FastAPI server.

If the FastAPI application is defined in `main.py`, use:

```bash
uvicorn main:app --reload
```

The backend runs at:

```text
http://localhost:8000
```

FastAPI interactive documentation is available at:

```text
http://localhost:8000/docs
```

---

### Start the Frontend

Open a **new terminal** in the project root directory.

Run:

```bash
npm run dev
```

The frontend application runs at:

```text
http://localhost:8080/
```

---

## 🔐 Environment Variables

If the project uses Supabase or other external services, configuration values should be stored in environment variables.

For example:

```text
.env
```

Do **not** upload files containing private credentials, passwords, API keys, or secret service keys to GitHub.

For sharing the project, use a `.env.example` file containing placeholder values.

Example:

```text
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 📊 Analysis Results

The application provides an analysis of the uploaded resume and job description, including:

* **ATS-style Match Score**
* Matching skills
* Missing skills
* Relevant keywords
* Resume-job similarity
* Skill gaps
* Resume improvement suggestions

These results help users understand how closely their resume aligns with the requirements of a particular job.

---

## 🎯 Use Cases

The AI Resume Analyzer can be used by:

* Students preparing for placements
* Fresh graduates
* Job seekers
* Career development programs
* Resume screening and evaluation
* Candidates preparing for specific job roles
* Users identifying missing technical skills

---

## 🌟 Advantages

* Provides quick resume-job compatibility analysis
* Reduces manual resume comparison
* Identifies relevant and missing skills
* Uses semantic similarity for contextual comparison
* Provides actionable improvement suggestions
* Presents results through a simple and user-friendly interface

---

## 🔮 Future Enhancements

Possible future improvements include:

* Support for DOCX resumes
* Resume section-wise scoring
* Automated resume optimization
* Job recommendation based on resume
* Multiple job-description comparison
* Resume ranking system
* Advanced transformer-based NLP models
* LinkedIn profile analysis
* Personalized career recommendations
* AI-powered resume generation

---

Screenshots can be added here to demonstrate the application interface.

## 📸 Screenshots

<h3>🏠 Home Page</h3>

<img src="https://github.com/Bhagyashrikunbithop/AI-Resume-Analyzer/blob/c7a4723581bfd4d944b31001269ebe6394f1e677/Screenshot%202026-09-06%20150732.png" alt="AI Resume Analyzer Home Page" width="800">

<br><br>

<h3>🔐 Login Page</h3>

<img src="https://github.com/Bhagyashrikunbithop/AI-Resume-Analyzer/blob/c7a4723581bfd4d944b31001269ebe6394f1e677/Screenshot%202026-09-06%20150355.png" alt="AI Resume Analyzer Login Page" width="800">

<br><br>

<h3>📊ATS score/result dashboard</h3>

<img src="https://github.com/Bhagyashrikunbithop/AI-Resume-Analyzer/blob/c7a4723581bfd4d944b31001269ebe6394f1e677/Screenshot%202026-09-06%20150526.png" alt="Resume Analysis Results Dashboard" width="800">

<br><br>

<h3>🤖 User History</h3>

<img src="https://github.com/Bhagyashrikunbithop/AI-Resume-Analyzer/blob/c7a4723581bfd4d944b31001269ebe6394f1e677/Screenshot%202026-09-06%20150553.png" alt="Resume Analysis Page" width="800">

```

If you find this project useful, consider giving the repository a ⭐ on GitHub.
