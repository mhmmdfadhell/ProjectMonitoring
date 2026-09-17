import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { deleteJsonProject, updateJsonProject } from "@/lib/jsonDb";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const patch = await request.json();

    const allowedFields = [
      "month",
      "year",
      "client",
      "client_norm",
      "project",
      "pic",
      "value",
      "bast",
      "no_invoice",
      "no_kontrak",
      "invoice_submit",
      "paid_date",
      "status",
      "status_updated_at",
    ];

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    for (const field of allowedFields) {
      if (patch[field] !== undefined) {
        fieldsToUpdate.push(`\`${field}\` = ?`);
        values.push(patch[field]);
      }
    }

    if (fieldsToUpdate.length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields provided to update" },
        { status: 400 }
      );
    }

    // Always update JSON file database first
    updateJsonProject(id, patch);

    // Attempt MySQL update if available
    try {
      values.push(id);
      const sql = `UPDATE projects SET ${fieldsToUpdate.join(", ")} WHERE id = ?`;
      await pool.execute(sql, values);
    } catch (dbErr: any) {
      console.warn("MySQL update skipped (saved to JSON file instead):", dbErr.message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to update project:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Always delete from JSON file
    deleteJsonProject(id);

    // Attempt MySQL delete if available
    try {
      await pool.execute("DELETE FROM projects WHERE id = ?", [id]);
    } catch (dbErr: any) {
      console.warn("MySQL delete skipped (deleted from JSON file instead):", dbErr.message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete project:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

