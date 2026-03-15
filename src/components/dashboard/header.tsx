import { useState } from "react";
import { Bell, User, Calendar, Plus, Users, Handshake, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import riffIcon from "@/assets/riff-icon.png";

interface HeaderProps {
  // Keeping props for backward compatibility pending full cleanup
  activeTab?: "mapa" | "buscar" | "eventos";
  onTabChange?: (tab: "mapa" | "buscar" | "eventos") => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const navigate = useNavigate();
  const { getUnreadBadgeText } = useNotifications();
  const badgeText = getUnreadBadgeText();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div>
      <header className="bg-transparent text-[rgba(238,243,243,1)] px-6 pt-6 pb-4 max-w-[480px] mx-auto z-10 relative">
        <div className="flex items-center justify-between w-full">
          
          {/* Riff Sports logo replacing the nav items for a clean premium look */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
              <img 
                src={riffIcon} 
                alt="Nova Riff" 
                className="w-6 h-6 object-contain"
              />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">Nova Riff</span>
          </div>

          {/* Profile Menu Dropdown */}
          <DropdownMenu onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative p-0 hover:bg-white/10 rounded-full h-10 w-10 transition-colors">
                <div className="relative flex items-center justify-center w-full h-full">
                  <User className="w-5 h-5 text-white/80" />
                  {/* Notification badge */}
                   {badgeText && (
                     <div className="absolute -top-1 -right-1 h-4 w-4 bg-[rgba(241,216,110,1)] text-[#031d24] text-[10px] font-bold rounded-full flex items-center justify-center">
                       {badgeText}
                     </div>
                   )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            
           <DropdownMenuContent align="end" className="w-64 bg-[rgba(3,29,36,0.98)] backdrop-blur-xl border-[rgba(255,255,255,0.1)] z-50 shadow-2xl rounded-2xl p-2">
            <DropdownMenuItem 
              className="text-white hover:bg-white/10 cursor-pointer py-3 px-4 rounded-xl text-sm font-medium transition-colors"
              onClick={() => navigate("/notifications")}
            >
              <Bell className="mr-3 h-4 w-4 text-[rgba(241,216,110,1)]" />
              <span className="flex-1">Notificações</span>
               {badgeText && (
                 <Badge className="ml-2 bg-[rgba(241,216,110,1)] text-[#031d24] text-xs">
                   {badgeText}
                 </Badge>
               )}
            </DropdownMenuItem>
            
             <DropdownMenuItem 
               className="text-white hover:bg-white/10 cursor-pointer py-3 px-4 rounded-xl text-sm font-medium transition-colors"
               onClick={() => navigate("/profile/current")}
             >
               <User className="mr-3 h-4 w-4 text-white/70" />
               Meu Perfil
             </DropdownMenuItem>
             
             <DropdownMenuItem 
               className="text-white/50 hover:bg-white/5 cursor-pointer py-3 px-4 rounded-xl text-sm font-medium transition-colors"
               onClick={() => navigate("/settings")}
             >
               <Settings className="mr-3 h-4 w-4 text-white/30" />
               Configurações
             </DropdownMenuItem>
             
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
    
    {/* Overlay when menu is open */}
    {isMenuOpen && (
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-300"
        onClick={() => setIsMenuOpen(false)}
      />
    )}
  </div>
  );
}