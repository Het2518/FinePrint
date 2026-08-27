# FinePrint 📝

**FinePrint** is an AI-powered contract risk monitoring and automated approval system. It leverages the reasoning capabilities of Large Language Models (LLMs) via LangGraph, bound by strict deterministic business rules, to evaluate, route, and execute decisions on third-party contracts.

## 🌟 Key Features

- **AI Contract Analysis:** Automatically ingest and evaluate contracts for compliance, liability, and financial risks.
- **Human-in-the-Loop (HITL):** Multi-tier approval workflows. Flag high-impact decisions for manual executive sign-off before execution.
- **Deterministic Guardrails:** Financial thresholds and routing logic are hardcoded outside the LLM prompt for maximum security and compliance.
- **MCP Extensibility:** Connect to external systems (Google Drive, Slack, Gmail) securely via the Model Context Protocol (MCP) with strict, granular scope limitations.
- **Immutable Audit Trail:** All decisions, manual overrides, and MCP tool invocations are logged for 24 months.

## 🏗️ Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React

### Backend
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL (via SQLAlchemy & Alembic)
- **Agent Orchestration:** LangGraph (StateGraph)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.11+)
- PostgreSQL (or SQLite for development)

### 1. Clone the Repository
```bash
git clone https://github.com/Het2518/FinePrint.git
cd FinePrint
```

### 2. Backend Setup
Navigate to the `backend` directory and install dependencies:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Set up your environment variables (copy the example file):
```bash
cp .env.example .env
```
Ensure you provide a valid `OPENAI_API_KEY` (or equivalent) in `.env` for the LangGraph agent.

Run the database migrations to set up the schema:
```bash
alembic upgrade head
```

Start the FastAPI server:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
Open a new terminal, navigate to the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```
The Next.js dashboard will be available at `http://localhost:3000`.

---

## 📚 Documentation

For a deep dive into the system architecture, database schema, and security model, please refer to our detailed documentation:
- [As-Built System Design & SRS](./DOC/FinePrint_System_Design_Updated.md)

---

## 🛡️ Security

- **Row-Level Org Isolation:** All database queries are filtered by Tenant ID.
- **MCP Tool Scopes:** External tool calls are intercepted and strictly authorized against the `scopes_granted` defined by the Org Admin.
- **No Direct Execution:** The LLM cannot execute financial transactions directly; it only proposes state changes that must pass the rules engine.

## 📄 License
This project is licensed under the MIT License.
