"""
GET /api/portfolio

Serves the precomputed, out-of-fold portfolio aggregates from
model/portfolio.json. All the numbers here were computed once at training
time (see ml/train.py) using cross_val_predict, so every score behind these
aggregates is genuinely out-of-sample. This endpoint does no computation of
its own — it reads a small JSON file and returns it, which is why it needs
no dependencies either.
"""

from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from typing import Any

PORTFOLIO_PATH = Path(__file__).resolve().parent.parent / "model" / "portfolio.json"
_PORTFOLIO_CACHE: dict[str, Any] | None = None


def load_portfolio() -> dict[str, Any]:
    global _PORTFOLIO_CACHE
    if _PORTFOLIO_CACHE is None:
        _PORTFOLIO_CACHE = json.loads(PORTFOLIO_PATH.read_text())
    return _PORTFOLIO_CACHE


class handler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, body: dict[str, Any]) -> None:
        payload = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "public, max-age=3600")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.end_headers()

    def do_GET(self) -> None:
        try:
            data = load_portfolio()
            self._send_json(200, data)
        except FileNotFoundError:
            self._send_json(500, {"error": "missing_artifact", "message": "Portfolio data not found."})

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A002
        pass
