"use client";
import { useContext, useEffect, useState, useRef } from "react";
import { Bell, Check, CheckCheck, Trash2, MessageCircle, AlertTriangle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NotificationsContext } from "@/components/NotificationsContext";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface NotificationData {
  id: number;
  type: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export function BottomBarNotifications() {
  const { notifications, markAllAsRead, clearReadNotifications } = useContext(NotificationsContext);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const { data: session } = useSession();
  const userId = (session?.user as { id: string })?.id;
  
  const { data: notificationsApi, mutate } = useSWR(
    userId ? `/api/notifications/user/${userId}` : null, 
    url => fetch(url).then(r => r.json()),
    { refreshInterval: 2000 } // Atualizar a cada 2 segundos
  );

  const wsRef = useRef<WebSocket | null>(null);

  // Estado para controlar notificações já mostradas
  const [shownNotifications, setShownNotifications] = useState<Set<number>>(new Set());

  // Função para salvar notificação no banco de dados
  const saveNotification = async (notificationData: {
    user_id: string;
    type: string;
    data: Record<string, unknown>;
  }) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationData),
      });
      
      if (res.ok) {
        mutate(); // Atualizar lista de notificações
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro ao salvar notificação:", error);
      return false;
    }
  };

  // Função para marcar notificação como lida
  const markNotificationAsRead = async (notificationId: number) => {
    try {
      const res = await fetch(`/api/notifications/user/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notificationId, read: true }),
      });
      
      if (res.ok) {
        mutate();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      return false;
    }
  };

  // Função para deletar notificação
  const deleteNotificationFromDB = async (notificationId: number) => {
    try {
      const res = await fetch(`/api/notifications/user/${userId}?id=${notificationId}`, {
        method: "DELETE"
      });
      
      if (res.ok) {
        mutate();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro ao deletar notificação:", error);
      return false;
    }
  };

  // Verificar novas solicitações de chat e mostrar notificações
  useEffect(() => {
    if (!notificationsApi || !userId) return;

    const chatRequests = notificationsApi.filter((n: { type: string; read: boolean; id: number }) => 
      n.type === "chat_request" && !n.read && !shownNotifications.has(n.id)
    );

    const chatDeletionRequests = notificationsApi.filter((n: { type: string; read: boolean; id: number }) => 
      n.type === "chat_deletion_request" && !n.read && !shownNotifications.has(n.id)
    );

    const chatDeletionRejected = notificationsApi.filter((n: { type: string; read: boolean; id: number }) => 
      n.type === "chat_deletion_rejected" && !n.read && !shownNotifications.has(n.id)
    );

    // Mostrar toast e notificação do sistema para cada nova solicitação de chat
    chatRequests.forEach((notif: { id: number; data: { fromUserName?: string; fromUserEmail?: string } }) => {
      const senderName = notif.data.fromUserName || notif.data.fromUserEmail || "Alguém";
      
      // Marcar como mostrada
      setShownNotifications(prev => new Set([...prev, notif.id]));
      
      // Toast notification
      toast.info(`${senderName} quer iniciar um chat com você!`, {
        description: "Clique no ícone de notificações para ver mais detalhes.",
        duration: 5000,
        action: {
          label: "Ver",
          onClick: () => {
            // Aqui você pode adicionar lógica para abrir o painel de notificações
            console.log("Abrir painel de notificações");
          }
        }
      });

      // Sistema operacional notification
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("Nova solicitação de chat", {
            body: `${senderName} quer iniciar um chat com você!`,
            icon: "/favicon.ico", // Adicione um ícone se tiver
            tag: `chat-request-${notif.id}`, // Evita duplicatas
            requireInteraction: true // Permanece até o usuário interagir
          });
        } else if (Notification.permission !== "denied") {
          // Solicitar permissão se não foi negada
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              new Notification("Nova solicitação de chat", {
                body: `${senderName} quer iniciar um chat com você!`,
                icon: "/favicon.ico",
                tag: `chat-request-${notif.id}`,
                requireInteraction: true
              });
            }
          });
        }
      }
    });

    // Mostrar toast e notificação do sistema para cada nova solicitação de exclusão
    chatDeletionRequests.forEach((notif: { id: number; data: { fromUserName?: string; fromUserEmail?: string; chatName?: string } }) => {
      const senderName = notif.data.fromUserName || notif.data.fromUserEmail || "Alguém";
      const chatName = notif.data.chatName || "Chat";
      
      // Marcar como mostrada
      setShownNotifications(prev => new Set([...prev, notif.id]));
      
      // Toast notification
      toast.warning(`${senderName} solicitou a exclusão do chat "${chatName}"`, {
        description: "Deseja aprovar a exclusão?",
        duration: 8000,
        action: {
          label: "Ver",
          onClick: () => {
            console.log("Abrir painel de notificações");
          }
        }
      });

      // Sistema operacional notification
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("Solicitação de exclusão de chat", {
            body: `${senderName} solicitou a exclusão do chat "${chatName}". Deseja aprovar?`,
            icon: "/favicon.ico",
            tag: `chat-deletion-request-${notif.id}`,
            requireInteraction: true
          });
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              new Notification("Solicitação de exclusão de chat", {
                body: `${senderName} solicitou a exclusão do chat "${chatName}". Deseja aprovar?`,
                icon: "/favicon.ico",
                tag: `chat-deletion-request-${notif.id}`,
                requireInteraction: true
              });
            }
          });
        }
      }
    });

    // Mostrar toast e notificação do sistema para cada nova rejeição de exclusão
    chatDeletionRejected.forEach((notif: { id: number; data: { fromUserName?: string; fromUserEmail?: string; chatName?: string } }) => {
      const senderName = notif.data.fromUserName || notif.data.fromUserEmail || "Alguém";
      const chatName = notif.data.chatName || "Chat";
      
      // Marcar como mostrada
      setShownNotifications(prev => new Set([...prev, notif.id]));
      
      // Toast notification
      toast.info(`${senderName} não aceitou a exclusão do chat "${chatName}"`, {
        description: "O chat permanecerá ativo.",
        duration: 5000,
      });

      // Sistema operacional notification
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("Exclusão de chat recusada", {
            body: `${senderName} não aceitou a exclusão do chat "${chatName}". O chat permanecerá ativo.`,
            icon: "/favicon.ico",
            tag: `chat-deletion-rejected-${notif.id}`,
            requireInteraction: true
          });
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              new Notification("Exclusão de chat recusada", {
                body: `${senderName} não aceitou a exclusão do chat "${chatName}". O chat permanecerá ativo.`,
                icon: "/favicon.ico",
                tag: `chat-deletion-rejected-${notif.id}`,
                requireInteraction: true
              });
            }
          });
        }
      }
    });
  }, [notificationsApi, userId, shownNotifications]);

  // Limpar notificações mostradas quando elas são lidas ou removidas
  useEffect(() => {
    if (!notificationsApi) return;
    
    const readNotifications = notificationsApi.filter((n: { read: boolean }) => n.read);
    const readIds = readNotifications.map((n: { id: number }) => n.id);
    
    setShownNotifications(prev => {
      const newSet = new Set(prev);
      readIds.forEach((id: number) => newSet.delete(id));
      return newSet;
    });
  }, [notificationsApi]);

  // Listener para ações das notificações do sistema
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const handleNotificationClick = (event: { notification: Notification; action?: string }) => {
      const notification = event.notification;
      const action = event.action;

      if (action === "accept") {
        // Lógica para aceitar o chat
        console.log("Aceitar chat via notificação do sistema");
        // Aqui você pode implementar a lógica para aceitar o chat
      } else if (action === "reject") {
        // Lógica para recusar o chat
        console.log("Recusar chat via notificação do sistema");
        // Aqui você pode implementar a lógica para recusar o chat
      }

      notification.close();
    };

    // Adicionar listener para cliques em notificações
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "notification-click") {
          handleNotificationClick(event.data);
        }
      });
    }

    return () => {
      // Cleanup se necessário
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl) return;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ userId }));
    };

    ws.onmessage = (event) => {
      // Quando receber uma notificação, atualize imediatamente
      mutate(); // Atualiza o SWR das notificações
    };

    ws.onerror = (err) => {
      // Opcional: log ou toast de erro
      // console.error('WebSocket error:', err);
    };

    return () => ws.close();
  }, [userId]);

  async function handleAccept(notif: NotificationData) {
    // Cria chat entre userId e fromUserId
    try {
      const fromUserId = notif.data.fromUserId as string;
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: [userId, fromUserId],
          name: notif.data.fromUserName ? `Chat com ${notif.data.fromUserName}` : undefined,
        }),
      });
      if (res.ok) {
        await deleteNotificationFromDB(notif.id);
        toast.success("Chat criado!");
      } else {
        toast.error("Erro ao criar chat.");
      }
    } catch {
      toast.error("Erro ao criar chat.");
    }
  }

  async function handleRemove(id: number) {
    await deleteNotificationFromDB(id);
  }

  async function handleAcceptChatDeletion(notificationData: Record<string, unknown>) {
    if (!userId) return;
    
    try {
      const chatId = notificationData.chatId as number;
      // Excluir o chat
      const res = await fetch(`/api/chats?chatId=${chatId}`, {
        method: "DELETE"
      });
      
      if (res.ok) {
        // Remover notificação
        await deleteNotificationFromDB(chatId);
        
        toast.success("Chat excluído com sucesso!");
      } else {
        toast.error("Erro ao excluir chat.");
      }
    } catch {
      toast.error("Erro ao excluir chat.");
    }
  }

  async function handleRejectChatDeletion(notificationData: Record<string, unknown>) {
    if (!userId) return;
    
    try {
      const chatId = notificationData.chatId as number;
      const fromUserId = notificationData.fromUserId as string;
      
      // Remover notificação
      await deleteNotificationFromDB(chatId);
      
      // Notificar o usuário que enviou a solicitação
      await saveNotification({
        user_id: fromUserId,
        type: "chat_deletion_rejected",
        data: {
          fromUserId: userId,
          fromUserName: session?.user?.name,
          fromUserEmail: session?.user?.email,
          chatId: chatId,
          chatName: notificationData.chatName
        },
      });
      
      toast.success("Solicitação de exclusão recusada.");
    } catch {
      toast.error("Erro ao recusar solicitação de exclusão.");
    }
  }

  // Contar notificações de chat pendentes
  const pendingChatRequests = notificationsApi?.filter((n: { type: string }) => n.type === "chat_request") || [];
  const pendingChatDeletionRequests = notificationsApi?.filter((n: { type: string }) => n.type === "chat_deletion_request") || [];
  const chatDeletionRejected = notificationsApi?.filter((n: { type: string }) => n.type === "chat_deletion_rejected") || [];
  const totalUnread = unreadCount + pendingChatRequests.length + pendingChatDeletionRequests.length + chatDeletionRejected.length;

  // Função para renderizar notificação baseada no tipo
  const renderNotification = (notif: NotificationData) => {
    const getNotificationIcon = (type: string) => {
      switch (type) {
        case "chat_request":
          return <MessageCircle size={16} className="text-primary" />;
        case "chat_deletion_request":
          return <AlertTriangle size={16} className="text-destructive" />;
        case "chat_deletion_rejected":
          return <AlertTriangle size={16} className="text-orange-500" />;
        default:
          return <Bell size={16} className="text-muted-foreground" />;
      }
    };

    const getNotificationTitle = (type: string, data: Record<string, unknown>) => {
      switch (type) {
        case "chat_request":
          return `${data.fromUserName || data.fromUserEmail || "Alguém"} quer iniciar um chat com você`;
        case "chat_deletion_request":
          return `${data.fromUserName || data.fromUserEmail || "Alguém"} solicitou a exclusão do chat "${data.chatName || "Chat"}"`;
        case "chat_deletion_rejected":
          return `${data.fromUserName || data.fromUserEmail || "Alguém"} não aceitou a exclusão do chat "${data.chatName || "Chat"}"`;
        default:
          return "Nova notificação";
      }
    };

    const getNotificationActions = (notif: NotificationData) => {
      switch (notif.type) {
        case "chat_request":
          return (
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={() => handleAccept(notif)}>Aceitar</Button>
              <Button size="sm" variant="outline" onClick={() => handleRemove(notif.id)}>Recusar</Button>
            </div>
          );
        case "chat_deletion_request":
          return (
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="destructive" onClick={() => handleAcceptChatDeletion(notif.data)}>Aprovar</Button>
              <Button size="sm" variant="outline" onClick={() => handleRejectChatDeletion(notif.data)}>Recusar</Button>
            </div>
          );
        default:
          return (
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={() => handleRemove(notif.id)}>Remover</Button>
            </div>
          );
      }
    };

    return (
      <div key={notif.id} className={`p-3 border rounded-lg mb-2 ${!notif.read ? 'bg-primary/5' : 'bg-muted/20'}`}>
        <div className="flex items-start gap-3">
          {getNotificationIcon(notif.type)}
          <div className="flex-1">
            <div className="text-sm font-medium">
              {getNotificationTitle(notif.type, notif.data)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {new Date(notif.created_at).toLocaleString()}
            </div>
            {getNotificationActions(notif)}
          </div>
          <div className="flex gap-1">
            {!notif.read && (
              <button
                onClick={() => markNotificationAsRead(notif.id)}
                className="p-1 rounded hover:bg-muted"
                title="Marcar como lida"
              >
                <Check size={14} />
              </button>
            )}
            <button
              onClick={() => deleteNotificationFromDB(notif.id)}
              className="p-1 rounded hover:bg-destructive/20 text-destructive"
              title="Remover"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          aria-label="Notificações"
          className="p-2 rounded-full hover:bg-muted transition-colors relative"
        >
          <Bell size={18} />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
              {totalUnread}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>Notificações</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          {/* Todas as notificações do banco de dados */}
          {notificationsApi && notificationsApi.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Central de Notificações</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => window.open('/notificacoes', '_blank')}>Visualizar todos</Button>
                  <Button size="sm" variant="destructive" onClick={async () => {
                    if (!notificationsApi) return;
                    const deletable = notificationsApi.filter((n: NotificationData) => n.type !== 'chat_request' && n.type !== 'chat_deletion_request');
                    await Promise.all(deletable.map((n: NotificationData) => deleteNotificationFromDB(n.id)));
                    toast.success('Notificações removidas!');
                  }}>Excluir todas</Button>
                </div>
              </div>
              {notificationsApi.map((notif: NotificationData) => renderNotification(notif))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Bell size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          )}
        </div>

        {/* Ações */}
        {notifications.length > 0 && (
          <div className="border-t pt-4 flex gap-2">
            <Button size="sm" variant="outline" onClick={markAllAsRead}>
              <CheckCheck size={14} className="mr-1" />
              Marcar todas como lidas
            </Button>
            <Button size="sm" variant="outline" onClick={clearReadNotifications}>
              <Trash2 size={14} className="mr-1" />
              Limpar lidas
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
} 