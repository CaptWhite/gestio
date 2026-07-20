"use client";

import { useState, useEffect } from "react";
import { Search, Filter, ChevronDown, X, FileSpreadsheet } from "lucide-react";
import CursIniciacioTable from "@/components/CursIniciacioTable";
import * as XLSX from "xlsx";

export default function CursIniciacioPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagatFilter, setPagatFilter] = useState("Tots");

  const fetchItems = async () => {
    try {
      setError(null);
      const res = await fetch('/api/curs-iniciacio');
      const data = await res.json();

      if (Array.isArray(data)) {
        setItems(data);
      } else {
        setError(data.error || "Error desconegut");
        setItems([]);
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error de xarxa o de servidor");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = items.filter((item: any) => {
    const p = item.payload || {};

    let matchesSearch = true;
    if (search.length >= 4) {
      const s = search.toLowerCase();
      matchesSearch =
        (p.nom?.toLowerCase() || "").includes(s) ||
        (p.cognoms?.toLowerCase() || "").includes(s) ||
        (p.email?.toLowerCase() || "").includes(s) ||
        (p["dni-nif"]?.toLowerCase() || "").includes(s) ||
        (item.id?.toString() || "").includes(s);
    }

    let matchesPagat = true;
    if (pagatFilter === "Pagat") {
      matchesPagat = p.pagat === "si";
    } else if (pagatFilter === "No Pagat") {
      matchesPagat = p.pagat !== "si";
    }

    return matchesSearch && matchesPagat;
  });

  const exportToExcel = () => {
    if (filteredItems.length === 0) {
      alert("No hi ha dades per exportar");
      return;
    }

    const data = filteredItems.map((item: any) => {
      const p = item.payload || {};
      return {
        ID: item.id,
        Cognoms: p.cognoms || '',
        Nom: p.nom || '',
        DNI: p["dni-nif"] || '',
        Email: p.email || '',
        Telefon: p.telefon || '',
        Mobil: p.telefonmobil || '',
        Data: item.date || '',
        Pagat: p.pagat === 'si' ? 'Sí' : 'No',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Curs Iniciació");
    XLSX.writeFile(workbook, `Curs_Iniciacio_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalPaid = filteredItems.filter((i: any) => i.payload?.pagat === 'si').length;
  const totalUnpaid = filteredItems.filter((i: any) => i.payload?.pagat !== 'si').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Curs d'Iniciació</h1>
          <p className="text-zinc-500 text-sm">
            Inscripcions al curs d'iniciació. {totalPaid} pagades, {totalUnpaid} pendents.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Cercar per nom, cognoms, email, DNI..."
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
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <select
            className="input pl-10 appearance-none bg-background pr-10"
            value={pagatFilter}
            onChange={(e) => setPagatFilter(e.target.value)}
          >
            <option value="Tots">Tots</option>
            <option value="Pagat">Pagat</option>
            <option value="No Pagat">No Pagat</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          </div>
        </div>

        <div className="ml-auto">
          <button
            onClick={exportToExcel}
            title="Exportar a Excel"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-all font-medium text-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      <div className="card">
        {error && (
          <div className="p-4 m-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-md text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}
        <CursIniciacioTable
          items={filteredItems}
          loading={loading}
          onRefresh={fetchItems}
        />
      </div>
    </div>
  );
}
