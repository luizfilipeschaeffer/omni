"use client";
import { useContext } from "react";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
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

export function BottomBarNotifications() {
  const { notifications, markAsRead, deleteNotification, markAllAsRead, clearReadNotifications } = useContext(NotificationsContext);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = notifications.filter((n) => n.read).length;
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const { data: notificationsApi, mutate } = useSWR(userId ? `/api/notifications/user/${userId}` : null, url => fetch(url).then(r => r.json()));

  async function handleAccept(notif: any) {
    // Cria chat entre userId e fromUserId
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: [userId, notif.data.fromUserId],
          name: notif.data.fromUserName ? `Chat com ${notif.data.fromUserName}` : undefined,
        }),
      });
      if (res.ok) {
        await handleRemove(notif.id);
        toast.success("Chat criado!");
      } else {
        toast.error("Erro ao criar chat.");
      }
    } catch {
      toast.error("Erro ao criar chat.");
    }
  }

  async function handleRemove(id: number) {
    // Remove notificação (pode ser por update read=true ou delete)
    await fetch(`/api/notifications/user/${userId}?id=${id}`, { method: "DELETE" });
    mutate();
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          aria-label="Notificações"
          className="p-2 rounded-full hover:bg-muted transition-colors relative"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
              {unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <div className="flex items-center gap-2 mb-2">
            <SheetTitle className="text-lg font-bold tracking-tight">Notificações</SheetTitle>
            {unreadCount > 0 && (
              <span className="inline-block bg-primary text-primary-foreground text-xs font-semibold rounded-full px-2 py-0.5">
                {unreadCount}
              </span>
            )}
            {unreadCount > 0 && (
              <button
                aria-label="Marcar todas como lidas"
                className="ml-1 p-1 rounded-full hover:bg-accent transition-colors"
                onClick={markAllAsRead}
              >
                <CheckCheck size={16} />
              </button>
            )}
            {readCount > 0 && (
              <button
                aria-label="Apagar todas as notificações lidas"
                className="ml-1 p-1 rounded-full hover:bg-destructive/20 transition-colors"
                onClick={clearReadNotifications}
                title="Apagar todas as notificações lidas"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </SheetHeader>
        <div className="mt-4 flex flex-col gap-4 px-3 max-h-[100vh] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
          {notifications.length === 0 ? (
            <span className="text-muted-foreground text-sm text-center py-8">Nenhuma notificação.</span>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-center justify-between gap-4 bg-card border border-border rounded-lg px-4 py-3 shadow-sm transition hover:shadow-md ${n.read ? 'opacity-60' : ''}`}
              >
                <div className="flex-1 pr-2">
                  <span className="text-sm text-foreground break-words block">{n.text}</span>
                  <span className="text-xs text-muted-foreground block mt-1">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
                {!n.read && (
                  <button
                    aria-label="Marcar como lida"
                    className="p-1.5 rounded-full hover:bg-accent transition-colors"
                    onClick={() => markAsRead(n.id)}
                  >
                    <Check size={16} />
                  </button>
                )}
                <button
                  aria-label="Apagar notificação"
                  className="p-1.5 rounded-full hover:bg-destructive/20 transition-colors"
                  onClick={() => deleteNotification(n.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
          {notificationsApi && notificationsApi.filter((n: any) => n.type === "chat_request").map((notif: any) => (
            <div key={notif.id} className="p-2 border-b flex flex-col gap-1">
              <div className="text-sm">
                <b>{notif.data.fromUserName || notif.data.fromUserEmail}</b> quer iniciar um chat com você.
              </div>
              <div className="flex gap-2 mt-1">
                <Button size="sm" onClick={() => handleAccept(notif)}>Aceitar</Button>
                <Button size="sm" variant="outline" onClick={() => handleRemove(notif.id)}>Recusar</Button>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
} 