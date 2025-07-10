"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Search, Info, Trash, Pencil, X } from "lucide-react";
import useSWR, { mutate as globalMutate } from "swr";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRef } from "react";

// Tipos explícitos para entidades
interface User {
  id: number | string;
  name?: string;
  email?: string;
}

interface Chat {
  id: number | string;
  name?: string;
  last_message?: string;
  participants?: User[]; // Adicionado para armazenar participantes
}

interface Message {
  id: number | string;
  user_id: number | string;
  content: string;
  created_at: string;
  edited?: boolean;
}

interface PendingChat {
  id: string;
  name: string;
  last_message: string;
  pending: boolean;
  userId: number | string;
  notificationId?: number;
  isReceived?: boolean; // Adicionado para indicar se é uma solicitação recebida
  isSent?: boolean; // Adicionado para indicar se é uma solicitação enviada
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Função utilitária para pegar o nome do contato
function getContactName(chat: Chat, userId: string | number) {
  if (!chat?.participants) return "Chat Privado";
  const contact = chat.participants.find((u: User) => String(u.id) !== String(userId));
  return contact?.name || contact?.email || "Chat Privado";
}

interface ChatViewProps {
  onClose?: () => void;
}

export function ChatView({ onClose }: ChatViewProps) {
  // Mock: userId do usuário autenticado
  const { data: session } = useSession();
  const userId = (session?.user as User)?.id;
  const { data: chats } = useSWR(userId ? `/api/chats?userId=${userId}` : null, fetcher);
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const chatId = selectedChat !== null && chats ? chats[selectedChat]?.id : null;
  const { data: messages, isLoading: loadingMessages } = useSWR(
    chatId ? `/api/chats/${chatId}/messages` : null,
    fetcher,
    { refreshInterval: 1000 }
  );
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<{ [userId: number]: boolean }>({});
  const [pendingChats, setPendingChats] = useState<PendingChat[]>([]);
  const [sentRequests, setSentRequests] = useState<PendingChat[]>([]);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingMessageText, setEditingMessageText] = useState("");

  // Buscar notificações pendentes do usuário
  const { data: userNotifications, mutate: mutateNotifications } = useSWR(
    userId ? `/api/notifications/user/${userId}` : null,
    fetcher,
    { refreshInterval: 3000 } // Atualizar a cada 3 segundos
  );

  // Buscar solicitações enviadas pelo usuário
  const { data: sentNotifications, mutate: mutateSentNotifications } = useSWR(
    userId ? `/api/notifications/sent/${userId}` : null,
    fetcher,
    { refreshInterval: 1000 }
  );

  console.log('userId autenticado:', userId);

  // Processar notificações pendentes (recebidas) e criar chats pendentes
  useEffect(() => {
    if (!userNotifications || !userId) return;
    
    const chatRequests = userNotifications.filter((notif: { type: string; read: boolean }) => 
      notif.type === 'chat_request' && !notif.read
    );
    
    const newPendingChats: PendingChat[] = chatRequests.map((notif: { data: { fromUserId: string; fromUserName?: string; fromUserEmail?: string }; id: number }) => ({
      id: `received-${notif.data.fromUserId}`,
      name: notif.data.fromUserName || notif.data.fromUserEmail || "Usuário",
      last_message: "Solicitação de conversa...",
      pending: true,
      userId: notif.data.fromUserId,
      notificationId: notif.id,
      isReceived: true
    }));
    
    setPendingChats(newPendingChats);
  }, [userNotifications, userId]);

  // Processar solicitações enviadas pelo usuário
  useEffect(() => {
    if (!sentNotifications || !userId) return;
    
    const sentChatRequests = sentNotifications.filter((notif: { type: string; read: boolean }) => 
      notif.type === 'chat_request' && !notif.read
    );
    
    const newSentChats: PendingChat[] = sentChatRequests.map((notif: { data: { toUserId: string; toUserName?: string; toUserEmail?: string }; id: number }) => ({
      id: `sent-${notif.data.toUserId}`,
      name: notif.data.toUserName || notif.data.toUserEmail || "Usuário",
      last_message: "PENDENTE",
      pending: true,
      userId: notif.data.toUserId,
      notificationId: notif.id,
      isSent: true
    }));
    
    setSentRequests(newSentChats);
  }, [sentNotifications, userId]);

  // Debounced search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const timeout = setTimeout(() => {
      fetch(`/api/users?q=${encodeURIComponent(searchTerm)}`)
        .then(res => res.json())
        .then(data => {
          setSearchResults(data);
          setSearchLoading(false);
        });
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  // Buscar pendências para cada usuário exibido
  useEffect(() => {
    if (!session?.user) return;
    if (!searchResults.length) return;
    const userId = (session.user as User)?.id;
    const fetchPendings = async () => {
      const pendings: { [userId: number]: boolean } = {};
      await Promise.all(searchResults.map(async (user: User) => {
        if (user.id === userId) return;
        const res = await fetch(`/api/notifications?fromUserId=${userId}&toUserId=${user.id}`);
        const data = await res.json();
        pendings[user.id as number] = !!data.pending;
      }));
      setPendingRequests(pendings);
    };
    fetchPendings();
  }, [searchResults, session]);

  // Função para aceitar solicitação de chat
  const handleAcceptChatRequest = async (pendingChat: PendingChat) => {
    if (!userId || !pendingChat.notificationId) return;
    
    try {
      // Criar o chat
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: [userId, pendingChat.userId],
          name: `Chat com ${pendingChat.name}`,
        }),
      });
      
      if (res.ok) {
        // Marcar notificação como lida
        await fetch(`/api/notifications/user/${userId}?id=${pendingChat.notificationId}`, {
          method: "DELETE"
        });
        
        // Atualizar dados
        mutateNotifications();
        globalMutate((key) => typeof key === "string" && key.startsWith("/api/chats"));
        
        toast.success("Chat criado com sucesso!");
      } else {
        toast.error("Erro ao criar chat.");
      }
    } catch {
      toast.error("Erro ao criar chat.");
    }
  };

  // Função para recusar solicitação de chat
  const handleRejectChatRequest = async (pendingChat: PendingChat) => {
    if (!userId || !pendingChat.notificationId) return;
    
    try {
      // Remover notificação
      await fetch(`/api/notifications/user/${userId}?id=${pendingChat.notificationId}`, {
        method: "DELETE"
      });
      
      // Atualizar dados
      mutateNotifications();
      toast.success("Solicitação recusada.");
    } catch {
      toast.error("Erro ao recusar solicitação.");
    }
  };

  // Função para cancelar solicitação enviada
  const handleCancelSentRequest = async (sentChat: PendingChat) => {
    if (!userId || !sentChat.notificationId) return;
    
    try {
      // Remover notificação enviada
      await fetch(`/api/notifications/sent/${userId}?id=${sentChat.notificationId}`, {
        method: "DELETE"
      });
      
      // Atualizar dados
      mutateSentNotifications();
      toast.success("Solicitação cancelada.");
    } catch {
      toast.error("Erro ao cancelar solicitação.");
    }
  };

  // Quando enviar solicitação, adicionar chat pendente
  const handleSendRequest = async (user: User) => {
    const userId = (session?.user as User)?.id;
    if (!userId || !session?.user) {
      toast.error("Você precisa estar autenticado para solicitar um chat.");
      return;
    }
    if (user.id === userId) {
      toast.error("Não é possível iniciar chat consigo mesmo.");
      return;
    }
    if (pendingRequests[user.id as number]) {
      toast("Já existe uma solicitação pendente para este usuário.");
      return;
    }
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          type: "chat_request",
          data: {
            fromUserId: userId,
            fromUserName: session.user.name,
            fromUserEmail: session.user.email,
          },
        }),
      });
      if (res.ok) {
        toast.success("Solicitação de chat enviada!");
        setNewChatOpen(false);
        setSearchTerm("");
        setPendingRequests((prev) => ({ ...prev, [user.id as number]: true }));
      } else {
        toast.error("Erro ao enviar solicitação.");
      }
    } catch {
      toast.error("Erro ao enviar solicitação.");
    }
  };

  // Remover chat pendente se o chat real for criado ou notificação removida
  useEffect(() => {
    if (!pendingChats.length) return;
    // Se o chat real aparecer na lista, remove o pendente
    if (chats) {
      setPendingChats((prev) => prev.filter(p => !chats.some((c: Chat) => c.name === p.name)));
    }
    // Se a pendência sumir (notificação removida), remove também
    Object.entries(pendingRequests).forEach(([uid, pending]) => {
      if (!pending) {
        setPendingChats((prev) => prev.filter(p => p.userId?.toString() !== uid));
      }
    });
  }, [chats, pendingRequests, pendingChats.length]);

  // Função para enviar mensagem
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !chatId) return;
    if (!userId) {
      toast.error("Usuário não autenticado.");
      return;
    }
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageText, user_id: userId }),
      });
      if (res.ok) {
        setMessageText("");
        globalMutate((key) => typeof key === "string" && key.startsWith(`/api/chats/${chatId}/messages`));
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        toast.error("Erro ao enviar mensagem.");
      }
    } catch {
      toast.error("Erro ao enviar mensagem.");
    }
  };

  // Função para deletar mensagem
  const handleDeleteMessage = async (msgId: number) => {
    if (!chatId) return;
    if (!window.confirm("Tem certeza que deseja apagar esta mensagem?")) return;
    try {
      const res = await fetch(`/api/chats/${chatId}/messages?id=${msgId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        globalMutate((key) => typeof key === "string" && key.startsWith(`/api/chats/${chatId}/messages`));
        toast.success("Mensagem apagada!");
      } else {
        toast.error("Erro ao apagar mensagem.");
      }
    } catch {
      toast.error("Erro ao apagar mensagem.");
    }
  };

  // Função para iniciar edição
  const handleStartEdit = (msg: Message) => {
    const idNum = typeof msg.id === "number" ? msg.id : Number(msg.id);
    if (!isNaN(idNum)) {
      setEditingMessageId(idNum);
    }
    setEditingMessageText(msg.content);
  };

  // Função para salvar edição
  const handleSaveEdit = async () => {
    if (!chatId || !editingMessageId || !editingMessageText.trim()) return;
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingMessageId, content: editingMessageText }),
      });
      if (res.ok) {
        setEditingMessageId(null);
        setEditingMessageText("");
        globalMutate((key) => typeof key === "string" && key.startsWith(`/api/chats/${chatId}/messages`));
        toast.success("Mensagem editada!");
      } else {
        toast.error("Erro ao editar mensagem.");
      }
    } catch {
      toast.error("Erro ao editar mensagem.");
    }
  };

  // Função para cancelar edição
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingMessageText("");
  };

  // Função para solicitar exclusão de chat
  const handleRequestChatDeletion = async (chat: Chat) => {
    if (!userId || !chat.id) return;
    
    // Encontrar o outro participante do chat
    const otherParticipant = chat.participants?.find((p: User) => String(p.id) !== String(userId));
    if (!otherParticipant) {
      toast.error("Não foi possível identificar o outro participante do chat.");
      return;
    }

    try {
      // Criar notificação de solicitação de exclusão
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: otherParticipant.id,
          type: "chat_deletion_request",
          data: {
            fromUserId: userId,
            fromUserName: session?.user?.name,
            fromUserEmail: session?.user?.email,
            chatId: chat.id,
            chatName: chat.name || "Chat Privado"
          },
        }),
      });

      if (res.ok) {
        toast.success("Solicitação de exclusão enviada! Aguardando aprovação do outro participante.");
      } else {
        toast.error("Erro ao enviar solicitação de exclusão.");
      }
    } catch {
      toast.error("Erro ao enviar solicitação de exclusão.");
    }
  };



  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop com blur */}
      <div className="absolute inset-0 bg-background/10 backdrop-blur-sm transition-opacity duration-200" />
      
      <div className="relative w-[95vw] max-w-full h-[90vh] max-h-[90vh] p-0 overflow-hidden rounded-none bg-background shadow-xl flex flex-col md:flex-row border-0 md:rounded-xl md:border-1 md:border-primary/40 transition-all duration-200 transform scale-100">
        {/* Sidebar mobile: Sheet */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <button className="md:hidden absolute top-4 left-4 z-20 p-2 rounded-full bg-background/80 border shadow-md"><Menu size={24} /></button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SidebarContent
              chats={chats}
              selectedChat={selectedChat}
              setSelectedChat={setSelectedChat}
              newChatOpen={newChatOpen}
              setNewChatOpen={setNewChatOpen}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              searchResults={searchResults}
              searchLoading={searchLoading}
              pendingRequests={pendingRequests}
              pendingChats={pendingChats}
              sentRequests={sentRequests}
              handleSendRequest={handleSendRequest}
              handleAcceptChatRequest={handleAcceptChatRequest}
              handleRejectChatRequest={handleRejectChatRequest}
              handleCancelSentRequest={handleCancelSentRequest}
            />
          </SheetContent>
        </Sheet>
        {/* Sidebar desktop */}
        <div className="hidden md:flex w-80 min-w-[260px] border-r bg-muted/40 flex-col h-full">
          <SidebarContent
            chats={chats}
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            newChatOpen={newChatOpen}
            setNewChatOpen={setNewChatOpen}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchResults={searchResults}
            searchLoading={searchLoading}
            pendingRequests={pendingRequests}
            pendingChats={pendingChats}
            sentRequests={sentRequests}
            handleSendRequest={handleSendRequest}
            handleAcceptChatRequest={handleAcceptChatRequest}
            handleRejectChatRequest={handleRejectChatRequest}
            handleCancelSentRequest={handleCancelSentRequest}
          />
        </div>
        {/* Main chat area */}
        <div className="flex-1 flex flex-col h-full relative bg-background">
          {/* Header do contato */}
          <div className="flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 border-b bg-background/80 min-h-[56px]">
            <button className="md:hidden p-2 mr-2" onClick={() => setSidebarOpen(true)}><Menu size={22} /></button>
            <User className="text-muted-foreground" size={28} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-base md:text-lg truncate flex items-center gap-2">
                {chats && selectedChat !== null
                  ? getContactName(chats[selectedChat], userId)
                  : ""}
                {chats && selectedChat !== null && (
                  <button
                    className="ml-2 p-1 rounded hover:bg-destructive/10 text-destructive transition"
                    title="Solicitar exclusão do chat"
                    onClick={() => handleRequestChatDeletion(chats[selectedChat])}
                  >
                    <Trash size={18} />
                  </button>
                )}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                {/* Status removido */}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" title="Ver dados do contato">
                <Info size={20} />
              </Button>
              {onClose && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  title="Fechar chat"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={20} />
                </Button>
              )}
            </div>
          </div>
          <div className="border-b" />
          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto px-2 md:px-6 py-2 md:py-4 flex flex-col gap-2 bg-background pb-8">
            {loadingMessages && <div className="text-muted-foreground">Carregando mensagens...</div>}
            {!userId && <div className="text-muted-foreground">Usuário não autenticado</div>}
            {messages && userId && messages.map((msg: Message) => {
              // Garantir que a comparação seja feita corretamente
              const currentUserId = String(userId);
              const messageUserId = String(msg.user_id);
              const isOwn = currentUserId === messageUserId;
              
              console.log('Debug mensagem:', {
                msgId: msg.id,
                messageUserId: messageUserId,
                currentUserId: currentUserId,
                isOwn: isOwn,
                userIdType: typeof userId,
                msgUserIdType: typeof msg.user_id
              });
              
              const isEditing = editingMessageId === msg.id;
              return (
                <div
                  key={msg.id}
                  className={`flex w-full ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75vw] md:max-w-[60vw] px-3 md:px-4 py-2 rounded-lg text-sm shadow-sm
                      ${isOwn 
                        ? "bg-primary text-primary-foreground ml-auto" 
                        : "bg-muted border border-border mr-auto"
                      }
                    `}
                    style={{ wordBreak: "break-word" }}
                  >
                    {/* Removido o nome do usuário */}
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          className="w-full rounded border border-primary bg-background p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          value={editingMessageText}
                          onChange={e => setEditingMessageText(e.target.value)}
                          rows={2}
                          autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={handleCancelEdit} type="button">Cancelar</Button>
                          <Button size="sm" variant="default" onClick={handleSaveEdit} type="button">Salvar</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {msg.content}
                        <span className="block text-xs text-muted-foreground mt-1 text-right flex items-center gap-2 justify-end">
                          {msg.created_at && new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {msg.edited && (
                            <span className="ml-1 px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground border border-border">editada</span>
                          )}
                        </span>
                        {isOwn && (
                          <div className="flex gap-2 mt-1 justify-end">
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  className="p-1 rounded hover:bg-background/30"
                                  title="Ações"
                                  type="button"
                                >
                                  <Pencil size={16} />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-32 p-2 flex flex-col gap-1" align="end" side="right">
                                <button
                                  className="w-full text-left px-2 py-1 rounded hover:bg-muted transition text-sm"
                                  onClick={() => handleStartEdit(msg)}
                                  type="button"
                                >
                                  Editar
                                </button>
                                <button
                                  className="w-full text-left px-2 py-1 rounded hover:bg-destructive/20 text-destructive transition text-sm"
                                  onClick={() => {
                                    const idNum = typeof msg.id === "number" ? msg.id : Number(msg.id);
                                    if (!isNaN(idNum)) handleDeleteMessage(idNum);
                                  }}
                                  type="button"
                                >
                                  Remover
                                </button>
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          {/* Input de mensagem */}
          <form className="flex items-center gap-2 px-2 md:px-6 py-2 md:py-4 border-t bg-background" onSubmit={handleSendMessage}>
            <Input
              placeholder="Digite uma mensagem..."
              className="flex-1 h-11 text-base"
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              autoFocus
            />
            <Button type="submit" className="h-11 px-4 md:px-6 text-base">Enviar</Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Tipar as props do SidebarContent
interface SidebarContentProps {
  chats: Chat[];
  selectedChat: number | null;
  setSelectedChat: (idx: number) => void;
  newChatOpen: boolean;
  setNewChatOpen: (open: boolean) => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  searchResults: User[];
  searchLoading: boolean;
  pendingRequests: Record<string, boolean>;
  pendingChats: PendingChat[];
  sentRequests: PendingChat[];
  handleSendRequest: (user: User) => void;
  handleAcceptChatRequest: (pendingChat: PendingChat) => void;
  handleRejectChatRequest: (pendingChat: PendingChat) => void;
  handleCancelSentRequest: (sentChat: PendingChat) => void;
}
// SidebarContent extraído para evitar duplicação
function SidebarContent({
  chats, selectedChat, setSelectedChat, newChatOpen, setNewChatOpen, searchTerm, setSearchTerm, searchResults, searchLoading, pendingRequests, pendingChats, sentRequests, handleSendRequest, handleAcceptChatRequest, handleRejectChatRequest, handleCancelSentRequest
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center gap-2">
        <Search className="text-muted-foreground" size={18} />
        <Input placeholder="Filtrar conversas..." className="h-9" />
      </div>
      <div className="p-4 border-b flex items-center justify-between gap-2">
        <span className="font-semibold text-sm">Conversas</span>
        <Popover open={newChatOpen} onOpenChange={setNewChatOpen}>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline">Novo Chat</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Buscar contato por nome ou email"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-10"
                autoFocus
              />
              {searchLoading && <div className="text-xs text-muted-foreground px-2 py-1">Buscando...</div>}
              {!searchLoading && searchTerm.trim() && searchResults.length === 0 && (
                <div className="text-xs text-muted-foreground px-2 py-1">Nenhum usuário encontrado.</div>
              )}
              <div className="max-h-56 overflow-y-auto flex flex-col gap-1">
                {searchResults.map((user: User) => (
                  <button
                    key={user.id}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-accent transition flex flex-col border border-transparent hover:border-primary relative ${pendingRequests[user.id as string] ? 'opacity-60 cursor-not-allowed' : ''}`}
                    onClick={() => handleSendRequest(user)}
                    type="button"
                    disabled={pendingRequests[user.id as string]}
                  >
                    <span className="font-medium text-sm flex items-center gap-2">
                      {user.name || user.email}
                      {pendingRequests[user.id as string] && <Badge variant="secondary" className="ml-2">Pendente</Badge>}
                    </span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="border-b" />
      <div className="flex-1 overflow-y-auto">
        {/* Solicitações recebidas (para o usuário B) */}
        {pendingChats.map((chat: PendingChat) => (
          <div
            key={`received-${chat.id}`}
            className="flex items-center gap-3 px-4 py-3 border-b bg-muted/60 relative"
          >
            <User className="text-muted-foreground" size={28} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate flex items-center gap-2">
                {chat.name}
                <Badge variant="secondary">Solicitação</Badge>
              </div>
              <div className="text-xs text-muted-foreground truncate">{chat.last_message}</div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => handleAcceptChatRequest(chat)}>Aceitar</Button>
                <Button size="sm" variant="outline" onClick={() => handleRejectChatRequest(chat)}>Recusar</Button>
              </div>
            </div>
          </div>
        ))}

        {/* Solicitações enviadas (para o usuário A) */}
        {sentRequests.map((chat: PendingChat) => (
          <div
            key={`sent-${chat.id}`}
            className="flex items-center gap-3 px-4 py-3 border-b bg-yellow-50 dark:bg-yellow-950/20 relative"
          >
            <User className="text-muted-foreground" size={28} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate flex items-center gap-2">
                {chat.name}
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">PENDENTE</Badge>
              </div>
              <div className="text-xs text-muted-foreground truncate">{chat.last_message}</div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => handleCancelSentRequest(chat)}>Cancelar</Button>
              </div>
            </div>
          </div>
        ))}

        {/* Chats reais */}
        {chats && chats.map((chat: Chat, idx: number) => (
          <div
            key={`real-${chat.id}`}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b hover:bg-accent transition ${selectedChat === idx ? "bg-primary/10" : ""}`}
            onClick={() => setSelectedChat(idx)}
          >
            <User className="text-muted-foreground" size={28} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{chat.name || "Chat Privado"}</div>
              <div className="text-xs text-muted-foreground truncate">{chat.last_message || "Sem mensagens"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 