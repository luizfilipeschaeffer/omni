# Tech Context — Omni

## Tecnologias Utilizadas
- **Next.js** (App Router) — frontend e backend
- **TypeScript** — tipagem estática
- **Prisma** — gerenciamento de banco e migrações
- **PostgreSQL** — banco de dados relacional
- **SWR** — dados reativos e polling
- **shadcn/ui** — biblioteca de componentes UI
- **lucide-react** — ícones
- **sonner** — toasts/feedback visual

## Setup de Desenvolvimento
- Instalar dependências: `npm install`
- Rodar local: `npm run dev`
- Banco de dados: PostgreSQL (local ou cloud)
- Migrações: Prisma + scripts SQL
- Variáveis de ambiente: `.env` com DATABASE_URL

## Constraints
- Foco em acessibilidade e responsividade
- Estrutura pronta para deploy em Vercel, Railway, Render, etc.
- Código preparado para expansão (busca, grupos, notificações)

## Dependências principais
- next, react, typescript, prisma, @prisma/client, swr, shadcn/ui, lucide-react, sonner