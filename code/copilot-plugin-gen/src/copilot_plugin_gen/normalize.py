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
