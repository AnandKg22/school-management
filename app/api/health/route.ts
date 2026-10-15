import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const res = await query("SELECT NOW() as now, COUNT(*) as student_count FROM app_school_management_students");
    return NextResponse.json({
      status: "ok",
      application: "school-management",
      timestamp: res.rows[0]?.now || new Date().toISOString(),
      database: "connected",
      records: {
        students: parseInt(res.rows[0]?.student_count || "0", 10),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "degraded",
        error: err.message,
      },
      { status: 500 }
    );
  }
}
