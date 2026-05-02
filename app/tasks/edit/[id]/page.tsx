"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X } from "lucide-react";
import Link from "next/link";

export default function EditTaskPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    priority: "medium",
    type: "",
    payload: ""
  });

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await fetch(`/gestio/api/tasks/${params.id}`);
        if (!res.ok) throw new Error("Failed to fetch task");
        const data = await res.json();
        setFormData({
          title: data.title || "",
          priority: data.priority || "medium",
          type: data.type || "",
          payload: data.payload || ""
        });
      } catch (error) {
        console.error("Error:", error);
        alert("Error al cargar la tarea");
        router.push("/tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/gestio/api/tasks/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        router.push("/tasks");
        // Forzar refresco si es necesario, aunque push a menudo es suficiente
        router.refresh();
      } else {
        throw new Error("Failed to update task");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar la tarea");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-zinc-500 animate-pulse">Cargando tarea...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link 
          href="/tasks" 
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Editar Tarea</h1>
          <p className="text-zinc-500 text-sm">Modifica los detalles de la tarea seleccionada.</p>
        </div>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">
              Descripción
            </label>
            <input 
              required
              type="text" 
              className="input w-full" 
              placeholder="¿Qué hay que hacer?" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">
                Prioridad
              </label>
              <select 
                className="input w-full appearance-none"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">
                Tipo
              </label>
              <input 
                type="text" 
                className="input w-full" 
                placeholder="Ej: Seguimiento, Demo..." 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">
              Payload (Información adicional)
            </label>
            <textarea 
              rows={4}
              className="input w-full min-h-[120px] py-3" 
              placeholder="Datos adicionales en formato texto o JSON..." 
              value={formData.payload}
              onChange={(e) => setFormData({...formData, payload: e.target.value})}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Link href="/tasks" className="btn-secondary flex items-center gap-2">
              <X className="w-4 h-4" />
              Cancelar
            </Link>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Guardando..." : "Modificar tarea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
