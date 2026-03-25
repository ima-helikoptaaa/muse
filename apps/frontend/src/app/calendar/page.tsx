'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCalendar } from '@/lib/api';
import { formatDate, statusColor } from '@/lib/utils';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
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

  const { data: entries } = useQuery({
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
    entries?.filter((e: any) => isSameDay(new Date(e.scheduledDate), day)) || [];

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
          >
            <ChevronLeft size={18} />
          </button>
          <span className="font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded hover:bg-[var(--muted)]"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
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
                  {dayEntries.map((entry: any) => (
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
    </div>
  );
}
