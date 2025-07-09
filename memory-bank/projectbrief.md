# Project Brief — Omni

Este projeto, chamado **Omni**, é um sistema de chat moderno, construído com Next.js, TypeScript, Prisma (para migrações), SWR para dados reativos, e shadcn/ui para componentes visuais. O objetivo é fornecer uma experiência de chat em tempo real, com recursos de edição, remoção, status de visualização e histórico de mensagens, focando em usabilidade, acessibilidade e arquitetura escalável.

## Objetivos
- Chat privado entre usuários
- Mensagens com edição, remoção, badge de "editada"
- Status de visualização (visto por, horário de leitura)
- Interface responsiva e moderna
- Backend robusto com API RESTful
- Estrutura pronta para produção

## Escopo
- Autenticação de usuários
- Listagem de conversas e mensagens
- Envio, edição e remoção de mensagens
- Badge de mensagem editada
- Atualização automática das mensagens (SWR polling)
- Banco de dados relacional (PostgreSQL)
- Migrações versionadas
- UI com shadcn/ui

## Requisitos Técnicos
- Next.js (App Router)
- TypeScript
- Prisma (migrações)
- PostgreSQL
- SWR
- shadcn/ui
- API RESTful (rotas em /api)

## Decisões já tomadas
- Estrutura de banco de dados com users, chats, memberships, messages
- Campos extras em messages: edited, updated_at, viewed_at, viewed_by
- Polling de mensagens a cada 2 segundos
- Badge visual para mensagens editadas
- Popover de ações (editar/remover) nas mensagens do próprio usuário
- Layout: mensagens enviadas à direita, recebidas à esquerda
- Código preparado para futuras features de "visto por" e busca avançada 