"use client";

import { useState, useTransition } from "react";
import { format, isToday, isPast, startOfDay } from "date-fns";
import { de } from "date-fns/locale";
import { Bell, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createReminder, toggleReminder, deleteReminder } from "@/lib/actions/reminders";
import { toast } from "sonner";

interface Reminder {
  id: string;
  date: Date;
  description: string;
  completed: boolean;
}

interface ReminderSectionProps {
  clientId: string;
  reminders: Reminder[];
}

function getReminderColor(date: Date, completed: boolean) {
  if (completed) return "text-muted-foreground";
  const day = startOfDay(date);
  const today = startOfDay(new Date());
  if (day < today) return "text-red-500";
  if (day.getTime() === today.getTime()) return "text-orange-500";
  return "text-muted-foreground";
}

export function ReminderSection({ clientId, reminders }: ReminderSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!date || !description) return;

    startTransition(async () => {
      try {
        await createReminder(clientId, { date: new Date(date), description });
        setDate("");
        setDescription("");
        setShowForm(false);
        toast.success("Erinnerung erstellt");
      } catch {
        toast.error("Fehler beim Erstellen");
      }
    });
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      try {
        await toggleReminder(id);
      } catch {
        toast.error("Fehler beim Aktualisieren");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteReminder(id);
        toast.success("Erinnerung gelöscht");
      } catch {
        toast.error("Fehler beim Löschen");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Erinnerungen ({reminders.filter((r) => !r.completed).length})
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="flex gap-2 items-end pb-3 border-b">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-40"
            />
            <Input
              placeholder="Beschreibung..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button size="sm" onClick={handleCreate} disabled={isPending}>
              Hinzufügen
            </Button>
          </div>
        )}

        {reminders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Erinnerungen</p>
        ) : (
          <div className="space-y-2">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center gap-3 text-sm group"
              >
                <Checkbox
                  checked={reminder.completed}
                  onCheckedChange={() => handleToggle(reminder.id)}
                />
                <Bell
                  className={`h-3.5 w-3.5 shrink-0 ${getReminderColor(reminder.date, reminder.completed)}`}
                />
                <span className={`text-xs shrink-0 ${getReminderColor(reminder.date, reminder.completed)}`}>
                  {format(reminder.date, "dd.MM.yyyy", { locale: de })}
                </span>
                <span className={reminder.completed ? "line-through text-muted-foreground flex-1" : "flex-1"}>
                  {reminder.description}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                  onClick={() => handleDelete(reminder.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
