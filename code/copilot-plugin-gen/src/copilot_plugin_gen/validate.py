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
