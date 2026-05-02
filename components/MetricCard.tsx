import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  details?: number[];
}

export default function MetricCard({ title, value, change, icon: Icon, details }: MetricCardProps) {
  const isPositive = change.startsWith('+');
  const isNeutral = !change.startsWith('+') && !change.startsWith('-');
  const months = ['G', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

  return (
    <div className="card p-6 h-full flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-10 h-10 rounded-lg bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-border shrink-0">
            <Icon className="w-5 h-5 text-zinc-300" />
          </div>
          
          {details && (
            <div className="grid grid-cols-6 gap-x-2 gap-y-1 flex-1">
              {details.map((count, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-[8px] text-zinc-300 font-bold uppercase line-height-1">{months[i]}</span>
                  <span className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {change && (
          <span className={`text-[14px] font-medium px-2 py-1 rounded-full shrink-0 ${
            isNeutral
              ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
              : isPositive 
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' 
                : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10'
          }`}>
            {change}
          </span>
        )}
      </div>
      
      <div className="mt-4">
        <p className="text-base font-medium text-zinc-400">{title}</p>
        <h3 className="text-2xl font-bold mt-1 tracking-tight">{value}</h3>
      </div>
    </div>
  );
}
