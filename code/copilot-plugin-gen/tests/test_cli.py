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
