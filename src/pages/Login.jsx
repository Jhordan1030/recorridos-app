import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Mail, Lock, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, user, error, setError } = useAuth();
  const { theme, toggleTheme } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard');
    setError('');
  }, [user, navigate, setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);
    if (result.success) navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen w-full bg-white dark:bg-slate-950 transition-colors duration-300">

      {/* --- LADO IZQUIERDO (FORMULARIO) --- */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 relative bg-white dark:bg-slate-950 transition-colors duration-300">

        {/* Botón Tema (Flotante a la izquierda en móvil, pero visualmente queda bien en la esquina) */}
        <button
          onClick={toggleTheme}
          className="absolute top-6 left-6 p-3 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all duration-300 shadow-sm z-20"
          aria-label="Cambiar tema"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="w-full max-w-[420px] space-y-8 z-10">

          <div className="text-center md:text-left space-y-2">
            <div className="md:hidden inline-flex mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              <span className="text-2xl">🚌</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Bienvenido de nuevo
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Ingresa tus credenciales para acceder al panel.
            </p>
          </div>

          {error && (
            <div className="animate-in slide-in-from-top-2 fade-in bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm flex items-start gap-3 border border-red-100 dark:border-red-800/30">
              <div className="mt-0.5">⚠️</div>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Input Email con Icono */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                Correo Electrónico
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-blue-500/20"
                  placeholder="ejemplo@empresa.com"
                />
              </div>
            </div>

            {/* Input Password con Icono */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Contraseña
                </label>
                <a href="#" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline">
                  ¿Olvidaste tu clave?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-blue-500/20"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Botón Personalizado */}
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              className="w-full justify-center py-3.5 text-base font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-300"
            >
              {isLoading ? 'Verificando...' : (
                <span className="flex items-center gap-2">
                  Iniciar Sesión <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>

          </form>

          <p className="text-center text-slate-400 dark:text-slate-600 text-xs mt-8">
            © 2025 Recorridos App Inc. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* --- LADO DERECHO (BRANDING) --- */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 relative flex-col justify-between p-12 lg:p-16 overflow-hidden">
        
        {/* Fondo animado sutil */}
        <div className="absolute inset-0 bg-gradient-to-bl from-slate-900 via-blue-950 to-slate-900 z-0" />
        <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-20%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse delay-700" />

        {/* Contenido */}
        <div className="relative z-10 mt-10 text-right"> {/* Alineado a la derecha para variar */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 backdrop-blur-md mb-6 ml-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-blue-200 text-xs font-bold tracking-widest uppercase">Sistema V 2.1</span>
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
            Gestión de <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-400 to-indigo-400">
              Transporte
            </span>
          </h1>
          
          <p className="mt-6 text-slate-400 text-lg max-w-md ml-auto leading-relaxed">
            Plataforma integral para el control de flotas, optimización de rutas y seguridad de los estudiantes.
          </p>
        </div>

        {/* Footer del lado derecho */}
        <div className="relative z-10 text-slate-500 text-sm text-right">
          <p>Potenciado por tecnología segura.</p>
        </div>
      </div>

    </div>
  );
};

export default Login;