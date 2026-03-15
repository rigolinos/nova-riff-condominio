import React, { useState, useEffect } from "react";
import { DoorOpen, CheckCircle, Clock, Search, ShieldCheck, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventWithGuests {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  creator_name: string;
  creator_apt: string;
  creator_block: string;
  guests: Guest[];
}

interface Guest {
  id: string;
  guest_name: string;
  guest_document: string | null;
  status: 'pending' | 'checked_in';
  checkin_time: string | null;
}

const PortariaDashboard = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<EventWithGuests[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventWithGuests | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchTodayEvents();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchTodayEvents = async () => {
    try {
      setLoading(true);
      
      // Get today's start and end in ISO
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch all upcoming events for the condominium
      // For a real app, we filter by the logged-in user's condominium.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('condominium_id')
        .eq('id', user.id)
        .single();

      if (!profile?.condominium_id) return;

      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          id, title, date, time, location,
          profiles:created_by (full_name, block_number, apt_number)
        `)
        .eq('condominium_id', profile.condominium_id)
        .gte('date', today.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (eventsError) throw eventsError;

      if (!eventsData || eventsData.length === 0) {
        setEvents([]);
        return;
      }

      const eventIds = eventsData.map(e => e.id);

      // Fetch guests for all these events
      const { data: guestsData, error: guestsError } = await supabase
        .from('guest_lists')
        .select('*')
        .in('event_id', eventIds);

      // If the column 'status' doesn't exist yet, this might ignore it, we assume it'll return gracefully or we handle it
      if (guestsError && guestsError.code !== '42703') throw guestsError; // Ignore missing column error for now if not applied

      // Map events and guests
      const mappedEvents: EventWithGuests[] = eventsData.map((e: any) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        time: e.time,
        location: e.location,
        creator_name: e.profiles?.full_name || 'Desconhecido',
        creator_apt: e.profiles?.apt_number || '',
        creator_block: e.profiles?.block_number || '',
        guests: (guestsData || [])
            .filter((g: any) => g.event_id === e.id)
            .map((g: any) => ({
              id: g.id,
              guest_name: g.guest_name,
              guest_document: g.guest_document,
              // Fallbacks if the column is missing
              status: g.status || 'pending',
              checkin_time: g.checkin_time || null
            }))
      }));

      // Only show events that have guests
      setEvents(mappedEvents.filter(e => e.guests.length > 0));

    } catch (error) {
      console.error("Error fetching portaria data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (guestId: string, eventId: string) => {
    try {
      // Optimistic UI Update MOCK
      const updatedEvents = events.map(ev => {
        if (ev.id === eventId) {
          return {
            ...ev,
            guests: ev.guests.map(g => 
              g.id === guestId 
                ? { ...g, status: 'checked_in' as const, checkin_time: new Date().toISOString() }
                : g
            )
          };
        }
        return ev;
      });
      setEvents(updatedEvents);
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent(updatedEvents.find(e => e.id === eventId) || null);
      }

      // Supabase update
      const { error } = await supabase
        .from('guest_lists')
        .update({ 
          status: 'checked_in',
          checkin_time: new Date().toISOString()
        } as any)
        .eq('id', guestId);

      if (error) {
        // Revert 
        fetchTodayEvents();
        if (error.code === '42703') {
           toast({
               title: "Erro de Banco",
               description: "A coluna status ainda não foi adicionada no banco de dados.",
               variant: "destructive"
           });
        } else {
           throw error;
        }
      } else {
        toast({
          title: "Check-in Registrado",
          description: "Entrada liberada e notificada com sucesso.",
        });
      }

    } catch (error) {
      console.error("Checkin error:", error);
      toast({
        title: "Erro ao dar baixa",
        description: "Verifique sua conexão ou tabela.",
        variant: "destructive"
      });
    }
  };

  const filteredGuests = selectedEvent?.guests.filter(g => 
    g.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (g.guest_document && g.guest_document.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  return (
    <div className="min-h-screen bg-[rgba(3,29,36,1)] flex flex-col md:flex-row">
      
      {/* Sidebar: Eventos do Dia */}
      <div className="w-full md:w-1/3 lg:w-1/4 border-r border-[#ffffff10] bg-[rgba(255,255,255,0.02)] flex flex-col max-h-screen overflow-y-auto">
        <div className="p-6 sticky top-0 bg-[rgba(3,29,36,0.95)] backdrop-blur-xl z-10 border-b border-[#ffffff10]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[rgba(241,216,110,0.15)] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[rgba(241,216,110,1)]" />
            </div>
            <div>
              <h1 className="text-white font-black text-xl leading-none">Portaria</h1>
              <p className="text-white/50 text-xs font-bold uppercase tracking-wider mt-1">{format(currentTime, "HH:mm - dd 'de' MMMM", { locale: ptBR })}</p>
            </div>
          </div>
          
          <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Eventos com Convidados</h2>
        </div>

        <div className="p-4 flex-1 space-y-3">
          {loading ? (
            <div className="text-center py-10">
               <div className="w-8 h-8 border-2 border-[rgba(241,216,110,1)] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
               <p className="text-white/40 text-sm">Carregando listas...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-10 px-4 glass-card rounded-3xl">
              <DoorOpen className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/60 text-sm font-medium">Nenhum evento com convidados para hoje.</p>
            </div>
          ) : (
            events.map(event => {
              const checkedInCount = event.guests.filter(g => g.status === 'checked_in').length;
              const isSelected = selectedEvent?.id === event.id;
              
              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`w-full text-left p-4 rounded-2xl transition-all border ${
                    isSelected 
                      ? 'bg-[rgba(241,216,110,0.1)] border-[rgba(241,216,110,0.3)] shadow-[0_0_20px_rgba(241,216,110,0.05)]' 
                      : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.06)]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-bold truncate pr-3 ${isSelected ? 'text-[rgba(241,216,110,1)]' : 'text-white'}`}>
                      {event.title}
                    </h3>
                    <span className="text-white/40 text-xs font-bold bg-black/30 px-2 py-1 rounded-md shrink-0">
                      {event.time.substring(0,5)}
                    </span>
                  </div>
                  
                  <p className="text-white/60 text-xs mb-3 truncate flex items-center gap-1">
                    Morador: {event.creator_name} {event.creator_apt && `(Apt ${event.creator_apt})`}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[8px] font-bold text-white border-2 border-[rgba(3,29,36,1)]">
                        +{event.guests.length}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                      {checkedInCount}/{event.guests.length} Entraram
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Main Content: Guest List */}
      <div className="flex-1 max-h-screen overflow-y-auto bg-[rgba(3,29,36,1)]">
        {selectedEvent ? (
          <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4">
            
            {/* Event Header Panel */}
            <div className="glass-card p-8 rounded-[2rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[rgba(241,216,110,0.1)] rounded-full filter blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.1)] text-white/80 text-xs font-bold uppercase tracking-wider mb-4">
                    {parseISO(selectedEvent.date) ? format(parseISO(selectedEvent.date), "dd/MM/yyyy") : selectedEvent.date}
                  </span>
                  <h1 className="text-3xl md:text-5xl font-black text-white mb-2">{selectedEvent.title}</h1>
                  <p className="text-white/60 text-lg flex items-center gap-2">
                    <span className="text-[rgba(241,216,110,1)]">{selectedEvent.location}</span> 
                    &bull; Morador Resp: {selectedEvent.creator_name} ({[
                      selectedEvent.creator_block ? `Bl ${selectedEvent.creator_block}` : '', 
                      selectedEvent.creator_apt ? `Apt ${selectedEvent.creator_apt}` : ''
                    ].filter(Boolean).join(' - ')})
                  </p>
                </div>
                
                <div className="text-center bg-black/20 p-6 rounded-3xl backdrop-blur-md border border-[rgba(255,255,255,0.05)]">
                  <span className="text-5xl font-black text-[rgba(241,216,110,1)] inline-block mb-1">
                    {selectedEvent.guests.length}
                  </span>
                  <span className="block text-white/50 text-xs font-bold uppercase tracking-widest">Convidados</span>
                </div>
              </div>
            </div>

            {/* List Header & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                Controle de Acesso
              </h2>
              <div className="relative w-full sm:w-72">
                <Search className="w-5 h-5 text-white/40 absolute left-4 top-1/2 transform -translate-y-1/2" />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar RG ou Nome..."
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] focus:border-[rgba(241,216,110,0.5)] rounded-2xl pl-12 pr-4 py-3.5 text-white text-sm transition-colors focus:outline-none"
                />
              </div>
            </div>

            {/* Guest Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGuests.length > 0 ? filteredGuests.map((guest, idx) => (
                <div 
                  key={guest.id}
                  className={`glass-card p-5 rounded-3xl flex items-center justify-between transition-all ${
                    guest.status === 'checked_in' ? 'opacity-70 saturate-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center font-black text-white/40">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{guest.guest_name}</p>
                      <p className="text-white/40 text-xs tracking-wider uppercase font-semibold mt-0.5">
                        RG/CPF: <span className="text-white/70">{guest.guest_document || 'N/A'}</span>
                      </p>
                    </div>
                  </div>

                  {guest.status === 'checked_in' ? (
                    <div className="text-right">
                      <div className="inline-flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full border border-emerald-500/20">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Presente</span>
                      </div>
                      <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest mt-2 mr-2">
                        {guest.checkin_time ? format(parseISO(guest.checkin_time), "HH:mm") : 'Hoje'}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCheckIn(guest.id, selectedEvent.id)}
                      className="bg-[rgba(241,216,110,1)] hover:bg-[#d6be5e] text-[#031d24] font-black uppercase tracking-wider text-xs px-6 py-3.5 rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(241,216,110,0.3)] flex items-center gap-2"
                    >
                      Dar Baixa
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )) : (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-[rgba(255,255,255,0.05)] rounded-3xl">
                  <p className="text-white/40 font-medium">Nenhum convidado encontrado.</p>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center p-10">
            <div>
              <div className="w-24 h-24 rounded-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] flex items-center justify-center mx-auto mb-6">
                <DoorOpen className="w-10 h-10 text-[rgba(241,216,110,0.5)]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Painel do Porteiro</h2>
              <p className="text-white/50 max-w-sm mx-auto">
                Selecione um evento na barra lateral para ver a lista de convidados e liberar o acesso.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default PortariaDashboard;
