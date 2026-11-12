import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  navigate: (path: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, navigate }) => {
  return (
    <nav aria-label="Breadcrumb" className="py-2 px-3.5 mb-4 bg-white border border-slate-200 rounded-xl text-xs text-slate-500 shadow-xs">
      <ol className="flex items-center flex-wrap gap-1.5">
        <li className="inline-flex items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center hover:text-slate-900 transition-colors text-slate-600 font-medium cursor-pointer"
            title="Home"
          >
            <Home className="w-3.5 h-3.5 mr-1 text-slate-400" />
            <span>Home</span>
          </button>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="inline-flex items-center">
              <ChevronRight className="w-3 h-3 text-slate-400 mx-1 shrink-0" />
              {isLast || !item.path ? (
                <span className="font-semibold text-slate-900 truncate max-w-xs md:max-w-md">
                  {item.label}
                </span>
              ) : (
                <button
                  onClick={() => navigate(item.path!)}
                  className="hover:text-slate-900 transition-colors hover:underline text-slate-600 font-medium cursor-pointer"
                >
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
