'use client';

import { useState, useEffect } from 'react';
import type { PropsWithChildren } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Activity, Database, Code2 } from 'lucide-react';
import { ConnectionSelector } from './connections/connection-selector';
import { Provider as QueryClientProvider } from './query-client/provider';
import { Toolbar } from './toolbar';
import { cn } from '@/lib/utils';
import { selectedEnsNodeUrl } from '@/lib/env';

const SIDEBAR_STORAGE_KEY = 'ensadmin:sidebar:open';

export function PageShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ensnodeUrl = selectedEnsNodeUrl(searchParams);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (saved !== null) {
      setIsSidebarOpen(saved === 'true');
    }
  }, []);

  // Save sidebar state to localStorage
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    localStorage.setItem(SIDEBAR_STORAGE_KEY, (!isSidebarOpen).toString());
  };

  const tabs = [
    {
      path: '/status',
      label: 'Status',
      icon: Activity,
    },
    {
      path: '/gql/ponder',
      label: 'Ponder GraphQL API',
      icon: Database,
    },
    {
      path: '/gql/subgraph-compat',
      label: 'Subgraph-compatible GraphQL API',
      icon: Database,
    },
    {
      path: '/ponder-client',
      label: 'Ponder Client',
      icon: Code2,
    },
  ];

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-card border-b px-6 py-4">
        <h1 className="text-2xl font-semibold text-card-foreground">
          ENSAdmin
        </h1>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <nav
          className={cn(
            'bg-card border-r flex-shrink-0 overflow-y-auto',
            'transition-all duration-300 ease-in-out',
            isSidebarOpen ? 'w-80' : 'w-0'
          )}
          aria-label="Sidebar"
        >
          <div className={cn(
            'w-80 transition-opacity duration-300',
            isSidebarOpen ? 'opacity-100' : 'opacity-0'
          )}>
            <QueryClientProvider><ConnectionSelector />
            </QueryClientProvider>
            <div className="p-4 space-y-2">
              {tabs.map(({ path, label, icon: Icon }) => {
                const to = ensnodeUrl ? `${path}?ensnode=${ensnodeUrl}` : path;
                const isActive = pathname === path;

                return (
                  <Link
                    key={path}
                    href={to}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-colors',
                      'text-sm font-medium',
                      'hover:bg-muted hover:text-foreground',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          <Toolbar
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={toggleSidebar}
          />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
