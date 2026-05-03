import { ReactNode, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Store, History, Settings, LogOut, Menu, UserCircle, Plus, X, Download } from 'lucide-react';
import { useInstallPrompt } from '../hooks/usePWA';
import clsx from 'clsx';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { installPromptEvent, promptInstall } = useInstallPrompt();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Stores', path: '/stores', icon: Store },
    { name: 'History', path: '/history', icon: History, disabled: false },
    { name: 'Settings', path: '/settings', icon: Settings, disabled: true },
  ];

  const NavContent = () => (
    <>
      {/* Header / Brand */}
      <div className="px-6 mb-10 flex flex-col gap-4 pt-8">
        <div className="text-blue-500 font-bold text-xl tracking-tight">CardVault</div>
        <div className="flex items-center gap-3 mt-4">
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
             {user?.photoURL ? (
               <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
             ) : (
               <UserCircle className="text-white/50 w-6 h-6" />
             )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-semibold text-white truncate text-sm">{user?.displayName || 'CardVault User'}</p>
            <p className="text-gray-400 text-xs truncate">Secure Storage</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-col flex-1 px-4 gap-2 flex">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.name}
              to={item.disabled ? '#' : item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 font-medium text-sm transition-all duration-200 rounded-xl",
                isActive
                  ? "bg-blue-600/10 text-blue-400 border border-blue-600/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5",
                item.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <item.icon size={20} className={isActive ? "text-blue-400" : ""} />
              {item.name}
            </Link>
          )
        })}
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-white/5 flex flex-col gap-4">
        {installPromptEvent && (
          <button onClick={promptInstall} className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/20 font-medium text-sm transition-colors mb-2">
            <Download size={16} />
            Install App
          </button>
        )}
        <button onClick={logout} className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm transition-colors">
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex text-body-lg text-white antialiased">
      {/* SideNavBar (Web Only) */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-[#1a1a1a]/60 backdrop-blur-md border-r border-white/5 z-20 font-inter shadow-2xl">
        <NavContent />
      </nav>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div className={clsx(
        "md:hidden fixed inset-y-0 left-0 w-72 bg-[#1a1a1a] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-r border-white/10 flex flex-col",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button onClick={() => setMobileMenuOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white p-2">
           <X size={24} />
        </button>
        <NavContent />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen md:ml-64 relative w-full overflow-x-hidden">
        {/* TopAppBar */}
        <header className="flex justify-between items-center w-full px-4 md:px-6 h-16 bg-[#1a1a1a]/80 backdrop-blur-xl border-b border-white/5 z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-gray-400 hover:text-white p-2 -ml-2 rounded-lg active:bg-white/5 transition-colors">
              <Menu size={24} />
            </button>
            <span className="text-lg font-bold text-white tracking-widest md:hidden">CardVault</span>
          </div>
          <div className="flex items-center gap-4">
             <Link to="/add" className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm w-8 h-8 rounded-full sm:w-auto sm:h-auto sm:px-4 sm:py-2 sm:rounded-lg transition-colors shadow-lg shadow-blue-900/20">
               <Plus size={20} className="sm:w-4 sm:h-4 sm:mr-2" />
               <span className="hidden sm:inline">Add Gift Card</span>
             </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
