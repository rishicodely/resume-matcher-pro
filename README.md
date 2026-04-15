# 🚀 Resume Matcher Pro

An AI-powered resume analysis system built with a **distributed, event-driven architecture** that evaluates resume-job compatibility using semantic embeddings and asynchronous processing.

---

## 🏗️ Architecture

This system follows a **microservices + event-driven architecture** designed for scalability, fault tolerance, and non-blocking processing.

### 🔄 System Flow

1. User uploads resume → stored in **S3**
2. Frontend sends request to **Gateway API (NestJS)**
3. API enqueues job into **Redis (BullMQ)**
4. Worker consumes job asynchronously
5. Worker fetches resume from **S3**
6. Worker generates embeddings & similarity score
7. (Optional) Java ML service enhances feedback
8. Results stored in **PostgreSQL (Neon)**
9. Frontend fetches match history

---

### 📊 Architecture Diagram (Text)

```
                        ┌────────────────────┐
                        │     Frontend       │
                        │   (React UI)       │
                        └─────────┬──────────┘
                                  │
                                  ▼
                        ┌────────────────────┐
                        │   Gateway API      │
                        │   (NestJS)         │
                        └─────────┬──────────┘
                                  │
             ┌────────────────────┼────────────────────┐
             │                    │                    │
             ▼                    ▼                    ▼
   ┌────────────────┐   ┌────────────────┐   ┌────────────────┐
   │      S3        │   │    Redis       │   │   PostgreSQL   │
   │ (Resume Files) │   │  (BullMQ Queue)│   │   (Neon DB)    │
   └────────────────┘   └────────────────┘   └────────────────┘
                                  │
                                  ▼
                        ┌────────────────────┐
                        │     Worker         │
                        │   (Node.js)        │
                        └─────────┬──────────┘
                                  │
                                  ▼
                        ┌────────────────────┐
                        │  ML Service        │
                        │ (Java - Spring)    │
                        └─────────┬──────────┘
                                  │
                                  ▼
                        ┌────────────────────┐
                        │  External AI APIs  │
                        │ (Groq/OpenRouter)  │
                        └────────────────────┘
```

---

## ⚙️ Tech Stack

### Backend

- Node.js (NestJS) – API layer
- Java (Spring Boot) – ML microservice

### Queue & Processing

- Redis (Upstash) – Job queue
- BullMQ – Background job processing

### Storage

- AWS S3 – Resume file storage

### Database

- PostgreSQL (Neon)
- pgvector – Vector similarity search

### AI / ML

- Groq / OpenRouter APIs
- Embedding-based semantic scoring

### Deployment

- Railway – Backend services
- Neon – Serverless PostgreSQL
- Upstash – Serverless Redis
- AWS S3 – File storage

---

## 🚀 Features

- 📁 Resume upload and storage using S3
- 🔄 Asynchronous processing via Redis queue
- 🧠 Semantic similarity scoring using embeddings
- ⚡ Non-blocking scalable backend architecture
- 📊 Match score with AI-generated feedback
- 📜 User-specific match history tracking
- 🧩 Microservices-ready design (Node + Java separation)

---

## 📂 Project Structure

```
resume-matcher-pro/
├── gateway-api/        # NestJS API
├── match-worker/       # Java ML service
├── dashboard-ui/       # Frontend
```

---

## 🔌 API Example

### POST /match

#### Request

```json
{
  "resumeUrl": "https://your-s3-url",
  "jd": "Frontend Developer with React experience"
}
```

#### Response

```json
{
  "jobId": "job_123",
  "status": "QUEUED"
}
```

---

## 🧪 Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-username/resume-matcher-pro
cd resume-matcher-pro
```

---

### 2. Environment Variables

Create `.env` in `gateway-api`:

```env
DB_URL=
REDIS_URL=
GROQ_API_KEY=
```

---

### 3. Run Services

#### Gateway API

```bash
cd gateway-api
npm install
npm run start:dev
```

---

#### Worker

```bash
npm run worker
```

---

#### Java ML Service

```bash
cd match-worker
./mvnw spring-boot:run
```

---

## 🧠 Design Decisions

- Used **S3** to decouple file storage from compute layer
- Implemented **Redis queue** for asynchronous job processing
- Worker architecture ensures API remains non-blocking
- ML service separated for scalability and flexibility
- Embeddings used instead of keyword matching for better accuracy

---

## ⚠️ Limitations

- Java ML service is memory-intensive on free-tier deployments
- External AI APIs may face rate limits
- Authentication system not implemented yet

---

## 🚀 Future Improvements

- Add JWT-based authentication
- Implement real-time job tracking (WebSockets)
- Optimize ML service memory usage
- Improve ranking model accuracy

---

## ✨ Motivation

Built to solve real-world job matching inefficiencies by leveraging **semantic understanding instead of keyword matching**.

Focus was on:

- Scalable backend architecture
- Distributed systems design
- Production-ready engineering practices

---

## 📌 Author

Rishika Reddy
Full Stack Developer

---
