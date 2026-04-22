# TechMart AI Financial Assistant Implementation

This plan outlines the integration of Claude AI directly into the TechMart Accounting system to act as a real-time Financial Assistant.

## Background & Goal
The user wants to add an AI Assistant feature using their Claude API key. The assistant will be able to answer questions about the company's financial status by analyzing the data (Trial Balance, Income Statement, etc.) securely on the backend and responding natively in the dashboard.

## User Review Required

> [!IMPORTANT]
> - **API Key Security**: The `ANTHROPIC_API_KEY` must be placed in the **Backend's `.env` file** (`techmart_accounting/.env`). This prevents exposing your key to frontend users. I will update the `.env.example`.
> - Do you want the AI chat to appear as a **new dedicated page** in the sidebar (e.g., "AI Assistant"), or as a **floating chat window** that stays visible on the dashboard? (The plan assumes a **Dedicated Page** for a rich, full-screen chat experience, but let me know your preference!)

## Proposed Changes

### Backend (`techmart_accounting`)
We will add an AI feature that automatically injects the current financial summary (assets, revenue, recent entries) into the prompt secretly so Claude has context before answering the user.

- **Dependencies**: Add `anthropic` to `requirements.txt`.
- **Environment**: Add `ANTHROPIC_API_KEY` to `techmart_accounting/.env`.
- **New View**: Create an `AIAssistantView` in `apps/reports/views.py`.
  - Endpoint: `POST /api/v1/reports/ai-assistant/`
  - Logic: 
    1. Grabs the user's message.
    2. Gathers the `DashboardSummary` metrics internally.
    3. Sends the user's message + financial context to Claude using the Anthropic Python SDK.
    4. Returns Claude's markdown-formatted string response.
- **URLs**: Register the new endpoint in `apps/reports/urls.py`.

### Frontend (`techmart_frontend`)
We will create a clean, modern Chat interface.

- **API Service**: Add `askAssistant` strictly using POST to `reportsService` in `src/api/services.ts`.
- **UI Components**:
  - `src/pages/AIAssistant.tsx`: A full chat interface displaying user messages and AI responses (with markdown rendering if time allows, otherwise plain text mapping).
  - Include an input box simulating ChatGPT/Claude UI.
- **Routing**: Map `/ai-assistant` in `App.tsx`.
- **Sidebar**: Add a new "AI Assistant" link with an iconic spark/bot icon under a new sidebar section.

## Verification Plan

1. Install the `anthropic` package locally in the backend.
2. The user will be requested to paste their `sk-ant-` key into `./techmart_accounting/.env`.
3. Test the manual frontend chat window: ask "What is my total revenue right now?" and ensure Claude replies correctly using the injected backend data!
