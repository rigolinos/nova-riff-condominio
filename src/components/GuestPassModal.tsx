/**
 * @file GuestPassModal.tsx
 * @description Modal do QR Code de convidado.
 * Sprint 3 – O QR Code carrega apenas o pass_token (UUID leve).
 * Dados sensíveis (nome, CPF) ficam no banco.
 * Inclui botão de compartilhamento via Web Share API / WhatsApp fallback.
 */

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Share2, MessageCircle, X, Check, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GuestPass } from "@/hooks/useGatekeeperQuery";

interface GuestPassModalProps {
  pass: GuestPass;
  eventTitle: string;
  onClose: () => void;
}

// O QR Code carrega apenas uma URL de validação com o token UUID leve.
// O token não contém dados sensíveis — o banco faz a validação real.
const buildPassUrl = (passToken: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/gatekeeper/validate/${passToken}`;
};

const getStatusConfig = (status: GuestPass["status"]) => {
  switch (status) {
    case "active":
      return { label: "Válido", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30" };
    case "used":
      return { label: "Utilizado", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30" };
    case "expired":
      return { label: "Expirado", color: "text-red-400", bg: "bg-red-400/10 border-red-400/30" };
    case "cancelled":
      return { label: "Cancelado", color: "text-white/40", bg: "bg-white/5 border-white/10" };
  }
};

export function GuestPassModal({ pass, eventTitle, onClose }: GuestPassModalProps) {
  const passUrl = buildPassUrl(pass.pass_token);
  const statusConfig = getStatusConfig(pass.status);
  const canvasRef = useRef<HTMLDivElement>(null);

  const formattedValidFrom = new Date(pass.valid_from).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
  const formattedValidUntil = new Date(pass.valid_until).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  // ✅ Sprint 3: Web Share API com fallback para WhatsApp
  const handleShare = async () => {
    const shareText = `🏟️ Passe de entrada – ${eventTitle}\n👤 Convidado: ${pass.guest_name}\n📅 Válido: ${formattedValidFrom}\n\nApresente este link na portaria:\n${passUrl}`;

    if (navigator.share) {
      // Web Share API nativa (iOS Safari, Android Chrome)
      try {
        await navigator.share({
          title: `Passe – ${eventTitle}`,
          text: shareText,
          url: passUrl,
        });
      } catch {
        // Usuário cancelou o share — ignorar
      }
    } else {
      // Fallback: abre WhatsApp com texto pré-preenchido
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm px-4 pb-6">
      <div className="w-full max-w-[420px] bg-[rgba(3,29,36,1)] border border-white/10 rounded-3xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 shadow-[0_-20px_60px_rgba(0,0,0,0.5)]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h2 className="text-white font-bold text-base">Passe de Convidado</h2>
            <p className="text-white/50 text-xs mt-0.5 truncate max-w-[260px]">{eventTitle}</p>
          </div>
          {/* ✅ Sprint 2/3: touch target 44px */}
          <button
            onClick={onClose}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 active:scale-95 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center p-6 gap-4">
          <div ref={canvasRef} className={`p-4 rounded-2xl border-2 ${pass.status === "active" ? "bg-white border-[rgba(241,216,110,0.5)]" : "bg-white/90 border-white/20 opacity-60"}`}>
            <QRCodeCanvas
              value={passUrl}
              size={180}
              level="M"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#031d24"
            />
          </div>

          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${statusConfig.bg} ${statusConfig.color}`}>
            {pass.status === "active" ? <Check size={14} /> : <Clock size={14} />}
            {statusConfig.label}
          </div>

          {/* Dados do convidado */}
          <div className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[rgba(241,216,110,0.1)] flex items-center justify-center">
                <User size={16} className="text-[rgba(241,216,110,1)]" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">{pass.guest_name}</p>
                {pass.guest_document && (
                  <p className="text-white/40 text-xs">{pass.guest_document}</p>
                )}
              </div>
            </div>

            <div className="border-t border-white/5 pt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Válido de</span>
                <span className="text-white/70 font-medium">{formattedValidFrom}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Até</span>
                <span className="text-white/70 font-medium">{formattedValidUntil}</span>
              </div>
              {pass.checked_in_at && (
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Check-in</span>
                  <span className="text-emerald-400 font-medium">
                    {new Date(pass.checked_in_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Token leve (para digitação manual na portaria) */}
          <p className="text-white/20 text-[10px] font-mono text-center px-2 break-all">
            {pass.pass_token.split("-")[0].toUpperCase()}
          </p>
        </div>

        {/* Ações */}
        {pass.status === "active" && (
          <div className="px-5 pb-5">
            <Button
              onClick={handleShare}
              className="w-full bg-[rgba(241,216,110,1)] hover:bg-[#d6be5e] text-[#031d24] rounded-full h-14 font-bold text-sm uppercase tracking-wide transition-all active:scale-95 shadow-[0_4px_14px_rgba(241,216,110,0.3)]"
            >
              <Share2 size={18} className="mr-2" />
              Compartilhar com Convidado
            </Button>
            <p className="text-white/30 text-xs text-center mt-2">
              Via WhatsApp, iMessage ou qualquer app
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
