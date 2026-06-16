import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Library,
  FileText,
  FilePlus,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  exact?: boolean;
};

const items: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/', exact: true },
  { id: 'library', label: 'Report Library', icon: <Library size={18} />, path: '/library' },
  { id: 'templates', label: 'Templates', icon: <FileText size={18} />, path: '/templates' },
  { id: 'generate', label: 'Generate Report', icon: <FilePlus size={18} />, path: '/generate' },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (item: NavItem) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

  return (
    <>
      <div
        className={cn(
          'h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shrink-0',
          isCollapsed ? 'w-16' : 'w-56'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h2 className="text-sm font-semibold text-[#2e3338] leading-tight">Reporting</h2>
              <p className="text-[10px] text-[#9aa5b1] mt-0.5">by Purpose</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-gray-100 rounded transition-colors ml-auto text-[#657381]"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                isActive(item)
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-[#657381] hover:bg-gray-50 hover:text-[#2e3338]',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="shrink-0">{item.icon}</div>
              {!isCollapsed && <span className="text-sm flex-1">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200">
          <button
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 text-[#657381] hover:bg-gray-50 hover:text-[#2e3338] transition-colors',
              isCollapsed && 'justify-center'
            )}
            title={isCollapsed ? 'Help' : undefined}
          >
            <HelpCircle size={18} />
            {!isCollapsed && <span className="text-sm">Help</span>}
          </button>
          <button
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 text-[#657381] hover:bg-gray-50 hover:text-[#2e3338] transition-colors',
              isCollapsed && 'justify-center'
            )}
            title={isCollapsed ? 'Sarah Mitchell · Senior Advisor' : undefined}
          >
            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <UserIcon size={15} />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm text-[#2e3338] leading-tight truncate">Sarah Mitchell</p>
                <p className="text-[10px] text-[#9aa5b1] truncate">Senior Advisor</p>
              </div>
            )}
          </button>
        </div>
      </div>

      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed left-16 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-r-lg p-2 shadow-lg hover:bg-gray-50 transition-colors z-50 text-[#657381]"
          aria-label="Expand navigation"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </>
  );
}
