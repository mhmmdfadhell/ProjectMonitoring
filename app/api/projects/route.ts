import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { ProjectRow } from "@/lib/types";

export async function GET() {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM projects ORDER BY year DESC, id DESC"
    );

    // Map rows to correct types (convert numeric strings from MySQL to numbers)
    const projects: ProjectRow[] = (rows as any[]).map((r) => ({
      id: String(r.id),
      month: r.month,
      year: Number(r.year),
      client: r.client,
      client_norm: r.client_norm,
      project: r.project,
      pic: r.pic,
      value: Number(r.value || 0),
      bast: r.bast || "",
      no_invoice: r.no_invoice || null,
      no_kontrak: r.no_kontrak || null,
      invoice_submit: r.invoice_submit || null,
      paid_date: r.paid_date || null,
      status: r.status,
      status_updated_at: r.status_updated_at || null,
    }));

    return NextResponse.json({ success: true, data: projects });
  } catch (error: any) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id =
      body.id ||
      "p-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

    const projectData: ProjectRow = {
      id,
      month: body.month || "Januari",
      year: Number(body.year) || new Date().getFullYear(),
      client: body.client || "",
      client_norm: body.client_norm || body.client || "",
      project: body.project || "",
      pic: body.pic || "",
      value: Number(body.value) || 0,
      bast: body.bast || "",
      no_invoice: body.no_invoice || null,
      no_kontrak: body.no_kontrak || null,
      invoice_submit: body.invoice_submit || null,
      paid_date: body.paid_date || null,
      status: body.status || "In Progress",
      status_updated_at: body.status_updated_at || null,
    };

    await pool.execute(
      `INSERT INTO projects (id, month, year, client, client_norm, project, pic, value, bast, no_invoice, no_kontrak, invoice_submit, paid_date, status, status_updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectData.id,
        projectData.month,
        projectData.year,
        projectData.client,
        projectData.client_norm,
        projectData.project,
        projectData.pic,
        projectData.value,
        projectData.bast,
        projectData.no_invoice,
        projectData.no_kontrak,
        projectData.invoice_submit,
        projectData.paid_date,
        projectData.status,
        projectData.status_updated_at,
      ]
    );

    return NextResponse.json({ success: true, data: projectData }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create project:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
