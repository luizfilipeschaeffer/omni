-- Migration: 002_notifications.sql
-- Tabela para notificações entre usuários

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- destinatário
  type VARCHAR(50) NOT NULL, -- exemplo: 'chat_request'
  data JSONB, -- dados extras (ex: quem enviou, mensagem, etc)
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
); 