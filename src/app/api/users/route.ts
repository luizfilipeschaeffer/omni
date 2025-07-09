import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  if (!q) return NextResponse.json([]);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    const res = await client.query(
      `SELECT id, name, email FROM users WHERE name ILIKE $1 OR email ILIKE $1 ORDER BY name LIMIT 10`,
      ["%" + q + "%"]
    );
    return NextResponse.json(res.rows);
  } finally {
    await client.end();
  }
} 