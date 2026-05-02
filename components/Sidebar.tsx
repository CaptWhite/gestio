"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  Settings,
  UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Socis', href: '/customers', icon: Users },
  { name: 'Tasques', href: '/tasks', icon: CheckSquare },
  { name: 'Inscripcions', href: '/inscriptions', icon: UserPlus },
  { name: 'Configuració', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 border-r border-border bg-background">
      <div className="flex flex-col items-center py-8 px-6 gap-3">
        <img 
          src="/gestio/logo ASTER.png" 
          alt="ASTER Logo"
          className="w-24 h-24 object-contain"
        />
        <span className="font-semibold text-sm tracking-tight text-center uppercase text-zinc-600 dark:text-zinc-400">
          ASTER - Administració
        </span>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100" 
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-accent" : "text-zinc-400")} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex flex-col">
            <span className="text-xs font-medium">ASTER</span>
            <span className="text-[10px] text-zinc-300">Powered by Captwhite</span>
          </div>
        </div>
      </div>
    </div>
  );
}
