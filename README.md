# 🚀 Coach Copilot: GenAI Client Intelligence Console

> **A premium, evidence-grounded week-by-week intelligence report dashboard for 1:1 fitness, nutrition, and wellness coaches.**

---

## 📖 Project Overview

**Coach Copilot** resolves a core operational bottleneck for 1:1 wellness coaches: reviewing long, unstructured messaging transcripts (WhatsApp, SMS, etc.) prior to weekly check-ins. 

By utilizing structured GenAI extraction with a strict evidence-grounding constraint, the app translates raw logs into a structured dashboard mapping **8–10 key client wellness dimensions**. Every extraction is tagged with a clear confidence category and a direct hyperlink reference back to the original message, preventing hallucinated summaries and ensuring complete auditability.

*This project was developed as a working prototype for the FUME GenAI Product Intern practical case study.*

---

## ✨ Core Features

### 1. Robust Multiformat Transcript Parser
* **Flexible Ingestion:** Paste raw transcripts matching the exact multiline format (`Day 1\nClient: message`) or inline day indicators (`D1 | Client: message`).
* **Auto-Indexing & Role Mapping:** Lines are automatically grouped under day contexts and mapped to senders (Client, Coach, or Accountability Coach) with distinct, clear colors.

### 2. Strict Evidence Grounding ("Audit Chips")
* **Interactive References:** Every section, dimension, risk flag, and next action displays pill-shaped evidence chips referencing message IDs (e.g., `D3.11`).
* **Visual Teleportation:** Clicking an evidence chip smoothly scrolls the transcript panel to the specific line and highlights it with a temporary green focus ring.

### 3. Human-in-the-Loop Review State Machine
* **Card-Level Control:** Coaches can individually **Approve**, **Reject** (dims/fades the element), or **Edit** (provides an inline text editor) every item.
* **Audit Trail Preservation:** Edited cards preserve the original AI output beneath a collapsible `<details>` toggle.
* **Workflow Status:** Renders a floating indicator tracking the state of the brief. The status changes from **"Draft — Pending Review"** to **"Reviewed"** only when all cards have been processed.

### 4. Mutation & Version Alert
* **Stale Warnings:** If the raw transcript is edited *after* a report has been generated, an amber warning banner highlights that the current report is out-of-sync, prompt-protecting the coach from stale data references.

### 5. Crash-Proof Data Parsing
* **Zod Validation Fallback:** Utilizes strict Zod schema validation. If the LLM returns incomplete JSON or drops dimensions, the backend schema applies default structures (`missing` confidence, fallback text) to prevent UI crashes.

---

## 🎨 Visual Color Taxonomy

To protect coaches from confusing inferences with facts, every data point carries a strict provenance label color-coded for instant recognition:

| Color | Tag | Meaning | Example |
|---|---|---|---|
| 🟢 **Green** | **Confirmed Fact** | Directly and objectively stated by client/coach | *"Client weight is 83 kg."* |
| 🔵 **Blue** | **Client-Reported** | Subjective, self-reported metrics | *"Client slept fine last night."* |
| 🟡 **Amber** | **AI Inference** | Extrapolated from patterns, work habits, or tone | *Work stress driving stomach acidity.* |
| ⚪ **Grey** | **Missing** | Expected data points not mentioned in conversation | *"No water intake reported this week."* |

---

## 🏗️ Architecture & Tech Stack

* **Framework:** React 19 + TanStack Start (SSR & Server Functions)
* **Routing & Context:** TanStack Router + React Query
* **Styling:** Tailwind CSS v4 (with strict custom `oklch` color themes and Google Fonts integration)
* **Typography:** Inter (Sans-serif body) & Source Serif 4 (Serif headings)
* **Validation:** Zod schemas
* **AI Provider:** GPT-5.5 via the Lovable AI Gateway

---

## ⚙️ Installation & Local Setup

### Prerequisites
Make sure you have Node.js (v18+) or Bun installed.

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/shaawtymaker/chat-to-gems.git
cd chat-to-gems
npm install
# or
bun install
```

### 2. Set Up Environment Variables
Create a `.env` file in the root directory (or inject it directly into your shell):
```env
LOVABLE_API_KEY=your_lovable_api_key_here
```

### 3. Run Development Server
```bash
npm run dev
# or
bun dev
```
Open [http://localhost:3000](http://localhost:3000) to view the console.

### 4. Create Production Build
To check bundler safety and verify TypeScript compilation:
```bash
npm run build
```

---

## 📝 How to Test & Demo the Case Study

1. Open the application.
2. Click **"Load Sample"** in the left panel to load the 8-day transcript provided in the case study brief.
3. Click **"Analyze Week"** to query the model.
4. Review the generated dimensions (e.g. click the `D3.11` chip on the sleep card to view the accountability coach's update).
5. Experiment with human review:
   * **Approve** the Weekly Summary.
   * **Reject** a false barrier.
   * **Edit** the sleep status inline to insert a manual correction. Notice the original AI text remains readable under the *"show original"* link.
6. Once every card is approved, edited, or rejected, observe the status badge in the header flip to **"Reviewed"**.
7. Try modifying the transcript text on the left to trigger the **"Transcript modified"** warning banner.

---

## 🛡️ Failure & Hallucination Mitigation Strategies

1. **Quantification Locking:** Prompt instructions explicitly prohibit the model from inventing numbers. Dimensions without metric coordinates are systematically categorized as `missing`.
2. **Role Boundaries:** Transcripts are pre-processed to explicitly tag client, coach, and accountability coach turns, preventing the LLM from attributing coach goals as client actions.
3. **Audited Overrides:** Rather than letting AI write directly to the client's permanent record, all data must clear the coach review layer.
