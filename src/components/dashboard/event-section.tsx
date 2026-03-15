import { ChevronRight } from "lucide-react";
import { EventCard, EventData } from "./event-card";

interface EventSectionProps {
  title: string;
  events: EventData[];
  onSeeAll?: () => void;
  onEventAction?: (eventId: string, action: string) => void;
}

export function EventSection({ title, events, onSeeAll, onEventAction }: EventSectionProps) {
  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dashboard-text">
          {title}
        </h2>
        {onSeeAll && events.length > 3 && (
          <button
            onClick={onSeeAll}
            className="flex items-center space-x-1 text-dashboard-text/60 hover:text-dashboard-text transition-colors"
          >
            <span className="text-sm">ver todos</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Events Vertical List */}
      <div className="space-y-4">
        {events.length > 0 ? (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onAction={onEventAction}
            />
          ))
        ) : (
          <div className="text-center py-8 text-dashboard-text/60">
            <p>Nenhum evento encontrado</p>
          </div>
        )}
      </div>
    </section>
  );
}