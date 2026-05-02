"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";
import Link from "next/link";

export default function ViewInscriptionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<any>(null);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await fetch(`/gestio/api/tasks/${params.id}`);
        if (!res.ok) throw new Error("Failed to fetch task");
        const data = await res.json();
        
        // Parsear el payload si es un string
        if (data.payload && typeof data.payload === 'string') {
          try {
            data.payload = JSON.parse(data.payload);
          } catch (e) {
            console.error("Error parsing payload", e);
          }
        }
        
        setTask(data);
      } catch (error) {
        console.error("Error:", error);
        alert("Error al carregar l'inscripció");
        router.push("/inscriptions");
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-zinc-500 animate-pulse">Carregant inscripció...</div>
      </div>
    );
  }

  const payload = task?.payload || {};

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link 
          href="/inscriptions" 
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Detalls de l'Inscripció</h1>
          <p className="text-zinc-500 text-sm">Visualització de les dades de la inscripció web.</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="bg-zinc-50 dark:bg-zinc-900 px-6 py-4 border-b border-border flex items-center gap-3">
          <User className="w-5 h-5 text-accent" />
          <h2 className="font-medium">Dades del Formullari</h2>
        </div>
        
        <div className="p-6 space-y-4">
          {Object.entries(payload).length === 0 ? (
            <p className="text-zinc-500 text-sm italic">No hi ha dades disponibles al payload.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(payload).map(([key, value]) => (
                <div key={key} className="flex flex-col border-b border-zinc-100 dark:border-zinc-800 pb-2 last:border-0">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1">
                    {key.replace(/-/g, ' ')}
                  </span>
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900 p-6 border-t border-border flex justify-end">
          <Link href="/inscriptions" className="btn-primary px-8">
            Tornar
          </Link>
        </div>
      </div>
    </div>
  );
}
