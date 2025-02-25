'use client';

import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Toolbar({ isSidebarOpen, onToggleSidebar }: ToolbarProps) {
  return (
    <nav className='border-b'>
      <div className="h-14 bg-card px-4 flex items-center">
        <button
          onClick={onToggleSidebar}
          className={cn(
            'w-8 h-8 flex items-center justify-center rounded-md',
            'text-muted-foreground hover:text-foreground',
            'hover:bg-muted transition-colors'
          )}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-5 h-5" />
          ) : (
            <PanelLeft className="w-5 h-5" />
          )}
          <span className="sr-only">
            {isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          </span>
        </button>
      </div>
    </nav>
  );
}
