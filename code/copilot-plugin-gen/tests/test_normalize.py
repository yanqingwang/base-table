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
