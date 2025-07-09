"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { LoginDrawer } from "@/components/LoginDrawer";

export function AuthGate() {
  const { status } = useSession();
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated" || status === "loading") {
      setLoginOpen(true);
    } else {
      setLoginOpen(false);
    }
  }, [status]);

  return <LoginDrawer open={loginOpen} onOpenChange={setLoginOpen} />;
} 