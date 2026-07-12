from copilot_plugin_gen.loader import load_openapi, load_config


def test_load_openapi_yaml():
    spec = load_openapi("tests/fixtures/sample_openapi.yaml")
    assert spec["openapi"].startswith("3.0")
    assert "/budgets" in spec["paths"]


def test_load_config():
    cfg = load_config("tests/fixtures/sample_meta.yaml")
    assert cfg["agent"]["name"] == "Contoso Budgets"
