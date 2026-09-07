import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { CashInRow } from "@/lib/types";

export async function GET() {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM cashin ORDER BY year DESC, id DESC"
    );

    const cashin: CashInRow[] = (rows as any[]).map((r) => ({
      month: r.month,
      year: Number(r.year),
      project: r.project,
      income: Number(r.income || 0),
      trf_date: r.trf_date || null,
    }));

    return NextResponse.json({ success: true, data: cashin });
  } catch (error: any) {
    console.error("Failed to fetch cashin:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
