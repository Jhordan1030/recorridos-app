import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MapPin, Users, Car, User } from 'lucide-react';

const BottomNav = () => {
    const location = useLocation();

    const navItems = [
        { icon: Home, label: 'Inicio', path: '/dashboard' },
        { icon: MapPin, label: 'Rutas', path: '/recorridos' },
        { icon: Users, label: 'Niños', path: '/ninos' },
        { icon: Car, label: 'Vehículos', path: '/vehiculos' },
        { icon: User, label: 'Perfil', path: '/perfil' },
    ];

    return (
        <div className="fixed bottom-6 left-4 right-4 z-50 lg:hidden safe-area-bottom pointer-events-none">
            {/* iOS 26 Style: Floating Glassmorphism Island */}
            <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-2xl shadow-slate-300/50 rounded-[2.5rem] p-1.5 flex items-center justify-between mx-auto max-w-sm ring-1 ring-black/5 pointer-events-auto transition-all duration-300 transform hover:scale-[1.02]">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/');

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`relative group flex flex-col items-center justify-center w-full h-14 rounded-[2rem] transition-all duration-300 ease-out ${isActive ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {/* Active Background Pill */}
                            {isActive && (
                                <div className="absolute inset-0 bg-white shadow-sm rounded-[2rem] scale-95 border border-slate-100/50 animate-in fade-in zoom-in duration-300 origin-center" />
                            )}

                            {/* Icon & Label Container */}
                            <div className="relative z-10 flex flex-col items-center gap-0.5 transition-transform duration-200 active:scale-90">
                                <Icon
                                    size={24}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={`transition-all duration-300 ${isActive ? '-translate-y-0.5 drop-shadow-sm' : ''}`}
                                />

                                {isActive && (
                                    <span className="text-[9px] font-bold tracking-tight animate-in slide-in-from-bottom-1 fade-in duration-300">
                                        {item.label}
                                    </span>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;
