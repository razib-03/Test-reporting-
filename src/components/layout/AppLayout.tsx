import { Outlet, useLocation } from 'react-router';
import { Bell } from 'lucide-react';
import Sidebar from './Sidebar';

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard';
  if (pathname.startsWith('/library/')) return 'Report';
  if (pathname.startsWith('/library')) return 'Report Library';
  if (pathname.startsWith('/templates')) return 'Templates';
  if (pathname.startsWith('/generate')) return 'Generate Report';
  return 'Reporting';
}

export default function AppLayout() {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-12 bg-white border-b border-[#e9ecef] flex items-center gap-4 px-5 shrink-0">
          <span className="font-semibold text-sm text-[#2e3338]">{pageTitle}</span>

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-[11px] font-medium text-[#657381] bg-[#f3f4f6] border border-[#e9ecef] rounded-md px-2 py-1">
              CAD
            </span>
            <button className="relative p-2 rounded-lg text-[#657381] hover:bg-gray-100 hover:text-[#2e3338] transition-colors">
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#0645ad] rounded-full" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
