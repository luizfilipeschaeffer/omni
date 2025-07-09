"use client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useExpressMessage } from "@/components/ExpressMessageContext";
import { Button } from "@/components/ui/button";
import { AlertCircle, Info, CheckCircle2, XCircle } from "lucide-react";

const typeMap = {
  info: {
    color: "bg-blue-100 text-blue-800",
    icon: Info,
    label: "Informação",
  },
  success: {
    color: "bg-green-100 text-green-800",
    icon: CheckCircle2,
    label: "Sucesso",
  },
  warning: {
    color: "bg-yellow-100 text-yellow-800",
    icon: AlertCircle,
    label: "Atenção",
  },
  error: {
    color: "bg-red-100 text-red-800",
    icon: XCircle,
    label: "Erro",
  },
};

function formatRecurrence(r?: string) {
  if (!r || r === "none") return "";
  if (r === "daily") return "(Diariamente)";
  if (r === "weekly") return "(Semanalmente)";
  if (r === "monthly") return "(Mensalmente)";
  return "";
}

export function DialogExpresso() {
  const { message, closeExpressMessage } = useExpressMessage();
  if (!message || !message.active) return null;
  const { title, body, type, scheduledAt, recurrence } = message;
  const { color, icon: Icon, label } = typeMap[type];
  const canClose = type !== "warning" && type !== "error";

  return (
    <Dialog open={true} onOpenChange={canClose ? closeExpressMessage : undefined}>
      <DialogContent className="max-w-md">
        <div className={`flex items-center gap-3 mb-2 ${color} rounded p-2`}>
          <Icon className="w-6 h-6" />
          <span className="font-semibold">{label}</span>
        </div>
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="mb-4 whitespace-pre-line">{body}</p>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground mb-2">
          <span>Agendado para: {new Date(scheduledAt).toLocaleString()} {formatRecurrence(recurrence)}</span>
        </div>
        {canClose && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={closeExpressMessage}>Fechar</Button>
          </div>
        )}
        {(!canClose) && (
          <div className="text-xs text-yellow-700 mt-2">Este aviso não pode ser fechado manualmente.</div>
        )}
      </DialogContent>
    </Dialog>
  );
} 