import React from "react";
import { Home, Users, Plus, Dumbbell, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export const BottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // We don't want to show the bottom nav on Auth pages, public landings, or during full-screen flows (like inside CreateEvent itself)
  const hiddenRoutes = ["/", "/login", "/signup", "/loading", "/create-event"];
  const isHidden = hiddenRoutes.includes(currentPath) || currentPath.startsWith("/event-created/");

  if (isHidden) return null;

  return (
    <>
      {/* Spacer so content doesn't get hidden behind the fixed bar */}
      <div className="h-24 w-full" />
      
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-safe pointer-events-none">
        <div className="w-full max-w-[480px] bg-[rgba(3,29,36,0.85)] backdrop-blur-xl border-t border-white/5 px-6 py-3 flex items-center justify-between rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)] pointer-events-auto">
          
          <Link to="/dashboard" className="flex flex-col items-center gap-1 min-w-[64px] group">
            <div className={cn("p-2 rounded-2xl transition-all", currentPath === "/dashboard" ? "bg-white/10 text-white" : "text-white/40 group-hover:text-white/70")}>
              <Home size={24} strokeWidth={currentPath === "/dashboard" ? 2.5 : 2} />
            </div>
            <span className={cn("text-[10px] font-medium transition-colors", currentPath === "/dashboard" ? "text-white" : "text-white/40")}>Início</span>
          </Link>

          <Link to="/my-events" className="flex flex-col items-center gap-1 min-w-[64px] group">
            <div className={cn("p-2 rounded-2xl transition-all", currentPath === "/my-events" ? "bg-white/10 text-white" : "text-white/40 group-hover:text-white/70")}>
              <Users size={24} strokeWidth={currentPath === "/my-events" ? 2.5 : 2} />
            </div>
            <span className={cn("text-[10px] font-medium transition-colors", currentPath === "/my-events" ? "text-white" : "text-white/40")}>Portaria</span>
          </Link>

          {/* Floating Action Button (FAB) - Create Event / Reservation */}
          <div className="relative -top-8 flex flex-col items-center min-w-[72px]">
            <Link 
              to="/create-event" 
              className="w-16 h-16 bg-[rgba(241,216,110,1)] rounded-full flex items-center justify-center text-black shadow-[0_8px_30px_rgba(241,216,110,0.4)] hover:scale-105 active:scale-95 transition-all z-10 border-4 border-[rgba(3,29,36,1)]"
            >
              <Plus size={32} strokeWidth={3} />
            </Link>
            <span className="text-white text-[10px] font-bold mt-1">Reservar</span>
          </div>

          <Link to="/matchmaking" className="flex flex-col items-center gap-1 min-w-[64px] group">
            <div className={cn("p-2 rounded-2xl transition-all", currentPath === "/matchmaking" ? "bg-white/10 text-white" : "text-white/40 group-hover:text-white/70")}>
              <Dumbbell size={24} strokeWidth={currentPath === "/matchmaking" ? 2.5 : 2} />
            </div>
            <span className={cn("text-[10px] font-medium transition-colors", currentPath === "/matchmaking" ? "text-white" : "text-white/40")}>Match</span>
          </Link>

          <Link to="/profile/current" className="flex flex-col items-center gap-1 min-w-[64px] group">
            <div className={cn("p-2 rounded-2xl transition-all", currentPath === "/profile/current" ? "bg-white/10 text-white" : "text-white/40 group-hover:text-white/70")}>
              <User size={24} strokeWidth={currentPath === "/profile/current" ? 2.5 : 2} />
            </div>
            <span className={cn("text-[10px] font-medium transition-colors", currentPath === "/profile/current" ? "text-white" : "text-white/40")}>Perfil</span>
          </Link>

        </div>
      </div>
    </>
  );
};
