import React, { useState, useEffect } from "react";
import { ArrowLeft, UserPlus, Trash2, Search, FileText, Users } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Guest {
  id: string;
  guest_name: string;
  guest_document: string | null;
  created_at: string;
}

const GuestList = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState("");
  
  // Form state
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestDocument, setNewGuestDocument] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");

  // Check if user is event creator to allow editing
  const [isOrganizer, setIsOrganizer] = useState(false);

  useEffect(() => {
    if (!eventId || !user) return;
    
    fetchEventDetails();
    fetchGuests();
  }, [eventId, user]);

  const fetchEventDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("title, created_by")
        .eq("id", eventId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setEventTitle(data.title);
        setIsOrganizer(data.created_by === user?.id);
      }
    } catch (error) {
      console.error("Error fetching event details:", error);
    }
  };

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("guest_lists")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });
        
      if (error) throw error;
      
      setGuests(data || []);
    } catch (error) {
      console.error("Error fetching guests:", error);
      toast({
        title: "Erro ao buscar convidados",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
      
      // We will blindly insert the guest using Supabase client
      const { data, error } = await supabase
        .from("guest_lists")
        .insert({
          event_id: eventId,
          guest_name: newGuestName.trim(),
          guest_document: newGuestDocument.trim() || null
        })
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        setGuests([...guests, data]);
        setNewGuestName("");
        setNewGuestDocument("");
        
        toast({
          title: "Convidado adicionado",
          description: `${data.guest_name} foi adicionado à lista.`,
        });
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

  const handleRemoveGuest = async (guestId: string, guestName: string) => {
    if (!confirm(`Remover ${guestName} da lista?`)) return;
    
    try {
      const { error } = await supabase
        .from("guest_lists")
        .delete()
        .eq("id", guestId);
        
      if (error) throw error;
      
      setGuests(guests.filter(g => g.id !== guestId));
      
      toast({
        title: "Convidado removido",
        description: `${guestName} foi removido da lista.`,
      });
    } catch (error) {
      console.error("Error removing guest:", error);
      toast({
        title: "Erro ao remover",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const filteredGuests = guests.filter(guest => 
    guest.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (guest.guest_document && guest.guest_document.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[rgba(3,29,36,0.85)] backdrop-blur-md px-5 pt-12 pb-4 border-b border-[rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/event/${eventId}`)}
            className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Lista de Convidados</h1>
            <p className="text-white/50 text-xs truncate max-w-[250px]">{eventTitle}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Info card */}
        <div className="glass-card rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[rgba(241,216,110,0.1)] flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-[rgba(241,216,110,1)]" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Controle de Portaria</h3>
            <p className="text-white/60 text-xs mt-1 leading-relaxed">
              Adicione pessoas que não moram no condomínio. Esta lista ficará disponível na portaria no dia da sua reserva.
            </p>
          </div>
        </div>

        {/* Add Guest Form (Only for organizers) */}
        {isOrganizer && (
          <form onSubmit={handleAddGuest} className="glass-card rounded-3xl p-6 space-y-5">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[rgba(241,216,110,1)]" />
              Novo Convidado
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/50 ml-1 mb-1 block uppercase font-bold tracking-wider">Nome completo *</label>
                <input 
                  type="text"
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-[rgba(241,216,110,0.5)] transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="text-xs text-white/50 ml-1 mb-1 block uppercase font-bold tracking-wider">RG / CPF (Opcional)</label>
                <input 
                  type="text"
                  value={newGuestDocument}
                  onChange={(e) => setNewGuestDocument(e.target.value)}
                  placeholder="Documento para verificação"
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-[rgba(241,216,110,0.5)] transition-colors"
                />
              </div>

              <button 
                type="submit" 
                disabled={isAdding || !newGuestName.trim()}
                className="w-full bg-[rgba(241,216,110,1)] hover:bg-[#d6be5e] text-[#031d24] rounded-full py-4 font-bold text-sm uppercase tracking-wide transition-all disabled:opacity-50 mt-2 shadow-[0_4px_14px_rgba(241,216,110,0.3)] hover:shadow-[0_6px_20px_rgba(241,216,110,0.4)]"
              >
                {isAdding ? "Adicionando..." : "Adicionar à Lista"}
              </button>
            </div>
          </form>
        )}

        {/* Guests List */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-lg">
              Convidados ({guests.length})
            </h3>
          </div>
          
          {guests.length > 0 && (
            <div className="relative">
              <Search className="w-5 h-5 text-white/40 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar convidado na lista..."
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] focus:border-[rgba(241,216,110,0.5)] rounded-2xl pl-12 pr-4 py-3 text-white text-sm transition-colors focus:outline-none backdrop-blur-sm"
              />
            </div>
          )}

          {loading ? (
             <div className="text-center py-10">
               <div className="w-8 h-8 border-2 border-[rgba(241,216,110,1)] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
               <p className="text-white/50 text-sm">Carregando lista de convidados...</p>
             </div>
          ) : guests.length === 0 ? (
            <div className="text-center py-12 glass-card rounded-3xl">
              <div className="w-16 h-16 bg-[rgba(255,255,255,0.05)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-white/80 font-bold">A lista está vazia</p>
              {isOrganizer && (
                <p className="text-white/40 text-sm mt-2 px-8">
                  Adicione visitantes que não moram no condomínio acima.
                </p>
              )}
            </div>
          ) : filteredGuests.length === 0 ? (
             <div className="text-center py-10 glass-card rounded-3xl">
               <p className="text-white/60 text-sm">Nenhum convidado encontrado na busca.</p>
             </div>
          ) : (
            <div className="space-y-3">
              {filteredGuests.map((guest, index) => (
                <div 
                  key={guest.id} 
                  className="glass-card rounded-2xl p-4 flex items-center justify-between hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center flex-shrink-0">
                      <span className="text-white/70 font-bold text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <div className="truncate">
                      <p className="text-white text-base font-bold truncate">{guest.guest_name}</p>
                      {guest.guest_document && (
                        <p className="text-white/40 text-xs">Doc: {guest.guest_document}</p>
                      )}
                    </div>
                  </div>
                  
                  {isOrganizer && (
                    <button 
                      onClick={() => handleRemoveGuest(guest.id, guest.guest_name)}
                      className="p-3 text-white/30 hover:text-red-400 hover:bg-red-400/10 hover:shadow-lg rounded-full transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestList;
