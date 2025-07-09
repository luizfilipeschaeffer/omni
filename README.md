# Omni

Sistema de chat moderno, responsivo e pronto para produção, com Next.js, TypeScript, PostgreSQL, Prisma, SWR e shadcn/ui.

## Visão Geral
- Chat privado entre usuários
- Mensagens com edição, remoção e badge de "editada"
- Atualização automática das mensagens
- Layout responsivo, acessível e moderno
- Backend robusto com API RESTful
- Estrutura pronta para produção

## Requisitos
- Node.js 18+
- PostgreSQL (local ou cloud)

## Configuração
1. **Clone o repositório:**
   ```bash
   git clone <repo-url>
   cd <repo>
   ```
2. **Instale as dependências:**
   ```bash
   npm install
   ```
3. **Configure o banco de dados:**
   - Crie um banco PostgreSQL
   - Copie `.env.example` para `.env` e preencha `DATABASE_URL`

4. **Rode as migrações:**
   ```bash
   npm run migrate
   # ou rode os scripts SQL em migrations/ manualmente
   ```

## Rodando localmente
```bash
npm run dev
```
Acesse: http://localhost:3000

## Rodando em produção
1. **Build do projeto:**
   ```bash
   npm run build
   ```
2. **Start em modo produção:**
   ```bash
   npm start
   ```
3. **Configure variáveis de ambiente em produção:**
   - `DATABASE_URL` com acesso ao banco PostgreSQL
   - Outras variáveis conforme necessário

## Migrações
- As migrações estão em `/migrations` (SQL)
- Rode manualmente ou adapte para Prisma se preferir

## Deploy
- Pronto para deploy em Vercel, Railway, Render, etc.
- Configure as variáveis de ambiente na plataforma
- Certifique-se de rodar as migrações antes do primeiro start

## Dicas
- Para produção, use banco PostgreSQL gerenciado
- Ajuste o polling de mensagens conforme necessidade
- O projeto está pronto para expansão: grupos, busca, notificações

---

**Dúvidas?** Abra uma issue ou entre em contato!
