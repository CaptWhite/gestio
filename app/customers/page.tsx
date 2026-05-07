"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, ChevronDown, X, FileSpreadsheet } from "lucide-react";
import CustomerTable from "@/components/CustomerTable";
import AddCustomerModal from "@/components/AddCustomerModal";
import * as XLSX from "xlsx";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("Tots");

  const fetchCustomers = async () => {
    try {
      setError(null);
      const res = await fetch('/api/customers');
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setCustomers(data);
      } else {
        setError(data.error || "Error desconocido al cargar datos");
        setCustomers([]);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      setError("Error de red o de servidor");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = Array.isArray(customers) ? customers.filter((c: any) => {
    let matchesSearch = true;
    if (search.length >= 4) {
      const searchLower = search.toLowerCase();
      matchesSearch = 
        (c.nom?.toLowerCase() || "").includes(searchLower) || 
        (c.cognoms?.toLowerCase() || "").includes(searchLower) ||
        (c.correu_e_1?.toLowerCase() || "").includes(searchLower) ||
        (c.mobil?.toLowerCase() || "").includes(searchLower) ||
        (c.id_socis?.toString() || "").includes(searchLower);
    }
    
    const isBaixa = c.data_baixa && c.data_baixa !== '-' && c.data_baixa !== '';
    
    let matchesStatus = true;
    if (statusFilter === "Socis Alta") {
      matchesStatus = !isBaixa;
    } else if (statusFilter === "Socis Baixa") {
      matchesStatus = isBaixa;
    }

    return matchesSearch && matchesStatus;
  }) : [];

  const exportToExcel = () => {
    if (filteredCustomers.length === 0) {
      alert("No hi ha dades per exportar");
      return;
    }

    // Preparar los datos para el Excel (todas las columnas de la BD)
    // El objeto c ya contiene todas las columnas devueltas por la API
    const worksheet = XLSX.utils.json_to_sheet(filteredCustomers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Socis");

    // Generar archivo y descargar
    XLSX.writeFile(workbook, `Socis_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Socis</h1>
          <p className="text-zinc-500 text-sm">Gestió de la base de dades de socis.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Afegir Soci
        </button>
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
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <select 
            className="input pl-10 appearance-none bg-background pr-10"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Tots">Tots</option>
            <option value="Socis Alta">Socis Alta</option>
            <option value="Socis Baixa">Socis Baixa</option>
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
        <CustomerTable 
          customers={filteredCustomers} 
          loading={loading} 
          onRefresh={fetchCustomers}
        />
      </div>

      {isModalOpen && (
        <AddCustomerModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchCustomers();
          }} 
        />
      )}
    </div>
  );
}
