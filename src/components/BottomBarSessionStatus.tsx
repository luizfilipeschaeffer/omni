"use client";
import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

const statusMap: Record<string, string> = {
  authenticated: "Autenticado",
  unauthenticated: "Não autenticado",
  expired: "Sessão expirada",
};

export function BottomBarSessionStatus() {
  const { data: session, status } = useSession();
  return (
    <span className="hidden sm:flex font-mono text-sm select-none pl-2 items-center gap-2">
      Status: {statusMap[status] ?? "-"}
      {status === "authenticated" && session?.user && (
        <>
          <span className="ml-2 text-primary font-semibold">{session.user.name || session.user.email}</span>
        </>
      )}
    </span>
  );
} 