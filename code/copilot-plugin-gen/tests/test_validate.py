from copilot_plugin_gen.validate import validate_openapi


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
