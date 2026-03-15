import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Sport {
  id: string;
  name: string;
}

interface UserSportsManagerProps {
  userSports: Sport[];
  allSports: Sport[];
  isOwnProfile: boolean;
  onAddSport: (sportId: string) => void;
  onRemoveSport: (sportId: string) => void;
}

export function UserSportsManager({
  userSports,
  allSports,
  isOwnProfile,
  onAddSport,
  onRemoveSport,
}: UserSportsManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const availableSports = allSports.filter(
    sport => !userSports.some(userSport => userSport.id === sport.id)
  );

  const handleAddSport = (sportId: string) => {
    onAddSport(sportId);
    setIsDialogOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-lg font-medium">Interesses</h3>
        {isOwnProfile && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-dashboard-accent hover:text-dashboard-accent/80"
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[rgba(3,29,36,0.98)] border-[rgba(119,136,143,0.5)] max-w-[400px]">
              <DialogHeader>
                <DialogTitle className="text-white">Adicionar Esporte</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {availableSports.length > 0 ? (
                  availableSports.map(sport => (
                    <button
                      key={sport.id}
                      onClick={() => handleAddSport(sport.id)}
                      className="w-full text-left px-4 py-3 rounded-lg bg-[rgba(119,136,143,0.1)] hover:bg-[rgba(119,136,143,0.2)] text-white transition-colors"
                    >
                      {sport.name}
                    </button>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">
                    Você já adicionou todos os esportes disponíveis!
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {userSports.length > 0 ? (
          userSports.map(sport => (
            <Badge
              key={sport.id}
              variant="secondary"
              className="bg-[rgba(119,136,143,0.2)] text-white border border-[rgba(241,216,110,0.3)] px-3 py-1.5 text-sm flex items-center gap-2"
            >
              {sport.name}
              {isOwnProfile && (
                <button
                  onClick={() => onRemoveSport(sport.id)}
                  className="hover:text-dashboard-accent transition-colors"
                  aria-label={`Remover ${sport.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </Badge>
          ))
        ) : (
          <p className="text-gray-400 text-sm">
            {isOwnProfile 
              ? "Adicione esportes aos seus interesses" 
              : "Nenhum esporte cadastrado"}
          </p>
        )}
      </div>
    </div>
  );
}
