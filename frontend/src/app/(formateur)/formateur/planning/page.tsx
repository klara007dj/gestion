'use client';
import { CalendarDays } from 'lucide-react';
import CalendarView from '@/components/planning/CalendarView';

export default function FormateurPlanningPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-indigo-600" /> Mon planning
        </h1>
        <p className="text-gray-500 text-sm">Vos séances à venir</p>
      </div>

      <CalendarView role="FORMATEUR" />
    </div>
  );
}
