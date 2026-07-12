# Copilot Plugin Generator — Design Spec

**Date:** 2026-07-12
**Author:** Sisyphus (for rosswang / heart and road)
**Status:** Approved for implementation

---

## 1. Problem & Goal

`web2api` turns web sources into declarative "recipes" and auto-exposes them as
callable AI tools. We want the analogous capability for **Microsoft 365 Copilot
(enterprise)**: a generic **generator** that takes a standard **OpenAPI spec** plus
a small **meta-config** and emits a complete, enterprise-deployable **M365 Copilot
API plugin package**.

The package must work in an **enterprise tenant** (Copilot for work), which means:

- API plugins are only usable *inside a declarative agent* — never standalone.
- Enterprise deployment routes through the **Teams Admin Center / Integrated Apps**
  approval flow, so the package must include a Teams app manifest.
- Authentication must be **OAuth2 with Microsoft Entra ID** (SSO + admin consent).

This tool is the "web2api equivalent" for Copilot: define once, generate the plugin,
deploy to the tenant.

---

## 2. Scope

### In scope
- Python CLI (`copilot-plugin-gen`) with two commands: `gen` and `validate`.
- Inputs: an OpenAPI 3.x document (YAML/JSON) + a YAML meta-config.
- Outputs: a folder or zip containing all manifests + deploy guide.
- Auth: OAuth2 (Entra ID) only.
- Validation against Microsoft's published API-plugin guidance.
- Unit tests for rendering + validation.

### Out of scope (v1)
- A live mock/test harness that simulates Copilot invocation.
- Non-OAuth auth (API key / anonymous) — deferrable but structured so it can be
  added later.
- Auto-generating the backend service itself (we front an *existing* REST API).
- A custom recipe DSL (we consume raw OpenAPI, not a higher-level language).

---

## 3. Output Package (what gets generated)

```
dist/
  openapi.json            # normalized copy of the source OpenAPI
  plugin.json             # API plugin manifest (schema v2.3)
  declarativeAgent.json   # declarative agent manifest (schema v1.5)
  manifest.json           # Teams app manifest (references the DA)
  auth.json               # Entra ID OAuth config (tenant, client_id, scopes, URLs)
  icons/
    outline.png           # 32x32 / 64x64 placeholder (copied or generated)
    color.png
  DEPLOY.md               # tenant-admin approval steps
```

### 3.1 `openapi.json`
Normalized from the source: ensure every operation has a unique `operationId`,
every operation has `summary` + `description`, and at least one `200`/`2xx`
response. The generator does NOT invent API behavior — it only normalizes
metadata so Copilot's orchestrator can use it.

### 3.2 `plugin.json` (API plugin manifest v2.3)
Key fields:
```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/copilot/plugin/v2.3/schema.json",
  "schema_version": "v2.3",
  "namespace": "<slug>",
  "name_for_human": "...",
  "name_for_model": "<slug>",
  "description_for_human": "...",
  "description_for_model": "...",
  "functions": [
    { "name": "<operationId>", "description": "..." }
  ],
  "auth": {
    "type": "oauth",
    "client_id": "<from meta-config>",
    "authorization_url": "https://login.microsoftonline.com/<tenant>/oauth2/v2.0/authorize",
    "token_url": "https://login.microsoftonline.com/<tenant>/oauth2/v2.0/token",
    "scope": "<space-separated scopes>",
    "tenant_id": "<tenant>"
  },
  "api_dependency": { "openapi_doc_url": "openapi.json" }
}
```
`functions[].name` maps 1:1 to an OpenAPI `operationId`.

### 3.3 `declarativeAgent.json` (DA manifest v1.5)
```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/copilot/declarative-agent/v1.5/schema.json",
  "version": "v1.5",
  "name": "...",
  "description": "...",
  "instructions": "...",
  "conversation_starters": [ { "title": "...", "text": "..." } ],
  "actions": [
    { "id": "plugin", "file": "plugin.json" }
  ]
}
```
`capabilities` defaults to none (the plugin is the action); optional `WebSearch`
can be toggled via meta-config.

### 3.4 `manifest.json` (Teams app manifest)
Minimal Teams app that wraps the declarative agent so it can be uploaded for
tenant approval:
```json
{
  "$schema": "https://developer.microsoft.com/en-us/json-schemas/teams/v1.17/MicrosoftTeams.schema.json",
  "manifestVersion": "1.17",
  "version": "1.0.0",
  "id": "<generated UUID>",
  "packageName": "...",
  "developer": { "name": "...", "websiteUrl": "...", "mpnId": "..." },
  "name": { "short": "...", "full": "..." },
  "description": { "short": "...", "full": "..." },
  "icons": { "outline": "icons/outline.png", "color": "icons/color.png" },
  "accentColor": "#FFFFFF",
  "copilotAgents": { "declarativeAgents": [ { "id": "da", "file": "declarativeAgent.json" } ] },
  "staticTabs": [],
  "permissions": [ "identity" ],
  "validDomains": []
}
```

### 3.5 `auth.json`
Plain copy of the Entra config from meta-config for operator reference:
```json
{
  "type": "oauth2",
  "tenant_id": "...",
  "client_id": "...",
  "scopes": ["api://contoso/.default"],
  "authorize_url": "https://login.microsoftonline.com/<tenant>/oauth2/v2.0/authorize",
  "token_url": "https://login.microsoftonline.com/<tenant>/oauth2/v2.0/token"
}
```

### 3.6 `DEPLOY.md`
Step-by-step for the tenant admin:
1. Register an Entra ID app (single-tenant), add the required scopes.
2. `copilot-plugin-gen gen ...` to produce `dist/`.
3. Zip `dist/` (or run `gen` with `--format zip`).
4. Teams Admin Center → Manage apps → Upload custom app → submit for admin approval.
5. Once approved, the declarative agent appears in M365 Copilot for assigned users.

---

## 4. Input: meta-config (YAML)

```yaml
agent:
  name: "Contoso Budgets"            # <=100 chars
  description: "Query and manage Contoso budgets."   # <=1000 chars
  instructions: "You are the budgets assistant..."    # <=8000 chars
  conversation_starters:
    - title: "Check budget"
      text: "How much is left in the travel budget?"
  capabilities: []                   # optional: ["WebSearch"]
  namespace: "contoso-budgets"       # slug used in plugin namespace/id

auth:
  type: oauth2
  entra:
    tenant_id: "00000000-0000-0000-0000-000000000000"
    client_id: "11111111-1111-1111-1111-111111111111"
    scopes:
      - "api://contoso-budgets/.default"

source:
  openapi: ./openapi.yaml            # path or URL

output:
  format: folder | zip              # default: folder
  path: ./dist
```

---

## 5. CLI

```
copilot-plugin-gen gen \
    --openapi oas.yaml \
    --config meta.yaml \
    --out ./dist \
    [--format zip]

copilot-plugin-gen validate \
    --openapi oas.yaml
```

- `gen`: load OpenAPI + config → normalize OpenAPI → render 4 manifests + auth.json
  + DEPLOY.md + icons → write folder or zip.
- `validate`: run the validation rules (below) and exit non-zero on failure with
  clear messages. `gen` also runs validation first and refuses to emit an
  invalid package.

---

## 6. Validation rules (Microsoft guidance)

A spec is valid when:
- Every path operation has a unique, non-empty `operationId`.
- Every operation has `summary` and `description`.
- Every operation declares at least one `2xx` response.
- No operation relies solely on `application/octet-stream` request/response in a
  way Copilot cannot describe (warn, don't hard-fail, for v1).
- `openapi.json` parses and `$schema`/version is 3.0.x.
- `auth.json` has tenant_id, client_id, and >=1 scope.

The validator returns a list of `(level, location, message)` so the user can fix
the source spec before generating.

---

## 7. Project layout

Under `/home/wang/wk/code/copilot-plugin-gen/` (per AGENTS.md: code lives in
`/home/wang/wk/code`, main code + tests in the same folder):

```
copilot-plugin-gen/
  pyproject.toml
  README.md
  src/copilot_plugin_gen/
    __init__.py
    cli.py            # typer entrypoint: gen, validate
    loader.py         # read + parse OpenAPI (yaml/json/url) and meta-config
    normalize.py      # ensure operationIds/summaries/responses
    render.py         # build the 4 manifests + auth.json from spec+config
    validate.py       # validation rules
    templates/        # jinja2 templates for the manifests
      plugin.json.j2
      declarativeAgent.json.j2
      manifest.json.j2
      auth.json.j2
      DEPLOY.md.j2
    icons/            # default outline/color png
  tests/
    test_render.py
    test_validate.py
    fixtures/
      sample_openapi.yaml
      sample_meta.yaml
      bad_openapi.yaml
```

Dependencies (minimal): `typer`, `pyyaml`, `jinja2`, `jsonschema`.
Python 3.10+.

---

## 8. Data flow

```
meta.yaml ─┐
           ├─► loader ─► normalize(openapi) ─► validate ─► render(templates) ─► dist/
openapi ───┘                                                      (folder|zip) + DEPLOY.md
```

`gen` fails fast if `validate` reports errors.

---

## 9. Testing

- `tests/test_render.py`: render from fixture OpenAPI+config, assert each manifest
  is valid JSON, `functions[].name` matches operationIds, DA references plugin.json,
  Teams manifest references declarativeAgent.json, auth block has correct Entra URLs.
- `tests/test_validate.py`: known-good spec passes; known-bad spec (missing
  operationId / missing 2xx response) fails with the right message.
- Run with `pytest` (no framework fixtures beyond stdlib).

---

## 10. Enterprise notes / risks

- **Tenant approval is manual** — the tool produces the artifact; a tenant admin
  still uploads + approves. DEPLOY.md documents this.
- **Single-tenant Entra app** is the safe default for enterprise; multi-tenant is
  out of scope for v1.
- **Schema versions** are pinned (plugin v2.3, DA v1.5, Teams v1.17). If Microsoft
  bumps these, only the templates + `$schema` strings need updating.
- **Scope creep guard**: no live test harness, no other auth types in v1.
```
