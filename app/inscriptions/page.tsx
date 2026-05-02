"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Calendar, CreditCard, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function InscriptionsPage() {
  const [inscriptions, setInscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInscriptions = async () => {
    try {
      const res = await fetch('/gestio/api/inscriptions');
      const data = await res.json();
      if (Array.isArray(data)) {
        setInscriptions(data);
      } else {
        console.error("API error:", data.error);
        setInscriptions([]);
      }
    } catch (error) {
      console.error("Error fetching inscriptions:", error);
      setInscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInscriptions();
  }, []);

  const togglePagat = async (id: string) => {
    try {
      await fetch('/gestio/api/inscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchInscriptions();
    } catch (error) {
      console.error("Error toggling pagat:", error);
    }
  };

  const inscriptionsList = Array.isArray(inscriptions) ? inscriptions : [];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inscripcions</h1>
          <p className="text-zinc-500 text-sm">Inscripcions de socis realitzades per la web.</p>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-zinc-500 animate-pulse">Cargando inscripciones...</div>
        ) : inscriptionsList.length === 0 ? (
          <div className="card p-12 text-center text-zinc-500">
            No hay inscripciones registradas.
          </div>
        ) : (
          inscriptionsList.map((item: any) => {
            const isPagat = item.payload?.pagat === 'si';
            const cognoms = item.payload?.cognoms || "Sense cognoms";
            const dni = item.payload?.['dni-nif'] || "Sense DNI/NIF";
            const pagatText = item.payload?.pagat || "no";

            return (
              <div 
                key={item.id} 
                className={cn(
                  "card p-4 flex items-center gap-4 group hover:border-zinc-300 transition-all",
                  isPagat && "opacity-80"
                )}
              >
                <button 
                  onClick={() => togglePagat(item.id)}
                  className="text-zinc-400 hover:text-accent transition-colors"
                >
                  {isPagat ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </button>
                
                <div className="flex-1">
                  <h3 className="text-sm font-medium">
                    {cognoms} <span className="text-zinc-400 ml-2">({dni})</span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <Calendar className="w-3 h-3" />
                      {item.date}
                    </div>
                    
                    <div className={cn(
                      "flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider",
                      isPagat ? "text-emerald-500" : "text-rose-500"
                    )}>
                      <CreditCard className="w-3 h-3" />
                      Pagat: {pagatText}
                    </div>
                  </div>
                </div>

                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all">
                  <Link
                    href={`/inscriptions/view/${item.id}`}
                    className="p-2 text-zinc-400 hover:text-accent hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
