"use client";

import { useState, useMemo } from "react";
import { Pencil, ArrowUp, ArrowDown, ChevronDown, CheckCircle2, Circle } from "lucide-react";
import EditCursIniciacioModal from "./EditCursIniciacioModal";

interface Inscription {
  id: number;
  title: string;
  date: string;
  payload: Record<string, any>;
}

interface TableProps {
  items: Inscription[];
  loading: boolean;
  onRefresh?: () => void;
}

type SortConfig = {
  key: string | null;
  direction: 'asc' | 'desc';
};

export default function CursIniciacioTable({ items, loading, onRefresh }: TableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [editingItem, setEditingItem] = useState<Inscription | null>(null);

  const sortedItems = useMemo(() => {
    const sortableItems = [...items];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aVal: string;
        let bVal: string;

        if (sortConfig.key === 'pagat') {
          aVal = a.payload?.pagat || '';
          bVal = b.payload?.pagat || '';
        } else if (sortConfig.key === 'nom') {
          aVal = a.payload?.nom || '';
          bVal = b.payload?.nom || '';
        } else if (sortConfig.key === 'email') {
          aVal = a.payload?.email || '';
          bVal = b.payload?.email || '';
        } else {
          aVal = String((a as any)[sortConfig.key!] || '');
          bVal = String((b as any)[sortConfig.key!] || '');
        }

        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronDown className="w-3 h-3 opacity-0 group-hover/header:opacity-50 transition-opacity" />;
    }
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="w-3 h-3 text-blue-500" />
      : <ArrowDown className="w-3 h-3 text-blue-500" />;
  };

  const HeaderCell = ({ label, columnKey }: { label: string, columnKey: string }) => (
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

  if (loading) {
    return (
      <div className="p-8 text-center text-zinc-500 animate-pulse">
        Carregant curs d'iniciació...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500">
        No s'han trobat inscripcions al curs d'iniciació.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border bg-zinc-50/50 dark:bg-zinc-900/50">
            <HeaderCell label="ID" columnKey="id" />
            <HeaderCell label="Cognoms" columnKey="cognoms" />
            <HeaderCell label="Nom" columnKey="nom" />
            <HeaderCell label="Correu" columnKey="email" />
            <HeaderCell label="Telèfon" columnKey="telefon" />
            <HeaderCell label="Data" columnKey="date" />
            <HeaderCell label="Pagat" columnKey="pagat" />
            <th className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">Accions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sortedItems.map((item) => {
            const p = item.payload;
            const isPaid = p?.pagat === 'si';
            return (
              <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors group">
                <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.id}</td>
                <td className="px-6 py-4 text-sm text-zinc-400">{p?.cognoms || ''}</td>
                <td className="px-6 py-4 text-sm text-zinc-400">{p?.nom || ''}</td>
                <td className="px-6 py-4 text-sm text-zinc-400">{p?.email || ''}</td>
                <td className="px-6 py-4 text-sm text-zinc-400">{p?.telefon || p?.telefonmobil || ''}</td>
                <td className="px-6 py-4 text-sm text-zinc-400">{item.date || ''}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                    isPaid
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                    {isPaid ? 'Sí' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {editingItem && (
        <EditCursIniciacioModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={() => {
            setEditingItem(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
