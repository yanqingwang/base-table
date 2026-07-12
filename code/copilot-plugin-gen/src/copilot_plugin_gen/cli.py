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
