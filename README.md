
# AgentVerse Directory - A Demo of Agent Name Service (ANS)

This project is a prototype implementation demonstrating the core concepts of the Agent Name Service (ANS) as described in the research paper:

## Citation

**Title:** Agent Name Service (ANS): A Universal Directory for Secure AI Agent Discovery and Interoperability
**Authors:** Ken Huang, Vineeth Sai Narajala, Idan Habler, Akram Sheriff
**Link:** [https://arxiv.org/abs/2505.10609](https://arxiv.org/abs/2505.10609)

**Abstract:**
> The proliferation of AI agents requires robust mechanisms for secure discovery. This paper introduces the Agent Name Service (ANS), a novel architecture based on DNS addressing the lack of a public agent discovery framework. ANS provides a protocol-agnostic registry infrastructure that leverages Public Key Infrastructure (PKI) certificates for verifiable agent identity and trust. The architecture features several key innovations: a formalized agent registration and renewal mechanism for lifecycle management; DNS-inspired naming conventions with capability-aware resolution; a modular Protocol Adapter Layer supporting diverse communication standards (A2A, MCP, ACP etc.); and precisely defined algorithms for secure resolution. We implement structured communication using JSON Schema and conduct a comprehensive threat analysis of our proposal. The result is a foundational directory service addressing the core challenges of secured discovery and interaction in multi-agent systems, paving the way for future interoperable, trustworthy, and scalable agent ecosystems.

## Project Overview

This application serves as an interactive demonstration of the ANS, allowing users to:
*   Register AI agents into a central directory.
*   Lookup and discover registered agents.
*   Manage the lifecycle of these agents through renewal and revocation.

The implementation focuses on showcasing the key workflows and architectural ideas from the paper using a simplified, mock environment.

## Implemented Functionalities

This demo implements the following core features inspired by the ANS paper:

1.  **Agent Registration:**
    *   **ANSName Construction:** Agents are registered with details that form an ANSName (Protocol, AgentID, AgentCapability, Provider, Version, Extension).
    *   **Metadata:** Includes registration of the agent's actual network endpoint and protocol-specific extensions (as a JSON object).
    *   **Mock CSR & Certificate Issuance:** Users provide a mock Certificate Signing Request (CSR). Upon registration, the system (simulating a Local CA) issues a mock CA-signed certificate for the agent.
    *   **AI-Assisted Form Filling:** Genkit is used to help users populate registration details if they provide partial information.

2.  **ANS Lookup & Discovery:**
    *   **Name & Capability-based Resolution:** Users can perform a fuzzy search using a single search term. The system attempts to match this term against various parts of the agent's ANSName, provider, or other metadata.
    *   **Secure Resolution (Simulated):** Lookup responses include the agent's details, its mock certificate, a Time-To-Live (TTL), and a mock registry signature over these details, demonstrating the principle of verifiable responses.

3.  **ANS Management (Lifecycle):**
    *   **Agent Overview Table:** The management page displays a table of registered agents, including their status (active, revoked) and expiry information.
    *   **Renewal:** Agents' registrations can be "renewed" directly from the management table. This action updates their renewal timestamp and extends their TTL by 30 days (simulated).
    *   **Revocation:** Agents can be "revoked" from the directory via the management table, marking them as inactive.

4.  **Mock PKI Infrastructure:**
    *   **Local CA Simulation:** The system simulates a local Certificate Authority that issues and manages (mock) digital certificates for registered agents.
    *   **Digital Signing Workflow (Simulated):** Demonstrates a mock digital signing workflow where the registry signs lookup responses to ensure the authenticity and integrity of agent information presented to the querier.

5.  **Structured Communication (via Zod Schemas):**
    *   API request payloads for registration, renewal, revocation, and lookup are validated on the server-side using Zod schemas. This aligns with the paper's emphasis on structured communication to ensure data integrity.

## Technology Stack

*   **Frontend/Backend:** Next.js (App Router, Server Components, Server Actions)
*   **UI:** React, ShadCN UI Components, Tailwind CSS
*   **AI Assistance:** Google Genkit
*   **Language:** TypeScript
*   **Database:** Mock in-memory array (simulating a persistent store like SQLite for the purpose of this demo).
*   **PKI Operations:** Mock implementations for certificate generation and signing.

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Run the development server:
    ```bash
    npm run dev
    ```
    The application will typically be available at `http://localhost:9002`.

Explore the "Register Agent", "Lookup Agent", and "Manage Agents" tabs to interact with the implemented functionalities.

## Disclaimer

This project is a **demonstration prototype**. Key components like the Public Key Infrastructure (PKI), database interactions, and digital signing are **mocked implementations**. They are designed to illustrate the concepts from the ANS paper and **do not provide real security or production-ready persistence**.
