"""
POST /api/predict-compare

Scores a single loan applicant against all three models that are actually
deployed in production: Gradient Boosting (model/model.json), XGBoost
(model/model_xgboost.json) and Random Forest (model/model_random_forest.json).
Returns all three results in one response, so the UI can show whether
three independently trained models agree.

Shares its validation, vector-building and tree-walking code with
api/predict.py via a plain sibling import rather than a new api/_scoring.py
module. Vercel's Python builder (see vercel.json's `functions["api/**/*.py"]`
glob and docs/07-deployment.md) treats *every* .py file under api/ as its
own file-based function regardless of a leading underscore, so a module
named api/_scoring.py would itself be deployed as a route (/api/_scoring)
with no `handler` class. Importing from api/predict.py avoids that.

Each Python function is bundled in isolation on Vercel, so predict.py is
not on sys.path by default even though it lives in the same directory;
`vercel.json` explicitly includes it in this function's bundle
(functions["api/**/*.py"].includeFiles), and the path insert below makes
sure Python can actually find it once it's there.
"""

from __future__ import annotations

import json
import math
import os
import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from typing import Any

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from predict import (
    FEATURE_LABELS,
    ValidationError,
    build_vector,
    feature_index_map,
    band_for,
    decision_for,
    load_model,
    score,
    score_forest,
    score_to_display,
    validate_and_extract,
)

MODEL_DIR = Path(__file__).resolve().parent.parent / "model"
GB_PATH = MODEL_DIR / "model.json"
XGB_PATH = MODEL_DIR / "model_xgboost.json"
RF_PATH = MODEL_DIR / "model_random_forest.json"


def _additive_result(vector: list[float], model: dict[str, Any], cleaned: dict[str, Any]) -> dict[str, Any]:
    """Full response shape (with contributions) for an additive boosting
    model, shared by Gradient Boosting and XGBoost, since both are scored
    with the same score() walker."""
    raw_margin, contributions_by_idx = score(vector, model)
    probability = 1.0 / (1.0 + math.exp(-(model["platt_a"] * raw_margin + model["platt_b"])))

    index_map = feature_index_map(model)
    grouped: dict[str, float] = {}
    for idx, delta in contributions_by_idx.items():
        field, _category = index_map[idx]
        grouped[field] = grouped.get(field, 0.0) + delta

    total_margin_contribution = sum(grouped.values())
    base_probability = 1.0 / (1.0 + math.exp(-(model["platt_a"] * model["base_value"] + model["platt_b"])))

    if abs(total_margin_contribution) > 1e-12:
        scale = (probability - base_probability) / total_margin_contribution
    else:
        scale = 0.0

    contributions = []
    for field, delta in sorted(grouped.items(), key=lambda kv: -abs(kv[1])):
        contributions.append({
            "feature": field,
            "label": FEATURE_LABELS.get(field, field),
            "value": cleaned[field] if isinstance(cleaned[field], str) else round(cleaned[field], 2),
            "contribution": round(delta * scale, 4),
        })

    cutoff = model["cutoff"]
    return {
        "probability_of_default": round(probability, 4),
        "risk_band": band_for(probability),
        "score": score_to_display(probability),
        "decision": decision_for(probability, cutoff),
        "cutoff": cutoff,
        "contributions": contributions,
        "base_rate": model["base_rate"],
        "model_version": model["model_version"],
    }


def _forest_result(vector: list[float], model: dict[str, Any]) -> dict[str, Any]:
    """Response shape for Random Forest: no contributions key, by design.
    Random Forest gets no driver breakdown in this phase (see score_forest's
    docstring in api/predict.py)."""
    raw_probability, _contributions = score_forest(vector, model)
    probability = 1.0 / (1.0 + math.exp(-(model["platt_a"] * raw_probability + model["platt_b"])))

    cutoff = model["cutoff"]
    return {
        "probability_of_default": round(probability, 4),
        "risk_band": band_for(probability),
        "score": score_to_display(probability),
        "decision": decision_for(probability, cutoff),
        "cutoff": cutoff,
        "model_version": model["model_version"],
    }


def predict_compare(payload: dict[str, Any]) -> dict[str, Any]:
    gb_model = load_model(GB_PATH)
    # All three models share the identical 12 input fields and 37-column
    # vector, so validation only needs to run once, against GB's
    # categories/bounds.
    cleaned = validate_and_extract(payload, gb_model)
    vector = build_vector(cleaned, gb_model)

    xgb_model = load_model(XGB_PATH)
    rf_model = load_model(RF_PATH)

    return {
        "gradient_boosting": _additive_result(vector, gb_model, cleaned),
        "xgboost": _additive_result(vector, xgb_model, cleaned),
        "random_forest": _forest_result(vector, rf_model),
        "cutoff": gb_model["cutoff"],
    }


# ---------------------------------------------------------------------------
# HTTP handler (Vercel's Python /api runtime: a BaseHTTPRequestHandler
# subclass named `handler` is a supported entrypoint with zero dependencies)
# ---------------------------------------------------------------------------

class handler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, body: dict[str, Any]) -> None:
        payload = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self) -> None:
        try:
            length = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(length) if length > 0 else b"{}"
            try:
                payload = json.loads(raw_body.decode("utf-8"))
            except (json.JSONDecodeError, UnicodeDecodeError):
                self._send_json(400, {"error": "body", "message": "Request body must be valid JSON."})
                return

            result = predict_compare(payload)
            self._send_json(200, result)
        except ValidationError as exc:
            self._send_json(400, {"error": exc.field, "message": exc.message})
        except Exception as exc:  # noqa: BLE001: last-resort guard, never a 500 for bad input
            self._send_json(400, {"error": "unknown", "message": str(exc)})

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A002
        pass  # keep Vercel's function logs quiet for a request this small
