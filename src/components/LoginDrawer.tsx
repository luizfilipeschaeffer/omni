"use client";
import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface LoginDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function LoginDrawer(props: LoginDrawerProps = {}) {
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = props.open !== undefined ? props.open : internalOpen;
  const setOpen = props.onOpenChange || setInternalOpen;

  useEffect(() => {
    if (props.open !== undefined && props.open !== open) {
      setOpen(props.open);
    }
    // eslint-disable-next-line
  }, [props.open]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = e.currentTarget;
    const email = form.email.value;
    const password = form.password.value;
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    setLoading(false);
    if (res?.ok) {
      setOpen(false);
      router.refresh();
    } else {
      setError("Email ou senha inválidos.");
    }
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = e.currentTarget;
    const nome = form.nome.value;
    const sobrenome = form.sobrenome.value;
    const email = form.email.value;
    const senha = form.senha.value;
    const senha2 = form.senha2.value;
    if (senha !== senha2) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, sobrenome, email, senha }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      // Login automático após cadastro
      await signIn("credentials", { redirect: false, email, password: senha });
      setOpen(false);
      router.refresh();
    } else {
      setError(data.error || "Erro ao cadastrar usuário.");
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="max-w-md mx-auto p-6 sm:p-8 rounded-xl shadow-lg flex flex-col gap-6">
        <DrawerHeader className="px-0 pt-0 pb-2">
          <DrawerTitle className="text-center text-2xl font-semibold">Acesso</DrawerTitle>
        </DrawerHeader>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full flex justify-center mb-6 gap-2 bg-muted rounded-lg p-1">
            <TabsTrigger value="login" className="flex-1">Login</TabsTrigger>
            <TabsTrigger value="register" className="flex-1">Registrar-se</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form className="flex flex-col gap-5" onSubmit={handleLogin} autoComplete="on">
              <Input name="email" type="email" placeholder="Email" autoComplete="username" required className="h-11" />
              <Input name="password" type="password" placeholder="Senha" autoComplete="current-password" required className="h-11" />
              <div className="flex items-center gap-2 mt-1">
                <input id="remember" type="checkbox" className="accent-primary scale-110" />
                <label htmlFor="remember" className="text-sm select-none cursor-pointer">Lembrar de mim</label>
              </div>
              {error && <div className="text-destructive text-sm text-center">{error}</div>}
              <Button type="submit" className="mt-3 h-11 text-base font-medium" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Button>
            </form>
          </TabsContent>
          <TabsContent value="register">
            <form className="flex flex-col gap-5" onSubmit={handleRegister} autoComplete="on">
              <div className="flex gap-3">
                <Input name="nome" type="text" placeholder="Nome" autoComplete="given-name" required className="h-11" />
                <Input name="sobrenome" type="text" placeholder="Sobrenome" autoComplete="family-name" required className="h-11" />
              </div>
              <Input name="email" type="email" placeholder="Email" autoComplete="email" required className="h-11" />
              <Input name="senha" type="password" placeholder="Senha" autoComplete="new-password" required className="h-11" />
              <Input name="senha2" type="password" placeholder="Confirmar senha" autoComplete="new-password" required className="h-11" />
              {error && <div className="text-destructive text-sm text-center">{error}</div>}
              <Button type="submit" className="mt-3 h-11 text-base font-medium" disabled={loading}>{loading ? "Cadastrando..." : "Cadastrar-se"}</Button>
            </form>
          </TabsContent>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
} 