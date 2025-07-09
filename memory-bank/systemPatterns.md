# System Patterns — Omni

## Arquitetura
- Monorepo Next.js (App Router) com API RESTful em /api
- Banco de dados relacional (PostgreSQL)
- Migrações versionadas (Migrations apply personalizado + SQL)
- SWR para dados reativos e polling
- UI desacoplada com shadcn/ui

## Decisões Técnicas
- Separação clara entre frontend (UI) e backend (API)
- Polling de mensagens para atualização automática
- Popover para ações rápidas (editar/remover)
- Badge visual para mensagens editadas
- Layout flexível: mensagens enviadas à direita, recebidas à esquerda
- Estrutura de banco pronta para "visto por", busca, grupos

## Padrões de Design
- Componentização: cada parte do chat é um componente isolado
- Contextos para autenticação, notificações, etc.
- Uso de hooks para lógica de dados (SWR, useSession)
- Feedback visual imediato (toasts, badges)

## Relacionamento entre componentes
- ChatModal: view principal do chat
- SidebarContent: lista de conversas
- BottomBar: status e ações globais
- Mensagens: renderizadas dinamicamente, com ações inline