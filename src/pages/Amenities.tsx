import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/header";
import { CheckinCard } from "@/components/amenities/checkin-card";
import { useAuth } from "@/hooks/useAuth";
import { useAmenitiesQuery, useCheckInMutation, useCheckOutMutation } from "@/hooks/useAmenitiesQuery";
import { useCondominiumId } from "@/hooks/useCondominiumId";
import { ArrowLeft, Dumbbell, Waves, Grip, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Helper function to pick icon based on amenity name/type
const getIconForAmenity = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('academia') || n.includes('fitness')) return Dumbbell;
  if (n.includes('piscina') || n.includes('clube')) return Waves;
  if (n.includes('quadra') || n.includes('society')) return Activity;
  return Grip;
};

const Amenities = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { condominiumId } = useCondominiumId();
  
  const { data: amenities = [], isLoading: loading } = useAmenitiesQuery(condominiumId);
  const checkInMutation = useCheckInMutation();
  const checkOutMutation = useCheckOutMutation();

  const [activeCheckinId, setActiveCheckinId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Check which amenity the user is currently checked into
  useEffect(() => {
    const fetchUserCheckin = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('amenity_checkins')
        .select('amenity_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      if (!error && data) {
        setActiveCheckinId(data.amenity_id);
      } else {
        setActiveCheckinId(null);
      }
    };
    
    fetchUserCheckin();
  }, [user, amenities]); // Re-check when amenities change (e.g. after checkin)

  const handleCheckIn = async (id: string) => {
    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }
    
    setActionLoadingId(id);
    try {
      await checkInMutation.mutateAsync({ amenityId: id, userId: user.id });
      toast.success("Check-in realizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao realizar check-in");
      console.error(error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCheckOut = async (id: string) => {
    if (!user) return;
    
    setActionLoadingId(id);
    try {
      await checkOutMutation.mutateAsync({ amenityId: id, userId: user.id });
      toast.success("Check-out realizado!");
    } catch (error) {
      toast.error("Erro ao realizar check-out");
      console.error(error);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto relative overflow-hidden font-sans flex flex-col">
      <header className="px-5 pt-12 pb-6 border-b border-[rgba(255,255,255,0.05)] sticky top-0 bg-[rgba(3,29,36,0.95)] backdrop-blur-md z-10 flex items-center justify-between">
        <button 
          onClick={() => navigate('/dashboard')}
          className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[rgba(238,243,243,1)] hover:bg-[rgba(255,255,255,0.1)] transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[rgba(238,243,243,1)] font-bold text-lg">Espaços e Lotação 🏢</span>
        </div>
        <div className="w-10"></div> {/* Spacer to center the title */}
      </header>

      <main className="p-5 pb-24 flex-1 overflow-y-auto">
        <section className="mb-8">
          <h2 className="text-[rgba(238,243,243,1)] text-2xl font-bold mb-2">Veja onde a galera tá!</h2>
          <p className="text-[rgba(238,243,243,0.7)] text-sm leading-relaxed">
            Faça check-in quando chegar na academia ou piscina. 
            Assim todo mundo sabe o quão cheio o espaço está.
          </p>
        </section>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-10 h-10 rounded-full border-t-2 border-[rgba(241,216,110,1)] animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {amenities.map(amenity => (
              <CheckinCard
                key={amenity.id}
                id={amenity.id}
                name={amenity.name}
                capacity={amenity.capacity}
                occupancy={amenity.occupancy}
                status={amenity.status || 'Livre'}
                icon={getIconForAmenity(amenity.name)}
                isUserCheckedIn={activeCheckinId === amenity.id}
                onCheckIn={handleCheckIn}
                onCheckOut={handleCheckOut}
                isLoading={actionLoadingId === amenity.id}
              />
            ))}
            
            {amenities.length === 0 && (
              <div className="text-center py-10">
                 <p className="text-[rgba(238,243,243,0.5)]">Nenhuma amenidade cadastrada neste condomínio.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Amenities;
