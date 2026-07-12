import json
import uuid


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
