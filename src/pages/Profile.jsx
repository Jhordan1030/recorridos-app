import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { updateUser, getCurrentUser } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import {
  User,
  Mail,
  Shield,
  Key,
  Camera,
  Save,
  ArrowLeft,
  ChevronRight,
  Bell,
  Smartphone,
  HelpCircle,
  LogOut,
  Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Profile = () => {
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const { isMobile } = useApp();
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('main'); // 'main', 'personal', 'security'

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

  const [displayName, setDisplayName] = useState('');
  const [initial, setInitial] = useState('');

  // Cargar datos del usuario al montar
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await getCurrentUser();
        const userData = response.data.user || response.data;
        const name = extractName(userData) || '';

        setFormData(prev => ({
          ...prev,
          nombre: name,
          email: userData.email || ''
        }));
        setDisplayName(name);
        setInitial(name ? name.charAt(0).toUpperCase() : 'U');

      } catch (error) {
        console.error('Error fetching profile:', error);
        if (user) {
          const name = extractName(user) || '';
          setFormData(prev => ({
            ...prev,
            nombre: name,
            email: user.email || ''
          }));
          setDisplayName(name);
          setInitial(name ? name.charAt(0).toUpperCase() : 'U');
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

    if (formData.password && formData.password !== formData.confirmPassword) {
      showAlert('error', 'Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
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
        setDisplayName(formData.nombre);
        setActiveSection('main');
      }
    } catch (error) {
      showAlert('error', 'Error al actualizar perfil: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER HELPERS ---

  const renderHeader = () => (
    <div className="flex flex-col items-center py-8 bg-slate-50 border-b border-slate-100">
      <div className="relative group cursor-pointer mb-4">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-4 ring-white">
          {initial}
        </div>
        <div className="absolute bottom-0 right-0 bg-slate-900 text-white p-2 rounded-full border-2 border-white shadow-sm">
          <Camera size={16} />
        </div>
      </div>
      <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
      <p className="text-sm text-slate-500">{formData.email}</p>
    </div>
  );

  const renderListItem = ({ icon: Icon, label, sublabel, onClick, color = "text-primary-600", bg = "bg-primary-50", danger = false }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 bg-white active:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${danger ? 'text-red-600' : 'text-slate-900'}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${danger ? 'bg-red-50 text-red-500' : bg + ' ' + color}`}>
          <Icon size={18} />
        </div>
        <div className="text-left">
          <p className="font-medium text-[15px]">{label}</p>
          {sublabel && <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>}
        </div>
      </div>
      <ChevronRight size={18} className="text-slate-300" />
    </button>
  );

  // --- VISTAS ---

  if (activeSection === 'personal') {
    return (
      <div className="min-h-screen bg-slate-100 pb-24">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setActiveSection('main')} className="p-1 -ml-1 text-primary-600">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-slate-900">Datos Personales</h1>
        </div>

        <div className="p-4 max-w-md mx-auto">
          <Card className="p-5 space-y-4 shadow-sm border-slate-200">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nombre Completo"
                name="nombre"
                icon={User}
                value={formData.nombre}
                onChange={handleChange}
              />
              <Input
                label="Correo Electrónico"
                name="email"
                type="email"
                icon={Mail}
                value={formData.email}
                onChange={handleChange}
              //   disabled // Email usually shouldn't change easily
              />
              <div className="pt-2">
                <Button type="submit" isLoading={loading} className="w-full justify-center">
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  if (activeSection === 'security') {
    return (
      <div className="min-h-screen bg-slate-100 pb-24">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setActiveSection('main')} className="p-1 -ml-1 text-primary-600">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-slate-900">Seguridad</h1>
        </div>

        <div className="p-4 max-w-md mx-auto">
          <Card className="p-5 space-y-4 shadow-sm border-slate-200">
            <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100 text-amber-800 text-xs">
              <p className="font-bold flex items-center gap-1"><Lock size={12} /> Nota de Seguridad</p>
              Asegúrate de usar una contraseña fuerte que no utilices en otros sitios.
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nueva Contraseña"
                name="password"
                type="password"
                icon={Key}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
              <Input
                label="Confirmar Contraseña"
                name="confirmPassword"
                type="password"
                icon={Key}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
              />
              <div className="pt-2">
                <Button type="submit" variant="primary" isLoading={loading} className="w-full justify-center">
                  Actualizar Contraseña
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  // --- MAIN VIEW (WhatsApp Style) ---
  return (
    <div className="w-full">
      {/* Desktop Header Adaptation */}
      <div className="hidden lg:block mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Perfil de Usuario</h1>
        <p className="text-slate-500">Administra tu cuenta y preferencias.</p>
      </div>

      <div className="max-w-md mx-auto lg:max-w-2xl bg-white rounded-2xl shadow-sm lg:shadow-xl overflow-hidden border border-slate-200">

        {/* Header */}
        {renderHeader()}

        {/* List Groups */}
        <div className="bg-slate-100 pt-2 lg:bg-white lg:pt-0">

          {/* Section 1 */}
          <div className="bg-white mb-2 lg:mb-0 lg:border-t border-b border-slate-200 lg:border-0">
            {renderListItem({
              icon: User,
              label: 'Información Personal',
              sublabel: 'Nombre, correo electrónico',
              bg: 'bg-blue-100',
              color: 'text-blue-600',
              onClick: () => setActiveSection('personal')
            })}
            {renderListItem({
              icon: Key,
              label: 'Seguridad',
              sublabel: 'Cambiar contraseña, 2FA',
              bg: 'bg-teal-100',
              color: 'text-teal-600',
              onClick: () => setActiveSection('security')
            })}
          </div>

          {/* Section 2 */}
          <div className="bg-white mb-2 lg:mb-0 border-y border-slate-200 lg:border-0 lg:mt-4">
            {renderListItem({
              icon: Bell,
              label: 'Notificaciones',
              bg: 'bg-rose-100',
              color: 'text-rose-600',
              onClick: () => showAlert('info', 'Próximamente: Configuración de notificaciones')
            })}
            {renderListItem({
              icon: Shield,
              label: 'Privacidad',
              bg: 'bg-slate-100',
              color: 'text-slate-600',
              onClick: () => showAlert('info', 'Próximamente: Ajustes de privacidad')
            })}
            {renderListItem({
              icon: Smartphone,
              label: 'Apariencia',
              sublabel: 'Tema claro/oscuro',
              bg: 'bg-purple-100',
              color: 'text-purple-600',
              onClick: () => showAlert('info', 'El tema se ajusta al sistema automáticamente')
            })}
          </div>

          {/* Section 3 */}
          <div className="bg-white mb-8 border-y border-slate-200 lg:border-0 lg:mt-4">
            {renderListItem({
              icon: HelpCircle,
              label: 'Ayuda',
              bg: 'bg-emerald-100',
              color: 'text-emerald-600',
              onClick: () => showAlert('info', 'Contacta a soporte técnico')
            })}
            {renderListItem({
              icon: LogOut,
              label: 'Cerrar Sesión',
              bg: 'bg-slate-50',
              danger: true,
              onClick: logout
            })}
          </div>

          <div className="pb-8 text-center">
            <p className="text-xs text-slate-400">Recorridos App v1.2.0</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;