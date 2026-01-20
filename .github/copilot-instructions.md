# Copilot Instructions for LLM Workshop App

## Project Overview
**LLM Workshop App** is a minimal Node.js + Express web application that detects anomalies in police reports and returns structured JSON analysis using the Cerebras AI API. It demonstrates secure AI integration with parameter controls.

**Architecture:**
- **Backend**: Express server ([server.js](server.js)) - handles Cerebras API calls, enforces JSON responses, manages temperature/token parameters
- **Frontend**: Vanilla JS ([public/app.js](public/app.js)) - collects incident text, sends to backend, validates JSON output and usage stats
- **Data flow**: User text (police report) → `/api/ticket` endpoint → Cerebras LLM → JSON anomaly detection → display results

## Key Patterns & Conventions

### 1. Backend: Express API Design
- **Endpoint pattern**: `/api/<resource>` (e.g., `/api/ticket`, `/api/models`)
- **Error handling**: Returns HTTP status codes with JSON error objects containing `error` and optional `details` fields
  ```javascript
  res.status(400).json({ error: "incidentText is required" });
  res.status(500).json({ error: "Ticket generation failed", details: err?.message ?? String(err) });
  ```
- **Environment config**: Uses `dotenv` for `CEREBRAS_API_KEY`, `CEREBRAS_BASE_URL`, `CEREBRAS_MODEL`, and `PORT` — all required for API calls
- **Request/response**: Always `application/json`; client sends `incidentText`, `temperature`, `maxTokens` in request body

### 2. Frontend: Fetch Pattern
- **Post requests**: Send JSON with `Content-Type: application/json`; parse response and throw on `!r.ok`
- **Error UI**: Display raw error messages in `rawEl.textContent` for debugging
- **Validation**: Separate parsing attempt shows ✅/❌ status and extracted JSON structure

### 3. LLM Prompt Engineering
- **System prompt** (in [server.js](server.js#L39-L47)):
  - Forces JSON output: `response_format: { type: "json_object" }`
  - Specifies language (Spanish) and detector task in system prompt
  - Prohibits markdown/text wrapping: "Devuelve SOLO JSON válido (sin markdown, sin texto extra)"
  - Schema example: `{ "id": "string", "anomalies": [...], "risk_level": "string" }`
- **Temperature defaults to 0.2** (low) for deterministic, consistent anomaly detection

### 4. Configuration & Dependencies
- **Runtime**: Node.js (ES modules enabled via `"type": "module"`)
- **Dependencies**: Only `express` and `dotenv` — minimal surface
- **Start**: `npm start` runs `node server.js`
- **Port**: Defaults to 3000; configurable via `PORT` env var

## Critical Developer Workflows

### Running the App
```bash
# Set environment variables (required)
$env:CEREBRAS_API_KEY="your-key-here"
$env:CEREBRAS_BASE_URL="https://api.cerebras.ai/v1"
$env:CEREBRAS_MODEL="llama-3.3-70b"
$env:PORT=3000

# Install & start
npm install
npm start

# Visit http://localhost:3000
```

### Debugging
- **Backend logs**: Check terminal output for fetch errors and server startup message
- **Frontend network**: Browser DevTools Network tab shows POST `/api/ticket` responses
- **JSON validation**: Frontend highlights JSON parse errors with line numbers
- **Usage metrics**: Response includes `usage.prompt_tokens`, `usage.completion_tokens`, `usage.total_tokens`

## Integration Points
- **Cerebras API**: POST to `{CEREBRAS_BASE_URL}/chat/completions` with Bearer token auth
- **Response parsing**: Backend returns `data?.choices?.[0]?.message?.content` (raw AI output); frontend parses for JSON validation
- **UI states**: Track in element textContent (`rawEl`, `parsedEl`, `usageEl`) — mutate directly for simple updates

## Common Modifications
When adding features:
1. **New endpoints**: Follow `/api/<resource>` pattern, return `{ error, details }` on failure
2. **New parameters**: Add to `/api/ticket` payload destructuring (see line 28); pass to Cerebras payload
3. **Schema changes**: Update system prompt JSON schema and frontend validation parser
4. **Examples**: Add to `EXAMPLES` array in [public/app.js](public/app.js#L10-L13)

## Project-Specific Notes
- **No database**: All processing is stateless; no persistence layer
- **Single endpoint for AI**: `/api/ticket` is the only AI anomaly detection operation (no `/api/models` implemented yet, though button exists)
- **Frontend-driven testing**: Use browser UI to test—no automated test suite
- **Language**: Code comments and UI are in Spanish; maintain this convention
## What to avoid
- Do not introduce additional dependencies without justification—keep it lightweight
