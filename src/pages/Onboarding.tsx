import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, KeyRound, Search, Plus, ArrowRight, Loader2, Copy, Check, MapPin, Navigation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCondominiumId } from "@/hooks/useCondominiumId";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { PhotoUploader } from "@/components/PhotoUploader";

type OnboardingStep = "discover" | "verify" | "create" | "profile" | "success";

interface Condominium {
  id: string;
  name: string;
  address?: string;
  city?: string;
  distance_km?: number;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refetch } = useCondominiumId();

  const [step, setStep] = useState<OnboardingStep>("discover");
  const [isLoading, setIsLoading] = useState(false);

  // Geo state
  const [coords, setCoords] = useState<{lat: number; lng: number} | null>(null);
  const [geoStatus, setGeoStatus] = useState<"loading" | "granted" | "denied">("loading");
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCondo, setSelectedCondo] = useState<Condominium | null>(null);

  // Verification state
  const [inviteCode, setInviteCode] = useState("");

  // Create state
  const [newCondoName, setNewCondoName] = useState("");
  const [newCondoAddress, setNewCondoAddress] = useState("");
  const [newCondoCity, setNewCondoCity] = useState("");
  const [newCondoPhotoUrl, setNewCondoPhotoUrl] = useState("");

  // Profile state
  const [blockNumber, setBlockNumber] = useState("");
  const [aptNumber, setAptNumber] = useState("");
  const [phone, setPhone] = useState("");

  // Success state
  const [successData, setSuccessData] = useState<{ name: string; inviteCode?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (step === "discover" && geoStatus === "loading") {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCoords({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setGeoStatus("granted");
          },
          (error) => {
            console.warn("Geolocation denied or error:", error);
            setGeoStatus("denied");
          }
        );
      } else {
        setGeoStatus("denied");
      }
    }
  }, [step, geoStatus]);

  const { data: nearbyCondos = [], isLoading: isLoadingNearby } = useQuery({
    queryKey: ["condominiums", "nearby", coords],
    queryFn: async () => {
      if (!coords) return [];
      const { data, error } = await supabase.rpc("get_nearby_condominiums", {
        user_lat: coords.lat,
        user_lng: coords.lng,
        radius_km: 10
      });
      if (error) {
        console.error(error);
        return [];
      }
      return (data as any) || [];
    },
    enabled: geoStatus === "granted" && !!coords && searchQuery === "",
  });

  const { data: searchCondos = [], isLoading: isLoadingSearch } = useQuery({
    queryKey: ["condominiums", "search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 3) return [];
      const { data, error } = await supabase
        .from("condominiums")
        .select("id, name, address, city")
        .ilike("name", `%${searchQuery}%`)
        .limit(10);
      if (error) throw error;
      return (data as Condominium[]) || [];
    },
    enabled: searchQuery.length >= 3,
  });

  const displayedCondos = searchQuery.length >= 3 ? searchCondos : (geoStatus === "granted" ? nearbyCondos : []);

  const handleSelectCondo = (condo: Condominium) => {
    setSelectedCondo(condo);
    setStep("verify");
  };

  const handleVerifyCode = async () => {
    if (!inviteCode.trim() || !user?.id || !selectedCondo) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("join_condominium_by_code", {
        p_invite_code: inviteCode.trim().toUpperCase(),
        p_user_id: user.id,
      });
      if (error) throw error;
      const result = data as any;
      if (!result.success) {
        toast.error("Código incorreto ou inválido para este condomínio.");
        return;
      }
      toast.success("Condomínio verificado com sucesso!");
      await refetch();
      setStep("profile");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao verificar código.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCondominium = async () => {
    if (!newCondoName.trim() || !user?.id) return;
    setIsLoading(true);
    try {
      const payload: any = {
        p_name: newCondoName.trim(),
        p_address: newCondoAddress.trim() || null,
        p_city: newCondoCity.trim() || null,
        p_creator_id: user.id,
      };
      if (coords) {
        payload.p_lat = coords.lat;
        payload.p_lng = coords.lng;
      }
      
      const { data, error } = await supabase.rpc("create_condominium_with_seed", payload);
      
      if (error) throw error;
      
      const result = data as any;
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      // If photo was uploaded, update the condominium directly
      if (newCondoPhotoUrl) {
        await supabase
          .from("condominiums")
          .update({ photo_url: newCondoPhotoUrl })
          .eq("id", result.condominium_id || data.id); // depending on how rpc returns id
      }
      
      setSuccessData({ name: result.name, inviteCode: result.invite_code });
      toast.success(result.message);
      await refetch();
      setStep("success");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar condomínio. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!blockNumber.trim() && !aptNumber.trim()) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          block_number: blockNumber.trim(),
          apt_number: aptNumber.trim(),
          phone: phone.trim() || null,
        })
        .eq("user_id", user?.id);

      if (error) throw error;
      
      toast.success("Perfil completo! Bem-vindo ao Riff.");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar perfil.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (successData?.inviteCode) {
      navigator.clipboard.writeText(successData.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Código copiado!");
    }
  };

  return (
    <main className="bg-[rgba(3,29,36,1)] flex min-h-screen flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-[32px] p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[rgba(241,216,110,0.1)] rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-[rgba(241,216,110,1)]" />
          </div>
          
          {step === "success" && (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Condomínio Criado!</h1>
              <p className="text-white/60 text-center text-sm mb-6">
                Compartilhe o código abaixo com seus vizinhos para que eles entrem no {successData?.name}.
              </p>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full text-center mb-6">
                <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Código de Convite</p>
                <div className="text-4xl font-black text-[rgba(241,216,110,1)] tracking-widest mb-4">
                  {successData?.inviteCode}
                </div>
                <Button 
                  onClick={handleCopyCode} 
                  variant="outline" 
                  className="w-full bg-white/10 border-white/20 hover:bg-white/20 text-white rounded-xl h-12"
                >
                  {copied ? <Check className="w-4 h-4 mr-2 text-green-400" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? "Copiado!" : "Copiar Código"}
                </Button>
              </div>
              <Button
                onClick={() => setStep("profile")}
                className="w-full h-14 rounded-full bg-[rgba(241,216,110,1)] hover:bg-[#d6be5e] text-[#031d24] font-bold text-base"
              >
                Completar meu Perfil
              </Button>
            </>
          )}

          {step === "discover" && (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Encontre seu Condomínio</h1>
              <p className="text-white/60 text-sm text-center mb-6">
                {geoStatus === "loading" ? "Buscando sua localização..." : 
                 geoStatus === "granted" ? "Mostrando os condomínios mais próximos de você." : 
                 "Busque pelo nome do condomínio."}
              </p>

              <div className="relative w-full mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <Input
                  type="text"
                  placeholder="Buscar condomínio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/30"
                />
              </div>

              <div className="w-full space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {(isLoadingNearby || isLoadingSearch) ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 text-[rgba(241,216,110,1)] animate-spin" />
                  </div>
                ) : displayedCondos.length > 0 ? (
                  displayedCondos.map((condo: any) => (
                    <button
                      key={condo.id}
                      onClick={() => handleSelectCondo(condo)}
                      className="w-full flex items-center p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mr-4 shrink-0">
                        {condo.distance_km !== undefined ? (
                          <Navigation className="w-5 h-5 text-[rgba(241,216,110,1)]" />
                        ) : (
                          <MapPin className="w-5 h-5 text-white/60" />
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <h3 className="text-white font-bold text-sm truncate">{condo.name}</h3>
                        <p className="text-white/40 text-xs truncate mt-0.5">
                          {condo.distance_km !== undefined 
                            ? `A ${(condo.distance_km * 1000).toFixed(0)}m de você` 
                            : (condo.city || "Condomínio no Riff")}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white/60 ml-2 shrink-0 transition-colors" />
                    </button>
                  ))
                ) : searchQuery.length >= 3 ? (
                  <p className="text-center text-white/40 py-8 text-sm">Nenhum condomínio encontrado.</p>
                ) : null}
              </div>

              <div className="w-full mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={() => setStep("create")}
                  className="w-full flex items-center p-4 bg-[rgba(241,216,110,0.1)] hover:bg-[rgba(241,216,110,0.15)] border border-[rgba(241,216,110,0.2)] rounded-2xl transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-[rgba(241,216,110,0.2)] flex items-center justify-center mr-4 shrink-0">
                    <Plus className="w-5 h-5 text-[rgba(241,216,110,1)]" />
                  </div>
                  <div>
                    <h3 className="text-[rgba(241,216,110,1)] font-bold text-sm">Cadastrar meu Condomínio</h3>
                    <p className="text-[rgba(241,216,110,0.7)] text-xs mt-0.5">Seja o primeiro do seu prédio</p>
                  </div>
                </button>
              </div>
            </>
          )}

          {step === "verify" && (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Segurança</h1>
              <p className="text-white/60 text-sm text-center mb-6">
                Você selecionou o <strong>{selectedCondo?.name}</strong>. Para confirmar que você é morador, digite o código de convite do condomínio.
              </p>
              
              <div className="w-full space-y-6">
                <div>
                  <label className="text-xs text-white/50 uppercase font-bold tracking-wider ml-1">Código de Convite</label>
                  <Input
                    placeholder="EX: A1B2C3"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="mt-2 h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/20 text-center tracking-widest font-mono text-xl"
                    maxLength={6}
                  />
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={handleVerifyCode}
                    disabled={inviteCode.length < 5 || isLoading}
                    className="w-full h-14 rounded-full bg-[rgba(241,216,110,1)] hover:bg-[#d6be5e] text-[#031d24] font-bold text-base disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verificar e Entrar"}
                  </Button>
                  <button onClick={() => setStep("discover")} className="w-full text-center text-white/40 text-sm hover:text-white/60 transition-colors">
                    Voltar
                  </button>
                </div>
              </div>
            </>
          )}

          {step === "create" && (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Novo Condomínio</h1>
              <p className="text-white/60 text-sm text-center mb-6">
                Seja o pioneiro! Cadastre o prédio e convide seus vizinhos.
              </p>
              
              <div className="w-full space-y-4">
                <div>
                  <label className="text-xs text-white/50 uppercase font-bold tracking-wider ml-1">Nome do Condomínio *</label>
                  <Input
                    placeholder="Ex: Residencial Solar"
                    value={newCondoName}
                    onChange={(e) => setNewCondoName(e.target.value)}
                    className="mt-2 h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase font-bold tracking-wider ml-1">Endereço</label>
                  <Input
                    placeholder="Rua, Número"
                    value={newCondoAddress}
                    onChange={(e) => setNewCondoAddress(e.target.value)}
                    className="mt-2 h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase font-bold tracking-wider ml-1">Cidade</label>
                  <Input
                    placeholder="Ex: São Paulo"
                    value={newCondoCity}
                    onChange={(e) => setNewCondoCity(e.target.value)}
                    className="mt-2 h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/20"
                  />
                </div>
                <div className="py-2">
                  <label className="text-xs text-white/50 uppercase font-bold tracking-wider ml-1 mb-2 block">Foto do Condomínio</label>
                  <PhotoUploader
                    bucketName="amenities"
                    folderPath="condominiums"
                    onUploadSuccess={setNewCondoPhotoUrl}
                    currentPhotoUrl={newCondoPhotoUrl}
                  />
                </div>
                
                <div className="pt-4 space-y-3">
                  <Button
                    onClick={handleCreateCondominium}
                    disabled={!newCondoName.trim() || isLoading}
                    className="w-full h-14 rounded-full bg-[rgba(241,216,110,1)] hover:bg-[#d6be5e] text-[#031d24] font-bold text-base disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Criar Condomínio"}
                  </Button>
                  <button onClick={() => setStep("discover")} className="w-full text-center text-white/40 text-sm hover:text-white/60 transition-colors">
                    Voltar para Busca
                  </button>
                </div>
              </div>
            </>
          )}

          {step === "profile" && (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Último passo!</h1>
              <p className="text-white/60 text-sm text-center mb-6">
                Como os vizinhos e a portaria vão te encontrar?
              </p>
              
              <div className="w-full space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-white/50 uppercase font-bold tracking-wider ml-1">Bloco/Torre</label>
                    <Input
                      placeholder="Ex: A"
                      value={blockNumber}
                      onChange={(e) => setBlockNumber(e.target.value)}
                      className="mt-2 h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/20"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-white/50 uppercase font-bold tracking-wider ml-1">Apto *</label>
                    <Input
                      placeholder="Ex: 104"
                      value={aptNumber}
                      onChange={(e) => setAptNumber(e.target.value)}
                      className="mt-2 h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/20"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-white/50 uppercase font-bold tracking-wider ml-1">WhatsApp</label>
                  <Input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-2 h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/20"
                  />
                </div>
                
                <div className="pt-4">
                  <Button
                    onClick={handleCompleteProfile}
                    disabled={(!blockNumber && !aptNumber) || isLoading}
                    className="w-full h-14 rounded-full bg-[rgba(241,216,110,1)] hover:bg-[#d6be5e] text-[#031d24] font-bold text-base disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Concluir Cadastro"}
                  </Button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </main>
  );
}
