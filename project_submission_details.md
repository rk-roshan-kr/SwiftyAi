# Project Submission Details

**Target Industry:** Fintech (NBFC)
**Industry Type:** B2C
**User Group:** Prospects and Existing Customers
**User Department:** Retail Sales Division
**Solution Scenario:** A Master Agent orchestrates specialized Worker Agents (Sales, Verification, Underwriting) to autonomously handle the end-to-end personal loan sales process.
**Proposed Data Flow:** Chat Input -> Master Agent -> Sales (Negotiation) -> Verification (KYC check) -> Underwriting (Credit Score + EMI Logic) -> Sanction (Letter Generation).
**Nature of Output:** Web-based Chatbot Application

---

### 1. Please elaborate on the solution value proposition to the target user group. How will your solution cover the problem areas?
**Response:**
Our **Agentic AI** automates the entire loan sales lifecycle, replacing manual call centers. It solves the **scalability** bottleneck by handling thousands of concurrent applications 24/7 and ensures **policy adherence** by programmatically enforcing credit rules (e.g., 50% EMI cap) that human agents often miss.

### 2. What are the impact metrics that you propose to use to analyse the effect of the solution?
**Response:**
1.  **Conversion Rate:** Percentage of chats resulting in a generated Sanction Letter.
2.  **Turnaround Time (TAT):** Time reduced from "application" to "decision" (Target: < 2 mins).
3.  **Cost Efficiency:** Reduction in human-agent operational costs.
4.  **Risk Accuracy:** Percentage of correct rejections based on Credit Score < 700.

### 3. What are the technologies (languages, platforms, APIs, hardware, sponsored tools, technologies stacks, framework etc.) involved?
**Response:**
*   **Frontend:** React (Vite), TailwindCSS, Framer Motion.
*   **Backend:** Node.js, Express.js.
*   **AI Engine:** Local LLM (Llama-3 via Ollama) for privacy and zero-cost inference.
*   **Data:** JSON-based Mock Databases (CRM, Bureau, Products).
*   **Orchestration:** Custom `MasterAgent` routing logic (LangGraph-inspired).

### 4. Please state the assumptions, constraints and solution decision points (Reason behind choosing a technology)
**Response:**
*   **Assumption:** User provides a valid mobile number mapped to our `mockCRM.json` dataset.
*   **Constraint:** No real real-time banking APIs available; simulated via `mockBureau.json`.
*   **Decision:** Used **Local LLM (Ollama)** instead of OpenAI to ensure data privacy (PII security) and eliminate per-token costs during development.
*   **Decision:** Built on **Node.js** for non-blocking I/O to handle multiple concurrent agent streams.

### 5. How easily can your solution be implemented and how effective will it be?
**Response:**
*   **Implementation:** Highly portable; the entire backend is containerized, and the "Agent" logic is modular (separate files for `salesAgent.js`, `underwritingAgent.js`), allowing easy swap-outs for new models.
*   **Effectiveness:** The **Multi-Agent** approach reduces hallucination by separating "Sales Persuasion" (Creative LLM) from "Credit Underwriting" (Strict Logic/Math), ensuring >95% accuracy in loan decisions.

### 6. How robust / secure / easily scalable and extensible is the solution?
**Response:**
*   **Robustness:** Includes regex-based guardrails to sanitize Model outputs and fallback mechanisms if the LLM fails.
*   **Scalability:** Stateless REST API architecture allows horizontal scaling behind a load balancer; session state can be migrated to Redis.
*   **Extensibility:** New products (e.g., Home Loans) can be added simply by updating `products.toon` and adding a new `WorkerAgent` module.

### 7. What are the solution components that you would like to build and demonstrate; if you progress through next round.
**Response:**
1.  **Orchestrator Engine:** `masterAgent.js` routing intents.
2.  **Sales Bot:** `salesAgent.js` using empathy and negotiation tactics.
3.  **Credit Engine:** `underwritingAgent.js` implementing the "2x Limit" and "Score > 700" rules.
4.  **Sanction Generator:** `sanctionAgent.js` creating the final approval artifact.
5.  **Live Web Interface:** React-based chat UI with real-time feedback.
