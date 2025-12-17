# Problem Statement: Agentic AI for NBFC Personal Loan Sales

## About the business
A large-scale Non-Banking Financial Company (NBFC) with a presence across India offers personal loans, home loans, auto loans and more. To increase revenue from existing customers, the NBFC aims to sell personal loans to prospects and its existing customers through a web-based chatbot interface.

The chatbot will serve as a digital sales assistant, where a Master Agent (Agentic AI Controller) coordinates multiple Worker AI agents to handle the end-to-end loan sales process — from conversation and verification to credit evaluation, and approval and generating a sanction letter.

## Problem statement
The NBFC wants to improve its sales success rate for personal loans by using an AI-driven conversational approach. The solution must simulate a human-like sales process, where the Master Agent handles customer conversations, engages customers in a personalized manner and collaborates with multiple Worker AI agents to complete the loan process.

## Goal
Teams must design an Agentic AI solution where the Master Agent:
1.  Chats with customers landing on the web chatbot via digital ads or marketing emails.
2.  Understands the customer's needs and convinces them to take a personal loan.
3.  Orchestrates multiple Worker AI agents to complete all tasks—verification, underwriting and sanction letter generation—before closing the chat.

## Key deliverable
A live demo or recorded video (maximum four minutes) showcasing the end-to-end journey from the initial chat to sanction letter generation.

## Agentic AI roles

### Master Agent (Main orchestrator)
*   Manages the conversation flow with the customer.
*   Hands over tasks to Worker Agents and coordinates the workflow.
*   Starts and ends the conversation.

### Worker Agents
*   **Sales Agent**: Negotiates loan terms, discusses customer needs, amount, tenure and interest rates
*   **Verification Agent**: Confirms KYC details (phone, address) from a dummy CRM server.
*   **Underwriting Agent**:
    *   Fetches a dummy credit score (out of 900) from a mock credit bureau API.
    *   Validates eligibility:
        *   If the loan amount ≤ pre-approved limit, approve instantly.
        *   If ≤ 2× pre-approved limit, request a salary slip upload. Approve only if expected EMI ≤ 50% of salary.
        *   Reject if > 2× pre-approved limit or credit score < 700.
*   **Sanction Letter Generator**: Generates an automated PDF sanction letter if all conditions are met.

## Data and system assumptions
*   **Synthetic customer data**: Teams must create dummy data for at least 10 customers with details like name, age, city, current loan details, credit score and pre-approved personal loan limit.
*   **Offer mart server**: A mock server or API hosting pre-approved loan offers.
*   **CRM server**: Dummy customer KYC data.
*   **Credit bureau API**: Mock API to fetch credit scores.
*   **File upload**: Simulated salary slip upload (dummy PDF or image).
*   Teams may make any reasonable assumptions as long as the solution feels realistic.

## Evaluation criteria
*   **Technical design (40%)**
    *   Use of an Agentic AI framework (LangGraph, CrewAI, AutoGen, etc.).
    *   Well-structured orchestration of Master and Worker agents.
*   **Realism of data and workflow (25%)**
    *   Quality of synthetic data, APIs and file handling.
    *   Real-world-like loan decision rules.
*   **Conversation flow (25%)**
    *   Smooth, natural and intelligent dialogue handling (including non-linear paths).
*   **Demo quality (10%)**
    *   Live demo or video walkthrough of the complete journey—from chat initiation to sanction letter generation.

## Tips for participants
*   Keep the chatbot conversational and persuasive, just like a human sales executive.
*   Focus on orchestration logic—how the Master Agent decides which Worker Agent to trigger.
*   Demonstrate edge cases (e.g., loan rejection or the need for additional salary slip verification).
