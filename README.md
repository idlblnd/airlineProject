# ✈️ Airline Management API

A production-ready RESTful API for managing airline operations such as flights, ticket purchases, and passenger listing.

---

## 🏗️ System Design

The system is designed using a **layered architecture** to ensure separation of concerns and maintainability.

### Layers:

- **Controller Layer** — Handles HTTP requests and responses
- **Service Layer** — Contains business logic and validation
- **Repository Layer** — Responsible for database interactions (PostgreSQL via `pg`)
- **DTO Layer** — Defines request/response structures with Joi validation

### Infrastructure:

- **AWS EC2** — Hosts the Node.js/Express application and API Gateway
- **AWS RDS (PostgreSQL)** — Primary relational database for flights, tickets, and passengers
- **Google Firestore** — Real-time storage for AI chat sessions (`chatSessions` collection)
- **API Gateway** (`gateway.js`) — Runs on port 8080, handles rate limiting and proxies to the app on port 3000

### Key Design Decisions:

- RESTful API design with versioning (`/api/v1`)
- Stateless architecture using JWT authentication
- Separation of read and write operations
- Pluggable chat store: `CHAT_STORE_PROVIDER=memory` (default) or `firestore` via environment variable
- AI Agent powered by **Groq API** (Llama 3.3 70B) with MCP-based tool routing for flight search, booking, and check-in
- Duplicate ticket prevention enforced at the database level
- Seat assignment happens at check-in, not at booking

---

## 🧠 Assumptions

- Each ticket belongs to a single passenger on a single flight — no group bookings
- Flights must exist in the database before tickets can be purchased
- A passenger must buy a ticket before they can check in — check-in without a ticket is rejected
- The same passenger cannot buy two tickets for the same flight
- A passenger who has already checked in cannot check in again
- Seat numbers are assigned automatically at check-in time, not at booking
- The AI agent handles only three operations: flight search, booking, and check-in — all other requests are declined
- Chat sessions are stateful and persist across messages within the same session (stored in Firestore)
- The chatbot endpoints (`/api/v1/agent/sessions/*`) do not enforce per-user authentication — the AI agent authenticates against the API using its own service account credentials (configured via `AUTH_USERNAME` / `AUTH_PASSWORD` env vars). In a production system, chat sessions would be tied to user JWT tokens to prevent unauthorized bookings

---

## ⚠️ Issues Encountered

- **Duplicate ticket enforcement** — Initially handled only at the service layer; moved to database-level constraint to prevent race conditions under concurrent load
- **Date normalization** — Dates stored in PostgreSQL were returned in different formats depending on the query method; normalized all date fields to `YYYY-MM-DD` in response DTOs to ensure consistency
- **AI Agent tool isolation** — The LLM occasionally chained `bookFlight` and `checkIn` in a single response; fixed by adding strict `CRITICAL RULES` to the system prompt to enforce single-tool-per-intent behavior
- **Boarding pass download** — Generating and serving PDFs required careful handling of async streams and file cleanup to avoid memory leaks under load
- **Cloud provider migration** — The project was initially deployed on Microsoft Azure. When the Azure student credit was exhausted, the entire deployment was migrated to AWS EC2 with RDS, requiring reconfiguration of environment variables, security groups, and database connection strings


---

## 🗄️ Data Model (ER Diagram)

<img width="349" height="361" alt="Ekran Resmi 2026-03-29 19 48 20" src="https://github.com/user-attachments/assets/8d5795b2-ed81-44ee-b036-61a9f3ac10aa" />

---

## 📄 API Documentation

Deployed Swagger URL:

```text
http://56.228.29.254:8080/api-docs
```

AI Frontend URL:

```text
http://56.228.29.254:8080/
```

---

# 📊 Load Testing

Load testing was performed using **k6**.

---

## 🔹 Endpoints Tested

### 1. POST /api/v1/tickets/buy
- Description: Purchase a flight ticket
- Type: Write operation

### 2. GET /api/v1/tickets/passengers
- Description: Retrieve passengers for a flight
- Type: Read operation

---

## 🧪 Test Scripts

- `load-tests/buy-ticket.js`
- `load-tests/passenger-list.js`

Example command:
k6 run -e VUS=100 load-tests/buy-ticket.js

---

## 📈 Load Test Results

### 🔹 Buy Ticket Endpoint

| Load | Avg Response | p95 | RPS | Error Rate |
|------|-------------|-----|-----|-----------|
| 20 VUs | 121 ms | 217 ms | 17.4 | 0% |
| 50 VUs | 86 ms | 154 ms | 44.7 | 0% |
| 100 VUs | 559 ms | 2.14 s | 59.7 | 0% |

### Load Test – 20 VUs (Normal Load)
<img width="751" height="95" alt="buy-ticket(20)" src="https://github.com/user-attachments/assets/072d02c0-9259-4fdf-89a3-abecacb749f1" />

### Load Test – 50 VUs (Peak Load) 
<img width="760" height="85" alt="buy-ticket(50)" src="https://github.com/user-attachments/assets/1d1f8112-0782-4200-81e1-4591da4326b7" />

### Load Test – 100 VUs (Stress Load)
<img width="733" height="86" alt="buy-ticket(100)" src="https://github.com/user-attachments/assets/0585f124-08ef-45fe-acaa-15c20364221d" />

---

### 🔹 Passenger List Endpoint

| Load | Avg Response | p95 | RPS | Error Rate |
|------|-------------|-----|-----|-----------|
| 20 VUs | 95 ms | 178 ms | 17.4 | 0% |
| 50 VUs | 86 ms | 155 ms | 44.6 | 0% |
| 100 VUs | 88 ms | 156 ms | 87.8 | 0% |

### Load Test – 20 VUs (Normal Load)
<img width="734" height="91" alt="passenger-list(20)" src="https://github.com/user-attachments/assets/43408276-674d-44a1-ae4c-94fb08774be5" />

### Load Test – 50 VUs (Peak Load)
<img width="696" height="85" alt="passenger-list(50)" src="https://github.com/user-attachments/assets/3262cca0-914b-4e50-9d5c-b1f0fe17dcf5" />

### Load Test – 100 VUs (Stress Load)
<img width="703" height="87" alt="passenger-list(100)" src="https://github.com/user-attachments/assets/2d988c9e-653a-4bb7-9128-2cf5bf394e76" />

---


## 🧠 Analysis
The API performs efficiently under normal and peak load conditions, maintaining low response times and zero error rates.

Under stress load, the buy ticket endpoint shows increased latency due to database write operations and transaction overhead.

In contrast, the passenger list endpoint remains stable and fast, demonstrating strong scalability for read-heavy workloads.

No failed requests were observed, indicating high system reliability.

To improve scalability, database indexing, caching mechanisms (e.g., Redis), connection pooling optimization, and horizontal scaling strategies can be implemented.

---

## DEMO
https://drive.google.com/file/d/1RjGHbWgO9EtZMmdz8WPp3VRge0h3NciO/view?usp=share_link

