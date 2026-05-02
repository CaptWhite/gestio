"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [nom, setNom] = useState("");
  const [correu, setCorreu] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/gestio/api/settings');
      const data = await res.json();
      if (res.ok) {
        setNom(data.nom || "");
        setCorreu(data.correu || "");
      } else {
        setMessage({ type: 'error', text: data.error || "Error al cargar configuración" });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setMessage({ type: 'error', text: "Error de red al cargar configuración" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/gestio/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, correu })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: "Configuració guardada correctament" });
      } else {
        setMessage({ type: 'error', text: data.error || "Error al guardar" });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: 'error', text: "Error de red al guardar" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-zinc-500 text-sm">Carregant configuració...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuració</h1>
        <p className="text-zinc-500 text-sm">Configura el perfil i les preferències de l'aplicació.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h3 className="text-sm font-medium">Perfil</h3>
          <p className="text-xs text-zinc-500 mt-1">Informació pública i del compte.</p>
        </div>
        <div className="md:col-span-2 space-y-4">
          <div className="card p-6 space-y-6">
            {message && (
              <div className={`p-3 text-sm rounded-md border ${
                message.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                  : 'bg-rose-50 border-rose-200 text-rose-600'
              }`}>
                {message.text}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom d'usuari</label>
              <input 
                type="text" 
                className="input w-full" 
                value={nom} 
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Secretaria - Tresoreria"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Correu electrònic</label>
              <input 
                type="text" 
                className="input w-full" 
                value={correu} 
                onChange={(e) => setCorreu(e.target.value)}
                placeholder="Ex: secretaria@aster.cat"
              />
            </div>
            <div className="flex justify-end">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? "Guardant..." : "Guardar Canvis"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
