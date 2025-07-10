import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  if (!userId) return NextResponse.json([]);
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    const res = await client.query(
      `SELECT id, type, data, read, created_at FROM notifications 
       WHERE data->>'fromUserId' = $1 AND type = 'chat_request' AND read = false
       ORDER BY created_at DESC LIMIT 30`,
      [userId]
    );
    return NextResponse.json(res.rows);
  } finally {
    await client.end();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const id = req.nextUrl.searchParams.get("id");
  if (!userId || !id) return NextResponse.json({ error: "userId e id obrigatórios" }, { status: 400 });
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(
      `DELETE FROM notifications WHERE id = $1 AND data->>'fromUserId' = $2`,
      [id, userId]
    );
    return NextResponse.json({ ok: true });
  } finally {
    await client.end();
  }
} 