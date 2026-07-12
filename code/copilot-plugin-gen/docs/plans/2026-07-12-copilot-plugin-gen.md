# Copilot Plugin Generator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Python CLI that turns an OpenAPI spec + meta-config into a complete, enterprise-ready Microsoft 365 Copilot API plugin package (OAuth2/Entra ID).

**Architecture:** A `typer` CLI with two commands (`gen`, `validate`). `loader` reads the OpenAPI (file/URL) and YAML meta-config; `validate` enforces Microsoft's API-plugin guidance; `normalize` fills metadata gaps; `render` builds the four manifests + auth doc; `cli` writes a folder or zip. Output is a Teams-app package a tenant admin uploads for approval.

**Tech Stack:** Python 3.10+, `typer`, `pyyaml`. (No jinja2/jsonschema — manifests are built as dicts and JSON-serialized; ponytail simplification over the spec's template approach.) `pytest` for tests.

---

## File Structure

```
copilot-plugin-gen/
  pyproject.toml
  README.md
  src/copilot_plugin_gen/
    __init__.py
    loader.py          # load_openapi(path|url), load_config(path)
    validate.py        # validate_openapi(spec) -> list[Issue]
    normalize.py       # normalize_openapi(spec) -> spec
    render.py          # render_manifests(spec, config, normalized) -> dict[name,str]
    cli.py             # typer app: gen, validate
    icons/
      outline.png      # placeholder 1x1 white PNG
      color.png        # placeholder 1x1 blue PNG
  tests/
    test_loader.py
    test_validate.py
    test_normalize.py
    test_render.py
    test_cli.py
    fixtures/
      sample_openapi.yaml
      sample_meta.yaml
      bad_openapi.yaml
```

---

### Task 1: Project scaffold

**Files:**
- Create: `copilot-plugin-gen/pyproject.toml`
- Create: `copilot-plugin-gen/src/copilot_plugin_gen/__init__.py`
- Create: `copilot-plugin-gen/src/copilot_plugin_gen/icons/outline.png`
- Create: `copilot-plugin-gen/src/copilot_plugin_gen/icons/color.png`

- [ ] **Step 1: Write `pyproject.toml`**

```toml
[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[project]
name = "copilot-plugin-gen"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = ["typer>=0.12", "pyyaml>=6.0"]

[project.scripts]
copilot-plugin-gen = "copilot_plugin_gen.cli:app"

[tool.setuptools.packages.find]
where = ["src"]

[tool.pytest.ini_options]
testpaths = ["tests"]
```

- [ ] **Step 2: Write `__init__.py`**

```python
__version__ = "0.1.0"
```

- [ ] **Step 3: Create placeholder icons**

Run (bash):
```bash
mkdir -p copilot-plugin-gen/src/copilot_plugin_gen/icons
python - <<'PY'
import base64, pathlib
outline = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==")
color   = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYCaCAAHgAAQTAeGbAAAAAElFTkSuQmCC")
p = pathlib.Path("copilot-plugin-gen/src/copilot_plugin_gen/icons")
p.joinpath("outline.png").write_bytes(outline)
p.joinpath("color.png").write_bytes(color)
PY
```
Expected: two PNG files exist (user should replace with real 32x32/64x64 icons before production upload).

- [ ] **Step 4: Install editable + verify import**

```bash
cd copilot-plugin-gen && pip install -e . && python -c "import copilot_plugin_gen; print(copilot_plugin_gen.__version__)"
```
Expected: prints `0.1.0`.

---

### Task 2: loader.py

**Files:**
- Create: `src/copilot_plugin_gen/loader.py`
- Test: `tests/test_loader.py`
- Fixture: `tests/fixtures/sample_openapi.yaml`

- [ ] **Step 1: Write the failing test**

```python
from copilot_plugin_gen.loader import load_openapi, load_config

def test_load_openapi_yaml():
    spec = load_openapi("tests/fixtures/sample_openapi.yaml")
    assert spec["openapi"].startswith("3.0")
    assert "/budgets" in spec["paths"]

def test_load_config():
    cfg = load_config("tests/fixtures/sample_meta.yaml")
    assert cfg["agent"]["name"] == "Contoso Budgets"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd copilot-plugin-gen && pytest tests/test_loader.py -v
```
Expected: FAIL — `ModuleNotFoundError: copilot_plugin_gen.loader`.

- [ ] **Step 3: Create fixture `sample_openapi.yaml`**

```yaml
openapi: 3.0.3
info:
  title: Contoso Budgets API
  version: 1.0.0
paths:
  /budgets:
    get:
      operationId: listBudgets
      summary: List all budgets
      description: Returns all budgets in the org.
      responses:
        "200":
          description: OK
    post:
      operationId: createBudget
      summary: Create a budget
      description: Creates a new budget.
      responses:
        "201":
          description: Created
  /budgets/{name}/charge:
    post:
      operationId: chargeBudget
      summary: Charge a budget
      description: Charges an amount to a named budget.
      parameters:
        - name: name
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: OK
```

- [ ] **Step 4: Create fixture `sample_meta.yaml`**

```yaml
agent:
  name: Contoso Budgets
  description: Query and manage Contoso budgets.
  instructions: You are the Contoso budgets assistant.
  conversation_starters:
    - title: Check budget
      text: How much is left in the travel budget?
  namespace: contoso-budgets
auth:
  type: oauth2
  entra:
    tenant_id: 00000000-0000-0000-0000-000000000000
    client_id: 11111111-1111-1111-1111-111111111111
    scopes:
      - api://contoso-budgets/.default
source:
  openapi: tests/fixtures/sample_openapi.yaml
output:
  format: folder
```

- [ ] **Step 5: Write minimal implementation**

```python
import json
import urllib.request
from pathlib import Path

import yaml


def load_openapi(source: str) -> dict:
    if source.startswith(("http://", "https://")):
        with urllib.request.urlopen(source) as resp:  # noqa: S310
            raw = resp.read().decode("utf-8")
    else:
        raw = Path(source).read_text(encoding="utf-8")
    return yaml.safe_load(raw)


def load_config(path: str) -> dict:
    return yaml.safe_load(Path(path).read_text(encoding="utf-8"))
```

- [ ] **Step 6: Run test to verify it passes**

```bash
cd copilot-plugin-gen && pytest tests/test_loader.py -v
```
Expected: PASS.

---

### Task 3: validate.py

**Files:**
- Create: `src/copilot_plugin_gen/validate.py`
- Test: `tests/test_validate.py`
- Fixture: `tests/fixtures/bad_openapi.yaml`

- [ ] **Step 1: Write the failing test**

```python
from copilot_plugin_gen.validate import validate_openapi, Issue

def test_valid_spec_has_no_errors():
    spec = {
        "openapi": "3.0.3",
        "paths": {
            "/x": {"get": {"operationId": "getX", "summary": "s", "description": "d",
                           "responses": {"200": {"description": "OK"}}}}
        },
    }
    issues = validate_openapi(spec)
    assert all(i.level != "error" for i in issues)

def test_missing_operationid_is_error():
    spec = {"openapi": "3.0.3", "paths": {"/x": {"get": {"responses": {}}}}}
    issues = validate_openapi(spec)
    assert any(i.level == "error" and "operationId" in i.message for i in issues)

def test_bad_version_is_error():
    issues = validate_openapi({"openapi": "2.0", "paths": {}})
    assert any(i.level == "error" and "3.0" in i.message for i in issues)
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd copilot-plugin-gen && pytest tests/test_validate.py -v
```
Expected: FAIL — `import error`.

- [ ] **Step 3: Create fixture `bad_openapi.yaml`**

```yaml
openapi: 3.0.3
info:
  title: Bad
  version: 1.0.0
paths:
  /budgets:
    get:
      # missing operationId on purpose
      summary: List
      responses:
        "200":
          description: OK
  /budgets/{name}/charge:
    post:
      operationId: chargeBudget
      responses: {}   # no 2xx -> warning
```

- [ ] **Step 4: Write minimal implementation**

```python
from dataclasses import dataclass

HTTP_METHODS = {"get", "post", "put", "delete", "patch", "head", "options"}


@dataclass
class Issue:
    level: str  # "error" | "warning"
    location: str
    message: str

    def __str__(self) -> str:
        return f"[{self.level.upper()}] {self.location}: {self.message}"


def validate_openapi(spec: dict) -> list[Issue]:
    issues: list[Issue] = []
    version = str(spec.get("openapi", ""))
    if not version.startswith("3.0"):
        issues.append(Issue("error", "openapi", f"OpenAPI 3.0.x required, got '{version}'"))

    seen: dict[str, str] = {}
    for path, item in (spec.get("paths", {}) or {}).items():
        if not isinstance(item, dict):
            continue
        for method, op in item.items():
            if method.lower() not in HTTP_METHODS or not isinstance(op, dict):
                continue
            loc = f"{method.upper()} {path}"
            op_id = op.get("operationId")
            if not op_id:
                issues.append(Issue("error", loc, "missing operationId"))
                continue
            if op_id in seen:
                issues.append(Issue("error", loc, f"duplicate operationId '{op_id}' (also at {seen[op_id]})"))
            else:
                seen[op_id] = loc
            if not op.get("summary"):
                issues.append(Issue("warning", loc, "missing summary"))
            if not op.get("description"):
                issues.append(Issue("warning", loc, "missing description"))
            responses = op.get("responses", {}) or {}
            if not any(code.startswith("2") for code in responses):
                issues.append(Issue("warning", loc, "no 2xx response declared"))
    return issues
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd copilot-plugin-gen && pytest tests/test_validate.py -v
```
Expected: PASS.

---

### Task 4: normalize.py

**Files:**
- Create: `src/copilot_plugin_gen/normalize.py`
- Test: `tests/test_normalize.py`

- [ ] **Step 1: Write the failing test**

```python
from copilot_plugin_gen.normalize import normalize_openapi


def test_fills_missing_summary_and_description():
    spec = {"openapi": "3.0.3", "paths": {"/x": {"get": {"operationId": "getX"}}}}
    out = normalize_openapi(spec)
    op = out["paths"]["/x"]["get"]
    assert op["summary"] == "getX"
    assert op["description"] == "getX"


def test_does_not_mutate_input():
    spec = {"openapi": "3.0.3", "paths": {"/x": {"get": {"operationId": "getX"}}}}
    normalize_openapi(spec)
    assert "summary" not in spec["paths"]["/x"]["get"]
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd copilot-plugin-gen && pytest tests/test_normalize.py -v
```
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```python
from copy import deepcopy


def normalize_openapi(spec: dict) -> dict:
    spec = deepcopy(spec)
    for path, item in (spec.get("paths", {}) or {}).items():
        if not isinstance(item, dict):
            continue
        for method, op in item.items():
            if not isinstance(op, dict):
                continue
            op_id = op.get("operationId")
            if not op.get("summary"):
                op["summary"] = op_id or f"{method} {path}"
            if not op.get("description"):
                op["description"] = op.get("summary", "")
    return spec
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd copilot-plugin-gen && pytest tests/test_normalize.py -v
```
Expected: PASS.

---

### Task 5: render.py

**Files:**
- Create: `src/copilot_plugin_gen/render.py`
- Test: `tests/test_render.py`

- [ ] **Step 1: Write the failing test**

```python
import json
from copilot_plugin_gen.loader import load_openapi, load_config
from copilot_plugin_gen.normalize import normalize_openapi
from copilot_plugin_gen.render import render_manifests


def _build():
    spec = load_openapi("tests/fixtures/sample_openapi.yaml")
    cfg = load_config("tests/fixtures/sample_meta.yaml")
    norm = normalize_openapi(spec)
    return render_manifests(spec, cfg, norm)


def test_openapi_json_serializes():
    files = _build()
    parsed = json.loads(files["openapi.json"])
    assert parsed["openapi"].startswith("3.0")


def test_plugin_maps_functions_to_operationids():
    files = _build()
    plugin = json.loads(files["plugin.json"])
    names = {f["name"] for f in plugin["functions"]}
    assert names == {"listBudgets", "createBudget", "chargeBudget"}
    assert plugin["auth"]["type"] == "oauth"
    assert "login.microsoftonline.com" in plugin["auth"]["authorization_url"]


def test_da_references_plugin():
    files = _build()
    da = json.loads(files["declarativeAgent.json"])
    assert da["actions"][0]["file"] == "plugin.json"
    assert da["conversation_starters"][0]["text"]


def test_teams_manifest_references_da():
    files = _build()
    m = json.loads(files["manifest.json"])
    assert m["copilotAgents"]["declarativeAgents"][0]["file"] == "declarativeAgent.json"
    assert m["manifestVersion"] == "1.17"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd copilot-plugin-gen && pytest tests/test_render.py -v
```
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```python
import json
import uuid

from copy import deepcopy


def _entra_urls(tenant_id: str) -> tuple[str, str]:
    base = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0"
    return f"{base}/authorize", f"{base}/token"


def render_manifests(spec: dict, config: dict, normalized: dict) -> dict[str, str]:
    agent = config["agent"]
    entra = config["auth"]["entra"]
    tenant_id = entra["tenant_id"]
    client_id = entra["client_id"]
    scopes = " ".join(entra.get("scopes", []))
    authz_url, token_url = _entra_urls(tenant_id)

    namespace = agent.get("namespace") or agent["name"].lower().replace(" ", "-")
    instructions = agent.get("instructions") or agent["description"]

    functions = []
    for path, item in (normalized.get("paths", {}) or {}).items():
        if not isinstance(item, dict):
            continue
        for method, op in item.items():
            if not isinstance(op, dict) or "operationId" not in op:
                continue
            functions.append({
                "name": op["operationId"],
                "description": op.get("description") or op.get("summary") or "",
            })

    plugin = {
        "$schema": "https://developer.microsoft.com/json-schemas/copilot/plugin/v2.3/schema.json",
        "schema_version": "v2.3",
        "namespace": namespace,
        "name_for_human": agent["name"],
        "name_for_model": namespace,
        "description_for_human": agent["description"],
        "description_for_model": agent["description"],
        "functions": functions,
        "auth": {
            "type": "oauth",
            "client_id": client_id,
            "authorization_url": authz_url,
            "token_url": token_url,
            "scope": scopes,
            "tenant_id": tenant_id,
        },
        "api_dependency": {"openapi_doc_url": "openapi.json"},
    }

    conversation_starters = [
        {"title": cs.get("title", ""), "text": cs["text"]}
        for cs in agent.get("conversation_starters", [])
    ]
    da = {
        "$schema": "https://developer.microsoft.com/json-schemas/copilot/declarative-agent/v1.5/schema.json",
        "version": "v1.5",
        "name": agent["name"],
        "description": agent["description"],
        "instructions": instructions,
        "conversation_starters": conversation_starters,
        "actions": [{"id": "plugin", "file": "plugin.json"}],
    }

    dev = config.get("developer", {})
    manifest = {
        "$schema": "https://developer.microsoft.com/en-us/json-schemas/teams/v1.17/MicrosoftTeams.schema.json",
        "manifestVersion": "1.17",
        "version": "1.0.0",
        "id": config.get("app_id", uuid.uuid4().hex),
        "packageName": namespace,
        "developer": {
            "name": dev.get("name", agent["name"]),
            "websiteUrl": dev.get("websiteUrl", "https://localhost"),
            "mpnId": dev.get("mpnId", "0000000"),
        },
        "name": {"short": agent["name"], "full": agent["name"]},
        "description": {"short": agent["description"], "full": agent["description"]},
        "icons": {"outline": "icons/outline.png", "color": "icons/color.png"},
        "accentColor": "#FFFFFF",
        "copilotAgents": {
            "declarativeAgents": [{"id": "da", "file": "declarativeAgent.json"}]
        },
        "staticTabs": [],
        "permissions": ["identity"],
        "validDomains": [],
    }

    auth_doc = {
        "type": "oauth2",
        "tenant_id": tenant_id,
        "client_id": client_id,
        "scopes": entra.get("scopes", []),
        "authorize_url": authz_url,
        "token_url": token_url,
    }

    return {
        "openapi.json": json.dumps(normalized, indent=2, ensure_ascii=False),
        "plugin.json": json.dumps(plugin, indent=2, ensure_ascii=False),
        "declarativeAgent.json": json.dumps(da, indent=2, ensure_ascii=False),
        "manifest.json": json.dumps(manifest, indent=2, ensure_ascii=False),
        "auth.json": json.dumps(auth_doc, indent=2, ensure_ascii=False),
    }
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd copilot-plugin-gen && pytest tests/test_render.py -v
```
Expected: PASS.

---

### Task 6: cli.py

**Files:**
- Create: `src/copilot_plugin_gen/cli.py`
- Test: `tests/test_cli.py`

- [ ] **Step 1: Write the failing test**

```python
import json
from typer.testing import CliRunner
from copilot_plugin_gen.cli import app

runner = CliRunner()

def test_validate_ok():
    r = runner.invoke(app, ["validate", "--openapi", "tests/fixtures/sample_openapi.yaml"])
    assert r.exit_code == 0
    assert "VALIDATION OK" in r.output

def test_gen_writes_folder(tmp_path):
    out = tmp_path / "dist"
    r = runner.invoke(app, [
        "gen",
        "--openapi", "tests/fixtures/sample_openapi.yaml",
        "--config", "tests/fixtures/sample_meta.yaml",
        "--out", str(out),
        "--format", "folder",
    ])
    assert r.exit_code == 0, r.output
    for f in ("openapi.json", "plugin.json", "declarativeAgent.json", "manifest.json", "auth.json", "DEPLOY.md"):
        assert (out / f).exists()
    assert (out / "icons" / "outline.png").exists()

def test_gen_rejects_invalid(tmp_path):
    out = tmp_path / "dist"
    r = runner.invoke(app, [
        "gen",
        "--openapi", "tests/fixtures/bad_openapi.yaml",
        "--config", "tests/fixtures/sample_meta.yaml",
        "--out", str(out),
    ])
    assert r.exit_code != 0
    assert not (out / "plugin.json").exists()
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd copilot-plugin-gen && pytest tests/test_cli.py -v
```
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```python
import shutil
import zipfile
from pathlib import Path

import typer

from .loader import load_openapi, load_config
from .normalize import normalize_openapi
from .validate import validate_openapi
from .render import render_manifests

app = typer.Typer()
ICONS = Path(__file__).parent / "icons"


def _deploy_md(cfg: dict) -> str:
    agent = cfg["agent"]
    return (
        f"# Deploy {agent['name']} to Microsoft 365 Copilot (Enterprise)\n\n"
        "1. In Entra ID, register a single-tenant app. Note client ID and tenant ID.\n"
        "2. Add the API scopes from `auth.json` to the app registration.\n"
        "3. Run: `copilot-plugin-gen gen --openapi <oas> --config <meta> --format zip`\n"
        "4. Teams Admin Center -> Manage apps -> Upload custom app: upload the zip.\n"
        "5. Submit for admin approval; once approved the declarative agent appears in M365 Copilot.\n"
    )


def _write_output(files: dict[str, str], out: str, fmt: str) -> None:
    if fmt == "zip":
        with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
            for name, content in files.items():
                z.writestr(name, content)
            for icon in ("outline.png", "color.png"):
                z.writestr(f"icons/{icon}", (ICONS / icon).read_bytes())
    else:
        out_path = Path(out)
        out_path.mkdir(parents=True, exist_ok=True)
        for name, content in files.items():
            (out_path / name).write_text(content, encoding="utf-8")
        icons_dir = out_path / "icons"
        icons_dir.mkdir(exist_ok=True)
        for icon in ("outline.png", "color.png"):
            shutil.copy(ICONS / icon, icons_dir / icon)


@app.command()
def validate(openapi: str = typer.Option(..., "--openapi")) -> None:
    issues = validate_openapi(load_openapi(openapi))
    errors = [i for i in issues if i.level == "error"]
    for i in issues:
        typer.echo(str(i))
    if errors:
        typer.echo(f"VALIDATION FAILED: {len(errors)} error(s)")
        raise typer.Exit(code=1)
    typer.echo("VALIDATION OK")


@app.command()
def gen(
    openapi: str = typer.Option(..., "--openapi"),
    config: str = typer.Option(..., "--config"),
    out: str = typer.Option("dist", "--out"),
    format: str = typer.Option("folder", "--format"),
) -> None:
    spec = load_openapi(openapi)
    issues = validate_openapi(spec)
    errors = [i for i in issues if i.level == "error"]
    for i in issues:
        typer.echo(str(i))
    if errors:
        typer.echo("Refusing to generate: fix validation errors first.")
        raise typer.Exit(code=1)
    cfg = load_config(config)
    normalized = normalize_openapi(spec)
    files = render_manifests(spec, cfg, normalized)
    files["DEPLOY.md"] = _deploy_md(cfg)
    _write_output(files, out, format)
    typer.echo(f"Generated package at {out} ({format})")


if __name__ == "__main__":
    app()
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd copilot-plugin-gen && pytest tests/test_cli.py -v
```
Expected: PASS.

---

### Task 7: README + full suite

**Files:**
- Create: `copilot-plugin-gen/README.md`

- [ ] **Step 1: Write README**

```markdown
# copilot-plugin-gen

Generate an enterprise-ready Microsoft 365 Copilot API plugin package from an
OpenAPI spec + meta-config. Analogous to `web2api`: define once, generate the
plugin, deploy to your tenant.

## Install
pip install -e .

## Usage
copilot-plugin-gen validate --openapi openapi.yaml
copilot-plugin-gen gen --openapi openapi.yaml --config meta.yaml --format zip

## Output
openapi.json, plugin.json, declarativeAgent.json, manifest.json, auth.json,
icons/, DEPLOY.md. Upload the zip in Teams Admin Center for tenant approval.

## Auth
OAuth2 with Microsoft Entra ID (single-tenant). Set tenant_id, client_id, and
scopes in meta.yaml under `auth.entra`.
```

- [ ] **Step 2: Run the full test suite**

```bash
cd copilot-plugin-gen && pytest -v
```
Expected: all PASS.

- [ ] **Step 3: End-to-end smoke test**

```bash
cd copilot-plugin-gen && copilot-plugin-gen gen --openapi tests/fixtures/sample_openapi.yaml --config tests/fixtures/sample_meta.yaml --out /tmp/cpg-dist --format zip && unzip -l /tmp/cpg-dist
```
Expected: zip lists openapi.json, plugin.json, declarativeAgent.json, manifest.json, auth.json, DEPLOY.md, icons/outline.png, icons/color.png.

---

## Self-Review

1. **Spec coverage:** openapi.json (Task 5), plugin.json v2.3 (Task 5), declarativeAgent.json v1.5 (Task 5), manifest.json v1.17 (Task 5), auth.json (Task 5), DEPLOY.md (Task 6), OAuth2/Entra (Task 5 URLs, Task 6 DEPLOY), validation (Task 3 + Task 6), CLI gen/validate (Task 6), tests (Tasks 2-6 + 7). All covered.
2. **Placeholders:** none. Every step has real code/commands.
3. **Type consistency:** `render_manifests(spec, config, normalized)` signature matches its call in cli.py and tests. `validate_openapi` returns `list[Issue]`; cli uses `.level`. `Issue` dataclass stable across tasks. `namespace` derived identically in render. Good.

**Deviation from spec (intentional, ponytail):** dropped jinja2 templates + jsonschema; manifests built as dicts and JSON-serialized. Fewer deps, same output. Icons are 1x1 placeholders to be replaced before production upload.
