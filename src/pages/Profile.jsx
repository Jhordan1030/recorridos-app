import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { updateUser, getCurrentUser } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { User, Mail, Shield, Key, Camera, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // ← Agregar para volver atrás

const Profile = () => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate(); // ← Hook para navegación
  const [loading, setLoading] = useState(false);

  // --- LÓGICA DE NOMBRE ---
  const extractName = (u) => {
    if (!u) return null;
    return u.nombre ||
      u.full_name ||
      u.user_metadata?.full_name ||
      u.user_metadata?.name;
  };

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Cargar datos del usuario al montar
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await getCurrentUser();
        const userData = response.data.user || response.data;

        setFormData(prev => ({
          ...prev,
          nombre: extractName(userData) || '',
          email: userData.email || ''
        }));
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Si falla, al menos usamos lo que tenemos en el context
        if (user) {
          setFormData(prev => ({
            ...prev,
            nombre: extractName(user) || '',
            email: user.email || ''
          }));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validación simple de contraseña
    if (formData.password && formData.password !== formData.confirmPassword) {
      showAlert('error', 'Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      // Preparamos los datos a enviar
      const dataToUpdate = {
        nombre: formData.nombre,
        email: formData.email
      };

      if (formData.password) {
        dataToUpdate.password = formData.password;
      }

      const userId = user.id || user.userId;
      const response = await updateUser(userId, dataToUpdate);

      if (response.data.success) {
        showAlert('success', 'Perfil actualizado correctamente');
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      }
    } catch (error) {
      showAlert('error', 'Error al actualizar perfil: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Obtener inicial para el avatar
  const getInitial = () => {
    return formData.nombre ? formData.nombre.charAt(0).toUpperCase() : 'U';
  };

  return (
    <div className="min-h-screen bg-transparent py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300">

      {/* --- Page Header --- */}
      <div className="max-w-5xl mx-auto mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate(-1)}
              className="p-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 transition-all group shadow-sm"
            >
              <ArrowLeft size={20} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>
            <div>
              <h1 className="text-4xl font-black text-slate-900 sm:text-5xl tracking-tighter">Mi Perfil</h1>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-3">Configuración de identidad y seguridad</p>
            </div>
          </div>

          <div className="inline-flex items-center px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 bg-white text-slate-700 shadow-sm">
            <div className={`w-2 h-2 rounded-full mr-3 ${user?.rol === 'admin' ? 'bg-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]'}`} />
            {user?.rol === 'admin' ? 'Nivel Administrador' : 'Usuario Activo'}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* --- Identity Summary --- */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl p-0 overflow-hidden">
            <div className="p-10 flex flex-col items-center text-center">
              <div className="relative mb-8 group">
                <div className="w-36 h-36 rounded-[2.5rem] bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-6xl font-black shadow-inner">
                  {getInitial()}
                </div>
                <button className="absolute -bottom-2 -right-2 bg-primary-500 text-white rounded-2xl p-3.5 shadow-2xl shadow-primary-500/30 border border-primary-400/20 hover:scale-110 transition-all duration-300">
                  <Camera className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tighter">
                {formData.nombre || 'Jhordan Huera'}
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-10">
                {user?.rol === 'admin' ? 'Administrador del Sistema' : 'Usuario del Sistema'}
              </p>

              <div className="w-full grid grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center gap-1">
                  <span className="text-emerald-500 text-lg font-black tracking-tighter">✓</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Validado</span>
                </div>
                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center gap-1">
                  <span className="text-slate-900 text-lg font-black tracking-tighter">{new Date().getFullYear()}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Periodo</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* --- Sensitive Data Form --- */}
        <div className="lg:col-span-8">
          <Card className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden p-0">
            <div className="p-8 sm:p-10 lg:p-12">
              <div className="mb-10 flex items-center gap-5">
                <div className="h-12 w-12 rounded-2xl bg-primary-100 border border-primary-200 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase tracking-[0.05em]">Datos Maestros</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Sincronización de credenciales principales</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <Input
                    label="Filiación Completa"
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Escriba su nombre..."
                  />
                  <Input
                    label="Canal de Notificación"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="su@email.com"
                  />
                </div>

                <div className="pt-10 border-t border-slate-100">
                  <div className="mb-8 flex items-center gap-5">
                    <div className="h-12 w-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase tracking-[0.05em]">Cifrado y Acceso</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Gestión de llaves criptográficas</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <Input
                      label="Nueva Contraseña"
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                    />
                    <Input
                      label="Validar Secreto"
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="pt-10 flex flex-col-reverse sm:flex-row gap-6 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate(-1)}
                    className="w-full sm:w-auto"
                  >
                    Retroceder
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="w-full sm:w-auto shadow-2xl shadow-primary-500/20 px-10 ml-auto"
                  >
                    {loading ? 'Procesando...' : 'Fijar Atributos'}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;