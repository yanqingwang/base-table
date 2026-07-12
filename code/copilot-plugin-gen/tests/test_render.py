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
