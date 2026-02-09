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
              className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
            >
              <ArrowLeft size={20} className="text-white/50 group-hover:text-white transition-colors" />
            </button>
            <div>
              <h1 className="text-4xl font-black text-white sm:text-5xl tracking-tighter">Mi Perfil</h1>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-3">Configuración de identidad y seguridad</p>
            </div>
          </div>

          <div className="inline-flex items-center px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 bg-white/5 text-white shadow-2xl shadow-black/20">
            <div className={`w-2 h-2 rounded-full mr-3 ${user?.rol === 'admin' ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'}`} />
            {user?.rol === 'admin' ? 'Nivel Administrador' : 'Usuario Activo'}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* --- Identity Summary --- */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] shadow-2xl p-0 overflow-hidden">
            <div className="p-10 flex flex-col items-center text-center">
              <div className="relative mb-8 group">
                <div className="w-36 h-36 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center text-white text-6xl font-black shadow-inner shadow-white/10">
                  {getInitial()}
                </div>
                <button className="absolute -bottom-2 -right-2 bg-primary-500 text-white rounded-2xl p-3.5 shadow-2xl shadow-primary-500/30 border border-primary-400/20 hover:scale-110 transition-all duration-300">
                  <Camera className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-2xl font-black text-white mb-2 tracking-tighter">
                {formData.nombre || 'Jhordan Huera'}
              </h2>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.1em] mb-10">
                {user?.rol === 'admin' ? 'Administrador del Sistema' : 'Usuario del Sistema'}
              </p>

              <div className="w-full grid grid-cols-2 gap-4">
                <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex flex-col items-center gap-1">
                  <span className="text-emerald-400 text-lg font-black tracking-tighter">✓</span>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Validado</span>
                </div>
                <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex flex-col items-center gap-1">
                  <span className="text-white text-lg font-black tracking-tighter">{new Date().getFullYear()}</span>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Periodo</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* --- Sensitive Data Form --- */}
        <div className="lg:col-span-8">
          <Card className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden p-0">
            <div className="p-8 sm:p-10 lg:p-12">
              <div className="mb-10 flex items-center gap-5">
                <div className="h-12 w-12 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tighter uppercase tracking-[0.05em]">Datos Maestros</h3>
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">Sincronización de credenciales principales</p>
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

                <div className="pt-10 border-t border-white/5">
                  <div className="mb-8 flex items-center gap-5">
                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white tracking-tighter uppercase tracking-[0.05em]">Cifrado y Acceso</h3>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">Gestión de llaves criptográficas</p>
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

                <div className="pt-10 flex flex-col-reverse sm:flex-row gap-6 border-t border-white/5">
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