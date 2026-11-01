"""
Local development server for the three API endpoints.

Vercel runs api/predict.py, api/portfolio.py and api/predict-compare.py as
separate serverless functions in production, each at its own path
(/api/predict, /api/portfolio, /api/predict-compare). Locally, this script
runs the three *actual* production handler classes unmodified, each behind
its own tiny stdlib HTTP server, and next.config.ts rewrites those three
paths to them in development. Nothing here ships to production — it exists
purely so `npm run dev` gives a fully working app without the Vercel CLI.

Run with:  py ml/dev_server.py
"""

from __future__ import annotations

import importlib.util
import sys
import threading
from http.server import HTTPServer
from pathlib import Path

API_DIR = Path(__file__).resolve().parent.parent / "api"
sys.path.insert(0, str(API_DIR))

import portfolio  # noqa: E402
import predict  # noqa: E402

# predict-compare.py has a hyphen in its filename (to match Vercel's
# file-path-is-the-route convention for /api/predict-compare), which isn't
# a valid Python module name — `import predict-compare` would be a syntax
# error — so it's loaded by file path instead of by name.
_spec = importlib.util.spec_from_file_location("predict_compare", API_DIR / "predict-compare.py")
predict_compare = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
_spec.loader.exec_module(predict_compare)

PREDICT_PORT = 8001
PORTFOLIO_PORT = 8002
PREDICT_COMPARE_PORT = 8003


def serve(handler_cls, port: int, name: str) -> None:
    server = HTTPServer(("127.0.0.1", port), handler_cls)
    print(f"  {name:<10} listening on http://127.0.0.1:{port}")
    server.serve_forever()


if __name__ == "__main__":
    print("Loan Default Risk Predictor — local API server")
    print("=" * 50)

    t1 = threading.Thread(target=serve, args=(predict.handler, PREDICT_PORT, "predict"), daemon=True)
    t2 = threading.Thread(target=serve, args=(portfolio.handler, PORTFOLIO_PORT, "portfolio"), daemon=True)
    t3 = threading.Thread(
        target=serve,
        args=(predict_compare.handler, PREDICT_COMPARE_PORT, "predict-compare"),
        daemon=True,
    )
    t1.start()
    t2.start()
    t3.start()

    print("\nnext.config.ts rewrites:")
    print(f"  /api/predict          -> http://127.0.0.1:{PREDICT_PORT}")
    print(f"  /api/portfolio        -> http://127.0.0.1:{PORTFOLIO_PORT}")
    print(f"  /api/predict-compare  -> http://127.0.0.1:{PREDICT_COMPARE_PORT}")
    print("\nPress Ctrl+C to stop.\n")

    try:
        t1.join()
        t2.join()
        t3.join()
    except KeyboardInterrupt:
        print("\nStopped.")
