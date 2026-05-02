"use client";

import { useState, useEffect } from "react";
import { Plus, CheckCircle2, Circle, Calendar, AlertCircle, Trash2, Tag, Activity, Pencil } from "lucide-react";
import AddTaskModal from "@/components/AddTaskModal";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [filter, setFilter] = useState("all"); // all, pending, completed
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/gestio/api/tasks');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTasks(data);
      } else {
        console.error("API error:", data.error);
        setTasks([]);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const toggleTask = async (id: string) => {
    try {
      await fetch('/gestio/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', id })
      });
      fetchTasks();
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta tarea?")) return;
    try {
      await fetch('/gestio/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const filteredTasks = Array.isArray(tasks) ? tasks.filter((t: any) => {
    if (filter === "pending") return t.status === "pending";
    if (filter === "completed") return t.status === "completed";
    return true;
  }) : [];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasques</h1>
          <p className="text-zinc-500 text-sm">Gestió dels pendents y prioritats.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Tasca
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-border pb-1">
        {["all", "pending", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-all relative",
              filter === f ? "text-accent" : "text-zinc-500 hover:text-zinc-800"
            )}
          >
            {f === "all" ? "Todas" : f === "pending" ? "Pendents" : "Completades"}
            {filter === f && (
              <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-zinc-500 animate-pulse">Cargando tareas...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="card p-12 text-center text-zinc-500">
            No hay tareas en esta categoría.
          </div>
        ) : (
          filteredTasks.map((task: any) => (
            <div 
              key={task.id} 
              className={cn(
                "card p-4 flex items-center gap-4 group hover:border-zinc-300 transition-all",
                task.status === "completed" && "opacity-60"
              )}
            >
              <button 
                onClick={() => toggleTask(task.id)}
                className="text-zinc-400 hover:text-accent transition-colors"
              >
                {task.status === "completed" ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </button>
              
              <div className="flex-1">
                <h3 className={cn(
                  "text-sm font-medium transition-all",
                  task.status === "completed" && "line-through text-zinc-400"
                )}>
                  {task.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <Calendar className="w-3 h-3" />
                    {task.date}
                  </div>
                  
                  {task.type && (
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <Tag className="w-3 h-3" />
                      {task.type}
                    </div>
                  )}

                  <div className={cn(
                    "flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider",
                    task.status === "completed" ? "text-emerald-500" : "text-amber-500"
                  )}>
                    <Activity className="w-3 h-3" />
                    {task.status === "completed" ? "Completada" : "Pendiente"}
                  </div>

                  <div className={cn(
                    "flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider",
                    task.priority === "high" ? "text-rose-500" : 
                    task.priority === "medium" ? "text-amber-500" : "text-emerald-500"
                  )}>
                    <AlertCircle className="w-3 h-3" />
                    {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Media" : "Baja"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <Link
                  href={`/tasks/edit/${task.id}`}
                  className="p-2 text-zinc-400 hover:text-accent hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-all"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <AddTaskModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchTasks();
          }} 
        />
      )}
    </div>
  );
}
