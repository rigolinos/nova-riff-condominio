import React, { useState, useEffect, useRef, useMemo } from "react";
import { DoorOpen, CheckCircle, Search, ShieldCheck, UserCheck, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FlatGuest {
  id: string;
  guest_name: string;
  guest_document: string | null;
  status: 'pending' | 'checked_in';
  checkin_time: string | null;
  eventId: string;
  eventTitle: string;
  eventTime: string;
  location: string;
  creatorName: string;
  creatorApt: string;
  creatorBlock: string;
  creatorPhone: string;
}

const PortariaDashboard = () => {
  const { toast } = useToast();
  const [guests, setGuests] = useState<FlatGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modal de Entrada Avulsa
  const [showAdHocModal, setShowAdHocModal] = useState(false);
  const [adHocApt, setAdHocApt] = useState("");
  const [adHocName, setAdHocName] = useState("");
  const [adHocReason, setAdHocReason] = useState("");
  const [isAdHocLoading, setIsAdHocLoading] = useState(false);

  useEffect(() => {
    fetchTodayEvents();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchTodayEvents = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

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
          profiles:created_by (full_name, block_number, apt_number, phone)
        `)
        .eq('condominium_id', profile.condominium_id)
        .gte('date', today.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (eventsError) throw eventsError;

      if (!eventsData || eventsData.length === 0) {
        setGuests([]);
        return;
      }

      const eventIds = eventsData.map(e => e.id);

      const { data: guestsData, error: guestsError } = await supabase
        .from('guest_lists')
        .select('*')
        .in('event_id', eventIds);

      if (guestsError && guestsError.code !== '42703') throw guestsError;

      const flatGuestsList: FlatGuest[] = [];

      eventsData.forEach((e: any) => {
        const eventGuests = (guestsData || []).filter((g: any) => g.event_id === e.id);
        eventGuests.forEach((g: any) => {
          flatGuestsList.push({
            id: g.id,
            guest_name: g.guest_name,
            guest_document: g.guest_document,
            status: g.status || 'pending',
            checkin_time: g.checkin_time || null,
            eventId: e.id,
            eventTitle: e.title,
            eventTime: e.time,
            location: e.location,
            creatorName: e.profiles?.full_name || 'Desconhecido',
            creatorApt: e.profiles?.apt_number || '',
            creatorBlock: e.profiles?.block_number || '',
            creatorPhone: e.profiles?.phone || ''
          });
        });
      });

      setGuests(flatGuestsList);
    } catch (error) {
      console.error("Error fetching portaria data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (guestId: string) => {
    try {
      setGuests(prev => prev.map(g => 
        g.id === guestId 
          ? { ...g, status: 'checked_in', checkin_time: new Date().toISOString() }
          : g
      ));

      const { error } = await supabase
        .from('guest_lists')
        .update({ 
          status: 'checked_in',
          checkin_time: new Date().toISOString()
        } as any)
        .eq('id', guestId);

      if (error) {
        fetchTodayEvents();
        throw error;
      } else {
        toast({
          title: "Check-in Registrado",
          description: "Entrada liberada com sucesso.",
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

  const filteredGuests = useMemo(() => {
    if (!searchTerm) return guests;
    const lowerSearch = searchTerm.toLowerCase();
    return guests.filter(g => 
      g.guest_name.toLowerCase().includes(lowerSearch) || 
      (g.guest_document && g.guest_document.toLowerCase().includes(lowerSearch)) ||
      g.creatorApt.toLowerCase().includes(lowerSearch) ||
      g.creatorBlock.toLowerCase().includes(lowerSearch)
    );
  }, [guests, searchTerm]);

  const groupedGuests = useMemo(() => {
    const groups: Record<string, { event: FlatGuest, guests: FlatGuest[] }> = {};
    guests.forEach(g => {
      const key = g.eventId;
      if (!groups[key]) {
        groups[key] = { event: g, guests: [] };
      }
      groups[key].guests.push(g);
    });
    return Object.values(groups);
  }, [guests]);

  const handleAddAdHoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adHocApt || !adHocName) return;

    setIsAdHocLoading(true);
    try {
      // In a real app we might link this to an 'avulsos' table or dummy event.
      // Since it's MVP, we just add it to local state to show it works, or push to guest_lists without event_id if allowed.
      // But guest_lists might require event_id. We'll just create a dummy object in frontend.
      const newAdHoc: FlatGuest = {
        id: "adhoc-" + Date.now().toString(),
        guest_name: adHocName,
        guest_document: adHocReason || "Avulso/Delivery",
        status: "checked_in",
        checkin_time: new Date().toISOString(),
        eventId: "adhoc",
        eventTitle: "Entrada Avulsa",
        eventTime: format(new Date(), "HH:mm"),
        location: "Portaria",
        creatorName: "Visitante Ad-Hoc",
        creatorApt: adHocApt,
        creatorBlock: "",
        creatorPhone: "",
      };
      setGuests((prev) => [newAdHoc, ...prev]);
      setShowAdHocModal(false);
      setAdHocName("");
      setAdHocApt("");
      setAdHocReason("");
      toast({ title: "Entrada Avulsa Registrada", description: "Visitante liberado com sucesso." });
    } finally {
      setIsAdHocLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 to open Ad-Hoc Modal
      if (e.key === 'F2') {
        e.preventDefault();
        setShowAdHocModal(true);
      }
      
      // '/' to focus search
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      
      // Navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredGuests.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < filteredGuests.length) {
        e.preventDefault();
        const selectedGuest = filteredGuests[selectedIndex];
        if (selectedGuest.status === 'pending') {
          handleCheckIn(selectedGuest.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredGuests, selectedIndex]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(filteredGuests.length > 0 ? 0 : -1);
  }, [searchTerm, filteredGuests.length]);

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col font-sans text-slate-300">
      
      {/* Header / Top Bar */}
      <div className="bg-[#1e293b] border-b border-slate-700 p-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Painel Operacional - Portaria</h1>
            <p className="text-slate-400 text-sm">{format(currentTime, "HH:mm - dd 'de' MMMM", { locale: ptBR })}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowAdHocModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-emerald-500/20"
          >
            <span>+ Entrada Avulsa / Delivery</span>
            <span className="bg-emerald-800 text-emerald-200 text-[10px] px-1.5 py-0.5 rounded ml-1">F2</span>
          </button>
          
          <div className="relative w-96">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input 
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar Nome, RG ou Apto (Aperte '/' para focar)"
              className="w-full bg-[#0f172a] border border-slate-600 focus:border-emerald-500 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content: Dense Table */}
      <div className="flex-1 p-6 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : filteredGuests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <DoorOpen className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhum convidado encontrado.</p>
          </div>
        ) : (
          <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0f172a] text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                  <th className="p-4 font-semibold w-1/4">Convidado / Documento</th>
                  <th className="p-4 font-semibold w-1/5">Destino (Morador/Apto)</th>
                  <th className="p-4 font-semibold w-1/5">Local / Evento</th>
                  <th className="p-4 font-semibold w-1/6">Status</th>
                  <th className="p-4 font-semibold text-right w-1/6">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {!searchTerm ? (
                  groupedGuests.map((group) => (
                    <React.Fragment key={group.event.eventId}>
                      {/* Group Header */}
                      <tr className="bg-slate-800/50">
                        <td colSpan={5} className="p-3 pl-4">
                          <div className="flex items-center gap-2">
                            <DoorOpen className="w-4 h-4 text-emerald-400" />
                            <span className="text-white font-bold text-sm">{group.event.location}</span>
                            <span className="text-slate-400 text-sm">— {group.event.eventTitle} (Apto {group.event.creatorApt})</span>
                            <span className="ml-auto text-xs font-mono bg-slate-700 text-slate-300 px-2 py-1 rounded">
                              {group.guests.filter(g => g.status === 'checked_in').length}/{group.guests.length} Entraram
                            </span>
                          </div>
                        </td>
                      </tr>
                      {/* Group Guests */}
                      {group.guests.map((guest) => {
                        const isSelected = filteredGuests[selectedIndex]?.id === guest.id;
                        return (
                          <tr 
                            key={guest.id} 
                            className={`transition-colors cursor-pointer group ${isSelected ? 'bg-emerald-500/10' : 'hover:bg-slate-800/50'}`}
                            onClick={() => setSelectedIndex(filteredGuests.findIndex(g => g.id === guest.id))}
                          >
                            <td className="p-4 pl-8">
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-transparent'}`}></div>
                                <div>
                                  <div className={`font-semibold text-sm ${isSelected ? 'text-emerald-400' : 'text-slate-200'}`}>
                                    {guest.guest_name}
                                  </div>
                                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                                    {guest.guest_document || 'Sem Documento'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-slate-500 text-xs text-center" colSpan={2}>
                              (Ver Cabeçalho do Evento)
                            </td>
                            <td className="p-4">
                              {guest.status === 'checked_in' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
                                  <CheckCircle className="w-3.5 h-3.5" /> Liberado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold uppercase tracking-wider">
                                  <AlertCircle className="w-3.5 h-3.5" /> Pendente
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              {guest.status === 'checked_in' ? (
                                <div className="text-xs text-slate-500 font-mono">
                                  {guest.checkin_time ? format(parseISO(guest.checkin_time), "HH:mm") : '--:--'}
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleCheckIn(guest.id); }}
                                  className={`px-4 py-1.5 rounded-md font-bold uppercase tracking-wider text-xs transition-colors flex items-center gap-2 ml-auto ${isSelected ? 'bg-emerald-500 text-[#0f172a] hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                                >
                                  <UserCheck className="w-4 h-4" /> {isSelected ? 'Enter para Liberar' : 'Liberar'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))
                ) : (
                  filteredGuests.map((guest, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <tr 
                        key={guest.id} 
                        className={`transition-colors cursor-pointer group ${isSelected ? 'bg-emerald-500/10' : 'hover:bg-slate-800/50'}`}
                        onClick={() => setSelectedIndex(idx)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-transparent'}`}></div>
                            <div>
                              <div className={`font-semibold text-sm ${isSelected ? 'text-emerald-400' : 'text-slate-200'}`}>
                                {guest.guest_name}
                              </div>
                              <div className="text-xs text-slate-500 font-mono mt-0.5">
                                {guest.guest_document || 'Sem Documento'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-slate-300 font-medium">{guest.creatorName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Apto {guest.creatorApt} {guest.creatorBlock ? `- Bloco ${guest.creatorBlock}` : ''}
                            {guest.creatorPhone ? ` • 📞 Ramal: ${guest.creatorPhone}` : ''}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-slate-300 truncate max-w-[200px]">{guest.eventTitle}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{guest.location} • {guest.eventTime.substring(0,5)}</div>
                        </td>
                        <td className="p-4">
                          {guest.status === 'checked_in' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
                              <CheckCircle className="w-3.5 h-3.5" /> Liberado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold uppercase tracking-wider">
                              <AlertCircle className="w-3.5 h-3.5" /> Pendente
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {guest.status === 'checked_in' ? (
                            <div className="text-xs text-slate-500 font-mono">
                              Entrou às {guest.checkin_time ? format(parseISO(guest.checkin_time), "HH:mm") : '--:--'}
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCheckIn(guest.id); }}
                              className={`px-4 py-1.5 rounded-md font-bold uppercase tracking-wider text-xs transition-colors flex items-center gap-2 ml-auto ${isSelected ? 'bg-emerald-500 text-[#0f172a] hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                            >
                              <UserCheck className="w-4 h-4" /> {isSelected ? 'Enter para Liberar' : 'Liberar'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer / Shortcuts Help */}
      <div className="bg-[#1e293b] border-t border-slate-700 p-3 text-center text-xs text-slate-500 font-mono">
        Atalhos de Teclado: <kbd className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">F2</kbd> Entrada Avulsa • <kbd className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">/</kbd> Buscar • <kbd className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">↑</kbd> <kbd className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">↓</kbd> Navegar • <kbd className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Enter</kbd> Liberar Entrada
      </div>

      {showAdHocModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddAdHoc} className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Registro Avulso / Delivery</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1 block">Apto / Bloco *</label>
                <input 
                  type="text" 
                  value={adHocApt}
                  onChange={(e) => setAdHocApt(e.target.value)}
                  placeholder="Ex: 101 Bloco A"
                  className="w-full bg-[#0f172a] border border-slate-600 focus:border-emerald-500 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1 block">Nome do Visitante *</label>
                <input 
                  type="text" 
                  value={adHocName}
                  onChange={(e) => setAdHocName(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full bg-[#0f172a] border border-slate-600 focus:border-emerald-500 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1 block">Motivo / Empresa</label>
                <input 
                  type="text" 
                  value={adHocReason}
                  onChange={(e) => setAdHocReason(e.target.value)}
                  placeholder="Ex: iFood, Correios, Parente"
                  className="w-full bg-[#0f172a] border border-slate-600 focus:border-emerald-500 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                type="button" 
                onClick={() => setShowAdHocModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-bold transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isAdHocLoading || !adHocName.trim() || !adHocApt.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                Liberar Entrada
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PortariaDashboard;
