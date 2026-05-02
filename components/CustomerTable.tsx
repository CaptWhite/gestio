import { useState, useMemo } from "react";
import { Pencil, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";
import EditCustomerModal from "./EditCustomerModal";

interface Customer {
  id: number;
  id_socis: number;
  cognoms: string;
  nom: string;
  correu_e_1: string;
  mobil: string;
  data_alta: string;
  data_baixa: string;
}

interface CustomerTableProps {
  customers: Customer[];
  loading: boolean;
  onRefresh?: () => void;
}

type SortConfig = {
  key: keyof Customer | null;
  direction: 'asc' | 'desc';
};

export default function CustomerTable({ customers, loading, onRefresh }: CustomerTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const sortedCustomers = useMemo(() => {
    const sortableItems = [...customers];
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
  }, [customers, sortConfig]);

  const requestSort = (key: keyof Customer) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-zinc-500 animate-pulse">
        Cargando socios...
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500">
        No se encontraron socios.
      </div>
    );
  }

  const SortIcon = ({ columnKey }: { columnKey: keyof Customer }) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronDown className="w-3 h-3 opacity-0 group-hover/header:opacity-50 transition-opacity" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-blue-500" /> 
      : <ArrowDown className="w-3 h-3 text-blue-500" />;
  };

  const HeaderCell = ({ label, columnKey }: { label: string, columnKey: keyof Customer }) => (
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
            <HeaderCell label="Nº" columnKey="id_socis" />
            <HeaderCell label="Cognoms" columnKey="cognoms" />
            <HeaderCell label="Nom" columnKey="nom" />
            <HeaderCell label="Correu_e 1" columnKey="correu_e_1" />
            <HeaderCell label="Mòbil" columnKey="mobil" />
            <HeaderCell label="Data_alta" columnKey="data_alta" />
            <HeaderCell label="Data_baixa" columnKey="data_baixa" />
            <th className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">Accions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sortedCustomers.map((customer) => (
            <tr key={customer.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors group">
              <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">{customer.id_socis}</td>
              <td className="px-6 py-4 text-sm text-zinc-400">{customer.cognoms}</td>
              <td className="px-6 py-4 text-sm text-zinc-400">{customer.nom}</td>
              <td className="px-6 py-4 text-sm text-zinc-400">{customer.correu_e_1}</td>
              <td className="px-6 py-4 text-sm text-zinc-400">{customer.mobil}</td>
              <td className="px-6 py-4 text-sm text-zinc-400">{customer.data_alta}</td>
              <td className="px-6 py-4 text-sm text-zinc-400">{customer.data_baixa}</td>
              <td className="px-6 py-4 text-right">
                <button 
                  onClick={() => setEditingCustomer(customer)}
                  className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingCustomer && (
        <EditCustomerModal 
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSuccess={() => {
            setEditingCustomer(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
