import { useState, useMemo } from "react";
import { Pencil, ArrowUp, ArrowDown, ChevronDown, Send } from "lucide-react";
import EditCartaModal from "./EditCartaModal";
import Link from "next/link";

interface Carta {
  id: number;
  title: string;
  _to: string;
  _cc: string;
  _cco: string;
  subject: string;
  body: string;
  bodyFem: string;
  date_create: string;
  date_update: string;
}

interface CartesTableProps {
  cartes: Carta[];
  loading: boolean;
  onRefresh?: () => void;
}

type SortConfig = {
  key: keyof Carta | null;
  direction: 'asc' | 'desc';
};

export default function CartesTable({ cartes, loading, onRefresh }: CartesTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [editingCarta, setEditingCarta] = useState<Carta | null>(null);

  const sortedCartes = useMemo(() => {
    const sortableItems = [...cartes];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = String(a[sortConfig.key!] || "").toLowerCase();
        const bValue = String(b[sortConfig.key!] || "").toLowerCase();

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [cartes, sortConfig]);

  const requestSort = (key: keyof Carta) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-zinc-500 animate-pulse">
        Carregant cartes...
      </div>
    );
  }

  if (cartes.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500">
        No s&apos;han trobat cartes.
      </div>
    );
  }

  const SortIcon = ({ columnKey }: { columnKey: keyof Carta }) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronDown className="w-3 h-3 opacity-0 group-hover/header:opacity-50 transition-opacity" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-blue-500" /> 
      : <ArrowDown className="w-3 h-3 text-blue-500" />;
  };

  const HeaderCell = ({ label, columnKey }: { label: string, columnKey: keyof Carta }) => (
    <th 
      className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer group/header hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      onClick={() => requestSort(columnKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <SortIcon columnKey={columnKey} />
      </div>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border bg-zinc-50/50 dark:bg-zinc-900/50">
            <HeaderCell label="ID" columnKey="id" />
            <HeaderCell label="Titol" columnKey="title" />
            <HeaderCell label="Per a" columnKey="_to" />
            <HeaderCell label="CC" columnKey="_cc" />
            <HeaderCell label="Subject" columnKey="subject" />
            <th className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">Accions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sortedCartes.map((carta) => (
            <tr key={carta.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors group">
              <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">{carta.id}</td>
              <td className="px-6 py-4 text-sm text-zinc-400">{carta.title}</td>
              <td className="px-6 py-4 text-sm text-zinc-400">{carta._to}</td>
              <td className="px-6 py-4 text-sm text-zinc-400">{carta._cc}</td>
              <td className="px-6 py-4 text-sm text-zinc-400">{carta.subject}</td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/cartes/testMail/${carta.id}`}
                    className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors"
                    title="Enviar correu de prova"
                  >
                    <Send className="w-4 h-4" />
                  </Link>
                  <button 
                    onClick={() => setEditingCarta(carta)}
                    className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingCarta && (
        <EditCartaModal 
          carta={editingCarta}
          onClose={() => setEditingCarta(null)}
          onSuccess={() => {
            setEditingCarta(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}