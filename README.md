# 🚀 Resume Matcher Pro

An AI-powered resume analysis system built using a **distributed, event-driven architecture**. This platform evaluates resume-job compatibility using **semantic embeddings, cosine similarity, and weighted keyword matching**.

---

## 🏗️ Architecture

The system is architected as a **polyglot microservices pipeline** to decouple I/O-heavy API tasks from compute-heavy ML processing.

### 🔄 System Flow

1.  **Storage**: User uploads a resume; the frontend utilizes an S3 pre-signed URL to store the file in **AWS S3**, offloading I/O from the server.
2.  **Ingestion**: The **Gateway API (NestJS)** receives the metadata and enqueues a job into **Redis (BullMQ)**.
3.  **Orchestration**: A dedicated **Node.js Worker** consumes the job, managing retries and **Dead Letter Queues (DLQ)** for high reliability.
4.  **Compute**: The Worker triggers the **Java ML service** via **Railway Internal Networking** (`http://match-worker:8080`).
5.  **Intelligence**: The Java service (Spring Boot) performs:
    - **Text Extraction**: Leveraging Apache Tika.
    - **Hybrid Scoring**: A proprietary algorithm blending weighted keyword analysis (30%) with semantic vector similarity (70%).
    - **LLM Feedback**: Generating strengths and weaknesses via Groq/OpenRouter.
6.  **Persistence**: Results are stored in **PostgreSQL (Neon)** using `pgvector`.
7.  **Real-time Update**: The Java service publishes to **Redis Pub/Sub**, which the Gateway picks up to notify the frontend via **WebSockets**.

   
---


### 📊 Architecture Diagram

                   ┌──────────────────────────┐
                   │       Frontend (React)   │
                   │   (Vercel - Client UI)  │
                   └────────────┬────────────┘
                                │
        ┌───────────────────────▼───────────────────────┐
        │         AWS S3 (File Storage)                 │
        │   (via Pre-signed Upload URL from Gateway)    │
        └───────────────────────┬───────────────────────┘
                                │
                                ▼
                   ┌──────────────────────────┐
                   │   Gateway API (NestJS)   │
                   │  - REST APIs             │
                   │  - WebSockets            │
                   │  - Job Producer          │
                   └────────────┬────────────┘
                                │
                ┌───────────────┼───────────────┐
                │                               │
                ▼                               ▼
     ┌────────────────────┐         ┌────────────────────┐
     │ Redis Queue        │         │ Redis Pub/Sub      │
     │ (BullMQ / Upstash) │         │ (Realtime Events)  │
     └─────────┬──────────┘         └─────────┬──────────┘
               │                              │
               ▼                              ▼
     ┌────────────────────┐         ┌────────────────────┐
     │ Worker (Node.js)   │         │ Gateway WebSocket  │
     │ - Job Consumer     │◄────────│ Subscriber         │
     │ - Retry + DLQ      │         │ (Notify Frontend)  │
     └─────────┬──────────┘         └────────────────────┘
               │
               ▼
     ┌──────────────────────────────────────────────┐
     │ Java ML Service (Spring Boot)                │
     │ - Apache Tika (Parsing)                      │
     │ - Embeddings + Cosine Similarity             │
     │ - Keyword Scoring                            │
     │ - LLM Feedback (Groq/OpenRouter)             │
     └───────────────┬──────────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────┐
        │ PostgreSQL (Neon + pgvector) │
        │ - Match Results              │
        │ - Vector Storage             │
        └──────────────────────────────┘

---

## ⚙️ Tech Stack

- **Backend**: Node.js (NestJS), Java 17 (Spring Boot).
- **Queue**: Redis (Upstash) + BullMQ.
- **Storage**: AWS S3.
- **Database**: PostgreSQL (Neon) + `pgvector`.
- **AI / ML**: Groq Cloud (Llama 3.1), LangChain4j, Apache Tika.
- **Deployment**: Railway (Services), Vercel (Frontend).

---

## 🚀 Key Engineering Features

- **Hybrid Matching Engine**: Moves beyond simple keyword search by combining deterministic parsing with semantic vector embeddings.
- **Cloud-Native Resiliency**: Implemented secure **TLS/SSL handshakes** for Upstash Redis and Neon DB, alongside exponential backoff for LLM API rate-limiting.
- **Non-blocking I/O**: The user interface remains responsive during the 10-15 second analysis phase thanks to the async worker pattern.
- **Internal VPC Networking**: Utilizes private service-to-service communication to reduce latency and improve security.

---

## 🧠 Design Decisions

- **Why Polyglot?** Node.js excels at high-concurrency gateway orchestration, while Java provides a more robust ecosystem for PDF processing (Tika) and ML integrations.
- **Why S3 Pre-signed URLs?** To allow the client to upload large files directly to storage, preventing the Gateway API from becoming a bottleneck.
- **Why Redis Pub/Sub?** To bridge the gap between the stateless Java worker and the persistent WebSocket connection held by the Gateway.

---

## 📌 Author

**Rishika Reddy**
Backend Developer | Distributed Systems Enthusiast

---
