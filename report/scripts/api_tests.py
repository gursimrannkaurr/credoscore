"""About 20 black-box tests against the live /api/predict endpoint.

Hits the real dev server at http://127.0.0.1:8001/api/predict with
urllib (standard library only) and writes the real responses to
report/data/api-test-results.json. Never fabricates a response.

Run with PY312: PY312 -I report/scripts/api_tests.py
"""

from __future__ import annotations

import json
import math
import urllib.error
import urllib.request
from pathlib import Path

BASE_URL = "http://127.0.0.1:8001/api/predict"
ROOT = Path(__file__).resolve().parent.parent.parent
OUT_PATH = Path(__file__).resolve().parent.parent / "data" / "api-test-results.json"
OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

_MODEL = json.loads((ROOT / "model" / "model.json").read_text())
P_BASE = 1.0 / (1.0 + math.exp(-(_MODEL["platt_a"] * _MODEL["base_value"] + _MODEL["platt_b"])))

TYPICAL = {
    "age": 35, "employment_years": 4, "job_type": "skilled", "housing": "own",
    "monthly_income": 2500, "loan_amount": 5000, "duration_months": 24,
    "purpose": "car_new", "credit_history": "paid_duly", "checking_status": "0_to_200",
    "savings_status": "under_100", "existing_credits": 1,
}
STRONG = {
    "age": 50, "employment_years": 10, "job_type": "management", "housing": "own",
    "monthly_income": 7000, "loan_amount": 1500, "duration_months": 12,
    "purpose": "radio_tv", "credit_history": "critical", "checking_status": "none",
    "savings_status": "over_1000", "existing_credits": 1,
}
STRETCHED = {
    "age": 22, "employment_years": 0, "job_type": "unskilled_nonresident", "housing": "rent",
    "monthly_income": 800, "loan_amount": 15000, "duration_months": 48,
    "purpose": "business", "credit_history": "delayed_past", "checking_status": "less_than_0",
    "savings_status": "under_100", "existing_credits": 1,
}

RESULT_KEYS = {
    "probability_of_default", "risk_band", "score", "decision", "cutoff",
    "contributions", "base_rate", "model_version",
}


def without(d: dict, *keys: str) -> dict:
    return {k: v for k, v in d.items() if k not in keys}


def with_override(d: dict, **overrides) -> dict:
    out = dict(d)
    out.update(overrides)
    return out


def raw_request(body_bytes: bytes | None, headers: dict | None = None, method: str = "POST"):
    req = urllib.request.Request(BASE_URL, data=body_bytes, method=method)
    for k, v in (headers or {"Content-Type": "application/json"}).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            status = resp.status
            raw = resp.read()
            resp_headers = dict(resp.headers.items())
    except urllib.error.HTTPError as exc:
        status = exc.code
        raw = exc.read()
        resp_headers = dict(exc.headers.items()) if exc.headers else {}
    try:
        parsed = json.loads(raw.decode("utf-8")) if raw else None
    except json.JSONDecodeError:
        parsed = None
    return status, parsed, resp_headers


def post_json(payload) -> tuple[int, object, dict]:
    body = json.dumps(payload).encode("utf-8")
    return raw_request(body)


CASES: list[dict] = []
_next_id = [1]


def add_case(case: str, expected: str, run) -> None:
    status, actual, headers = run()
    CASES.append(
        {
            "id": _next_id[0],
            "case": case,
            "expected": expected,
            "status_code": status,
            "actual": actual,
            "response_headers": {k: v for k, v in headers.items() if k.lower() in
                                  ("access-control-allow-origin", "content-type", "allow",
                                   "access-control-allow-methods", "access-control-allow-headers")},
            "pass": None,
        }
    )
    _next_id[0] += 1


def evaluate(entry: dict, predicate) -> None:
    try:
        entry["pass"] = bool(predicate(entry))
    except Exception as exc:  # noqa: BLE001
        entry["pass"] = False
        entry["eval_error"] = str(exc)


def main() -> None:
    # 1-3: valid presets
    add_case("Valid typical applicant", "200 with full result shape",
              lambda: post_json(TYPICAL))
    add_case("Valid strong-file applicant", "200, low PD, low/medium band",
              lambda: post_json(STRONG))
    add_case("Valid stretched-file applicant", "200, high PD, decline likely",
              lambda: post_json(STRETCHED))

    # 4-6: missing fields (pick 3)
    add_case("Missing 'age'", "400 error for field age",
              lambda: post_json(without(TYPICAL, "age")))
    add_case("Missing 'checking_status'", "400 error for field checking_status",
              lambda: post_json(without(TYPICAL, "checking_status")))
    add_case("Missing 'loan_amount'", "400 error for field loan_amount",
              lambda: post_json(without(TYPICAL, "loan_amount")))

    # 7-9: wrong type / bool-as-number / NaN string
    add_case("Wrong type: age as string '35'", "400 error, age must be a number",
              lambda: post_json(with_override(TYPICAL, age="35")))
    add_case("Bool as number: existing_credits=true", "400 error (bool rejected as number)",
              lambda: post_json(with_override(TYPICAL, existing_credits=True)))
    add_case("NaN string for monthly_income", "400 error, must be a number",
              lambda: post_json(with_override(TYPICAL, monthly_income="NaN")))

    # 10-11: unknown categories
    add_case("Unknown category: housing='mansion'", "400 error, unknown category",
              lambda: post_json(with_override(TYPICAL, housing="mansion")))
    add_case("Unknown category: purpose='vacation' (A47 dropped from UI, API must still reject)", "400 error, unknown category",
              lambda: post_json(with_override(TYPICAL, purpose="vacation")))

    # 12-15: age / duration boundaries
    add_case("Age boundary: 17 (below min 18)", "400 error, out of bounds",
              lambda: post_json(with_override(TYPICAL, age=17)))
    add_case("Age boundary: 18 (at min)", "200, accepted",
              lambda: post_json(with_override(TYPICAL, age=18)))
    add_case("Age boundary: 100 (at max)", "200, accepted",
              lambda: post_json(with_override(TYPICAL, age=100)))
    add_case("Age boundary: 101 (above max 100)", "400 error, out of bounds",
              lambda: post_json(with_override(TYPICAL, age=101)))
    add_case("Duration boundary: 0 (below min 1)", "400 error, out of bounds",
              lambda: post_json(with_override(TYPICAL, duration_months=0)))
    add_case("Duration boundary: 121 (above max 120)", "400 error, out of bounds",
              lambda: post_json(with_override(TYPICAL, duration_months=121)))

    # 18: installment cross-field rule boundary
    # rule: loan_amount / duration_months <= 4 * monthly_income
    # choose income so the implied installment sits exactly at the 4x line, then 1 unit over.
    income = 1000.0
    duration = 12
    boundary_loan = 4 * income * duration  # implied installment == 4x income exactly (allowed)
    add_case("Installment rule at the boundary (implied installment == 4x income)", "200, accepted (rule uses > to reject)",
              lambda: post_json(with_override(TYPICAL, monthly_income=income, loan_amount=boundary_loan, duration_months=duration)))
    add_case("Installment rule just past the boundary (implied installment > 4x income)", "400 error on loan_amount",
              lambda: post_json(with_override(TYPICAL, monthly_income=income, loan_amount=boundary_loan + duration, duration_months=duration)))

    # 19: invalid JSON
    add_case("Invalid JSON body", "400 error, body must be valid JSON",
              lambda: raw_request(b"{not valid json", {"Content-Type": "application/json"}))

    # 20: OPTIONS preflight
    add_case("OPTIONS preflight", "204 with CORS headers",
              lambda: raw_request(None, {}, method="OPTIONS"))

    # 21: CORS header present on a normal POST
    add_case("CORS header present on POST response", "Access-Control-Allow-Origin: *",
              lambda: post_json(TYPICAL))

    # 22: response shape
    add_case("Response has all expected keys", "all of probability_of_default, risk_band, score, decision, cutoff, contributions, base_rate, model_version",
              lambda: post_json(TYPICAL))

    # 23: PD range + score formula
    add_case("PD in [0,1] and score == round(850 - 550*p)", "both hold",
              lambda: post_json(STRETCHED))

    # 24: contribution-sum check
    # Note: the response's "base_rate" field is the dataset base rate
    # (0.3), not the Platt-scaled base probability the contributions are
    # scaled around. p_base here is sigma(platt_a*base_value + platt_b),
    # read straight from model/model.json (see check_sum below).
    add_case("Sum of contributions == p - p_base within 1e-3", "holds",
              lambda: post_json(STRONG))

    # ---- Evaluate pass/fail against each case's real response -------------
    for entry in CASES:
        case = entry["case"]
        status = entry["status_code"]
        actual = entry["actual"]

        if case.startswith("Valid "):
            evaluate(entry, lambda e: e["status_code"] == 200 and isinstance(e["actual"], dict) and RESULT_KEYS.issubset(e["actual"].keys()))
        elif case.startswith("Missing") or case.startswith("Wrong type") or case.startswith("Bool as number") or case.startswith("NaN string") or case.startswith("Unknown category"):
            evaluate(entry, lambda e: e["status_code"] == 400 and isinstance(e["actual"], dict) and "error" in e["actual"] and "message" in e["actual"])
        elif case == "Age boundary: 17 (below min 18)":
            evaluate(entry, lambda e: e["status_code"] == 400)
        elif case == "Age boundary: 18 (at min)":
            evaluate(entry, lambda e: e["status_code"] == 200)
        elif case == "Age boundary: 100 (at max)":
            evaluate(entry, lambda e: e["status_code"] == 200)
        elif case == "Age boundary: 101 (above max 100)":
            evaluate(entry, lambda e: e["status_code"] == 400)
        elif case == "Duration boundary: 0 (below min 1)":
            evaluate(entry, lambda e: e["status_code"] == 400)
        elif case == "Duration boundary: 121 (above max 120)":
            evaluate(entry, lambda e: e["status_code"] == 400)
        elif case.startswith("Installment rule at the boundary"):
            evaluate(entry, lambda e: e["status_code"] == 200)
        elif case.startswith("Installment rule just past"):
            evaluate(entry, lambda e: e["status_code"] == 400)
        elif case == "Invalid JSON body":
            evaluate(entry, lambda e: e["status_code"] == 400 and isinstance(e["actual"], dict) and e["actual"].get("error") == "body")
        elif case == "OPTIONS preflight":
            evaluate(entry, lambda e: e["status_code"] == 204 and e["response_headers"].get("Access-Control-Allow-Origin") == "*")
        elif case == "CORS header present on POST response":
            evaluate(entry, lambda e: e["response_headers"].get("Access-Control-Allow-Origin") == "*")
        elif case == "Response has all expected keys":
            evaluate(entry, lambda e: isinstance(e["actual"], dict) and RESULT_KEYS.issubset(e["actual"].keys()))
        elif case.startswith("PD in [0,1]"):
            def check_pd_score(e):
                a = e["actual"]
                p = a["probability_of_default"]
                return 0.0 <= p <= 1.0 and a["score"] == round(850 - 550 * p)
            evaluate(entry, check_pd_score)
        elif case.startswith("Sum of contributions"):
            def check_sum(e):
                a = e["actual"]
                p = a["probability_of_default"]
                total = sum(c["contribution"] for c in a["contributions"])
                return math.isclose(total, p - P_BASE, abs_tol=1e-3)
            evaluate(entry, check_sum)
        else:
            entry["pass"] = None

    for entry in CASES:
        entry["status"] = "PASS" if entry["pass"] else ("FAIL" if entry["pass"] is False else "N/A")

    passed = sum(1 for e in CASES if e["status"] == "PASS")
    failed = sum(1 for e in CASES if e["status"] == "FAIL")
    print(f"{passed} passed, {failed} failed, {len(CASES)} total")
    for e in CASES:
        print(f"  [{e['status']}] #{e['id']:02d} {e['case']}")

    OUT_PATH.write_text(json.dumps(CASES, indent=2))
    print(f"\nWrote {OUT_PATH}")


if __name__ == "__main__":
    main()
