# ✈️ Airline Management API

A layered airline service with an AI agent interface for flight search, ticket booking, and check-in.

---

## 🏗️ System Design

The project follows a **layered service architecture** combined with an **agent flow** for natural-language interactions. The goal was to keep the airline domain APIs clean and deterministic, while allowing an LLM-driven chat interface to decide which operation to trigger.

### Layers:

- **Controller Layer** — Handles HTTP requests and responses
- **Service Layer** — Contains business logic and validation
- **Repository Layer** — Responsible for database interactions (PostgreSQL via `pg`)
- **DTO Layer** — Defines request/response structures with Joi validation
- **Agent Layer** — Manages chat sessions, LLM orchestration, MCP tools, and tool-to-API execution

### Infrastructure:

- **AWS EC2** — Hosts the Node.js/Express application and API Gateway
- **AWS RDS (PostgreSQL)** — Primary relational database for flights, tickets, and passengers
- **Google Firestore** — Stores chat sessions and message history for the AI agent
- **API Gateway** (`gateway.js`) — Runs on port 8080 and proxies all public API traffic to the application on port 3000

### End-to-End Agent Flow

1. The user sends a message from the web chat UI.
2. The chat backend stores the message and forwards the conversation to the LLM layer.
3. The LLM decides which MCP tool should be called based on the user intent.
4. The MCP server maps that tool to the correct gateway-backed airline API operation.
5. The gateway forwards the request to the midterm airline API routes.
6. The API response is stored in the chat session and streamed back to the frontend.

### Key Design Decisions:

- RESTful API design with versioning (`/api/v1`)
- Public traffic flows through the gateway instead of calling airline routes directly
- Separation of read and write operations in the service layer
- Firestore is used to persist chat sessions and preserve message history across requests
- AI agent powered by **Groq API** using **Llama 3.3 70B** with MCP-based tool routing for flight search, booking, and check-in
- Lightweight web chat frontend implemented with HTML/CSS/JavaScript to demonstrate the complete agent flow
- Duplicate ticket prevention enforced at the database level
- Seat assignment happens at check-in, not at booking

---

## 🧠 Assumptions

- Each ticket belongs to one passenger on one flight; group booking is out of scope.
- Flights must already exist before any booking request is accepted.
- A passenger must buy a ticket before check-in; check-in without a valid ticket is rejected.
- The same passenger cannot hold two tickets for the same flight and date.
- A passenger who is already checked in cannot check in again.
- Seat numbers are assigned during check-in, not during purchase.
- The chat agent supports only three operational intents: flight search, ticket booking, and check-in.
- Chat sessions are stateful and persisted in Firestore so the conversation can continue across messages.
- The chat UI itself is not authenticated per end user; when protected airline endpoints are needed, the agent authenticates using a constant service credential.


---

## ⚠️ Issues Encountered

- **Duplicate ticket enforcement** — Initially this was only a service-layer validation. It was strengthened with database-level protection to avoid race conditions under concurrent booking attempts.
- **Date normalization** — PostgreSQL date values were not always returned in a consistent format, so response DTOs were normalized to `YYYY-MM-DD`.
- **LLM tool isolation** — The LLM occasionally tried to combine multiple actions in one step. This was reduced by constraining tool choice and strengthening the system prompt with strict intent rules.
- **Gateway alignment** — To keep the architecture consistent, agent-triggered API calls had to be routed through the gateway instead of bypassing it.
- **Chat state management** — The agent needed persistent conversation history across requests, so Firestore was integrated as the session store for chat messages.
- **Cloud migration** — The deployment was moved from Azure to AWS after student credit limitations, which required updating environment variables, networking, and database configuration.


---

## 🗄️ Data Model (ER Diagram)

<img width="349" height="361" alt="Ekran Resmi 2026-03-29 19 48 20" src="https://github.com/user-attachments/assets/8d5795b2-ed81-44ee-b036-61a9f3ac10aa" />

---

## 📄 API Documentation

AI Frontend URL:

```text
http://56.228.29.254:8080/
```

---

## DEMO
https://drive.google.com/file/d/1VdQGZx0QVDGb0IOijUYowQMT8qaXLF6i/view?usp=share_link
