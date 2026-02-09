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
    <div className="flex min-h-screen w-full bg-transparent overflow-hidden">

      {/* --- LADO IZQUIERDO (FORMULARIO) --- */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 relative bg-transparent transition-colors duration-300">

        <div className="w-full max-w-[420px] space-y-8 z-10">

          <div className="text-center md:text-left space-y-3">
            <div className="md:hidden inline-flex mb-6 p-4 rounded-3xl bg-white border border-slate-200 text-slate-900 shadow-xl">
              <span className="text-3xl">🚌</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
              Bienvenido
            </h2>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
              INGRESA TUS CREDENCIALES PARA CONTINUAR
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 backdrop-blur-2xl text-red-400 p-5 rounded-3xl text-[10px] font-black uppercase tracking-widest flex items-center gap-4 border border-red-500/20 shadow-2xl animate-in slide-in-from-top-4">
              <div className="shrink-0 w-8 h-8 flex items-center justify-center bg-red-400 text-[#1e0a0a] rounded-full text-xs">⚠️</div>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Input Email con Icono */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                Correo Electrónico
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                </div>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-slate-50 focus:border-slate-300"
                  placeholder="ejemplo@empresa.com"
                />
              </div>
            </div>

            {/* Input Password con Icono */}
            <div className="space-y-3">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  Contraseña
                </label>
                <a href="#" className="text-[10px] font-black text-primary-600 hover:text-primary-700 uppercase tracking-widest transition-colors">
                  ¿Olvidaste tu clave?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                </div>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-slate-50 focus:border-slate-300"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Botón Personalizado */}
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              className="w-full justify-center shadow-[0_20px_40px_-10px_rgba(14,165,233,0.4)]"
            >
              {isLoading ? 'VERIFICANDO...' : (
                <span className="flex items-center gap-3">
                  INICIAR SESIÓN <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>

          </form>

          <p className="text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-12 pb-6">
            © 2026 Recorridos App Inc.
          </p>
        </div>
      </div>

      {/* --- LADO DERECHO (BRANDING) --- */}
      <div className="hidden md:flex md:w-1/2 relative flex-col justify-between p-12 lg:p-16 overflow-hidden bg-slate-950/20 backdrop-blur-md border-l border-white/5">

        {/* Fondo animado sutil */}
        <div className="absolute inset-0 bg-gradient-to-bl from-slate-950/40 via-blue-900/10 to-slate-950/40 z-0" />
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

          <h1 className="text-6xl lg:text-7xl font-black text-white leading-[0.9] tracking-tighter">
            GESTIÓN DE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-400 to-indigo-400">
              TRANSPORTE
            </span>
          </h1>

          <p className="mt-8 text-white/40 text-lg font-bold max-w-md ml-auto leading-relaxed tracking-tight">
            Plataforma integral para el control de flotas, optimización de rutas y seguridad inteligente.
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