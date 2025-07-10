import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
import { Client } from "pg";

export async function POST(req: NextRequest) {
  const { nome, sobrenome, email, senha } = await req.json();
  if (!nome || !sobrenome || !email || !senha) {
    return NextResponse.json({ error: "Campos obrigatórios" }, { status: 400 });
  }
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const exists = await client.query("SELECT 1 FROM users WHERE email = $1", [email]);
  if ((exists.rowCount ?? 0) > 0) {
    await client.end();
    return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });
  }
  const password_hash = await hash(senha, 10);
  const name = `${nome} ${sobrenome}`;
  await client.query(
    "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3)",
    [email, password_hash, name]
  );
  await client.end();
  return NextResponse.json({ success: true });
} 