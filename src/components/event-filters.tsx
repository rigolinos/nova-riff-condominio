import { useState } from "react";
import { Filter, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EventFiltersProps {
  onSportFilter: (sport: string | null) => void;
  onDateFilter: (date: string | null) => void;
  onClearFilters: () => void;
}

export function EventFilters({ onSportFilter, onDateFilter, onClearFilters }: EventFiltersProps) {
  const [selectedSport, setSelectedSport] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");

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

  const handleSportChange = (value: string) => {
    const sport = value === "all" ? null : value;
    setSelectedSport(value);
    onSportFilter(sport);
  };

  const handleDateChange = (value: string) => {
    const date = value === "all" ? null : value;
    setSelectedDate(value);
    onDateFilter(date);
  };

  const handleClearAll = () => {
    setSelectedSport("");
    setSelectedDate("");
    onClearFilters();
  };

  const hasActiveFilters = selectedSport || selectedDate;

  return (
    <div className="flex items-center space-x-3 mb-6">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`bg-[rgba(119,136,143,0.1)] border-[rgba(119,136,143,0.3)] text-white hover:bg-[rgba(119,136,143,0.2)] ${
              hasActiveFilters ? 'border-[rgba(241,216,110,0.5)] text-[rgba(241,216,110,1)]' : ''
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-2 bg-[rgba(241,216,110,1)] text-[rgba(3,29,36,1)] rounded-full px-2 py-0.5 text-xs font-medium">
                {(selectedSport ? 1 : 0) + (selectedDate ? 1 : 0)}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-[rgba(3,29,36,0.98)] border-[rgba(119,136,143,0.5)] text-white" align="start">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[rgba(238,243,243,0.8)] mb-2 block">
                Esporte
              </label>
              <Select value={selectedSport} onValueChange={handleSportChange}>
                <SelectTrigger className="bg-[rgba(119,136,143,0.1)] border-[rgba(119,136,143,0.3)] text-white">
                  <SelectValue placeholder="Todos os esportes" />
                </SelectTrigger>
                <SelectContent className="bg-[rgba(3,29,36,0.98)] border-[rgba(119,136,143,0.5)]">
                  <SelectItem value="all" className="text-white hover:bg-[rgba(119,136,143,0.3)]">
                    Todos os esportes
                  </SelectItem>
                  {sports.map((sport) => (
                    <SelectItem 
                      key={sport} 
                      value={sport} 
                      className="text-white hover:bg-[rgba(119,136,143,0.3)]"
                    >
                      {sport}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-[rgba(238,243,243,0.8)] mb-2 block">
                Data
              </label>
              <Select value={selectedDate} onValueChange={handleDateChange}>
                <SelectTrigger className="bg-[rgba(119,136,143,0.1)] border-[rgba(119,136,143,0.3)] text-white">
                  <SelectValue placeholder="Todas as datas" />
                </SelectTrigger>
                <SelectContent className="bg-[rgba(3,29,36,0.98)] border-[rgba(119,136,143,0.5)]">
                  <SelectItem value="all" className="text-white hover:bg-[rgba(119,136,143,0.3)]">
                    Todas as datas
                  </SelectItem>
                  {dateOptions.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value} 
                      className="text-white hover:bg-[rgba(119,136,143,0.3)]"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                onClick={handleClearAll}
                variant="outline"
                className="w-full bg-transparent border-[rgba(241,216,110,0.5)] text-[rgba(241,216,110,1)] hover:bg-[rgba(241,216,110,0.1)]"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}