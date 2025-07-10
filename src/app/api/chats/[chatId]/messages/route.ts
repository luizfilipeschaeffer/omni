import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL?.includes('render') ? { rejectUnauthorized: false } : false });

// GET: Lista todas as mensagens do chat
export async function GET(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  const messages = await pool.query(
    `SELECT m.id, m.chat_id, m.user_id, u.name as user_name, m.content, m.created_at, m.updated_at, m.edited, m.viewed_at, m.viewed_by
     FROM messages m
     LEFT JOIN users u ON m.user_id = u.id
     WHERE m.chat_id = $1
     ORDER BY m.created_at ASC`,
    [chatId]
  );
  return NextResponse.json(messages.rows);
}

// POST: Cria uma nova mensagem no chat
export async function POST(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  const body = await req.json();
  const { content, user_id } = body;
  
  // Validações
  if (!content || !user_id) {
    return NextResponse.json({ error: "Conteúdo e user_id são obrigatórios." }, { status: 400 });
  }
  
  if (typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: "Conteúdo deve ser uma string não vazia." }, { status: 400 });
  }
  
  if (typeof user_id !== 'number' && typeof user_id !== 'string') {
    return NextResponse.json({ error: "user_id deve ser um número ou string válido." }, { status: 400 });
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO messages (chat_id, user_id, content, created_at, edited, viewed_at, viewed_by) 
       VALUES ($1, $2, $3, NOW(), FALSE, NULL, NULL) 
       RETURNING id, chat_id, user_id, content, created_at, updated_at, edited, viewed_at, viewed_by`,
      [chatId, user_id, content.trim()]
    );
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Erro ao criar mensagem." }, { status: 500 });
    }
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Erro ao criar mensagem:', error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

// PUT: Edita o conteúdo de uma mensagem pelo id
export async function PUT(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  const body = await req.json();
  const { id, content } = body;
  if (!id || !content) {
    return NextResponse.json({ error: "ID e novo conteúdo são obrigatórios." }, { status: 400 });
  }
  const result = await pool.query(
    `UPDATE messages SET content = $1, edited = TRUE, updated_at = NOW() WHERE id = $2 AND chat_id = $3 RETURNING id, user_id, content, created_at, updated_at, edited, viewed_at, viewed_by`,
    [content, id, chatId]
  );
  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Mensagem não encontrada." }, { status: 404 });
  }
  return NextResponse.json(result.rows[0]);
}

// DELETE: Remove uma mensagem pelo id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID da mensagem é obrigatório." }, { status: 400 });
  }
  const result = await pool.query(
    `DELETE FROM messages WHERE id = $1 AND chat_id = $2 RETURNING id`,
    [id, chatId]
  );
  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Mensagem não encontrada." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
} 