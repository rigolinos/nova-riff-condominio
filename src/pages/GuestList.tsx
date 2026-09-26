import React, { useState, useEffect } from "react";
import { ArrowLeft, UserPlus, Trash2, Search, FileText, Users, QrCode } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { GuestPassModal } from "@/components/GuestPassModal";
import { Button } from "@/components/ui/button";

interface Guest {
  id: string;
  guest_name: string;
  guest_document: string | null;
  pass_token: string;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  created_at: string;
  valid_from: string;
  valid_until: string;
}

const GuestList = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  
  // Form state
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestDocument, setNewGuestDocument] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [bulkGuests, setBulkGuests] = useState("");
  const [addMode, setAddMode] = useState<"single" | "bulk">("single");
  
  const [searchTerm, setSearchTerm] = useState("");

  // Check if user is event creator to allow editing
  const [isOrganizer, setIsOrganizer] = useState(false);

  // Modal pass state
  const [selectedPass, setSelectedPass] = useState<Guest | null>(null);

  useEffect(() => {
    if (!eventId || !user) return;
    
    fetchEventDetails();
    fetchGuests();
  }, [eventId, user]);

  const fetchEventDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("title, created_by, date, time")
        .eq("id", eventId)
        .single();
        
      if (error) throw error;
      if (data) {
        setEventTitle(data.title);
        setEventDate(data.date);
        setEventTime(data.time);
        setIsOrganizer(data.created_by === user?.id);
      }
    } catch (error) {
      console.error("Error fetching event:", error);
    }
  };

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("guest_passes")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      setGuests(data || []);
    } catch (error) {
      console.error("Error fetching guests:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de convidados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getValidTimes = () => {
    const start = new Date(`${eventDate}T${eventTime}Z`);
    // Pass is valid 1 hour before the event
    const validFrom = new Date(start.getTime() - 60 * 60 * 1000);
    // Pass expires 4 hours after event start
    const validUntil = new Date(start.getTime() + 4 * 60 * 60 * 1000);
    return { valid_from: validFrom.toISOString(), valid_until: validUntil.toISOString() };
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do convidado.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAdding(true);
      const { valid_from, valid_until } = getValidTimes();
      
      const { data, error } = await supabase
        .from("guest_passes")
        .insert({
          event_id: eventId,
          created_by: user?.id,
          guest_name: newGuestName.trim(),
          guest_document: newGuestDocument.trim() || null,
          status: 'active',
          valid_from,
          valid_until
        })
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        setGuests([data, ...guests]);
        setNewGuestName("");
        setNewGuestDocument("");
        
        toast({
          title: "Convidado adicionado",
          description: `${data.guest_name} foi adicionado à lista.`,
        });

        // Show Modal with Pass
        setSelectedPass(data);
      }
    } catch (error: any) {
      console.error("Error adding guest:", error);
      toast({
        title: "Erro ao adicionar",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkGuests.trim()) return;
    
    setIsAdding(true);
    const names = bulkGuests.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    
    try {
      const { valid_from, valid_until } = getValidTimes();
      const inserts = names.map(name => ({
        event_id: eventId,
        created_by: user?.id,
        guest_name: name,
        status: 'active',
        valid_from,
        valid_until
      }));
      
      const { data, error } = await supabase
        .from("guest_passes")
        .insert(inserts)
        .select();
        
      if (error) throw error;
      
      if (data) {
        setGuests([...data, ...guests]);
        setBulkGuests("");
        setAddMode("single");
        
        toast({
          title: "Convidados adicionados",
          description: `${names.length} convidados foram adicionados à lista.`,
        });
      }
    } catch (error: any) {
      console.error("Error adding multiple guests:", error);
      toast({
        title: "Erro ao adicionar",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    try {
      const { error } = await supabase
        .from("guest_passes")
        .delete()
        .eq("id", guestId);
        
      if (error) throw error;
      
      setGuests(guests.filter(g => g.id !== guestId));
      toast({
        title: "Convidado removido",
        description: "O convidado foi removido da lista.",
      });
    } catch (error) {
      console.error("Error deleting guest:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o convidado.",
        variant: "destructive",
      });
    }
  };

  const filteredGuests = guests.filter(guest => 
    guest.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (guest.guest_document && guest.guest_document.includes(searchTerm))
  );

  return (
    <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto relative overflow-hidden font-sans flex flex-col">
      <header className="px-5 pt-12 pb-6 border-b border-[rgba(255,255,255,0.05)] sticky top-0 bg-[rgba(3,29,36,0.95)] backdrop-blur-md z-10 flex items-center justify-between">
        <button
          onClick={() => navigate(`/event/${eventId}`)}
          className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[rgba(238,243,243,1)] hover:bg-[rgba(255,255,255,0.1)] transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-[rgba(238,243,243,1)] font-bold text-lg truncate px-2">
          Lista de Convidados
        </span>
        <div className="w-10"></div>
      </header>

      <main className="p-5 pb-24 flex-1 overflow-y-auto">
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-2xl p-4 mb-6">
          <p className="text-[rgba(238,243,243,0.6)] text-xs font-bold uppercase tracking-wider mb-1">Evento</p>
          <h2 className="text-[rgba(238,243,243,1)] font-bold text-lg truncate">{eventTitle}</h2>
        </div>

        {isOrganizer && (
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-2xl p-5 mb-8">
            <div className="flex gap-2 mb-5">
              <button
                type="button"
                onClick={() => setAddMode("single")}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${addMode === "single" ? "bg-[rgba(241,216,110,1)] text-black" : "bg-transparent text-white/60 hover:text-white"}`}
              >
                Adicionar Um
              </button>
              <button
                type="button"
                onClick={() => setAddMode("bulk")}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${addMode === "bulk" ? "bg-[rgba(241,216,110,1)] text-black" : "bg-transparent text-white/60 hover:text-white"}`}
              >
                Lote (Vários)
              </button>
            </div>

            {addMode === "single" ? (
              <form onSubmit={handleAddGuest} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={newGuestName}
                    onChange={(e) => setNewGuestName(e.target.value)}
                    placeholder="Nome completo do convidado"
                    className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-[rgba(238,243,243,1)] placeholder-[rgba(238,243,243,0.3)] focus:outline-none focus:border-[rgba(241,216,110,0.5)] transition-colors"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newGuestDocument}
                    onChange={(e) => setNewGuestDocument(e.target.value)}
                    placeholder="RG ou CPF (Opcional)"
                    className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-[rgba(238,243,243,1)] placeholder-[rgba(238,243,243,0.3)] focus:outline-none focus:border-[rgba(241,216,110,0.5)] transition-colors"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!newGuestName.trim() || isAdding}
                  className="w-full h-12 rounded-xl bg-[rgba(241,216,110,1)] hover:bg-[#d6be5e] text-[#031d24] font-bold disabled:opacity-50"
                >
                  {isAdding ? "Adicionando..." : "Gerar Passe e Adicionar"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleBulkAdd} className="space-y-4">
                <div>
                  <label className="text-[rgba(238,243,243,0.6)] text-xs mb-2 block">
                    Cole os nomes (um por linha):
                  </label>
                  <textarea
                    value={bulkGuests}
                    onChange={(e) => setBulkGuests(e.target.value)}
                    placeholder={`João Silva\nMaria Souza\nPedro Santos`}
                    className="w-full h-32 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-[rgba(238,243,243,1)] placeholder-[rgba(238,243,243,0.3)] focus:outline-none focus:border-[rgba(241,216,110,0.5)] transition-colors resize-none"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!bulkGuests.trim() || isAdding}
                  className="w-full h-12 rounded-xl bg-[rgba(241,216,110,1)] hover:bg-[#d6be5e] text-[#031d24] font-bold disabled:opacity-50"
                >
                  {isAdding ? "Adicionando..." : "Adicionar em Lote"}
                </Button>
              </form>
            )}
          </div>
        )}

        <div className="mb-6 flex items-center bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3">
          <Search size={18} className="text-[rgba(238,243,243,0.4)] mr-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar convidado..."
            className="flex-1 bg-transparent border-none outline-none text-[rgba(238,243,243,1)] placeholder-[rgba(238,243,243,0.3)]"
          />
        </div>

        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-[rgba(238,243,243,1)] font-bold text-lg flex items-center">
            <Users size={18} className="mr-2 text-[rgba(241,216,110,1)]" />
            Lista Atual
          </h3>
          <span className="text-[rgba(238,243,243,0.5)] text-sm font-medium">
            {filteredGuests.length} convidados
          </span>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="w-8 h-8 border-2 border-[rgba(241,216,110,1)] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-[rgba(238,243,243,0.5)]">Carregando lista...</p>
          </div>
        ) : filteredGuests.length > 0 ? (
          <div className="space-y-3">
            {filteredGuests.map((guest) => (
              <div 
                key={guest.id} 
                className="flex items-center justify-between bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-2xl p-4"
              >
                <div>
                  <p className="text-[rgba(238,243,243,1)] font-bold mb-1">{guest.guest_name}</p>
                  {guest.guest_document && (
                    <p className="text-[rgba(238,243,243,0.5)] text-xs flex items-center">
                      <FileText size={12} className="mr-1" />
                      {guest.guest_document}
                    </p>
                  )}
                  {guest.status === 'used' ? (
                     <span className="mt-2 inline-block text-[10px] uppercase font-bold tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">Já Acessou</span>
                  ) : (
                     <span className="mt-2 inline-block text-[10px] uppercase font-bold tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Liberado</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedPass(guest)}
                    className="p-2 text-white/40 hover:text-white transition-colors bg-white/5 rounded-lg"
                    title="Ver Passe/QR"
                  >
                    <QrCode size={18} />
                  </button>
                  {isOrganizer && (
                    <button 
                      onClick={() => handleDeleteGuest(guest.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors bg-white/5 rounded-lg"
                      title="Remover"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-[rgba(255,255,255,0.02)] rounded-2xl border border-[rgba(255,255,255,0.05)]">
            <div className="w-16 h-16 bg-[rgba(255,255,255,0.05)] rounded-full flex items-center justify-center mx-auto mb-3">
              <Users size={24} className="text-[rgba(238,243,243,0.3)]" />
            </div>
            <p className="text-[rgba(238,243,243,0.5)]">
              {searchTerm ? "Nenhum convidado encontrado na busca." : "Nenhum convidado adicionado ainda."}
            </p>
          </div>
        )}
      </main>

      {/* MODAL DE PASSE */}
      {selectedPass && (
        <GuestPassModal 
          pass={selectedPass as any}
          eventTitle={eventTitle}
          onClose={() => setSelectedPass(null)} 
        />
      )}
    </div>
  );
};

export default GuestList;
