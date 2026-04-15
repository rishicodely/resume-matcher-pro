# 🚀 Resume Matcher Pro

An AI-powered resume analysis system built using a **distributed, event-driven architecture** to evaluate resume-job compatibility using **semantic embeddings and cosine similarity**.

---

## 🏗️ Architecture

This system is designed as a **microservices-inspired, event-driven pipeline** to handle compute-heavy resume analysis asynchronously.

### 🔄 System Flow

1. User uploads resume → stored in **AWS S3**
2. Frontend sends request to **Gateway API (NestJS)**
3. API enqueues job into **Redis (BullMQ)**
4. Worker consumes job asynchronously
5. Worker calls **Java ML service**
6. Java service:
   - extracts text
   - generates embeddings
   - computes **cosine similarity**
   - generates structured feedback

7. Results stored in **PostgreSQL (Neon)**
8. Worker handles retries & failures via **DLQ**
9. Frontend fetches match history

---

### 📊 Architecture Diagram

```text
Frontend (React)
        ↓
Gateway API (NestJS)
        ↓
Redis Queue (BullMQ / Upstash)
        ↓
Worker (Node.js)
        ↓
Java ML Service (Spring Boot)
        ↓
AI APIs (Groq / OpenRouter)
        ↓
PostgreSQL (Neon)

+ S3 (Resume Storage)
```

---

## ⚙️ Tech Stack

### Backend

- Node.js (NestJS) – API layer
- Java (Spring Boot) – ML processing service

### Queue & Processing

- Redis (Upstash) – Job queue
- BullMQ – Worker + DLQ handling

### Storage

- AWS S3 – Resume file storage

### Database

- PostgreSQL (Neon)
- pgvector – Embedding storage

### AI / ML

- Embedding-based semantic matching
- Cosine similarity scoring
- Groq / OpenRouter APIs

### Deployment

- Railway – API & worker services
- Neon – Database
- Upstash – Redis
- AWS S3 – File storage

---

## 🚀 Features

- 📁 Resume upload & storage via S3
- 🔄 Asynchronous processing using Redis queues
- 🧠 Semantic similarity using embeddings + cosine similarity
- ⚡ Non-blocking backend architecture
- 📊 AI-generated feedback (strengths, weaknesses, recommendations)
- 📜 User-specific match history
- 🧩 Polyglot microservices (Node + Java)
- ♻️ Dead Letter Queue (DLQ) for failure handling

---

## 📂 Project Structure

```text
resume-matcher-pro/
├── gateway-api/        # NestJS API
├── match-worker/       # Java ML service
├── dashboard-ui/       # Frontend
```

---

## 🔌 API Example

### POST /match

```json
{
  "resumeUrl": "https://your-s3-url",
  "jd": "Backend Developer with Node.js experience"
}
```

Response:

```json
{
  "jobId": "job_123",
  "status": "QUEUED"
}
```

---

## 🧪 Local Setup

### 1. Clone repo

```bash
git clone https://github.com/your-username/resume-matcher-pro
cd resume-matcher-pro
```

---

### 2. Setup environment variables

```env
DB_URL=
REDIS_URL=
GROQ_API_KEY=
AWS_ACCESS_KEY=
AWS_SECRET_KEY=
```

---

### 3. Run services

#### Gateway API

```bash
cd gateway-api
npm install
npm run start:dev
```

#### Worker

```bash
npm run worker
```

#### Java ML Service

```bash
cd match-worker
./mvnw spring-boot:run
```

---

## 🧠 Design Decisions

- Used **event-driven architecture** to handle heavy processing asynchronously
- Introduced **worker + queue pattern** to avoid blocking API requests
- Implemented **DLQ** for reliability and retry handling
- Separated ML logic into **Java service** for scalability and flexibility
- Used **cosine similarity over embeddings** for semantic matching
- Stored resumes in **S3** to decouple storage from compute

---

## ⚠️ Deployment Note

- Core system (API, Worker, DB, Redis) is deployable and functional
- Java ML service is included as a separate microservice
- Due to memory constraints on free-tier platforms, ML service is best run locally or on higher-memory environments

---

## 🚀 Future Improvements

- Add authentication (JWT)
- Real-time processing updates (WebSockets)
- Optimize ML service memory usage
- Improve ranking model

---

## ✨ Motivation

Built to solve resume-job matching using **semantic understanding instead of keyword matching**, with focus on:

- System design
- Scalability
- Real-world backend architecture

---

## 📌 Author

Rishika Reddy
Backend Developer

---
