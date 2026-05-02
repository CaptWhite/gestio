"use client";

import { useState, useEffect } from "react";
import MetricCard from "@/components/MetricCard";
import { Users, CheckSquare, CalendarDays, Activity } from "lucide-react";

export default function Dashboard() {
  const [customerStats, setCustomerStats] = useState<any>({ 
    totalActive: 0, 
    homes: 0, 
    dones: 0, 
    monthlyData: Array(12).fill(0),
    currentYear: new Date().getFullYear(),
    recentActivity: []
  });
  const [taskStats, setTaskStats] = useState<any>({
    total: 0,
    pending: 0,
    completed: 0,
    recentTasks: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, taskRes] = await Promise.all([
          fetch('/gestio/api/customers?mode=stats'),
          fetch('/gestio/api/tasks?mode=stats')
        ]);
        
        const custData = await custRes.json();
        const taskData = await taskRes.json();
        
        if (custRes.ok) setCustomerStats(custData);
        if (taskRes.ok) setTaskStats(taskData);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalNewThisYear = (customerStats.monthlyData || []).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-zinc-300 text-sm">Resum de l'activitat i mètriques clau.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard 
          title="Socis Actius" 
          value={loading ? "..." : `${customerStats.totalActive}`} 
          change={loading ? "" : `Homes: ${customerStats.homes}, Dones: ${customerStats.dones}`} 
          icon={Users} 
        />
        <MetricCard 
          title={`Altes l'any ${customerStats.currentYear}`} 
          value={loading ? "..." : `${totalNewThisYear}`} 
          change="" 
          icon={CalendarDays}
          details={customerStats.monthlyData}
        />
        <MetricCard 
          title="Gestió de Tasques" 
          value={loading ? "..." : `${taskStats.total}`} 
          change={loading ? "" : `Pendents: ${taskStats.pending} Completades: ${taskStats.completed}`} 
          icon={CheckSquare} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-medium mb-4 text-zinc-700 dark:text-zinc-300">Activitat recent</h3>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-zinc-500 animate-pulse text-xs">Carregant activitat...</div>
            ) : (customerStats.recentActivity || []).length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs italic">No hi ha activitat registrada</div>
            ) : (
              (customerStats.recentActivity || []).map((log: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0 dark:border-zinc-900">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{log.descripcio}</p>
                      <p className="text-xs text-zinc-400">{log.time}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-medium mb-4 text-zinc-700 dark:text-zinc-300">Properes tasques</h3>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4 text-zinc-500 animate-pulse text-xs">Carregant...</div>
            ) : (taskStats.recentTasks || []).length === 0 ? (
              <div className="text-center py-4 text-zinc-500 text-xs italic">No hi ha tasques recents</div>
            ) : (
              (taskStats.recentTasks || []).map((item: any, i: number) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                  <div className="mt-1 w-2 h-2 rounded-full bg-accent" />
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 line-clamp-1">{item.title}</p>
                    <p className="text-xs text-zinc-400">{item.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
