/**
 * @file GatekeeperScanner.tsx
 * @description Interface otimizada para o porteiro.
 * Sprint 3 – Validação de QR Code em 1 clique.
 * Feedback visual verde (✅ liberado) / vermelho (❌ negado) imediato.
 * Dois modos: câmera (URL) ou código digitado manualmente.
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, QrCode, Keyboard, CheckCircle2, XCircle, Clock, RefreshCw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useValidateGuestPassMutation, useGuestPassesQuery } from "@/hooks/useGatekeeperQuery";
import { MatchmakingCardSkeleton } from "@/components/matchmaking/MatchmakingCardSkeleton";
import type { ValidationResult } from "@/hooks/useGatekeeperQuery";

type ScanMode = "manual" | "camera";

// -----------------------------------------------------------------------
// Componente de resultado visual (verde / vermelho)
// -----------------------------------------------------------------------
interface ValidationFeedbackProps {
  result: ValidationResult;
  onReset: () => void;
}

function ValidationFeedback({ result, onReset }: ValidationFeedbackProps) {
  const isSuccess = result.success;

  return (
    <div className={`rounded-3xl p-8 text-center border-2 transition-all animate-in fade-in zoom-in-95 duration-300 ${
      isSuccess
        ? "bg-emerald-500/10 border-emerald-500/40"
        : "bg-red-500/10 border-red-500/40"
    }`}>
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${
        isSuccess ? "bg-emerald-500/20" : "bg-red-500/20"
      }`}>
        {isSuccess ? (
          <CheckCircle2 size={48} className="text-emerald-400" />
        ) : result.status === "already_used" ? (
          <Clock size={48} className="text-amber-400" />
        ) : (
          <XCircle size={48} className="text-red-400" />
        )}
      </div>

      <h3 className={`text-2xl font-extrabold mb-2 ${
        isSuccess ? "text-emerald-400" : result.status === "already_used" ? "text-amber-400" : "text-red-400"
      }`}>
        {isSuccess ? "LIBERADO" : result.status === "already_used" ? "JÁ ENTROU" : "NEGADO"}
      </h3>

      {result.guest_name && (
        <p className="text-white font-bold text-xl mb-1">{result.guest_name}</p>
      )}
      {result.event_title && (
        <p className="text-white/50 text-sm mb-4">{result.event_title}</p>
      )}

      <p className={`text-sm font-medium mb-6 ${isSuccess ? "text-emerald-300" : "text-red-300"}`}>
        {result.message}
      </p>

      {result.checked_in_at && (
        <p className="text-white/40 text-xs mb-6">
          {result.status === "already_used" ? "Entrada registrada às" : "Check-in às"}{" "}
          {new Date(result.checked_in_at).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}

      {/* ✅ Sprint 3: touch target 44px no botão de reset */}
      <Button
        onClick={onReset}
        className="w-full h-14 min-h-[44px] bg-white/10 hover:bg-white/15 text-white rounded-full font-bold active:scale-95 transition-all"
      >
        <RefreshCw size={18} className="mr-2" />
        Próximo Convidado
      </Button>
    </div>
  );
}

// -----------------------------------------------------------------------
// Página principal do porteiro
// -----------------------------------------------------------------------
export default function GatekeeperScanner() {
  const navigate = useNavigate();
  const { eventId, token } = useParams<{ eventId?: string; token?: string }>();

  const [mode, setMode] = useState<ScanMode>("manual");
  const [tokenInput, setTokenInput] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const validateMutation = useValidateGuestPassMutation();
  const { data: passes = [], isLoading: passesLoading } = useGuestPassesQuery(eventId || "");

  // Captura token da URL quando vindo de um QR Code scaneado pelo celular da câmera
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");
    
    const activeToken = token || tokenFromUrl;
    if (activeToken) {
      handleValidate(activeToken);
    }
  }, [token]);

  const handleValidate = async (tokenStr?: string) => {
    const t = (tokenStr ?? tokenInput).trim();
    if (!t) return;

    const result = await validateMutation.mutateAsync(t);
    setValidationResult(result);
    setTokenInput("");
  };

  const handleReset = () => {
    setValidationResult(null);
    setTokenInput("");
  };

  const activeCount = passes.filter(p => p.status === "active").length;
  const usedCount = passes.filter(p => p.status === "used").length;

  return (
    <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto pb-28">

      {/* Header */}
      <div className="sticky top-0 z-20 bg-[rgba(3,29,36,0.92)] backdrop-blur-md px-5 pt-12 pb-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-lg">Portaria Digital</h1>
            <p className="text-white/40 text-xs">Validação de Convidados</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <Shield size={14} className="text-emerald-400" />
            <span className="text-emerald-400 text-xs font-bold">Porteiro</span>
          </div>
        </div>
      </div>

      <main className="p-5 space-y-6">

        {/* Contadores rápidos */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Esperados", value: passes.length, color: "text-white" },
            { label: "Na Fila", value: activeCount, color: "text-[rgba(241,216,110,1)]" },
            { label: "Entraram", value: usedCount, color: "text-emerald-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center">
              <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
              <p className="text-white/40 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Resultado de validação */}
        {validationResult ? (
          <ValidationFeedback result={validationResult} onReset={handleReset} />
        ) : (
          <>
            {/* Toggle de modo */}
            <div className="flex gap-2 bg-white/[0.03] border border-white/5 p-1.5 rounded-2xl">
              {[
                { key: "manual" as ScanMode, icon: Keyboard, label: "Código Manual" },
                { key: "camera" as ScanMode, icon: QrCode, label: "Câmera / URL" },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 min-h-[44px] ${
                    mode === key
                      ? "bg-[rgba(241,216,110,1)] text-[#031d24] shadow-[0_4px_14px_rgba(241,216,110,0.3)]"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>

            {/* Painel de validação */}
            {mode === "manual" ? (
              <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 space-y-4">
                <div>
                  <label className="text-xs text-white/40 uppercase font-bold tracking-wider mb-2 block">
                    Token ou UUID do Passe
                  </label>
                  <Input
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleValidate()}
                    placeholder="Cole ou digite o token aqui..."
                    className="w-full bg-white/[0.03] border-white/10 text-white h-14 rounded-2xl px-5 focus:border-[rgba(241,216,110,0.5)] transition-colors focus-visible:ring-0 font-mono"
                    autoComplete="off"
                    autoCapitalize="none"
                  />
                </div>
                <Button
                  onClick={() => handleValidate()}
                  disabled={!tokenInput.trim() || validateMutation.isPending}
                  className="w-full bg-[rgba(241,216,110,1)] hover:bg-[#d6be5e] text-[#031d24] rounded-full h-14 min-h-[44px] font-bold text-sm uppercase tracking-wide transition-all active:scale-95 data-[disabled]:opacity-50 shadow-[0_4px_14px_rgba(241,216,110,0.3)]"
                >
                  {validateMutation.isPending ? "Validando..." : "Validar Entrada"}
                </Button>
              </div>
            ) : (
              <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[rgba(241,216,110,0.1)] flex items-center justify-center mx-auto">
                  <QrCode size={32} className="text-[rgba(241,216,110,1)]" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base mb-2">Scan via Câmera</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Use a câmera do celular para escanear o QR Code do convidado.
                    O app abrirá esta tela automaticamente com o resultado.
                  </p>
                </div>
                <p className="text-white/30 text-xs">
                  Ou peça ao convidado que abra o link do passe no próprio celular e mostre o QR.
                </p>
              </div>
            )}

            {/* Lista de passes do evento */}
            <section>
              <h3 className="text-white font-bold text-base mb-3">
                Lista de Convidados
              </h3>

              {passesLoading ? (
                <MatchmakingCardSkeleton />
              ) : passes.length === 0 ? (
                <div className="text-center p-8 bg-white/[0.03] border border-white/5 rounded-3xl">
                  <p className="text-white/50 text-sm">Nenhum passe emitido para este evento.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {passes.map((pass) => (
                    <div
                      key={pass.id}
                      className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/5 rounded-2xl"
                    >
                      {/* Status visual */}
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        pass.status === "active" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" :
                        pass.status === "used"    ? "bg-blue-400" :
                        pass.status === "expired" ? "bg-red-400" :
                        "bg-white/20"
                      }`} />

                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{pass.guest_name}</p>
                        {pass.guest_document && (
                          <p className="text-white/40 text-xs">{pass.guest_document}</p>
                        )}
                        {pass.checked_in_at && (
                          <p className="text-emerald-400/70 text-xs">
                            Entrou às {new Date(pass.checked_in_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </div>

                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        pass.status === "active"   ? "bg-emerald-500/10 text-emerald-400" :
                        pass.status === "used"     ? "bg-blue-500/10 text-blue-400" :
                        pass.status === "expired"  ? "bg-red-500/10 text-red-400" :
                        "bg-white/5 text-white/30"
                      }`}>
                        {pass.status === "active"   ? "Aguardando" :
                         pass.status === "used"     ? "Entrou" :
                         pass.status === "expired"  ? "Expirado" : "Cancelado"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
