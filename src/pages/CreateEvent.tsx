/**
 * @file CreateEvent.tsx (Reserva de Espaço)
 * Sprint 1: Refatorado com Zod (validação + timezone UTC) e React Query (dados de amenities).
 * Spinner genérico substituído por Skeleton.
 */
import React, { useState } from "react";
import { ArrowLeft, Calendar, Clock, MapPin, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCondominiumId } from "@/hooks/useCondominiumId";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { reservationSchema, toUtcIso } from "@/lib/schemas";
import { useAmenitiesQuery } from "@/hooks/useAmenitiesQuery";

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { condominiumId } = useCondominiumId();

  // ✅ Sprint 1: dados via React Query com cache inteligente
  const { data: amenities = [], isLoading } = useAmenitiesQuery(condominiumId);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedAmenity, setSelectedAmenity] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [maxPlayers, setMaxPlayers] = useState<string>("4");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleCreateReservation = async () => {
    if (!selectedAmenity) {
      toast({ title: "Selecione um espaço", variant: "destructive" });
      return;
    }

    // ✅ Sprint 1: Validação com Zod - erro por campo
    const result = reservationSchema.safeParse({
      title,
      date,
      time,
      amenityId: selectedAmenity,
      maxParticipants: parseInt(maxPlayers) || 1,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        const field = e.path[0] as string;
        errors[field] = e.message;
      });
      setFormErrors(errors);
      toast({ title: "Preencha os campos corretamente", variant: "destructive" });
      return;
    }

    setFormErrors({});
    setIsSaving(true);

    try {
      // ✅ Trava Anti-Monopólio (Verifica se já tem reserva futura ativa neste espaço)
      if (user?.id) {
        const { count, error: countError } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("amenity_id", result.data.amenityId)
          .eq("created_by", user.id)
          .eq("status", "active")
          .gte("date", new Date().toISOString().split('T')[0]);

        if (countError) throw countError;

        if (count && count >= 1) {
          toast({ 
            title: "Limite Atingido", 
            description: "Você já possui uma reserva ativa para este espaço. Aguarde ela passar para reservar novamente.",
            variant: "destructive" 
          });
          setIsSaving(false);
          return;
        }
      }

      // ✅ Sprint 1: Conversão UTC para evitar bug de timezone (refinamento do especialista)
      const startDateTimeUtc = toUtcIso(result.data.date, result.data.time);

      const { error } = await supabase.from("events").insert({
        title: result.data.title,
        date: result.data.date,
        time: result.data.time,
        start_datetime_utc: startDateTimeUtc,
        amenity_id: result.data.amenityId,
        condominium_id: condominiumId,
        created_by: user?.id,
        location:
          amenities.find((a) => a.id === result.data.amenityId)?.name ||
          "Condomínio",
        max_participants: result.data.maxParticipants,
        status: "active",
      });

      if (error) {
        throw error;
      }

      toast({ title: "Reserva criada com sucesso! ✅" });
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao criar reserva", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const getStepText = () => {
    if (step === 1) return "Escolha o Espaço";
    if (step === 2) return "Data e Hora";
    return "";
  };

  // ✅ Sprint 1: Skeleton no lugar do spinner genérico
  const AmenitySkeleton = () => (
    <div className="grid grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-36 rounded-3xl bg-white/5" />
      ))}
    </div>
  );

  // Determine glow color
  const selectedAmenityData = amenities.find(a => a.id === selectedAmenity);
  const isSports = selectedAmenityData?.name?.toLowerCase().includes("quadra") || selectedAmenityData?.name?.toLowerCase().includes("tênis");
  const glowClass = !selectedAmenity ? "from-[#073642]/40" : isSports ? "from-emerald-500/10" : "from-amber-500/10";

  return (
    <div className={`min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${glowClass} via-[#031D24] to-[#031D24] max-w-[480px] mx-auto pb-28 transition-colors duration-500`}>
      <div className="sticky top-0 z-20 bg-[rgba(3,29,36,0.6)] backdrop-blur-xl px-5 pt-12 pb-4 border-b border-[rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-4">
          {/* ✅ Sprint 2 (UI Polish): min-w/h 44px para touch target acessível */}
          <button
            onClick={() => (step === 1 ? navigate("/dashboard") : setStep(1))}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">
              Nova Reserva
            </h1>
            <p className="text-white/50 text-xs">
              Passo {step} de 2: {getStepText()}
            </p>
          </div>
        </div>
      </div>

      <main className="p-5">
        {step === 1 ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-white font-bold text-lg mb-4">
              Onde você quer acessar?
            </h2>

            {isLoading ? (
              <AmenitySkeleton />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {amenities.map((amenity) => (
                  <div
                    key={amenity.id}
                    className={`glass-card p-5 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.05)] ${
                      selectedAmenity === amenity.id
                        ? "ring-2 ring-[rgba(241,216,110,1)] bg-[rgba(255,255,255,0.08)]"
                        : ""
                    }`}
                    onClick={() => setSelectedAmenity(amenity.id)}
                  >
                    <div className="w-12 h-12 bg-[rgba(241,216,110,0.1)] rounded-full flex items-center justify-center mb-3">
                      <MapPin className="w-6 h-6 text-[rgba(241,216,110,1)]" />
                    </div>
                    <h3 className="text-white font-bold text-sm tracking-wide">
                      {amenity.name}
                    </h3>
                    <p className="text-white/40 text-xs mt-1">
                      {amenity.capacity
                        ? `Até ${amenity.capacity} pessoas`
                        : "Livre"}
                    </p>
                  </div>
                ))}

                {amenities.length === 0 && (
                  <div className="col-span-2 text-center p-8 glass-card rounded-3xl">
                    <p className="text-white/60">
                      Nenhum espaço cadastrado no seu condomínio ainda.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="pt-8">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedAmenity}
                className="w-full bg-[rgba(241,216,110,1)] hover:bg-[#d6be5e] text-[#031d24] rounded-full h-14 font-bold text-sm uppercase tracking-wide transition-all data-[disabled]:opacity-50 shadow-[0_4px_14px_rgba(241,216,110,0.3)] hover:shadow-[0_6px_20px_rgba(241,216,110,0.4)]"
              >
                Continuar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="glass-card p-6 rounded-3xl space-y-6">
              <div className="space-y-2">
                <label className="text-xs text-[rgba(241,216,110,1)] ml-1 mb-1 block uppercase font-bold tracking-wider">
                  Como quer chamar a vizinhança? *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Títulos descontraídos enchem mais rápido!"
                  className="w-full bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)] text-white h-14 rounded-2xl px-5 focus:border-[rgba(241,216,110,0.5)] transition-colors focus-visible:ring-0"
                />
                {formErrors.title && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.title}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {["⚽ Futsal dos Vizinhos", "🎾 Tênis Fim de Tarde", "🏖️ Beach Tennis & Resenha"].map(chip => (
                    <button
                      key={chip}
                      onClick={() => setTitle(chip)}
                      className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="text-xs text-white/50 ml-1 mb-1 block uppercase font-bold tracking-wider">
                    Data *
                  </label>
                  <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-minimal">
                    {Array.from({ length: 7 }).map((_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() + i);
                      const iso = d.toISOString().split("T")[0];
                      const isSelected = date === iso;
                      
                      // Semantic Heatmap mock based on day index (just for visual representation)
                      let availabilityColor = "bg-emerald-400";
                      if (i === 1 || i === 4) availabilityColor = "bg-amber-400"; // few slots
                      if (i === 2 || i === 6) availabilityColor = "bg-slate-500"; // full

                      const dayName = i === 0 ? "Hoje" : i === 1 ? "Amanhã" : d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }).replace('.', '');

                      return (
                        <button
                          key={iso}
                          onClick={() => setDate(iso)}
                          className={`flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-[72px] rounded-2xl border transition-all ${
                            isSelected 
                              ? "bg-[rgba(241,216,110,0.1)] border-[rgba(241,216,110,1)] text-[rgba(241,216,110,1)]" 
                              : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.05)] text-white hover:bg-[rgba(255,255,255,0.08)]"
                          }`}
                        >
                          <span className="text-xs font-bold uppercase mb-1">{dayName.split(',')[0]}</span>
                          <span className="text-lg font-black leading-none mb-2">{d.getDate()}</span>
                          <div className={`w-1.5 h-1.5 rounded-full ${availabilityColor}`}></div>
                        </button>
                      );
                    })}
                  </div>
                  {formErrors.date && (
                    <p className="text-red-400 text-xs mt-1">{formErrors.date}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 ml-1 mb-1 block uppercase font-bold tracking-wider">
                    Horário *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-4 w-5 h-5 text-white/40 pointer-events-none" />
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)] text-white h-14 rounded-2xl pl-12 pr-4 focus:border-[rgba(241,216,110,0.5)] transition-colors focus-visible:ring-0"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-white/50 ml-1 mb-1 block uppercase font-bold tracking-wider">
                  Limite de Vagas
                </label>
                <Input
                  type="number"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                  min="0"
                  max="200"
                  className="w-full bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)] text-white h-14 rounded-2xl px-5 focus:border-[rgba(241,216,110,0.5)] transition-colors focus-visible:ring-0"
                />
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mt-2">
                  <p className="text-emerald-400 text-xs">
                    💡 <strong>Dica de Mestre:</strong> Deixe 2 a 3 vagas abaixo do limite máximo do esporte. 
                    Isso ativa a Fila de Espera automática, desperta urgência e faz a galera confirmar presença bem mais rápido!
                  </p>
                </div>
                {formErrors.maxParticipants && (
                  <p className="text-red-400 text-xs mt-1">
                    {formErrors.maxParticipants}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 space-y-4 text-center">
              <Button
                onClick={handleCreateReservation}
                disabled={isSaving || !title || !date || !time}
                className="relative overflow-hidden w-full bg-[rgba(241,216,110,1)] hover:bg-[#d6be5e] text-[#031d24] rounded-full h-14 font-bold text-sm uppercase tracking-wide transition-all data-[disabled]:opacity-50 shadow-[0_4px_14px_rgba(241,216,110,0.3)] hover:shadow-[0_6px_20px_rgba(241,216,110,0.4)] active:scale-[0.97]"
              >
                <AnimatePresence mode="wait">
                  {isSaving ? (
                    <motion.div
                      key="saving"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="absolute inset-0 flex items-center justify-center bg-emerald-500 text-white"
                    >
                      <CheckCircle className="w-6 h-6 mr-2" />
                      Reservado
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      Confirmar Reserva
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
              <button
                onClick={() => setStep(1)}
                className="text-white/40 text-sm font-bold uppercase tracking-wide hover:text-white transition-colors"
              >
                Voltar Escolha do Espaço
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CreateEvent;