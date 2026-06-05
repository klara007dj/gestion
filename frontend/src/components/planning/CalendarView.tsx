'use client';
import { useEffect, useMemo, useState } from 'react';
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { CalendarOff, Loader2 } from 'lucide-react';
import { seancesApi } from '@/lib/api';

moment.locale('fr');
const localizer = momentLocalizer(moment);

type Role = 'ADMIN' | 'FORMATEUR' | 'PARTICIPANT';

interface CalendarViewProps {
  role?: Role;
  /** Incrémenter cette valeur force un rechargement des séances. */
  reloadKey?: number;
}

interface PlanningEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: any;
}

const messages = {
  date: 'Date',
  time: 'Heure',
  event: 'Séance',
  allDay: 'Journée',
  week: 'Semaine',
  work_week: 'Semaine de travail',
  day: 'Jour',
  month: 'Mois',
  previous: 'Précédent',
  next: 'Suivant',
  yesterday: 'Hier',
  tomorrow: 'Demain',
  today: "Aujourd'hui",
  agenda: 'Agenda',
  noEventsInRange: 'Aucune séance sur cette période.',
  showMore: (total: number) => `+ ${total} de plus`,
};

// Combine une date (@db.Date, ISO UTC) et une heure (@db.Time, ISO UTC)
// en un objet Date local avec les bons composants horaires.
function combineDateTime(dateStr: string, timeStr: string): Date {
  const d = new Date(dateStr);
  const t = new Date(timeStr);
  return new Date(
    d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(),
    t.getUTCHours(), t.getUTCMinutes(), 0, 0
  );
}

export default function CalendarView({ role = 'ADMIN', reloadKey = 0 }: CalendarViewProps) {
  const [events, setEvents] = useState<PlanningEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState<Date>(new Date());

  useEffect(() => {
    let active = true;
    setLoading(true);
    seancesApi
      .list()
      .then(({ data }) => {
        if (!active) return;
        const mapped: PlanningEvent[] = (data || []).map((s: any) => {
          const formateurNom = s.formateur?.user
            ? `${s.formateur.user.firstName} ${s.formateur.user.lastName}`
            : '';
          const base = s.titre || s.formation?.titre || 'Séance';
          const title =
            role === 'PARTICIPANT'
              ? `${base}${s.salle?.nom ? ' • ' + s.salle.nom : ''}`
              : `${base}${formateurNom ? ' • ' + formateurNom : ''}${s.salle?.nom ? ' • ' + s.salle.nom : ''}`;
          return {
            id: s.id,
            title,
            start: combineDateTime(s.date, s.heureDebut),
            end: combineDateTime(s.date, s.heureFin),
            resource: s,
          };
        });
        setEvents(mapped);
      })
      .catch(() => {
        if (active) setEvents([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [role, reloadKey]);

  const eventPropGetter = useMemo(
    () => () => ({
      style: {
        backgroundColor: '#2563eb',
        borderRadius: '6px',
        border: 'none',
        color: '#fff',
        fontSize: '0.78rem',
        padding: '1px 4px',
      },
    }),
    []
  );

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Chargement du planning...
      </div>
    );
  }

  return (
    <div className="card">
      {events.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <CalendarOff size={16} />
          Aucune séance planifiée pour le moment.
        </div>
      )}
      <div style={{ height: 650 }}>
        <Calendar
          localizer={localizer}
          culture="fr"
          events={events}
          startAccessor="start"
          endAccessor="end"
          messages={messages}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          min={new Date(1970, 0, 1, 7, 0, 0)}
          max={new Date(1970, 0, 1, 21, 0, 0)}
          step={30}
          popup
          eventPropGetter={eventPropGetter}
        />
      </div>
    </div>
  );
}
