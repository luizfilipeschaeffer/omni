"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Search, Info, CircleDot, Trash, Pencil, Trash2 } from "lucide-react";
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
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function ChatView() {
  // Mock: userId do usuário autenticado
  const { data: session } = useSession();
  const userId = (session?.user as User)?.id;
  const { data: chats, isLoading: loadingChats } = useSWR(userId ? `/api/chats?userId=${userId}` : null, fetcher);
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
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingMessageText, setEditingMessageText] = useState("");

  console.log('userId autenticado:', userId);

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
        setPendingChats((prev) => [
          {
            id: `pending-${user.id}`,
            name: user.name || user.email || "",
            last_message: "Solicitação pendente",
            pending: true,
            userId: user.id,
          },
          ...prev,
        ]);
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
  }, [chats, pendingRequests]);

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

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="w-[95vw] max-w-full h-[90vh] max-h-[90vh] p-0 overflow-hidden rounded-none bg-background shadow-xl flex flex-col md:flex-row border-0 md:rounded-xl md:border-1 md:border-primary/40">
        {/* Sidebar mobile: Sheet */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <button className="md:hidden absolute top-4 left-4 z-20 p-2 rounded-full bg-background/80 border shadow-md"><Menu size={24} /></button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SidebarContent
              chats={chats}
              loadingChats={loadingChats}
              selectedChat={selectedChat}
              setSelectedChat={setSelectedChat}
              newChatOpen={newChatOpen}
              setNewChatOpen={setNewChatOpen}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              searchResults={searchResults}
              searchLoading={searchLoading}
              session={session}
              pendingRequests={pendingRequests}
              pendingChats={pendingChats}
              handleSendRequest={handleSendRequest}
            />
          </SheetContent>
        </Sheet>
        {/* Sidebar desktop */}
        <div className="hidden md:flex w-80 min-w-[260px] border-r bg-muted/40 flex-col h-full">
          <SidebarContent
            chats={chats}
            loadingChats={loadingChats}
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            newChatOpen={newChatOpen}
            setNewChatOpen={setNewChatOpen}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchResults={searchResults}
            searchLoading={searchLoading}
            session={session}
            pendingRequests={pendingRequests}
            pendingChats={pendingChats}
            handleSendRequest={handleSendRequest}
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
                {chats && selectedChat !== null ? (chats[selectedChat]?.name || "Chat Privado") : ""}
                {chats && selectedChat !== null && (
                  <button
                    className="ml-2 p-1 rounded hover:bg-destructive/10 text-destructive transition"
                    title="Remover chat"
                    onClick={async () => {
                      const chatId = chats[selectedChat]?.id;
                      if (!chatId) return;
                      if (!window.confirm("Tem certeza que deseja remover este chat?")) return;
                      try {
                        const res = await fetch(`/api/chats?chatId=${chatId}`, { method: "DELETE" });
                        if (res.ok) {
                          globalMutate((key) => typeof key === "string" && key.startsWith("/api/chats"));
                          setSelectedChat(null);
                          toast.success("Chat removido!");
                        } else {
                          toast.error("Erro ao remover chat.");
                        }
                      } catch {
                        toast.error("Erro ao remover chat.");
                      }
                    }}
                  >
                    <Trash size={18} />
                  </button>
                )}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <CircleDot className="text-green-500" size={12} /> Online
              </div>
            </div>
            <Button size="icon" variant="ghost" title="Ver dados do contato">
              <Info size={20} />
            </Button>
          </div>
          <div className="border-b" />
          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto px-2 md:px-6 py-2 md:py-4 flex flex-col gap-2 bg-background pb-8">
            {loadingMessages && <div className="text-muted-foreground">Carregando mensagens...</div>}
            {messages && messages.map((msg: Message) => {
              const isOwn = String(msg.user_id) === String(userId);
              console.log('msg.id:', msg.id, 'msg.user_id:', msg.user_id, 'isOwn:', isOwn);
              const isEditing = editingMessageId === msg.id;
              return (
                <div
                  key={msg.id}
                  className={`flex w-full ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75vw] md:max-w-[60vw] px-3 md:px-4 py-2 rounded-lg text-sm shadow-sm
                      ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted border border-border"}
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
  loadingChats: boolean;
  selectedChat: number | null;
  setSelectedChat: (idx: number) => void;
  newChatOpen: boolean;
  setNewChatOpen: (open: boolean) => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  searchResults: User[];
  searchLoading: boolean;
  session: any;
  pendingRequests: Record<string, boolean>;
  pendingChats: PendingChat[];
  handleSendRequest: (user: User) => void;
}
// SidebarContent extraído para evitar duplicação
function SidebarContent({
  chats, loadingChats, selectedChat, setSelectedChat, newChatOpen, setNewChatOpen, searchTerm, setSearchTerm, searchResults, searchLoading, session, pendingRequests, pendingChats, handleSendRequest
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
        {/* Chats pendentes no topo */}
        {pendingChats.map((chat: PendingChat) => (
          <div
            key={chat.id}
            className="flex items-center gap-3 px-4 py-3 cursor-not-allowed border-b bg-muted/60 relative"
          >
            <User className="text-muted-foreground" size={28} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate flex items-center gap-2">
                {chat.name}
                <Badge variant="secondary">Pendente</Badge>
              </div>
              <div className="text-xs text-muted-foreground truncate">{chat.last_message}</div>
            </div>
          </div>
        ))}
        {/* Chats reais */}
        {chats && chats.map((chat: Chat, idx: number) => (
          <div
            key={chat.id}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b hover:bg-accent transition ${selectedChat === idx ? "bg-primary/10" : ""}`}
            onClick={() => setSelectedChat(idx)}
          >
            <User className="text-muted-foreground" size={28} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{chat.name || "Chat Privado"}</div>
              <div className="text-xs text-muted-foreground truncate">{chat.last_message || "Sem mensagens"}</div>
            </div>
            <CircleDot className="text-green-500" size={14} />
          </div>
        ))}
      </div>
    </div>
  );
} 