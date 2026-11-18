"""Predict the source dataset's P1–P4 priority label (not default)."""
from __future__ import annotations

import json
import gzip
import math
import struct
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from typing import Any

MODEL_DIR = Path(__file__).resolve().parent.parent / "model" / "cibil"
LABELS = ["P1", "P2", "P3", "P4"]
NUMERIC_INPUTS = {
    "age": (18, 100, "AGE"),
    "monthly_income": (0, 10_000_000, "NETMONTHLYINCOME"),
    "employer_months": (0, 720, "Time_With_Curr_Empr"),
    "credit_score": (300, 900, "Credit_Score"),
    "total_trades": (0, 500, "Total_TL"),
    "active_trades": (0, 500, "Tot_Active_TL"),
    "missed_payments": (0, 500, "Tot_Missed_Pmnt"),
    "delinquency_events": (0, 500, "num_times_delinquent"),
    "recent_dpd_30_plus": (0, 500, "num_times_30p_dpd"),
    "recent_delinquency_12m": (0, 500, "num_deliq_12mts"),
    "recent_payment_days": (0, 5000, "time_since_recent_payment"),
    "personal_loan_accounts": (0, 500, "PL_TL"),
    "credit_card_utilization": (0, 1, "CC_utilization"),
    "recent_enquiries_12m": (0, 500, "enq_L12m"),
    "secured_accounts": (0, 500, "Secured_TL"),
    "unsecured_accounts": (0, 500, "Unsecured_TL"),
}
CATEGORICAL_INPUTS = {
    "education": ("EDUCATION", {"SSC", "12TH", "UNDER GRADUATE", "GRADUATE", "POST-GRADUATE", "PROFESSIONAL", "OTHERS"}),
    "recent_product": ("last_prod_enq2", {"others", "ConsumerLoan", "PL", "CC", "AL", "HL"}),
    "first_product": ("first_prod_enq2", {"others", "ConsumerLoan", "PL", "CC", "AL", "HL"}),
}
_MODELS: dict[str, Any] | None = None
_METADATA: dict[str, Any] | None = None


class InputError(Exception):
    def __init__(self, field: str, message: str):
        self.field, self.message = field, message
        super().__init__(message)


def load_models() -> dict[str, Any]:
    global _MODELS
    if _MODELS is None:
        with gzip.open(MODEL_DIR / "models.json.gz", "rt", encoding="utf-8") as f:
            _MODELS = json.load(f)["models"]
    return _MODELS


def load_metadata() -> dict[str, Any]:
    global _METADATA
    if _METADATA is None:
        _METADATA = json.loads((MODEL_DIR / "metadata.json").read_text())
    return _METADATA


def clean_payload(payload: Any) -> tuple[dict[str, Any], dict[str, str]]:
    if not isinstance(payload, dict):
        raise InputError("body", "Send applicant details as a JSON object.")
    model_values: dict[str, Any] = {}
    audit_values: dict[str, str] = {}
    for key, (low, high, field) in NUMERIC_INPUTS.items():
        value = payload.get(key)
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
            raise InputError(key, f"{key} must be a finite number.")
        if value < low or value > high:
            raise InputError(key, f"{key} must be between {low} and {high}.")
        model_values[field] = float(value)
    for key, (field, allowed) in CATEGORICAL_INPUTS.items():
        value = payload.get(key)
        if not isinstance(value, str) or value not in allowed:
            raise InputError(key, f"{key} must be one of {sorted(allowed)}.")
        model_values[field] = value
    for key, allowed in (("gender", {"M", "F"}), ("marital_status", {"Married", "Single"})):
        value = payload.get(key)
        if not isinstance(value, str) or value not in allowed:
            raise InputError(key, f"{key} must be one of {sorted(allowed)}.")
        audit_values[key] = value

    total = model_values["Total_TL"]
    denominator = max(total, 1.0)
    model_values["active_account_ratio"] = min(max(model_values["Tot_Active_TL"] / denominator, 0.0), 1.0)
    model_values["missed_payment_rate"] = min(max(model_values["Tot_Missed_Pmnt"] / denominator, 0.0), 1.0)
    model_values["unsecured_account_ratio"] = min(max(model_values["Unsecured_TL"] / denominator, 0.0), 1.0)
    return model_values, audit_values


def build_vector(values: dict[str, Any], model: dict[str, Any]) -> list[float]:
    vector = [float(values[feature]) for feature in model["numeric_features"]]
    vector.extend(0.0 for _ in model["missing_indicator_features"])
    for feature in model["categorical_features"]:
        value = str(values[feature])
        vector.extend(1.0 if value == category else 0.0 for category in model["categories"][feature])
    if len(vector) != model["feature_count"]:
        raise RuntimeError("The request feature vector does not match the trained model schema.")
    return vector


def walk(vector: list[float], tree: dict[str, Any], strict: bool = False, sparse_zeros_missing: bool = False) -> int:
    node = 0
    while tree["left"][node] != -1:
        feature = tree["feature"][node]
        threshold = tree["threshold"][node]
        value = vector[feature]
        if sparse_zeros_missing and value == 0:
            left = bool(tree["default_left"][node])
        else:
            left = value < threshold if strict else value <= threshold
        node = tree["left"][node] if left else tree["right"][node]
    return node


def softmax(raw: list[float]) -> list[float]:
    maximum = max(raw)
    exp = [math.exp(value - maximum) for value in raw]
    total = sum(exp)
    return [value / total for value in exp]


def score_one(vector: list[float], model: dict[str, Any]) -> dict[str, Any]:
    if model["kind"] == "gradient_boosting":
        raw = list(model["base"])
        for stage in model["stages"]:
            for klass, tree in enumerate(stage):
                raw[klass] += model["learning_rate"] * tree["value"][walk(vector, tree)]
        probabilities = softmax(raw)
    elif model["kind"] == "random_forest":
        total = [0.0] * len(LABELS)
        for tree in model["trees"]:
            leaf = tree["value"][walk(vector, tree)]
            mass = sum(leaf)
            for i, value in enumerate(leaf):
                total[i] += value / mass if mass else 0.25
        probabilities = [value / len(model["trees"]) for value in total]
    else:
        vector = [struct.unpack("f", struct.pack("f", value))[0] for value in vector]
        raw = list(model["base"])
        for tree in model["trees"]:
            node = walk(vector, tree, strict=True)
            if tree["left"][node] == -1:
                raw[tree["class"]] += tree["value"][node]
        probabilities = softmax(raw)

    by_class = {label: float(probabilities[i]) for i, label in enumerate(LABELS)}
    predicted = max(by_class, key=by_class.get)
    return {"priority_class": predicted, "confidence": by_class[predicted], "class_probabilities": by_class}


def predict(payload: Any) -> dict[str, Any]:
    values, demographics = clean_payload(payload)
    models = load_models()
    metadata = load_metadata()
    results = {name: score_one(build_vector(values, model), model) for name, model in models.items()}
    primary = results["gradient_boosting"]["priority_class"]
    return {
        **results,
        "fairness": {
            "gender": demographics["gender"],
            "marital_status": demographics["marital_status"],
            "current_priority": primary,
            "other_gender_priority": primary,
            "other_marital_priority": primary,
            "sensitive_features_used_for_scoring": False,
            "test_group_audit": metadata["test_group_audit"],
        },
        "label": "Approved_Flag",
        "meaning": "historical_bank_priority_tier",
    }


class handler(BaseHTTPRequestHandler):
    def _send(self, status: int, body: dict[str, Any]) -> None:
        data = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self) -> None:
        try:
            length = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length else {}
            self._send(200, predict(payload))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._send(400, {"error": "body", "message": "Request body must be valid JSON."})
        except InputError as exc:
            self._send(400, {"error": exc.field, "message": exc.message})
        except FileNotFoundError:
            self._send(503, {"error": "model", "message": "Indian model files are missing. Run py ml/train_cibil.py --download, then py ml/train_cibil.py."})
        except Exception as exc:  # noqa: BLE001
            self._send(500, {"error": "model", "message": f"Indian model scoring failed: {exc}"})

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A002
        pass
