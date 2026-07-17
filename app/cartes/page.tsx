"use client";

import { useState, useEffect } from "react";
import { Search, X, Plus } from "lucide-react";
import Link from "next/link";
import CartesTable from "@/components/CartesTable";

export default function CartesPage() {
  const [cartes, setCartes] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCartes = async () => {
    try {
      setError(null);
      const res = await fetch('/api/cartes');
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setCartes(data);
      } else {
        setError(data.error || "Error desconocido al cargar datos");
        setCartes([]);
      }
    } catch (error) {
      console.error("Error fetching cartes:", error);
      setError("Error de red o de servidor");
      setCartes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartes();
  }, []);

  const filteredCartes = Array.isArray(cartes) ? cartes.filter((c: any) => {
    if (search.length < 4) return true;
    const searchLower = search.toLowerCase();
    return (
      (c.title?.toLowerCase() || "").includes(searchLower) || 
      (c._to?.toLowerCase() || "").includes(searchLower) ||
      (c.subject?.toLowerCase() || "").includes(searchLower)
    );
  }) : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cartes</h1>
          <p className="text-zinc-500 text-sm">Gestió de cartes.</p>
        </div>
        <Link href="/cartes/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Afegir Carta
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Cercar" 
            className="input pl-10 pr-10 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button 
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {error && (
          <div className="p-4 m-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-md text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}
        <CartesTable 
          cartes={filteredCartes} 
          loading={loading} 
          onRefresh={fetchCartes}
        />
      </div>
    </div>
  );
}