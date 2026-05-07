"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface AddCustomerModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddCustomerModal({ onClose, onSuccess }: AddCustomerModalProps) {
  const [formData, setFormData] = useState({
    id_socis: "",
    sexe: "",
    cognoms: "",
    nom: "",
    dni: "",
    data_neix: "",
    adreca: "",
    poblacio: "",
    professio: "",
    mobil: "",
    telefon_fix: "",
    correu_e_1: "",
    correu_e2: "",
    observacions: "",
    data_alta: new Date().toISOString().split('T')[0],
    cobrament_inicial: "",
    data_baixa: "",
    comptecorrent: "",
    motiu_baixa: "",
    quota: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchNextId = async () => {
      try {
        const res = await fetch('/api/customers?mode=nextId');
        if (res.ok) {
          const data = await res.json();
          setFormData(prev => ({ ...prev, id_socis: data.nextId.toString() }));
        }
      } catch (error) {
        console.error("Error fetching next ID:", error);
      }
    };
    fetchNextId();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error adding customer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background w-full max-w-2xl rounded-lg shadow-xl border border-border animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Afegir Soci</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">ID (Socio)</label>
              <input 
                readOnly
                type="text" 
                className="input w-full bg-zinc-50 dark:bg-zinc-900 cursor-not-allowed" 
                value={formData.id_socis}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Sexe</label>
              <select 
                className="input w-full appearance-none"
                value={formData.sexe}
                onChange={(e) => setFormData({...formData, sexe: e.target.value})}
              >
                <option value="">Selecciona...</option>
                <option value="H">Home</option>
                <option value="D">Dona</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nom</label>
              <input 
                required
                type="text" 
                className="input w-full" 
                placeholder="Ej. Joan" 
                value={formData.nom}
                onChange={(e) => setFormData({...formData, nom: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Cognoms</label>
              <input 
                required
                type="text" 
                className="input w-full" 
                placeholder="Ej. Pérez" 
                value={formData.cognoms}
                onChange={(e) => setFormData({...formData, cognoms: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">DNI</label>
              <input 
                type="text" 
                className="input w-full" 
                placeholder="12345678X" 
                value={formData.dni}
                onChange={(e) => setFormData({...formData, dni: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Data Naixement</label>
              <input 
                type="date" 
                className="input w-full" 
                value={formData.data_neix}
                onChange={(e) => setFormData({...formData, data_neix: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Adreça</label>
            <input 
              type="text" 
              className="input w-full" 
              placeholder="Carrer, núm, pis" 
              value={formData.adreca}
              onChange={(e) => setFormData({...formData, adreca: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Població</label>
              <input 
                type="text" 
                className="input w-full" 
                placeholder="Barcelona" 
                value={formData.poblacio}
                onChange={(e) => setFormData({...formData, poblacio: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Professió</label>
              <input 
                type="text" 
                className="input w-full" 
                placeholder="Enginyer" 
                value={formData.professio}
                onChange={(e) => setFormData({...formData, professio: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Mòbil</label>
              <input 
                type="text" 
                className="input w-full" 
                placeholder="600 000 000" 
                value={formData.mobil}
                onChange={(e) => setFormData({...formData, mobil: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Telèfon Fix</label>
              <input 
                type="text" 
                className="input w-full" 
                placeholder="930 000 000" 
                value={formData.telefon_fix}
                onChange={(e) => setFormData({...formData, telefon_fix: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Correu-e 1</label>
              <input 
                required
                type="email" 
                className="input w-full" 
                placeholder="email@exemple.com" 
                value={formData.correu_e_1}
                onChange={(e) => setFormData({...formData, correu_e_1: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Correu-e 2</label>
              <input 
                type="email" 
                className="input w-full" 
                placeholder="altre@exemple.com" 
                value={formData.correu_e2}
                onChange={(e) => setFormData({...formData, correu_e2: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Data Alta</label>
              <input 
                type="date" 
                className="input w-full" 
                value={formData.data_alta}
                onChange={(e) => setFormData({...formData, data_alta: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Data Baixa</label>
              <input 
                type="date" 
                className="input w-full" 
                value={formData.data_baixa}
                onChange={(e) => setFormData({...formData, data_baixa: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Quota</label>
              <input 
                type="text" 
                className="input w-full" 
                placeholder="Ej. 50€" 
                value={formData.quota}
                onChange={(e) => setFormData({...formData, quota: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Cobrament Inicial</label>
              <input 
                type="text" 
                className="input w-full" 
                value={formData.cobrament_inicial}
                onChange={(e) => setFormData({...formData, cobrament_inicial: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Compte Corrent</label>
            <input 
              type="text" 
              className="input w-full" 
              placeholder="ES00 0000 0000 0000 0000 0000" 
              value={formData.comptecorrent}
              onChange={(e) => setFormData({...formData, comptecorrent: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Motiu Baixa</label>
            <input 
              type="text" 
              className="input w-full" 
              value={formData.motiu_baixa}
              onChange={(e) => setFormData({...formData, motiu_baixa: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Observacions</label>
            <textarea 
              className="input w-full min-h-[80px] py-2" 
              value={formData.observacions}
              onChange={(e) => setFormData({...formData, observacions: e.target.value})}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-4">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? "Creant..." : "Crear Soci"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
