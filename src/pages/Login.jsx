import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, user, error, setError } = useAuth();
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
    /* SOLUCIÓN MAESTRA:
       - fixed: Saca el elemento del flujo normal.
       - inset-0: Lo pega a los 4 bordes (top, right, bottom, left = 0).
       - z-50: Asegura que quede encima de cualquier otro elemento (navbars, footers globales).
    */
    <div className="fixed inset-0 w-full h-full flex bg-white font-sans z-50">
      
      {/* --- LADO IZQUIERDO (IMAGEN/BRANDING) --- */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 relative flex-col justify-between p-12 lg:p-16 overflow-hidden">
        
        {/* Fondo con degradado y patrón */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-slate-900 z-0" />
        
        {/* Círculos decorativos de fondo (Efecto Glow) */}
        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px]" />

        {/* Contenido Superior */}
        <div className="relative z-10 mt-8">
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 backdrop-blur-md mb-6">
            <span className="text-blue-200 text-xs font-bold tracking-wider uppercase">Sistema V 2.1</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
            Gestión de <br />
            <span className="text-blue-500">Transporte</span>
          </h1>
          <p className="mt-6 text-slate-400 text-lg max-w-md leading-relaxed">
            Plataforma integral para el control de flotas, optimización de rutas y seguridad corporativa.
          </p>
        </div>

        {/* Contenido Inferior (Footer del lado izquierdo) */}
        
      </div>

      {/* --- LADO DERECHO (FORMULARIO) --- */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 md:p-16 bg-white relative">
        
        {/* Decoración sutil esquina superior derecha */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full" />

        <div className="w-full max-w-[450px] space-y-8 z-10">
          
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-slate-900">Bienvenido de nuevo</h2>
            <p className="text-slate-500 mt-2">Ingresa tus credenciales para acceder.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-3 border border-red-100">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Correo Corporativo</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none text-slate-900 placeholder-slate-400"
                placeholder="ejemplo@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-slate-700">Contraseña</label>
                <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700">¿Olvidaste tu clave?</a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none text-slate-900 placeholder-slate-400"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? 'Conectando...' : 'Ingresar al Dashboard'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-xs mt-8">
            © 2025 Recorridos App Inc. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;