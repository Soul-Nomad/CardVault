import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Store, History, Settings, LogOut, Menu, UserCircle, Plus } from 'lucide-react';
import clsx from 'clsx';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Stores', path: '/stores', icon: Store },
    { name: 'History', path: '/history', icon: History, disabled: false },
    { name: 'Settings', path: '/settings', icon: Settings, disabled: true },
  ];

  return (
    <div className="min-h-screen flex text-body-lg text-white antialiased">
      {/* SideNavBar (Web Only) */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-[#1a1a1a]/60 backdrop-blur-md border-r border-white/5 pt-8 z-20 font-inter">
        {/* Header / Brand */}
        <div className="px-6 mb-10 flex flex-col gap-4">
          <div className="text-primary font-bold text-xl tracking-tight">CardVault</div>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center overflow-hidden">
               {user?.photoURL ? (
                 <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <UserCircle className="text-outline w-6 h-6" />
               )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-label-md text-white truncate">{user?.displayName || 'Portfolio'}</p>
              <p className="font-body-sm text-gray-400 text-xs truncate">Secure Storage</p>
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
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 font-inter text-sm transition-all duration-200 rounded",
                  isActive
                    ? "bg-white/5 text-blue-400 border-r-2 border-blue-400"
                    : "text-gray-400 hover:text-white hover:bg-white/5",
                  item.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <item.icon size={20} className={isActive ? "fill-primary/20" : ""} />
                {item.name}
              </Link>
            )
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/5 flex flex-col gap-4">
          <button onClick={logout} className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm transition-colors">
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen md:ml-64 relative">
        {/* TopAppBar */}
        <header className="flex justify-between items-center w-full px-6 h-16 bg-[#1a1a1a]/60 backdrop-blur-md border-b border-white/5 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-zinc-400 hover:text-zinc-200">
              <Menu size={24} />
            </button>
            <span className="text-lg font-black text-white uppercase tracking-widest md:hidden">CardVault</span>
          </div>
          <div className="flex items-center gap-4">
             <Link to="/add" className="hidden sm:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors">
               <Plus size={16} />
               Add Gift Card
             </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
