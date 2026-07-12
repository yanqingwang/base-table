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
