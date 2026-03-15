import { Users } from "lucide-react";

interface CheckinCardProps {
  id: string;
  name: string;
  capacity: number | null;
  occupancy: number;
  status: string;
  icon: React.ElementType;
  isUserCheckedIn: boolean;
  onCheckIn: (amenityId: string) => void;
  onCheckOut: (amenityId: string) => void;
  isLoading?: boolean;
}

export const CheckinCard = ({
  id,
  name,
  capacity,
  occupancy,
  status,
  icon: Icon,
  isUserCheckedIn,
  onCheckIn,
  onCheckOut,
  isLoading = false
}: CheckinCardProps) => {
  const isFull = capacity !== null && occupancy >= capacity;
  
  // Status Colors styling
  let statusColorClass = "bg-orange-500/10 text-orange-500 text-orange-400";
  if (status === 'Livre' || (!isFull && occupancy === 0)) statusColorClass = "bg-emerald-500/10 text-emerald-500 text-emerald-400";
  if (status === 'Ocupado' || (occupancy > 0 && !isFull)) statusColorClass = "bg-blue-500/10 text-blue-500 text-blue-400";
  if (status === 'Lotado' || isFull) statusColorClass = "bg-red-500/10 text-red-500 text-red-400";

  const bgClass = statusColorClass.split(' ')[0];
  const textClass = statusColorClass.split(' ')[1];
  const badgeClass = statusColorClass.split(' ')[2];

  // Dynamic Status Text
  let statusText = status;
  if (!status) {
    statusText = isFull ? 'Lotado' : (occupancy > 0 ? 'Ocupado' : 'Livre');
  }

  return (
    <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-2xl p-5 flex flex-col justify-between h-full relative overflow-hidden transition-all hover:bg-[rgba(255,255,255,0.05)]">
      
      {/* Background glow when checked in */}
      {isUserCheckedIn && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-[rgba(241,216,110,0.1)] rounded-bl-full filter blur-xl pointer-events-none"></div>
      )}

      <div>
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgClass} ${textClass}`}>
            <Icon size={24} strokeWidth={2.5} />
          </div>
          
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${bgClass} ${badgeClass}`}>
            {statusText}
          </span>
        </div>

        <h4 className="text-[rgba(238,243,243,1)] text-lg font-bold mb-1 relative z-10">{name}</h4>
        
        <div className="flex items-center gap-1.5 text-[rgba(238,243,243,0.6)] text-sm font-medium relative z-10">
          <Users size={16} />
          <span>
            {occupancy} <span className="opacity-50">pessoas no local</span>
            {capacity && <span className="opacity-50"> / {capacity} limit</span>}
          </span>
        </div>
      </div>

      <div className="mt-6 w-full relative z-10">
        {isUserCheckedIn ? (
          <button
            onClick={() => onCheckOut(id)}
            disabled={isLoading}
            className="w-full py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[rgba(241,216,110,1)] rounded-full text-sm font-bold hover:bg-[rgba(255,255,255,0.1)] transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Saindo...' : 'Fazer Check-out'}
          </button>
        ) : (
          <button
            onClick={() => onCheckIn(id)}
            disabled={isLoading || isFull}
            className={`w-full py-3 rounded-full text-sm font-bold disabled:opacity-50 transition-all ${
              isFull 
                ? 'bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.3)] cursor-not-allowed' 
                : 'bg-[rgba(241,216,110,1)] text-[rgba(3,29,36,1)] hover:bg-[rgba(241,216,110,0.9)] shadow-[0_4px_14px_0_rgba(241,216,110,0.3)]'
            }`}
          >
            {isLoading ? 'Entrando...' : isFull ? 'Lotado' : 'Fazer Check-in'}
          </button>
        )}
      </div>

    </div>
  );
};
