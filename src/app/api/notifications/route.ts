import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fromUserId = searchParams.get("fromUserId");
  const toUserId = searchParams.get("toUserId");
  if (fromUserId && toUserId) {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();
    try {
      const res = await client.query(
        `SELECT 1 FROM notifications WHERE user_id = $1 AND type = 'chat_request' AND data->>'fromUserId' = $2 AND read = false`,
        [toUserId, fromUserId]
      );
      return NextResponse.json({ pending: (res.rowCount ?? 0) > 0 });
    } finally {
      await client.end();
    }
  }
  return NextResponse.json({});
}

export async function POST(req: NextRequest) {
  const { user_id, type, data } = await req.json();
  if (!user_id || !type) return NextResponse.json({ error: "user_id e type obrigatórios" }, { status: 400 });

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(
      `INSERT INTO notifications (user_id, type, data) VALUES ($1, $2, $3)`,
      [user_id, type, data || {}]
    );
    return NextResponse.json({ ok: true });
  } finally {
    await client.end();
  }
} 