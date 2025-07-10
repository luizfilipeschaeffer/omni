"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { BottomBar } from "@/components/BottomBar";
import { useNotifications } from "@/components/NotificationsContext";
import { LoginDrawer } from "@/components/LoginDrawer";
import { useSession } from "next-auth/react";
import { ChatView } from "../components/ChatModal";

export default function Home() {
  const [liked, setLiked] = useState(false);
  const { data: session, status } = useSession();
  const [chatOpen, setChatOpen] = useState(false);

  const { addNotification } = useNotifications();
  const handleLike = () => {
    setLiked((v) => !v);
    const message = "Um novo usuário curtiu a página...";
    sonnerToast(
      <div className="flex items-center gap-2">
        <span>{message}</span>
        <Button size="sm" variant="outline" onClick={() => sonnerToast.dismiss()}>Fechar</Button>
      </div>
    );
    addNotification(message);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 pb-10" key={status}>
      {status === "unauthenticated" ? (
        <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
          <LoginDrawer />
        </div>
      ) : (
        <>
          <Dialog>
            {session ? (
              <>
                <Button
                  variant="outline"
                  className="border border-primary border-b-2 rounded-md"
                  onClick={() => setChatOpen(true)}
                >
                  Chat
                </Button>
                {chatOpen && <ChatView />}
              </>
            ) : null}
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nome do Projeto</DialogTitle>
                <DialogDescription>
                  Este é um template de login utilizando shadcn/ui, Next.js e TailwindCSS. O objetivo é fornecer uma base moderna e flexível para autenticação e UI.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-row gap-4 mt-4 w-full">
                <div className="flex-1" />
                <div className="flex-1 flex justify-end">
                  <Button
                    variant={liked ? "secondary" : "outline"}
                    onClick={handleLike}
                    className="flex items-center gap-2"
                  >
                    <Heart fill={liked ? "#e11d48" : "none"} color="#e11d48" size={20} />
                    Curtir
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <BottomBar />
        </>
      )}
    </div>
  );
}
