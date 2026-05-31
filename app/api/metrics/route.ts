import { NextResponse } from "next/server";
import { readImportLogs } from "@/services/imports/importLogs.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const logs = await readImportLogs();
  const successLog = logs.find((log) => log.status === "success");

  if (!successLog) {
    return NextResponse.json(
      { error: "No successful import found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    available: true,
    lastImport: successLog.importedAt,
  });
}
