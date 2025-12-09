import { NextResponse } from "next/server";
import pool from "@/lib/db";

// POST /api/screenings  บันทึกผลคัดกรอง
export async function POST(req) {
  try {
    const body = await req.json();

    const {
      citizen_id,
      fullname,
      facility_code,
      stress_score,
      q1,
      q2,
      q3,
      q8_total,
      risk_level,
      recommendation
    } = body;

    const [result] = await pool.execute(
      `INSERT INTO screenings
       (citizen_id, fullname, facility_code,
        stress_score, q1, q2, q3, q8_total,
        risk_level, recommendation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        citizen_id || null,
        fullname || null,
        facility_code || null,
        stress_score ?? null,
        q1 ?? null,
        q2 ?? null,
        q3 ?? null,
        q8_total ?? null,
        risk_level,
        recommendation || null
      ]
    );

    return NextResponse.json({
      id: result.insertId,
      ...body
    });
  } catch (err) {
    console.error("POST /screenings error:", err);
    return NextResponse.json(
      { error: err.message || "db error" },
      { status: 500 }
    );
  }
}

// GET /api/screenings?limit=200  ดึงข้อมูลย้อนหลัง
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") || "100");

    const [rows] = await pool.execute(
      `SELECT *
       FROM screenings
       ORDER BY created_at DESC
       LIMIT ?`,
      [limit]
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /screenings error:", err);
    return NextResponse.json(
      { error: err.message || "db error" },
      { status: 500 }
    );
  }
}
