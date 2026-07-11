# AI Open Source & GitHub Trends Report
## Period: June 1 - July 5, 2026

*Report compiled: 2026-07-05*

---

## 1. Top Trending AI Open Source Projects on GitHub (by Star Growth)

GitHub's monthly trending page reveals intense activity around **AI agent infrastructure, MCP tooling, and coding agent tooling**. The top AI-related projects by star growth include:

| Repository | Description | Category |
|---|---|---|
| [DeusData/codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp) | High-performance code intelligence MCP server with persistent knowledge graph; 158 languages, sub-ms queries | MCP / Code Intelligence |
| [calesthio/OpenMontage](https://github.com/calesthio/OpenMontage) | First open-source agentic video production system: 12 pipelines, 52 tools, 500+ agent skills | Video Generation / Agents |
| [Panniantong/Agent-Reach](https://github.com/Panniantong/Agent-Reach) | AI agent with internet-wide eyes: read/search Twitter, Reddit, YouTube, GitHub, Bilibili — zero API fees | Agent Framework |
| [mvanhorn/last30days-skill](https://github.com/mvanhorn/last30days-skill) | AI agent skill that researches topics across Reddit, X, YouTube, HN, Polymarket | Agent Skills |
| [interviewstreet/hiring-agent](https://github.com/interviewstreet/hiring-agent) | AI agent for resume evaluation and scoring | Agent Application |
| [phuryn/pm-skills](https://github.com/phuryn/pm-skills) | 100+ agentic product management skills and plugins | Agent Skills |
| [asgeirtj/system_prompts_leaks](https://github.com/asgeirtj/system_prompts_leaks) | Extracted system prompts from Claude, GPT, Gemini, Grok, Cursor, Copilot, Perplexity | Prompt Engineering |
| [ogulcancelik/herdr](https://github.com/ogulcancelik/herdr) | Agent multiplexer for terminal — runs/manages multiple agents | Agent Orchestration |
| [stablyai/orca](https://github.com/stablyai/orca) | Agent Development Environment for fleets of parallel agents | Agent Platform |
| [usestrix/strix](https://github.com/usestrix/strix) | Open-source AI penetration testing tool | Security |
| [kenn-io/agentsview](https://github.com/kenn-io/agentsview) | Local-first session search, analytics, and token tracking for 20+ coding agents | Agent Observability |
| [lfnovo/open-notebook](https://github.com/lfnovo/open-notebook) | Open-source implementation of NotebookLM with extended flexibility | Knowledge Tools |
| [mukul975/Anthropic-Cybersecurity-Skills](https://github.com/mukul975/Anthropic-Cybersecurity-Skills) | 817 structured cybersecurity skills mapped to 6 frameworks (MITRE ATT&CK, NIST, etc.) | Agent Skills |
| [apple/container](https://github.com/apple/container) | Lightweight VM-based Linux containers on Apple Silicon | Infrastructure |
| [roboflow/supervision](https://github.com/roboflow/supervision) | Reusable computer vision tools (maintained) | Computer Vision |

**Key Insight**: The trending page is dominated by agent-building and agent-observability infrastructure, not raw models. The ecosystem is shifting from "what model" to "how to orchestrate agents."

---

## 2. Latest Open Source Model Releases

### Mistral AI
- **Upcoming open-weight model**: Mistral CEO Arthur Mensch confirmed an open-weight model coming "this summer" with early access starting July 2026. Speculation around capabilities is significant (dubbed "Le Chaton Fat" on social media).
- **Code agent Leanstral**: Open-sourced, marking Mistral's commitment to open-weight agent models.
- **Mistral Small 4** and **Les Ministraux**: Edge-optimized models for phones.
- **Recent funding**: Rumored $3.5B raise at $23.15B valuation; ARR at $400M+, on track for $1B.
- **Acquisitions**: Koyeb (infrastructure), Emmi (physics AI).
- **Source**: [TechCrunch](https://techcrunch.com/2026/07/04/what-is-mistral-ai-everything-to-know-about-the-openai-competitor/), [Mistral Blog](https://mistral.ai)

### Anthropic Claude Sonnet 5 (June 30)
- Mid-tier model with near-Opus-level agentic capabilities at lower cost.
- Pricing: $2/M input tokens, $10/M output tokens (introductory); $3/$15 after Aug 31.
- Agentic coding score: 63.2% vs Opus 4.8's 69.2%, Sonnet 4.6's 58.1%.
- Also launched: **Claude Science** (AI workbench for scientists), **Claude Fable 5** (reinstated after Trump admin restrictions).
- **Source**: [TechCrunch](https://techcrunch.com/2026/06/30/anthropic-launches-claude-sonnet-5-as-a-cheaper-way-to-run-agents/)

### OpenAI GPT-5.6 Sol (June 26)
- Most agentic OpenAI model yet — allows splitting work across subagents.
- Government limited rollout after official request; limited release to select users.
- **Codex Micro**: OpenAI's hardware keyboard for Codex in partnership with Work Louder.

### Google
- **Gemini 3.5 Flash** (May/June): Shift from chatbot to agentic tool — plans, builds, iterates autonomously.
- **Gemini Spark**: Agentic assistant now available on Mac; connects Tasks and Keep, Canva/Instacart integrations.
- **Nano Banana 2 Lite** (June 30): Faster/cheaper image gen — 4-second generation, $0.034 per 1,000 images.
- **Gemini Omni Flash**: Video generation — $0.10/second of video output; Omni Product Studio transforms static images to cinematic e-commerce videos.
- **Source**: [TechCrunch](https://techcrunch.com/2026/06/30/google-introduces-a-faster-cheaper-image-generator-with-nano-banana-2-lite/)

### Qwen, DeepSeek, and Others
- Qwen, DeepSeek, Kimi, GLM, MiniMax, Llama, Mistral, Command R+, Phi all ranked as top open-source LLMs for 2026.
- Llama derivatives continue to proliferate, though no major new Llama base release in this window.
- DeepSeek remains a strong contender in open-weight models.
- **Source**: Google Search synthesis, multiple rankings.

---

## 3. AI Agent Frameworks & Tools Gaining Traction

The June-July 2026 period is defined by an **explosion of agent infrastructure tooling**:

### Agent Orchestration & Platforms
- **herdr** (`ogulcancelik/herdr`): Terminal-based agent multiplexer — running multiple agents simultaneously from CLI. Major GitHub trending spike.
- **orca** (`stablyai/orca`): "Agent Development Environment" for parallel agent fleets; desktop + mobile.
- **OpenClaw**: Open-source AI assistant now has iOS and Android apps (June 30). Voice conversations, agent action approval, device camera/location control.
- **agentsview** (`kenn-io/agentsview`): Analytics and token tracking across Claude Code, Codex, and 20+ other coding agents.
- **Acti**: AI agents embedded directly into smartphone keyboards.
- **Agent-Reach** (`Panniantong/Agent-Reach`): Social media scraper for AI agents — reads Twitter, Reddit, YouTube, GitHub, Bilibili.

### Coding Agents
- **Claude Code**: Widely adopted; Alibaba reportedly banned employees from using it.
- **Cursor**: SpaceX announced plans to acquire Cursor; Cursor launched iPhone app with Live Activities.
- **Codex (OpenAI)**: Hardware keyboard (Codex Micro) launched at AI Engineer World Fair.

### Agent Economics
- Mark Zuckerberg told Meta staff that AI agents "haven't progressed as quickly as he'd hoped."
- Anthropic positioning Sonnet 5 as cheaper agent runtime — agent capability is now table stakes; differentiation is cost and reliability.
- **Source**: TechCrunch (multiple articles), GitHub Trending

---

## 4. Open Source AI Video & Image Generation Projects

### Google's Nano Banana Family
- **Nano Banana 2 Lite** (June 30): Gemini-powered image gen at $0.034/1k images, 4-second latency. Available via AI Studio, Gemini API, and Gemini Enterprise Agent Platform.
- Replaces original Nano Banana ("legacy model").
- **Gemini Omni Flash**: Video generation at $0.10/second. Omni Product Studio for e-commerce video creation from static images.

### OpenMontage (Open Source)
- `calesthio/OpenMontage`: Described as "world's first open-source, agentic video production system" — 12 pipelines, 52 tools, 500+ agent skills. Major GitHub trending hit.

### Commercial Video Tools
- Major comparison of Sora 2, Runway, Kling, Luma, Pika, Veo, PixVerse published — ecosystem maturing rapidly.
- Google struck $75M A24 deal for AI video; fan backlash over AI slop.
- 60% of TikTok videos and 21% of YouTube videos reported as AI-slop.
- **Source**: TechCrunch, Google Blog, GitHub Trending

---

## 5. Context Engineering, RAG & MCP Trends

### MCP (Model Context Protocol) Surge
- **`DeusData/codebase-memory-mcp`**: GitHub's top AI trending repo for June 2026. Indexes codebases into a persistent knowledge graph — millisecond queries, 99% fewer tokens. Single static binary, zero dependencies.
- **GitHub MCP Registry**: GitHub launched MCP Registry as a new feature to integrate external tools directly. This signals platform-level support for MCP as an ecosystem standard.
- **`stablyai/orca`**: Supports MCP-based agent communication.

### System Prompt Engineering
- **`asgeirtj/system_prompts_leaks`**: Massive repository of extracted production system prompts from Claude Fable 5, Opus 4.8, Claude Code, GPT-5.5 Thinking, GPT-5.5 Instant, Gemini 3.5 Flash, Grok, Cursor, Copilot, Perplexity, and more. Updated regularly — a key resource for the prompt engineering community.

### Knowledge & Context Tools
- **`lfnovo/open-notebook`**: Open-source NotebookLM implementation gaining traction — flexible document ingestion, Q&A, synthesis.
- **`mvanhorn/last30days-skill`**: Researches and synthesizes grounded summaries from social media + web — context gathering agent skill.

### RAG Evolution
- RAG continues to be absorbed into broader agent frameworks rather than being a standalone tool category. The trending projects integrate retrieval directly into agent memory (knowledge graphs, codebase indexing, MCP servers) rather than treating RAG as a separate pipeline.
- Agent skills with structured cybersecurity frameworks (817 skills across 6 frameworks) demonstrate context engineering moving toward structured, reusable knowledge packages.

### Key MCP Developments
| Project | Capability |
|---|---|
| codebase-memory-mcp | Code intelligence knowledge graph; 158 languages |
| GitHub MCP Registry | Platform-native MCP tool integration |
| system_prompts_leaks | Production prompt extraction and analysis |
| agentsview | Agent session context analytics |

---

## Cross-Cutting Themes

1. **Agentic capability is now table stakes.** Every major model release (Sonnet 5, GPT-5.6 Sol, Gemini 3.5 Flash) emphasizes autonomous tool use, planning, and subagent coordination over raw benchmark scores.

2. **Open-weight remains strategic.** Mistral's upcoming open-weight model, Leanstral open-sourcing, and continued Qwen/DeepSeek presence show open-weight models remain central to ecosystem strategy despite growing regulatory pressure.

3. **MCP is becoming infrastructure.** GitHub's MCP Registry, combined with the viral growth of codebase-memory-mcp, signals MCP as a de facto standard for model-tool integration.

4. **Observability for agents is an emerging market.** `agentsview`, `orca`, and `herdr` all address the "what is my agent actually doing" problem — a sign of production adoption.

5. **China AI:** DeepSeek, Qwen, Kimi, GLM, and MiniMax continue to rank among top open-source models; Alibaba banned Claude Code internally; Bilibili/XiaoHongShu integrations via Agent-Reach.

---

*Sources: GitHub Trending (monthly), TechCrunch AI, The Verge, Google Blog, Anthropic Blog, Mistral Blog, OpenAI announcements.*
