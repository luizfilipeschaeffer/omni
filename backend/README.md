# WebSocket Server para Notificações Instantâneas

Este servidor WebSocket permite notificações instantâneas para o frontend do seu app Next.js.

## Como funciona
- Cada usuário conecta via WebSocket e envia seu `userId`.
- O backend Next.js, ao criar uma notificação, faz um HTTP POST para `/notify` deste servidor, que envia a notificação ao usuário conectado.

## Deploy na Render.com

### 1. Crie um novo serviço do tipo **Web Service**
- **Environment:** Node
- **Start command:**
  ```sh
  node backend/ws-server.js
  ```
- **Build command:** (deixe em branco ou `npm install` se precisar de dependências)
- **Port:** 3002 (ou deixe Render detectar automaticamente)

### 2. Variáveis de ambiente
- Você pode definir a variável `PORT` se quiser mudar a porta (opcional).

### 3. Exemplo de uso no Next.js
No endpoint de criação de notificação (`src/app/api/notifications/route.ts`), adicione após salvar no banco:

```js
await fetch('https://SEU-WS-RENDER-URL.onrender.com/notify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user_id,
    notification: { type, data, createdAt: new Date().toISOString() }
  })
});
```

Troque `SEU-WS-RENDER-URL` pela URL do seu serviço Render.

### 4. Frontend
No React, conecte ao WebSocket:
```js
const ws = new WebSocket('wss://SEU-WS-RENDER-URL.onrender.com');
ws.onopen = () => ws.send(JSON.stringify({ userId }));
ws.onmessage = (event) => {
  // Atualize as notificações instantaneamente
};
```

---

**Dica:**
- O WebSocket server pode ser hospedado em qualquer serviço Node.js (Render, Railway, Heroku, VPS, etc).
- O Next.js na Vercel/Render só precisa saber a URL do WebSocket para enviar notificações e para o frontend conectar. 