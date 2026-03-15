import React, { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Clock, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Amenity {
  id: string;
  name: string;
  capacity: number | null;
}

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [selectedAmenity, setSelectedAmenity] = useState<string | null>(null);
  const [condominiumId, setCondominiumId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form Data
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [maxPlayers, setMaxPlayers] = useState<string>("4");

  useEffect(() => {
    const fetchAmenities = async () => {
      if (!user) return;
      
      try {
        // Get user's condominium
        const { data: profile } = await supabase
          .from("profiles")
          .select("condominium_id")
          .eq("id", user.id)
          .single();

        if (profile?.condominium_id) {
          setCondominiumId(profile.condominium_id);
          // Fetch amenities for this condo
          const { data: condoAmenities } = await supabase
            .from("amenities")
            .select("*")
            .eq("condominium_id", profile.condominium_id);

          if (condoAmenities) setAmenities(condoAmenities);
        }
      } catch (error) {
        console.error("Error fetching amenities:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAmenities();
  }, [user]);

  const handleCreateReservation = async () => {
    if (!user || !condominiumId || !selectedAmenity || !date || !time || !title) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("events").insert({
        title,
        date,
        time,
        amenity_id: selectedAmenity,
        condominium_id: condominiumId,
        created_by: user.id,
        location: amenities.find(a => a.id === selectedAmenity)?.name || 'Condomínio',
        max_participants: parseInt(maxPlayers),
        status: 'active',
        sport_id: null // We could add a sport selector later, but keeping it simple for the MVP reservation flow
      });

      if (error) throw error;

      toast({ title: "Reserva criada com sucesso!" });
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao criar reserva", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getStepText = () => {
    if (step === 1) return "Escolha o Espaço";
    if (step === 2) return "Data e Hora";
    return "";
  };

  return (
    <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto pb-28">
      <div className="sticky top-0 z-20 bg-[rgba(3,29,36,0.85)] backdrop-blur-md px-5 pt-12 pb-4 border-b border-[rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => step === 1 ? navigate("/dashboard") : setStep(1)}
            className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Nova Reserva</h1>
            <p className="text-white/50 text-xs">Passo {step} de 2: {getStepText()}</p>
          </div>
        </div>
      </div>

      <main className="p-5">
        {isLoading && step === 1 ? (
          <div className="flex justify-center p-10"><div className="animate-spin w-8 h-8 border-4 border-dashboard-accent border-t-transparent rounded-full" /></div>
        ) : step === 1 ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-white font-bold text-lg mb-4">Onde você quer acessar?</h2>
            <div className="grid grid-cols-2 gap-4">
              {amenities.map(amenity => (
                <div 
                  key={amenity.id} 
                  className={`glass-card p-5 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.05)] ${selectedAmenity === amenity.id ? 'ring-2 ring-[rgba(241,216,110,1)] bg-[rgba(255,255,255,0.08)]' : ''}`}
                  onClick={() => setSelectedAmenity(amenity.id)}
                >
                  <div className="w-12 h-12 bg-[rgba(241,216,110,0.1)] rounded-full flex items-center justify-center mb-3">
                    <MapPin className="w-6 h-6 text-[rgba(241,216,110,1)]" />
                  </div>
                  <h3 className="text-white font-bold text-sm tracking-wide">{amenity.name}</h3>
                  <p className="text-white/40 text-xs mt-1">{amenity.capacity ? `Até ${amenity.capacity} pessoas` : 'Livre'}</p>
                </div>
              ))}
              
              {amenities.length === 0 && (
                <div className="col-span-2 text-center p-8 glass-card rounded-3xl">
                  <p className="text-white/60">Nenhum espaço cadastrado no seu condomínio ainda.</p>
                </div>
              )}
            </div>

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
                <label className="text-xs text-white/50 ml-1 mb-1 block uppercase font-bold tracking-wider">Nome da Atividade *</label>
                <Input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Tênis Duplas, Festa no Salão..."
                  className="w-full bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)] text-white h-14 rounded-2xl px-5 focus:border-[rgba(241,216,110,0.5)] transition-colors focus-visible:ring-0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-white/50 ml-1 mb-1 block uppercase font-bold tracking-wider">Data *</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-4 w-5 h-5 text-white/40 pointer-events-none" />
                    <Input 
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)] text-white h-14 rounded-2xl pl-12 pr-4 focus:border-[rgba(241,216,110,0.5)] transition-colors focus-visible:ring-0 min-w-0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 ml-1 mb-1 block uppercase font-bold tracking-wider">Horário *</label>
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
                <label className="text-xs text-white/50 ml-1 mb-1 block uppercase font-bold tracking-wider">Convidados Extras (Máximo)</label>
                <Input 
                  type="number"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                  min="0"
                  className="w-full bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)] text-white h-14 rounded-2xl px-5 focus:border-[rgba(241,216,110,0.5)] transition-colors focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="pt-4 space-y-4 text-center">
              <Button 
                onClick={handleCreateReservation} 
                disabled={isLoading || !title || !date || !time}
                className="w-full bg-[rgba(241,216,110,1)] hover:bg-[#d6be5e] text-[#031d24] rounded-full h-14 font-bold text-sm uppercase tracking-wide transition-all data-[disabled]:opacity-50 shadow-[0_4px_14px_rgba(241,216,110,0.3)] hover:shadow-[0_6px_20px_rgba(241,216,110,0.4)]"
              >
                {isLoading ? "Confirmando..." : "Confirmar Reserva"}
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