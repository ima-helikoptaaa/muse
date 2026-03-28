'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCalendar } from '@/lib/api';
import type { CalendarEntry } from '@/lib/api';
import { statusColor } from '@/lib/utils';
import { Calendar, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isSameDay,
  startOfWeek,
  endOfWeek,
} from 'date-fns';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data: entries, isLoading, isError } = useQuery({
    queryKey: ['calendar', format(monthStart, 'yyyy-MM-dd'), format(monthEnd, 'yyyy-MM-dd')],
    queryFn: () =>
      getCalendar(
        format(monthStart, 'yyyy-MM-dd'),
        format(monthEnd, 'yyyy-MM-dd'),
      ),
  });

  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEntriesForDay = (day: Date) =>
    entries?.filter((e: CalendarEntry) => isSameDay(new Date(e.scheduledDate), day)) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar size={24} /> Content Calendar
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded hover:bg-[var(--muted)]"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded hover:bg-[var(--muted)]"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-[var(--muted-foreground)]">Loading calendar...</p>
      ) : isError ? (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
          <AlertCircle size={16} />
          Failed to load calendar data.
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-[var(--border)]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="p-3 text-center text-xs font-medium text-[var(--muted-foreground)]"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dayEntries = getEntriesForDay(day);
              const isCurrentMonth =
                day.getMonth() === currentMonth.getMonth();
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[100px] p-2 border-b border-r border-[var(--border)] ${
                    isCurrentMonth ? '' : 'opacity-30'
                  }`}
                >
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {format(day, 'd')}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayEntries.map((entry: CalendarEntry) => (
                      <div
                        key={entry.id}
                        className={`text-xs px-1.5 py-0.5 rounded truncate ${statusColor(entry.contentPiece?.status || 'IDEA')}`}
                      >
                        {entry.contentPiece?.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
