"""
POST /api/predict

Scores a single loan applicant using the exported Gradient Boosting
ensemble in model/model.json. No third-party dependencies: the whole
tree-walk, Platt scaling and path-contribution attribution are written by
hand against the Python standard library, which is what lets this endpoint
deploy on Vercel without a requirements.txt at all.

See docs/03-backend.md for the artifact format and the path-contribution
method (a Saabas decomposition of the boosted ensemble), and notebook.ipynb
for the tests that prove this file reproduces the fitted scikit-learn
pipeline to within 1e-9.
"""

from __future__ import annotations

import json
import math
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from typing import Any

MODEL_PATH = Path(__file__).resolve().parent.parent / "model" / "model.json"
_MODEL_CACHE: dict[str, dict[str, Any]] = {}


def load_model(path: Path = MODEL_PATH) -> dict[str, Any]:
    """Loads a model artifact, cached by path.

    Generalised (still path-keyed, defaulting to the Gradient Boosting
    artifact) so a warm serverless instance that scores against more than
    one model — see api/predict-compare.py — doesn't re-read disk on every
    request for models it already loaded.
    """
    key = str(path)
    if key not in _MODEL_CACHE:
        _MODEL_CACHE[key] = json.loads(Path(path).read_text())
    return _MODEL_CACHE[key]


# ---------------------------------------------------------------------------
# Feature vector construction — mirrors the sklearn ColumnTransformer exactly:
# numeric columns (in order), then one one-hot block per categorical column
# (in the category order captured at training time).
# ---------------------------------------------------------------------------

NUMERIC_BOUNDS = {
    "age": (18, 100),
    "employment_years": (0, 50),
    "monthly_income": (1, 1_000_000),
    "loan_amount": (1, 1_000_000),
    "duration_months": (1, 120),
    "existing_credits": (0, 20),
}


class ValidationError(Exception):
    def __init__(self, field: str, message: str):
        self.field = field
        self.message = message
        super().__init__(message)


def validate_and_extract(payload: dict[str, Any], model: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValidationError("_body", "Request body must be a JSON object.")

    cleaned: dict[str, Any] = {}

    for field in model["numeric_features"]:
        if field not in payload:
            raise ValidationError(field, f"'{field}' is required.")
        raw = payload[field]
        if isinstance(raw, bool) or not isinstance(raw, (int, float)):
            raise ValidationError(field, f"'{field}' must be a number.")
        value = float(raw)
        if math.isnan(value) or math.isinf(value):
            raise ValidationError(field, f"'{field}' must be a finite number.")
        lo, hi = NUMERIC_BOUNDS.get(field, (float("-inf"), float("inf")))
        if value < lo or value > hi:
            raise ValidationError(field, f"'{field}' must be between {lo} and {hi}.")
        cleaned[field] = value

    for field in model["categorical_features"]:
        if field not in payload:
            raise ValidationError(field, f"'{field}' is required.")
        raw = payload[field]
        if not isinstance(raw, str):
            raise ValidationError(field, f"'{field}' must be a string.")
        allowed = model["categories"][field]
        if raw not in allowed:
            raise ValidationError(
                field, f"'{field}' must be one of {allowed}, got '{raw}'."
            )
        cleaned[field] = raw

    if cleaned["duration_months"] > 0:
        implied_installment = cleaned["loan_amount"] / cleaned["duration_months"]
        if implied_installment > cleaned["monthly_income"] * 4:
            raise ValidationError(
                "loan_amount",
                "This loan amount and duration imply a monthly installment "
                "many times the applicant's income. Lower the amount, extend "
                "the duration, or raise the income.",
            )

    return cleaned


def build_vector(cleaned: dict[str, Any], model: dict[str, Any]) -> list[float]:
    vector: list[float] = [cleaned[f] for f in model["numeric_features"]]
    for field in model["categorical_features"]:
        value = cleaned[field]
        for category in model["categories"][field]:
            vector.append(1.0 if category == value else 0.0)
    return vector


# ---------------------------------------------------------------------------
# Tree walk + Saabas-style path contributions
# ---------------------------------------------------------------------------

def score(vector: list[float], model: dict[str, Any]) -> tuple[float, dict[str, float]]:
    """Returns (raw_margin, contribution_by_feature_index).

    Each tree's contribution walk starts from a *virtual* value of 0, not the
    tree's actual root value. This is deliberate: the shared prior across the
    whole ensemble lives entirely in ``base_value``, so attributing a tree's
    full leaf output to the path taken through it (rather than only the
    root-to-leaf delta) is what makes contributions sum to exactly
    ``raw - base_value``. Using the actual root value instead would silently
    drop each tree's root value from every prediction's attribution, since
    that root value is folded into ``raw`` via the real leaf value but never
    assigned to a feature. Tested for exact additivity in notebook.ipynb.

    The left/right split comparison is **not** the same convention for every
    model type: sklearn (Gradient Boosting) routes a row left on
    ``value <= threshold``, but XGBoost routes left only on a strict
    ``value < threshold``. This is not a cosmetic difference — XGBoost's
    histogram-based splitter frequently places a threshold exactly on a real
    data value (rather than at a midpoint, the way sklearn's CART does), so
    ties at the boundary are common, not rare. Measured directly against the
    shipped model_xgboost.json over all 1,000 training rows, using ``<=``
    instead of the training-time ``<`` flips the routing on every single row
    at at least one of the 200 trees, with probability-of-default differing
    by as much as 0.65 between the two conventions — nowhere close to
    negligible. ``model["model_type"]`` (present in every exported artifact)
    is what decides the operator here, so the one shared function still
    handles every model type correctly without a per-caller special case.
    """
    strict_less = model.get("model_type") == "xgboost"
    contributions: dict[int, float] = {}
    raw = model["base_value"]

    for tree in model["trees"]:
        node = 0
        attributed_value = 0.0
        while tree["left"][node] != -1:
            feature_idx = tree["feature"][node]
            threshold = tree["threshold"][node]
            go_left = vector[feature_idx] < threshold if strict_less else vector[feature_idx] <= threshold
            next_node = tree["left"][node] if go_left else tree["right"][node]
            next_value = tree["value"][next_node]

            delta = (next_value - attributed_value) * model["learning_rate"]
            contributions[feature_idx] = contributions.get(feature_idx, 0.0) + delta

            node = next_node
            attributed_value = next_value

        raw += attributed_value * model["learning_rate"]

    return raw, contributions


def score_forest(vector: list[float], model: dict[str, Any]) -> tuple[float, dict[str, float]]:
    """Returns (mean_probability, {}) for a Random Forest artifact.

    Random Forest combines trees by *averaging* predicted leaf
    probabilities, not by additive boosting, so this walk is deliberately
    simpler than score(): no learning rate, no accumulation across the
    nodes on a path — only the leaf each tree lands on matters, and the
    final value is the mean of those leaf values across all trees. The
    empty dict keeps this function's return shape identical to score()'s
    so callers don't need a special case beyond "which function to call."
    Random Forest gets no driver breakdown in this phase, by design.
    """
    total = 0.0
    trees = model["trees"]

    for tree in trees:
        node = 0
        while tree["left"][node] != -1:
            feature_idx = tree["feature"][node]
            threshold = tree["threshold"][node]
            go_left = vector[feature_idx] <= threshold
            node = tree["left"][node] if go_left else tree["right"][node]
        total += tree["value"][node]

    return total / len(trees), {}


def feature_index_map(model: dict[str, Any]) -> list[tuple[str, str | None]]:
    """Expanded-column index -> (source_field, category_or_None)."""
    mapping: list[tuple[str, str | None]] = []
    for field in model["numeric_features"]:
        mapping.append((field, None))
    for field in model["categorical_features"]:
        for category in model["categories"][field]:
            mapping.append((field, category))
    return mapping


FEATURE_LABELS = {
    "age": "Age",
    "employment_years": "Years employed",
    "monthly_income": "Monthly income",
    "loan_amount": "Loan amount",
    "duration_months": "Loan duration",
    "existing_credits": "Existing credit lines",
    "job_type": "Job type",
    "housing": "Housing situation",
    "purpose": "Loan purpose",
    "credit_history": "Credit history",
    "checking_status": "Checking account status",
    "savings_status": "Savings account status",
}


def band_for(probability: float) -> str:
    if probability < 0.15:
        return "low"
    if probability < 0.35:
        return "medium"
    return "high"


def decision_for(probability: float, cutoff: float) -> str:
    if probability < cutoff * 0.6:
        return "approve"
    if probability < cutoff:
        return "approve_with_conditions"
    if probability < cutoff * 1.6:
        return "refer_for_review"
    return "decline"


def score_to_display(probability: float) -> int:
    # Maps [0, 1] probability of default onto a familiar 300-850 band,
    # inverted so a lower default probability yields a higher score.
    return round(850 - probability * (850 - 300))


def predict(payload: dict[str, Any]) -> dict[str, Any]:
    model = load_model()
    cleaned = validate_and_extract(payload, model)
    vector = build_vector(cleaned, model)
    raw_margin, contributions_by_idx = score(vector, model)

    probability = 1.0 / (1.0 + math.exp(-(model["platt_a"] * raw_margin + model["platt_b"])))

    index_map = feature_index_map(model)
    grouped: dict[str, float] = {}
    for idx, delta in contributions_by_idx.items():
        field, _category = index_map[idx]
        grouped[field] = grouped.get(field, 0.0) + delta

    # Scale contributions into probability space around the base rate, so the
    # waterfall sums to (probability - base_rate) rather than raw log-odds,
    # which is far more intuitive to read on a chart.
    total_margin_contribution = sum(grouped.values())
    base_probability = 1.0 / (1.0 + math.exp(-(model["platt_a"] * model["base_value"] + model["platt_b"])))

    contributions = []
    if abs(total_margin_contribution) > 1e-12:
        scale = (probability - base_probability) / total_margin_contribution
    else:
        scale = 0.0

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

            result = predict(payload)
            self._send_json(200, result)
        except ValidationError as exc:
            self._send_json(400, {"error": exc.field, "message": exc.message})
        except Exception as exc:  # noqa: BLE001 — last-resort guard, never a 500 for bad input
            self._send_json(400, {"error": "unknown", "message": str(exc)})

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A002
        pass  # keep Vercel's function logs quiet for a request this small
