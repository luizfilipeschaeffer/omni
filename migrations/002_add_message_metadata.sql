-- Migration: 002_add_message_metadata.sql
-- Adiciona campos de metadados para mensagens

ALTER TABLE messages
  ADD COLUMN updated_at TIMESTAMP,
  ADD COLUMN edited BOOLEAN DEFAULT FALSE,
  ADD COLUMN viewed_at TIMESTAMP,
  ADD COLUMN viewed_by TEXT; 