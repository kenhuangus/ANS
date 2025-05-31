
# Agent Name Service (ANS) Directory - A Demo Implementation

This project is a prototype implementation demonstrating the core concepts of the Agent Name Service (ANS) as described in the research paper:

## Citation

**Title:** Agent Name Service (ANS): A Universal Directory for Secure AI Agent Discovery and Interoperability
**Authors:** Ken Huang, Vineeth Sai Narajala, Idan Habler, Akram Sheriff
**Link:** [https://arxiv.org/abs/2505.10609](https://arxiv.org/abs/2505.10609)
**DOI:** [https://doi.org/10.48550/arXiv.2505.10609](https://doi.org/10.48550/arXiv.2505.10609)

**Abstract:**
> The proliferation of AI agents requires robust mechanisms for secure discovery. This paper introduces the Agent Name Service (ANS), a novel architecture based on DNS addressing the lack of a public agent discovery framework. ANS provides a protocol-agnostic registry infrastructure that leverages Public Key Infrastructure (PKI) certificates for verifiable agent identity and trust. The architecture features several key innovations: a formalized agent registration and renewal mechanism for lifecycle management; DNS-inspired naming conventions with capability-aware resolution; a modular Protocol Adapter Layer supporting diverse communication standards (A2A, MCP, ACP etc.); and precisely defined algorithms for secure resolution. We implement structured communication using JSON Schema and conduct a comprehensive threat analysis of our proposal. The result is a foundational directory service addressing the core challenges of secured discovery and interaction in multi-agent systems, paving the way for future interoperable, trustworthy, and scalable agent ecosystems.

## Project Overview

This application serves as an interactive demonstration of the ANS, allowing users to:
*   Register AI agents into a central directory.
*   Lookup and discover registered agents.
*   Manage the lifecycle of these agents through renewal and revocation.

The implementation focuses on showcasing the key workflows and architectural ideas from the paper using a simplified, mock environment for PKI operations but with a persistent SQLite database for agent records.

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
    *   **Renewal:** Agents' registrations can be "renewed" directly from the management table. This action updates their renewal timestamp and extends their TTL by 30 days.
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
*   **Database:** SQLite (via `better-sqlite3`) for persistent agent record storage.
*   **PKI Operations:** Mock implementations for certificate generation and signing.

## Getting Started

Follow these steps to set up and run the project locally:

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone https://github.com/kenhuangus/ANS 
    cd ANS
    ```

2.  **Install dependencies:**
    Make sure you have Node.js and npm (or yarn/pnpm) installed.
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    ```
    This will install Next.js, React, Genkit, `better-sqlite3`, and all other necessary packages. The SQLite database file (`ans.db`) will be created automatically in the project root when the application first runs and initializes the database.

3.  **Run the development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    # or
    # pnpm dev
    ```
    The application will typically be available at `http://localhost:9002`.

Explore the "Register Agent", "Lookup Agent", and "Manage Agents" tabs to interact with the implemented functionalities.

## Contributing

We welcome contributions to enhance and improve this ANS demonstration project! If you're interested in contributing, please consider the following:

1.  **Fork the Repository:** Start by forking the main repository to your own GitHub account.
2.  **Create a Branch:** Create a new branch in your fork for your feature or bug fix (e.g., `feature/new-lookup-filter` or `fix/registration-bug`).
3.  **Make Changes:** Implement your changes, ensuring code clarity and adherence to the existing style.
4.  **Test:** Thoroughly test your changes locally to ensure they work as expected and don't introduce regressions.
5.  **Commit:** Write clear and concise commit messages.
6.  **Push:** Push your changes to your forked repository.
7.  **Open a Pull Request:** Submit a pull request from your branch to the main repository's `main` branch. Provide a detailed description of your changes in the pull request.

While we don't have strict coding guidelines enforced by linters yet, please try to maintain a consistent code style with the existing codebase. If you're planning a major change, it's a good idea to open an issue first to discuss it.

## Citing the Paper

If you use or refer to the concepts from the Agent Name Service paper in your work, please cite it as follows.

**CSL-JSON Format:**

```json
{
  "id": "Huang2025Agent",
  "type": "article-journal",
  "title": "Agent Name Service (ANS): A Universal Directory for Secure AI Agent Discovery and Interoperability",
  "author": [
    {
      "family": "Huang",
      "given": "Ken"
    },
    {
      "family": "Narajala",
      "given": "Vineeth Sai"
    },
    {
      "family": "Habler",
      "given": "Idan"
    },
    {
      "family": "Sheriff",
      "given": "Akram"
    }
  ],
  "URL": "https://arxiv.org/abs/2505.10609",
  "DOI": "10.48550/arXiv.2505.10609",
  "publisher": "arXiv",
  "issued": {
    "date-parts": [
      [2025, 5] 
    ]
  },
  "note": "arXiv:2505.10609 [cs.CR]"
}
```
*(Note: The "issued" field is an estimate based on the arXiv ID for this example and would be updated if the paper is formally published elsewhere. The arXiv submission date is typically reflected in the ID itself.)*

## Disclaimer

This project is a **demonstration prototype**. Key components like the Public Key Infrastructure (PKI) and digital signing are **mocked implementations**. They are designed to illustrate the concepts from the ANS paper and **do not provide real security**. The SQLite database provides persistence for local development but is not configured for production-scale deployment without further consideration for backup, scaling, and security hardening.

## License

This project is licensed under the MIT License.

MIT License

Copyright (c) 2024 Ken Huang

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

