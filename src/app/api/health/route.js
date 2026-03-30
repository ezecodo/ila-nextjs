import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const start = Date.now();
  const checks = {};

  // Base de datos
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok" };
  } catch (error) {
    checks.database = { status: "error", message: error.message };
  }

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - start,
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
