import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from './Header';
import BottomNav from './BottomNav';
import { useApp } from '../../context/AppContext';

const Layout = ({ children }) => {
  const { isMobile } = useApp();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/50 transition-colors duration-300 font-sans text-slate-900">

      {/* Header (Top Navbar) - Always visible on Desktop, updated design */}
      {user && (
        <Header isMobile={isMobile} />
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[2000px] mx-auto px-0 sm:px-4 lg:px-6 pb-24 lg:pb-8">
        {children}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      {user && (
        <BottomNav />
      )}

    </div>
  );
};

export default Layout;