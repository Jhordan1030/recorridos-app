import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { updateUser } from '../services/api'; 
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

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Cargar datos del usuario al montar
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        nombre: user.nombre || user.user_metadata?.full_name || '',
        email: user.email || ''
      }));
    }
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-4 px-3 sm:px-6 lg:px-8 transition-colors duration-300">
      
      {/* Header de la Página MEJORADO */}
      <div className="max-w-5xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Botón volver atrás - Solo en móvil */}
            <button 
              onClick={() => navigate(-1)}
              className="lg:hidden p-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600 dark:text-slate-400" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Mi Perfil
              </h1>
              <p className="text-gray-600 dark:text-slate-400 text-xs sm:text-sm">
                Gestiona tu información personal y seguridad
              </p>
            </div>
          </div>
          
          {/* Badge de estado */}
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
            user?.rol === 'admin' 
              ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' 
              : 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              user?.rol === 'admin' ? 'bg-amber-500' : 'bg-emerald-500'
            }`}></div>
            {user?.rol === 'admin' ? 'Administrador' : 'Activo'}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: Tarjeta de Resumen MEJORADA */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="p-4 sm:p-6 flex flex-col items-center text-center">
              
              {/* Avatar Responsive */}
              <div className="relative mb-4 group">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl sm:text-5xl font-bold shadow-xl ring-4 ring-white dark:ring-slate-800">
                  {getInitial()}
                </div>
                <button className="absolute bottom-0 right-0 sm:-bottom-1 sm:-right-1 bg-white dark:bg-slate-800 rounded-full p-2 shadow-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  <Camera className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                </button>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1 truncate max-w-full">
                {formData.nombre || 'Usuario'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mb-4 truncate max-w-full">
                {formData.email}
              </p>

              {/* Stats Responsive */}
              <div className="w-full grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <span className="block text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">✓</span>
                  <span className="text-xs text-gray-500 dark:text-slate-500">Verificado</span>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <span className="block text-sm sm:text-base font-bold text-gray-900 dark:text-white">{new Date().getFullYear()}</span>
                  <span className="text-xs text-gray-500 dark:text-slate-500">Miembro</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* COLUMNA DERECHA: Formulario MEJORADO */}
        <div className="lg:col-span-2">
          <Card className="border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="mb-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" />
                  Información Personal
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
                  Actualiza tus datos básicos y de contacto
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Nombre Completo</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <User className="w-4 h-4 text-gray-400" />
                      </div>
                      <Input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        className="pl-10 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        placeholder="Tu nombre completo"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Correo Electrónico</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Mail className="w-4 h-4 text-gray-400" />
                      </div>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-10 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Sección Seguridad MEJORADA */}
                <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
                  <div className="mb-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center">
                      <Key className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-amber-500" />
                      Seguridad
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
                      Cambia tu contraseña (opcional)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Nueva Contraseña</label>
                      <Input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white text-sm sm:text-base"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Confirmar</label>
                      <Input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Botones Responsive */}
                <div className="pt-6 flex flex-col-reverse sm:flex-row gap-3 border-t border-gray-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate(-1)}
                    className="w-full sm:w-auto justify-center bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border-gray-300 dark:border-slate-600"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    className="w-full sm:w-auto justify-center shadow-lg shadow-blue-500/20 flex items-center gap-2 order-first sm:order-last"
                  >
                    <Save className="w-4 h-4" />
                    Guardar Cambios
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