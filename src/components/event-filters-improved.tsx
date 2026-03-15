import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface EventFiltersImprovedProps {
  onApplyFilters: (filters: ActiveFilters) => void;
  onClearFilters: () => void;
}

export interface ActiveFilters {
  sports: string[];
  dates: string[];
}

export function EventFiltersImproved({ onApplyFilters, onClearFilters }: EventFiltersImprovedProps) {
  // Temporary states (before applying)
  const [tempSports, setTempSports] = useState<string[]>([]);
  const [tempDates, setTempDates] = useState<string[]>([]);
  
  // Applied filters (after clicking "Aplicar filtros")
  const [appliedFilters, setAppliedFilters] = useState<ActiveFilters>({ sports: [], dates: [] });
  const [isOpen, setIsOpen] = useState(false);

  const sports = [
    "Futebol",
    "Basquete", 
    "Vôlei",
    "Tennis",
    "Natação",
    "Corrida",
    "Ciclismo",
    "Xadrez",
    "Outros"
  ];

  const dateOptions = [
    { label: "Hoje", value: "today" },
    { label: "Amanhã", value: "tomorrow" },
    { label: "Este fim de semana", value: "weekend" },
    { label: "Próxima semana", value: "next-week" },
  ];

  const handleSportToggle = (sport: string) => {
    setTempSports(prev => 
      prev.includes(sport) 
        ? prev.filter(s => s !== sport)
        : [...prev, sport]
    );
  };

  const handleDateToggle = (date: string) => {
    setTempDates(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
  };

  const handleApplyFilters = () => {
    const newFilters = {
      sports: tempSports,
      dates: tempDates
    };
    setAppliedFilters(newFilters);
    onApplyFilters(newFilters);
    setIsOpen(false);
  };

  const handleClearAll = () => {
    setTempSports([]);
    setTempDates([]);
    setAppliedFilters({ sports: [], dates: [] });
    onClearFilters();
  };

  const removeFilter = (type: 'sport' | 'date', value: string) => {
    if (type === 'sport') {
      const newSports = appliedFilters.sports.filter(s => s !== value);
      setTempSports(newSports);
      const newFilters = { ...appliedFilters, sports: newSports };
      setAppliedFilters(newFilters);
      onApplyFilters(newFilters);
    } else {
      const newDates = appliedFilters.dates.filter(d => d !== value);
      setTempDates(newDates);
      const newFilters = { ...appliedFilters, dates: newDates };
      setAppliedFilters(newFilters);
      onApplyFilters(newFilters);
    }
  };

  const hasActiveFilters = appliedFilters.sports.length > 0 || appliedFilters.dates.length > 0;
  const totalActiveFilters = appliedFilters.sports.length + appliedFilters.dates.length;

  const getDateLabel = (value: string) => {
    return dateOptions.find(opt => opt.value === value)?.label || value;
  };

  return (
    <div className="mb-6 space-y-3">
      {/* Filter Button */}
      <div className="flex items-center space-x-3">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`bg-[rgba(119,136,143,0.1)] border-[rgba(119,136,143,0.3)] text-white hover:bg-[rgba(119,136,143,0.2)] px-6 py-5 text-base ${
                hasActiveFilters ? 'border-[rgba(241,216,110,0.5)] text-[rgba(241,216,110,1)]' : ''
              }`}
            >
              <Filter className="w-5 h-5 mr-2" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-2 bg-[rgba(241,216,110,1)] text-[rgba(3,29,36,1)] rounded-full px-2.5 py-1 text-sm font-medium">
                  {totalActiveFilters}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-[rgba(3,29,36,0.98)] border-[rgba(119,136,143,0.5)] text-white" align="start">
            <div className="space-y-4">
              {/* Sports Filter */}
              <div>
                <label className="text-sm font-medium text-[rgba(238,243,243,0.8)] mb-3 block">
                  Esporte (selecione múltiplos)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {sports.map((sport) => (
                    <div key={sport} className="flex items-center space-x-2">
                      <Checkbox
                        id={`sport-${sport}`}
                        checked={tempSports.includes(sport)}
                        onCheckedChange={() => handleSportToggle(sport)}
                        className="border-[rgba(119,136,143,1)] data-[state=checked]:bg-[rgba(241,216,110,1)] data-[state=checked]:border-[rgba(241,216,110,1)]"
                      />
                      <Label 
                        htmlFor={`sport-${sport}`} 
                        className="text-white text-sm cursor-pointer flex-1"
                      >
                        {sport}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date Filter */}
              <div>
                <label className="text-sm font-medium text-[rgba(238,243,243,0.8)] mb-3 block">
                  Data (selecione múltiplas)
                </label>
                <div className="space-y-2">
                  {dateOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`date-${option.value}`}
                        checked={tempDates.includes(option.value)}
                        onCheckedChange={() => handleDateToggle(option.value)}
                        className="border-[rgba(119,136,143,1)] data-[state=checked]:bg-[rgba(241,216,110,1)] data-[state=checked]:border-[rgba(241,216,110,1)]"
                      />
                      <Label 
                        htmlFor={`date-${option.value}`} 
                        className="text-white text-sm cursor-pointer flex-1"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[rgba(119,136,143,0.3)]">
                <Button
                  onClick={handleApplyFilters}
                  className="w-full bg-[rgba(241,216,110,1)] text-[rgba(3,29,36,1)] hover:bg-[rgba(241,216,110,0.9)] font-medium"
                  disabled={tempSports.length === 0 && tempDates.length === 0}
                >
                  Aplicar filtros
                </Button>
                
                {(tempSports.length > 0 || tempDates.length > 0) && (
                  <Button
                    onClick={handleClearAll}
                    variant="outline"
                    className="w-full bg-transparent border-[rgba(119,136,143,0.5)] text-[rgba(238,243,243,0.7)] hover:bg-[rgba(119,136,143,0.1)]"
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[rgba(238,243,243,0.7)] text-sm">Filtros ativos:</span>
          
          {/* Sport Tags */}
          {appliedFilters.sports.map((sport) => (
            <Badge 
              key={sport} 
              variant="secondary"
              className="bg-[rgba(241,216,110,0.2)] text-[rgba(241,216,110,1)] border border-[rgba(241,216,110,0.5)] hover:bg-[rgba(241,216,110,0.3)] pr-1"
            >
              {sport}
              <button
                onClick={() => removeFilter('sport', sport)}
                className="ml-2 hover:bg-[rgba(241,216,110,0.3)] rounded-full p-0.5 transition-colors"
                aria-label={`Remover filtro ${sport}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}

          {/* Date Tags */}
          {appliedFilters.dates.map((date) => (
            <Badge 
              key={date} 
              variant="secondary"
              className="bg-[rgba(241,216,110,0.2)] text-[rgba(241,216,110,1)] border border-[rgba(241,216,110,0.5)] hover:bg-[rgba(241,216,110,0.3)] pr-1"
            >
              {getDateLabel(date)}
              <button
                onClick={() => removeFilter('date', date)}
                className="ml-2 hover:bg-[rgba(241,216,110,0.3)] rounded-full p-0.5 transition-colors"
                aria-label={`Remover filtro ${getDateLabel(date)}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}

          {/* Clear All Button */}
          <Button
            onClick={handleClearAll}
            variant="ghost"
            size="sm"
            className="text-[rgba(238,243,243,0.7)] hover:text-white hover:bg-[rgba(119,136,143,0.2)] h-7 px-2"
          >
            Limpar todos
          </Button>
        </div>
      )}
    </div>
  );
}

