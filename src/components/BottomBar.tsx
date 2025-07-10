"use client";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop, CircleDot, LogOut, MessageCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BottomBarClock } from "@/components/BottomBarClock";
import { BottomBarSessionStatus } from "@/components/BottomBarSessionStatus";
import { BottomBarNotifications } from "@/components/BottomBarNotifications";
import { useSession, signOut } from "next-auth/react";

function useDbStatus() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    async function check() {
      try {
        const res = await fetch("/api/db-status");
        const data = await res.json();
        setOk(data.ok);
      } catch {
        setOk(false);
      }
      timeout = setTimeout(check, 30000);
    }
    check();
    return () => clearTimeout(timeout);
  }, []);
  return ok;
}

export function BottomBar() {
  const { theme, setTheme } = useTheme();
  const [showToggle, setShowToggle] = useState(false);
  const themeSwitcherRef = useRef<HTMLDivElement>(null);
  const dbStatus = useDbStatus();
  const { status } = useSession();

  const getThemeIcon = () => {
    if (theme === "light") return <Sun size={16} />;
    if (theme === "dark") return <Moon size={16} />;
    return <Laptop size={16} />;
  };

  return (
    <div className="fixed bottom-0 left-0 w-full h-8 bg-background border-t border-border flex items-center px-2 z-50 shadow-[0_-2px_8px_0_rgba(0,0,0,0.04)]">
      <div className="flex-1 flex items-center min-w-0">
        <BottomBarSessionStatus/>
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden sm:block">
        <BottomBarClock />
      </div>
      <div className="flex items-center gap-2">
        <BottomBarNotifications />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <CircleDot size={18} className={dbStatus === true ? "text-green-500" : dbStatus === false ? "text-red-500" : "text-muted-foreground"} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {dbStatus === true ? "Banco conectado" : dbStatus === false ? "Erro ao conectar" : "Verificando..."}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {status === "authenticated" && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label="Chat"
                  className="p-2 rounded-full hover:bg-primary/20 transition-colors"
                  onClick={() => {
                    console.log('Ícone de chat clicado na barra inferior');
                    // Aqui você pode adicionar a lógica para abrir o chat
                    // Por exemplo, emitir um evento ou chamar uma função
                    window.dispatchEvent(new CustomEvent('openChat'));
                  }}
                >
                  <MessageCircle size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Chat</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {status === "authenticated" && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label="Sair"
                  className="p-2 rounded-full hover:bg-destructive/20 transition-colors"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Sair</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <div
          ref={themeSwitcherRef}
          onMouseEnter={() => setShowToggle(true)}
          onMouseLeave={() => setShowToggle(false)}
        >
          <TooltipProvider>
            {showToggle ? (
              <ToggleGroup type="single" value={theme === undefined ? "system" : theme} onValueChange={v => v && setTheme(v)}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem value="system" aria-label="Automático">
                      <Laptop size={16} />
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent>Automático</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem value="light" aria-label="Claro">
                      <Sun size={16} />
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent>Claro</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem value="dark" aria-label="Escuro">
                      <Moon size={16} />
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent>Escuro</TooltipContent>
                </Tooltip>
              </ToggleGroup>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label="Tema"
                    className="p-2 rounded-full"
                    style={{ minWidth: 40, minHeight: 40 }}
                  >
                    {getThemeIcon()}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Trocar tema
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
} 