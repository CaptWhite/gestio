"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface EditCustomerModalProps {
  customer: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditCustomerModal({ customer, onClose, onSuccess }: EditCustomerModalProps) {
  // Helper to format dates to YYYY-MM-DD for HTML date inputs
  const formatDateForInput = (dateStr: string) => {
    if (!dateStr || dateStr === "-") return "";
    
    // If it's already YYYY-MM-DD, return it
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    // Try to parse common formats like DD/MM/YYYY
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      // If first part is 4 digits, assume YYYY-MM-DD (already handled but just in case)
      if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      // Assume DD/MM/YYYY
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }

    // Fallback to standard JS Date parsing
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch (e) {}
    
    return "";
  };

  const [formData, setFormData] = useState({
    ...customer,
    data_neix: formatDateForInput(customer.data_neix),
    data_alta: formatDateForInput(customer.data_alta),
    data_baixa: formatDateForInput(customer.data_baixa),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData({ 
      ...customer,
      data_neix: formatDateForInput(customer.data_neix),
      data_alta: formatDateForInput(customer.data_alta),
      data_baixa: formatDateForInput(customer.data_baixa),
    });
  }, [customer]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/gestio/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating customer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields = [
    { name: "id", label: "ID (DB)", readOnly: true },
    { name: "id_socis", label: "Nº SOCIS" },
    { name: "sexe", label: "Sexe" },
    { name: "cognoms", label: "COGNOMS" },
    { name: "nom", label: "NOM" },
    { name: "dni", label: "DNI" },
    { name: "data_neix", label: "Data_Neix", type: "date" },
    { name: "adreca", label: "ADREÇA" },
    { name: "poblacio", label: "POBLACIÓ" },
    { name: "professio", label: "PROFESSIÓ" },
    { name: "mobil", label: "MÒBIL" },
    { name: "telefon_fix", label: "Telefon fix" },
    { name: "correu_e_1", label: "Correu_e 1" },
    { name: "correu_e2", label: "Correu_e2" },
    { name: "observacions", label: "Observacions" },
    { name: "data_alta", label: "Data Alta", type: "date" },
    { name: "cobrament_inicial", label: "Cobrament inicial" },
    { name: "data_baixa", label: "Data baixa", type: "date" },
    { name: "comptecorrent", label: "CompteCorrent" },
    { name: "motiu_baixa", label: "Motiu_Baixa" },
    { name: "quota", label: "Quota" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background w-full max-w-2xl rounded-lg shadow-xl border border-border flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border bg-zinc-50/50 dark:bg-zinc-900/50">
          <h2 className="text-lg font-semibold">
            Editar Soci: {formData.id_socis} {formData.nom} {formData.cognoms}
          </h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {fields.map((field) => (
              <div key={field.name} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-500">{field.label}</label>
                <input 
                  type={field.type || "text"} 
                  readOnly={field.readOnly}
                  className={`input w-full ${field.readOnly ? 'bg-zinc-50 dark:bg-zinc-900 cursor-not-allowed opacity-70' : ''}`}
                  value={formData[field.name as keyof typeof formData] || ""}
                  onChange={(e) => !field.readOnly && setFormData({ ...formData, [field.name]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-zinc-50/50 dark:bg-zinc-900/50">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button 
            type="submit" 
            onClick={handleSubmit}
            disabled={isSubmitting} 
            className="btn-primary"
          >
            {isSubmitting ? "Actualitzant..." : "Actualitzar"}
          </button>
        </div>
      </div>
    </div>
  );
}
