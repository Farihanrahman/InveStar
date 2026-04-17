# InveStar — AI Automation & Integration Playbook

**Audience:** Dev team  
**Stack:** Claude Code + NemoClaw (NVIDIA GTC 2026) + MCP servers + WhatsApp + Telegram  
**Scope:** AI Coach, automation pipelines, and platform integrations  
**Updated:** March 17, 2026

---

## TL;DR — Two tools, two jobs

| Tool | Job | Why |
|---|---|---|
| **Claude Code** | Developer automation, CI/CD, codebase agents, internal Slack/Gmail | Native MCP, memory, scheduling — zero Docker config |
| **NemoClaw + OpenClaw** | User-facing AI Coach on WhatsApp / Telegram | PII stripping, network sandboxing, policy enforcement for fintech |

Julian Goldie's viral tweet is right that Claude Code dramatically reduces setup overhead for internal automation. He's wrong that it "kills" OpenClaw for user-facing agents — NemoClaw's OpenShell sandbox is still the right security layer between user conversations and InveStar's financial data.

---

## Part 1 — Claude Code automation (internal, dev team)

Claude Code runs as a long-running agent with access to your codebase, MCP servers,
and scheduling. No Docker, no server config — runs via `npm` or directly in your IDE.

### 1.1 Install

```bash
npm install -g @anthropic-ai/claude-code
claude-code auth  # authenticates with ANTHROPIC_API_KEY
```

### 1.2 Memory across sessions

Claude Code auto-generates `CLAUDE.md` files in your repo to persist project context.
Create `CLAUDE.md` in the InveStar repo root:

```markdown
# InveStar — Claude Code project memory

## What this project is
InveStar is a Stellar-based remittance + investment platform for Bangladeshi diaspora.
- Phase 1: Remittance-only (Track 1 SEP-24 MVP, Track 2 Transfer API + bKash direct)
- Phase 2: Wallet + DSE investing + AI Coach

## Tech stack
- Frontend: React 18 + TypeScript + Vite + Tailwind + Capacitor (mobile)
- Backend: Supabase (Auth, Postgres, Edge Functions)
- Blockchain: Stellar testnet → mainnet (USDC, SEP-10/24)
- AI: Claude API (claude-sonnet-4-6) via Anthropic SDK
- Agent layer: OpenClaw + NemoClaw (AI Coach on WhatsApp/Telegram)

## Key files
- `coach-gateway.ts` — AI Coach OpenClaw gateway
- `nemoclaw-policy.json` — security policy (NEVER modify without security review)
- `claws/investar-coach/SKILL.md` — AI Coach claw definition
- `supabase/functions/ai-coach-*/` — read-only API endpoints for AI Coach

## Hard rules (Claude Code must never violate these)
- Never write code that calls MoneyGram API from the AI Coach layer
- Never expose Stellar private keys or HSM signing endpoints to OpenClaw
- Never commit .env files or secrets
- Never remove PII stripping from nemoclaw-policy.json
- Always run `npm run lint && npm run build` before suggesting a PR

## Current sprint priorities
1. SEP-24 testnet integration (Module A — stellar-ramp-service)
2. AI Coach Supabase Edge Functions (read-only endpoints)
3. NemoClaw OpenShell policy testing
```

### 1.3 Scheduled automation (24/7 tasks)

Claude Code supports cron-style scheduling via `claude-code schedule`. 
Create `schedules/investar-schedules.json`:

```json
{
  "schedules": [
    {
      "id": "daily-dse-brief",
      "description": "Generate daily DSE market brief and push to Slack #market-intel",
      "cron": "0 9 * * 1-5",
      "timezone": "Asia/Dhaka",
      "prompt": "Fetch the top 5 DSE gainers and losers from the IMDS API at oms-investar.dev.sandbox3000.com, summarize in 5 bullet points, and post to Slack #market-intel channel.",
      "mcp_servers": ["slack", "investar-readonly-api"]
    },
    {
      "id": "fx-rate-monitor",
      "description": "Alert Slack if USD/BDT moves more than 0.5% from yesterday's close",
      "cron": "0 */2 * * *",
      "timezone": "UTC",
      "prompt": "Check current USD/BDT rate from frankfurter.app. Compare with yesterday's close stored in Supabase table fx_snapshots. If change > 0.5%, post alert to Slack #ops-alerts with the exact rate, change %, and a one-line note on remittance impact.",
      "mcp_servers": ["slack", "supabase"]
    },
    {
      "id": "weekly-transfer-report",
      "description": "Weekly summary of transfer volumes for the team",
      "cron": "0 8 * * MON",
      "timezone": "Asia/Dhaka",
      "prompt": "Query Supabase for last week's completed transfers: total count, total USD volume, avg transfer size, top corridors. Format as a clean summary and send to Slack #team-weekly.",
      "mcp_servers": ["slack", "supabase"]
    },
    {
      "id": "test-suite-runner",
      "description": "Run lint + build checks on main branch every morning",
      "cron": "0 7 * * *",
      "timezone": "UTC",
      "prompt": "Run npm run lint and npm run build on the main branch. If either fails, post the error log to Slack #dev-alerts and create a GitHub issue tagged 'ci-failure'.",
      "mcp_servers": ["slack", "github"]
    }
  ]
}
```

Run schedules:
```bash
claude-code schedule start --config ./schedules/investar-schedules.json
```

### 1.4 MCP server configuration

Claude Code connects to external services via MCP (Model Context Protocol) servers.
Create `mcp-config.json`:

```json
{
  "mcpServers": {
    "slack": {
      "type": "url",
      "url": "https://slack.mcp.claude.com/mcp",
      "description": "Post alerts, reports, and notifications to InveStar Slack"
    },
    "gmail": {
      "type": "url",
      "url": "https://gmail.mcp.claude.com/mcp",
      "description": "Read/send team emails, forward transfer confirmations"
    },
    "github": {
      "type": "url",
      "url": "https://github.mcp.claude.com/mcp",
      "description": "Create issues, review PRs, check CI status"
    },
    "supabase": {
      "type": "stdio",
      "command": "npx",
      "args": ["@supabase/mcp-server-supabase", "--read-only"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      },
      "description": "Read-only access to InveStar database for reporting"
    },
    "investar-readonly-api": {
      "type": "stdio",
      "command": "npx",
      "args": ["ts-node", "mcp/investar-readonly-server.ts"],
      "description": "InveStar read-only API endpoints (portfolio, DSE, FX, tx history)"
    }
  }
}
```

Configure Claude Code to use it:
```bash
claude-code config set mcp-config ./mcp-config.json
```

### 1.5 Remote control via iOS/Android

Claude Code has a companion mobile app (iOS + Android) released alongside Claude Code 1.x.
Team members can trigger agents from their phone — useful for on-call situations.

Setup:
1. Install Claude Code mobile app from App Store / Google Play
2. Sign in with same Anthropic account as desktop
3. Your scheduled agents and manual prompts sync across devices

Useful InveStar mobile commands to save as shortcuts:
- "What's today's transfer volume?"
- "Any failed transactions in the last hour?"
- "Current USD/BDT rate and how it compares to last week"
- "Is the Stellar testnet healthy?"

---

## Part 2 — NemoClaw + OpenClaw (user-facing AI Coach)

This is the WhatsApp/Telegram AI Coach. See `INVESTAR_AI_COACH_OPENCLAW.md`
for the full implementation. This section adds the upgrade from vanilla OpenClaw
to NemoClaw — the mandatory step for a fintech deployment.

### 2.1 Why NemoClaw, not vanilla OpenClaw

NemoClaw's OpenShell runtime delivers an isolated sandbox with data privacy enforcement, applying minimal-privilege access controls and policy-based network guardrails. Administrators configure security policies via YAML with hot-swappable rules, adjusting constraints without redeploying agents.

For InveStar specifically:
- **PII stripping**: bKash numbers, account numbers, Stellar addresses are stripped before reaching Claude API — differential privacy acquired from Gretel
- **Network allowlist**: blocks Stellar/MoneyGram/Zero Hash APIs from being reachable by the agent
- **Hot-swap policy**: update `nemoclaw-policy.json` without redeploying the agent
- **Audit log**: every agent action logged for compliance

### 2.2 Install NemoClaw

```bash
# Single command (NVIDIA Agent Toolkit — GTC 2026 release)
npx nemoclaw install

# Verify OpenShell runtime
npx nemoclaw status

# Expected output:
# ✅ OpenShell runtime: active
# ✅ Privacy router: enabled
# ✅ PII stripping: enabled
# ✅ Network policy: enforced
# ✅ Nemotron models: available (optional — InveStar uses Claude)
```

### 2.3 YAML policy (hot-swappable, no redeploy)

Create `nemoclaw-policy.yaml` (YAML is simpler to edit than JSON):

```yaml
agent: investar-ai-coach
version: "1.1"

pii_stripping:
  enabled: true
  engine: gretel-differential-privacy  # NVIDIA's built-in
  patterns:
    - bkash_number          # 01XXXXXXXXX format
    - bank_account_number   # BD bank account formats
    - stellar_wallet_address  # G... Stellar public keys
    - national_id           # NID patterns (BD format)
    - passport_number
    - phone_number
  replacement: "[REDACTED]"
  log_stripped_fields: true  # audit log only, never log values

network:
  mode: allowlist  # deny all by default
  allowed_outbound:
    - api.anthropic.com
    - "*.supabase.co"
    - api.frankfurter.app    # FX rates (open source, ECB data)
    - oms-investar.dev.sandbox3000.com  # IMDS DSE data
  blocked_outbound:
    - api.moneygram.com      # Module B — never from AI Coach
    - "*.stellar.org"        # Stellar HSM — never from AI Coach
    - api.triple-a.io        # Module C — never from AI Coach
    - api.zerohash.com       # Module C — never from AI Coach

tool_permissions:
  allowed:
    - get_portfolio_summary
    - get_transaction_history
    - get_dse_quote
    - get_dse_movers
    - get_fx_rate
    - get_transfer_status
  blocked_patterns:
    - "*sign*"
    - "*transfer*initiate*"
    - "*commit*"
    - "*kyc*write*"
    - "*hsm*"
    - "*key*"

session:
  max_tokens_per_request: 2000
  timeout_minutes: 30
  max_messages_per_user_per_hour: 20  # prevent token cost spikes

audit:
  enabled: true
  log_path: ./logs/nemoclaw-audit.jsonl
  log_fields:
    - timestamp
    - user_id_hash    # hashed — not raw user ID
    - tool_called
    - pii_stripped_count
    - response_tokens
    - blocked_by_policy  # true if network/tool blocked
```

Hot-swap the policy without redeploying:
```bash
npx nemoclaw policy reload --config ./nemoclaw-policy.yaml
# Output: ✅ Policy reloaded — no restart required
```

### 2.4 WhatsApp Business API setup

```bash
# 1. Create Meta Business Account at business.facebook.com
# 2. Add a WhatsApp Business number (can be existing mobile number)
# 3. Get credentials from Meta Developer Portal:
#    - Phone Number ID
#    - Access Token (never expires if you use System User token)
#    - Verify Token (any string you choose)

# 4. Register webhook (after deploying coach-gateway.ts)
curl -X POST \
  "https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/subscribed_apps" \
  -H "Authorization: Bearer ${WHATSAPP_ACCESS_TOKEN}" \
  -d "subscribed_fields=messages"

# 5. Set webhook URL in Meta Developer Portal:
#    https://your-server.com/webhook/whatsapp
#    Verify token: (your WHATSAPP_VERIFY_TOKEN value)

# 6. Test
curl -X POST \
  "https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer ${WHATSAPP_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"messaging_product":"whatsapp","to":"YOUR_TEST_NUMBER","type":"text","text":{"body":"InveStar AI Coach is live 🟢"}}'
```

### 2.5 Telegram Bot setup

```bash
# 1. Message @BotFather on Telegram
# 2. /newbot → name: "InveStar AI Coach" → username: investar_coach_bot
# 3. Copy the bot token

# 4. Set webhook (after deploying coach-gateway.ts)
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -d "url=https://your-server.com/webhook/telegram" \
  -d "allowed_updates=[\"message\",\"callback_query\"]"

# 5. Set bot commands (shows menu in Telegram)
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setMyCommands" \
  -d 'commands=[
    {"command":"rate","description":"Current USD/BDT rate"},
    {"command":"portfolio","description":"My portfolio summary"},
    {"command":"dse","description":"DSE market movers today"},
    {"command":"transfer","description":"Check my last transfer status"},
    {"command":"help","description":"What can I help you with?"}
  ]'
```

---

## Part 3 — Integration map (full picture)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTERNAL (Claude Code)          USER-FACING (NemoClaw + OpenClaw)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Claude Code CLI / mobile app     WhatsApp Business API
        │                                │
        ▼                                ▼
 MCP servers:                   OpenClaw Gateway (port 3001)
  - Slack (alerts, reports)             │
  - Gmail (email automation)   NemoClaw OpenShell (sandbox)
  - GitHub (CI, issues)                 │
  - Supabase (read-only DB)    Claude API (claude-sonnet-4-6)
  - InveStar read-only API              │
        │                     InveStar read-only Supabase
        ▼                       Edge Functions
 Scheduled tasks:
  - Daily DSE brief → Slack    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  - FX rate alerts → Slack     HARD WALL (never crossed)
  - Weekly reports → Slack     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  - CI health → Slack          MoneyGram Transfer API (Module B)
                               Stellar HSM / key signer
                               Triple-A / Zero Hash (Module C)
                               KYC write endpoints
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Part 4 — What the JulianGoldieSEO tweet gets right (and wrong)

| Claim | Verdict | InveStar implication |
|---|---|---|
| "Claude killed OpenClaw" | ❌ Wrong | OpenClaw is fastest growing OSS project ever. NemoClaw makes it enterprise-safe. Use both. |
| "Scheduled tasks for 24/7 automation" | ✅ Real | Claude Code schedules via `claude-code schedule` — use for DSE briefs, FX alerts, CI checks |
| "Remote control via iOS/Android" | ✅ Real | Claude Code mobile app — useful for on-call ops queries |
| "Auto-memory across sessions" | ✅ Real | `CLAUDE.md` in repo root — set up in Section 1.2 above |
| "Native connectors for Slack and Gmail" | ✅ Real | MCP servers — configured in Section 1.4 above |
| "Zero server or Docker config" | ✅ Real (for Claude Code) | Not true for NemoClaw — OpenShell needs a server for 24/7 user-facing agents |
| "No more expensive API token drains" | ⚠️ Misleading | Claude Code uses tokens. Set `max_messages_per_user_per_hour: 20` in NemoClaw policy. |

**Bottom line for InveStar:** Use Claude Code for everything internal. Use NemoClaw+OpenClaw for everything user-facing. They are not competitors — they are two different layers of the same stack.

---

## Part 5 — Files to add to the repo

```
InveStar/
├── CLAUDE.md                           ← Claude Code project memory (Section 1.2)
├── mcp-config.json                     ← MCP server config (Section 1.4)
├── nemoclaw-policy.yaml                ← Hot-swappable NemoClaw policy (Section 2.3)
├── schedules/
│   └── investar-schedules.json         ← Cron automation (Section 1.3)
├── claws/
│   └── investar-coach/
│       └── SKILL.md                    ← AI Coach claw definition
├── coach-gateway.ts                    ← OpenClaw gateway
├── openclaw-config.json                ← OpenClaw channel config
├── supabase/functions/
│   ├── ai-coach-portfolio/index.ts
│   ├── ai-coach-dse/index.ts
│   └── ai-coach-fx/index.ts
└── INVESTAR_AUTOMATION_PLAYBOOK.md     ← this file
```

---

## Part 6 — Pre-launch security checklist

- [ ] `investar-app-key.jks` removed from repo and key rotated ⚠️ URGENT
- [ ] `CLAUDE.md` added — Claude Code has project context
- [ ] `nemoclaw-policy.yaml` blocks all MoneyGram/Stellar/Zero Hash outbound
- [ ] Supabase RLS confirmed — users see only own data
- [ ] Secrets in environment variables only (not `.env` committed)
- [ ] Rate limiting set: `max_messages_per_user_per_hour: 20`
- [ ] WhatsApp webhook verified end-to-end with test message
- [ ] Telegram `/start` and `/help` commands tested
- [ ] NemoClaw audit log writing to `./logs/nemoclaw-audit.jsonl`
- [ ] Claude Code schedules tested in staging before enabling in production
- [ ] MCP Supabase server confirmed `--read-only` flag is active

---

*InveStar Engineering — AI Automation workstream*  
*NemoClaw: github.com/nvidia/nemoclaw (GTC 2026)*  
*Claude Code: claude.ai/code*  
*OpenClaw: github.com/openclaw/openclaw*
