"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useExpressMessage, ExpressMessageType, ExpressMessage } from "@/components/ExpressMessageContext";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Edit, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useNotifications } from "@/components/NotificationsContext";

const typeOptions = [
  { value: "info", label: "Informação" },
  { value: "success", label: "Sucesso" },
  { value: "warning", label: "Atenção" },
  { value: "error", label: "Erro" },
];

const recurrenceOptions = [
  { value: "none", label: "Única vez" },
  { value: "daily", label: "Diária" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
];

function combineDateAndTime(date: Date | undefined, time: string): string {
  if (!date) return new Date().toISOString();
  const [hours, minutes] = time.split(":");
  const d = new Date(date);
  d.setHours(Number(hours) || 0, Number(minutes) || 0, 0, 0);
  return d.toISOString();
}

function getInitialTime(date?: Date) {
  const d = date || new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function loadAllMessages(): ExpressMessage[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("express_messages");
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveAllMessages(messages: ExpressMessage[]) {
  localStorage.setItem("express_messages", JSON.stringify(messages));
}

export function ExpressMessageManager() {
  const { showExpressMessage } = useExpressMessage();
  const { addNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ExpressMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<boolean>(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    type: "info" as ExpressMessageType,
    recurrence: "none" as "none" | "daily" | "weekly" | "monthly",
    date: new Date() as Date | undefined,
    time: getInitialTime(),
  });

  // Atalho Ctrl+Shift+M
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Carregar mensagens do localStorage
  useEffect(() => {
    setMessages(loadAllMessages());
  }, [open]);

  // Salvar mensagens no localStorage
  useEffect(() => {
    if (messages.length > 0) saveAllMessages(messages);
    else localStorage.removeItem("express_messages");
  }, [messages]);

  // Selecionar mensagem para editar
  function handleSelect(msg: ExpressMessage) {
    setSelectedId(msg.id);
    setEditing(true);
    setForm({
      title: msg.title,
      body: msg.body,
      type: msg.type,
      recurrence: msg.recurrence || "none",
      date: new Date(msg.scheduledAt),
      time: getInitialTime(new Date(msg.scheduledAt)),
    });
  }

  // Limpar formulário
  function clearForm() {
    setForm({
      title: "",
      body: "",
      type: "info",
      recurrence: "none",
      date: new Date(),
      time: getInitialTime(),
    });
    setSelectedId(null);
    setEditing(false);
  }

  // Criar ou editar mensagem
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim() || !form.date) return;
    const scheduledAt = combineDateAndTime(form.date, form.time);
    if (editing && selectedId) {
      setMessages((prev) => prev.map((m) => m.id === selectedId ? { ...m, ...form, scheduledAt } : m));
    } else {
      const newMsg: ExpressMessage = {
        id: `${Date.now()}-${Math.random()}`,
        title: form.title,
        body: form.body,
        type: form.type,
        scheduledAt,
        recurrence: form.recurrence,
        createdAt: new Date().toISOString(),
        active: false,
      };
      setMessages((prev) => [newMsg, ...prev]);
      showExpressMessage({
        title: newMsg.title,
        body: newMsg.body,
        type: newMsg.type,
        scheduledAt: newMsg.scheduledAt,
        recurrence: newMsg.recurrence,
      });
      addNotification(`Expresso: ${newMsg.title} agendada para ${format(new Date(newMsg.scheduledAt), "dd/MM/yyyy HH:mm")}`);
    }
    clearForm();
  }

  // Remover mensagem
  function handleRemove(id: string) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (selectedId === id) clearForm();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[98vw] w-[98vw] h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full w-full">
          <div className="text-center font-bold text-lg py-4 border-b">Gerenciador de Mensagens Expresso</div>
          <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
            <ResizablePanel defaultSize={35} minSize={20} className="bg-muted/40 border-r flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <span className="font-semibold">Mensagens</span>
                <Button size="icon" variant="ghost" onClick={clearForm} title="Nova mensagem"><Plus /></Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-muted-foreground text-sm p-4">Nenhuma mensagem cadastrada.</div>
                ) : (
                  <ul>
                    {messages.map((msg) => (
                      <li
                        key={msg.id}
                        className={`px-4 py-3 border-b cursor-pointer flex items-center gap-2 transition bg-white hover:bg-accent ${selectedId === msg.id ? "bg-primary/10" : ""}`}
                        onClick={() => handleSelect(msg)}
                      >
                        <span className="font-bold text-sm flex-1 truncate">{msg.title}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(msg.scheduledAt), "dd/MM/yyyy HH:mm")}</span>
                        <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); handleRemove(msg.id); }} title="Remover"><Trash2 className="w-4 h-4" /></Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={65} minSize={40} className="flex flex-col">
              <div className="flex flex-row items-center justify-end gap-2 px-6 pt-6">
                <Button type="button" variant="secondary" onClick={() => addNotification("Notificação de teste enviada com sucesso!")}>Testar notificação</Button>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-6 h-full">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg flex-1">{editing ? "Editar mensagem" : "Nova mensagem"}</h3>
                  {editing && <Button size="sm" variant="outline" onClick={clearForm} type="button">Cancelar</Button>}
                </div>
                <input
                  className="w-full border rounded px-2 py-1"
                  placeholder="Título"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
                <textarea
                  className="w-full border rounded px-2 py-1"
                  placeholder="Corpo da mensagem"
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  required
                  rows={3}
                />
                <div className="flex gap-2 items-center flex-wrap">
                  <select
                    className="border rounded px-2 py-1"
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value as ExpressMessageType }))}
                  >
                    {typeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={"w-[140px] justify-start text-left font-normal" + (!form.date ? " text-muted-foreground" : "")}
                        type="button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.date ? format(form.date, "dd/MM/yyyy") : <span>Escolha a data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.date}
                        onSelect={d => setForm(f => ({ ...f, date: d }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <input
                    type="time"
                    className="border rounded px-2 py-1 w-[100px]"
                    value={form.time}
                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    required
                  />
                  <select
                    className="border rounded px-2 py-1"
                    value={form.recurrence}
                    onChange={e => setForm(f => ({ ...f, recurrence: e.target.value as any }))}
                  >
                    {recurrenceOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 mt-auto">
                  <Button type="submit">{editing ? "Salvar" : "Agendar mensagem"}</Button>
                </div>
              </form>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </DialogContent>
    </Dialog>
  );
} 