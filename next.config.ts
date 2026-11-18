import type { NextConfig } from "next";

// In production on Vercel, API routes are served directly by Python functions
// in api/. Locally, `next dev` has nothing listening on /api by itself, so these
// rewrites forward requests to ml/dev_server.py, which runs the same
// handler classes that ship to production. See docs/07-deployment.md.
const nextConfig: NextConfig = {
  // Silences Next.js's workspace-root auto-detection, which otherwise walks
  // up to a stray package-lock.json in the user's home directory.
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    if (process.env.NODE_ENV === "production") {
      return [];
    }
    return [
      { source: "/api/predict", destination: "http://127.0.0.1:8001/api/predict" },
      { source: "/api/portfolio", destination: "http://127.0.0.1:8002/api/portfolio" },
      { source: "/api/predict-compare", destination: "http://127.0.0.1:8003/api/predict-compare" },
      { source: "/api/predict-cibil", destination: "http://127.0.0.1:8004/api/predict-cibil" },
    ];
  },
};

export default nextConfig;
