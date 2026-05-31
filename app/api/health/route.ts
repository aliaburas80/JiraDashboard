import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "delivery-clarity-api",
    version: "2.0.0",
    endpoints: [
      "POST /api/upload",
      "GET /api/imports",
      "GET /api/metrics",
      "GET /api/dashboard",
      "GET /api/health",
      "GET /api/backend-view",
      "GET /api/developer-view",
    ],
  });
}
