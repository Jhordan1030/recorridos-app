import React, { useState, useEffect } from 'react';
import { getUsers, deleteUser, createUser, updateUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useApp } from '../context/AppContext';
import ConfirmModal from '../components/ui/ConfirmModal';
import Alert from '../components/ui/Alert';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import { Plus } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Loading States
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const { isAdmin, user: currentUser } = useAuth();
  const { showAlert } = useAlert();
  const { isMobile } = useApp();

  // Forms Data
  const [createFormData, setCreateFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'usuario'
  });

  const [editFormData, setEditFormData] = useState({
    nombre: '',
    email: '',
    rol: 'usuario'
  });

  const [passwordFormData, setPasswordFormData] = useState({
    newPassword: ''
  });

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers();
      const usersData = response.data.data || [];
      if (Array.isArray(usersData)) {
        setUsers(usersData);
      } else {
        setUsers([]);
        showAlert('error', 'Formato de datos incorrecto');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      showAlert('error', `Error al cargar usuarios: ${errorMessage}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser?.userId) {
      showAlert('warning', 'No puedes eliminar tu propio usuario');
      return;
    }
    const userToDelete = users.find(user => user.id === userId);
    setSelectedUser(userToDelete);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteUser(selectedUser.id);
      setUsers(users.filter(user => user.id !== selectedUser.id));
      showAlert('success', 'Usuario eliminado correctamente');
    } catch (error) {
      showAlert('error', 'No se pudo eliminar el usuario');
    } finally {
      setShowDeleteModal(false);
      setSelectedUser(null);
    }
  };

  // --- Create User Logic ---
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!createFormData.nombre || !createFormData.email || !createFormData.password) {
      showAlert('warning', 'Completa todos los campos obligatorios');
      return;
    }
    if (createFormData.password.length < 6) {
      showAlert('warning', 'La contraseña es muy corta (mínimo 6 caracteres)');
      return;
    }

    try {
      setCreating(true);
      const response = await createUser(createFormData);
      if (response.data.success) {
        setShowCreateForm(false);
        setCreateFormData({ nombre: '', email: '', password: '', rol: 'usuario' });
        await loadUsers();
        showAlert('success', 'Usuario registrado exitosamente');
      }
    } catch (error) {
      showAlert('error', 'Error al crear el usuario');
    } finally {
      setCreating(false);
    }
  };

  // --- Edit User Logic ---
  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!editFormData.nombre || !editFormData.email) {
      showAlert('warning', 'Nombre y email son requeridos');
      return;
    }

    try {
      setEditing(true);
      const response = await updateUser(selectedUser.id, editFormData);
      if (response.data.success) {
        setShowEditForm(false);
        setSelectedUser(null);
        await loadUsers();
        showAlert('success', 'Información actualizada');
      }
    } catch (error) {
      showAlert('error', 'No se pudieron guardar los cambios');
    } finally {
      setEditing(false);
    }
  };

  // --- Password Reset Logic ---
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (passwordFormData.newPassword.length < 6) {
      showAlert('warning', 'La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setEditing(true);
      const response = await updateUser(selectedUser.id, {
        password: passwordFormData.newPassword
      });

      if (response.data.success) {
        setShowPasswordModal(false);
        setPasswordFormData({ newPassword: '' });
        setSelectedUser(null);
        showAlert('success', 'Contraseña restablecida correctamente');
      }
    } catch (error) {
      showAlert('error', 'Error al actualizar la contraseña: ' + error.message);
    } finally {
      setEditing(false);
    }
  };

  // --- Helpers ---
  const openEditForm = (user) => {
    setSelectedUser(user);
    setEditFormData({
      nombre: user.nombre,
      email: user.email,
      rol: user.rol
    });
    setShowEditForm(true);
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setPasswordFormData({ newPassword: '' });
    setShowPasswordModal(true);
  };

  const usersArray = Array.isArray(users) ? users : [];

  // UI Helper: Role Badge Styles
  const getRoleBadge = (rol) => {
    const isPrimary = rol === 'admin';
    const styles = isPrimary
      ? 'bg-amber-400/20 text-amber-400 border-amber-400/20'
      : 'bg-primary-400/20 text-primary-400 border-primary-400/20';

    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border ${styles}`}>
        {rol}
      </span>
    );
  };

  // UI Helper: Get Initials
  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .filter(n => n)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-transparent py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <Alert />

      {/* --- Page Header --- */}
      <div className="w-full mx-auto mb-10">
        <div className="md:flex md:items-center md:justify-between md:space-x-8">
          <div className="flex items-start">
            <div className="pt-1.5">
              <h1 className="text-4xl font-black text-slate-900 sm:text-5xl tracking-tighter">Usuarios</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">Administración de accesos y roles</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col-reverse justify-stretch gap-4 md:mt-0 md:flex-row md:items-center">
            <Button
              variant="secondary"
              onClick={loadUsers}
              disabled={loading}
              size={isMobile ? 'sm' : 'lg'}
              className="w-full md:w-auto !bg-white !border !border-slate-200 !text-slate-700 hover:!text-indigo-600 hover:!border-indigo-200 hover:!bg-indigo-50 transition-all shadow-sm"
            >
              Refrescar
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowCreateForm(true)}
              size={isMobile ? 'sm' : 'lg'}
              className="w-full md:w-auto shadow-2xl shadow-primary-500/20"
            >
              Nuevo Usuario
            </Button>
          </div>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="w-full mx-auto">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-10">
          <Card className="p-8">
            <dt className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Usuarios</dt>
            <dd className="text-4xl font-black text-slate-900 tracking-tighter">{usersArray.length}</dd>
          </Card>
          <Card className="p-8 border-purple-200 bg-purple-50/50">
            <dt className="text-[10px] font-black text-purple-600/70 uppercase tracking-[0.2em] mb-2">Administradores</dt>
            <dd className="text-4xl font-black text-purple-600 tracking-tighter">
              {usersArray.filter(u => u.rol === 'admin').length}
            </dd>
          </Card>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} variant="card" className="h-[250px]" />
            ))}
          </div>
        ) : usersArray.length === 0 ? (
          <div className="text-center py-24 bg-slate-50 rounded-[2.5rem] border border-slate-200 border-dashed">
            <div className="text-5xl mb-6 opacity-30">👥</div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Sin usuarios</h3>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Registra nuevos miembros para comenzar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {usersArray.map((user) => (
              <div
                key={user.id}
                className="group relative bg-white rounded-[2rem] border border-slate-100 p-7 hover:shadow-xl transition-all duration-500 flex flex-col"
              >
                <div className="flex items-start justify-between mb-6">
                  {/* Avatar */}
                  <div className="h-14 w-14 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center font-black text-xs shadow-sm border border-slate-100 ring-4 ring-slate-50">
                    {getInitials(user.nombre)}
                  </div>
                  {/* Role Badge */}
                  {getRoleBadge(user.rol)}
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-black text-slate-900 truncate tracking-tighter" title={user.nombre}>
                    {user.nombre}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 truncate" title={user.email}>
                    {user.email}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">ID: {user.id}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                    <span className="text-[9px] font-black text-emerald-400/70 uppercase tracking-widest">En línea</span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className={`
                  absolute inset-0 bg-white/90 backdrop-blur-xl rounded-[2rem] flex items-center justify-center gap-3 transition-all duration-500
                  ${isMobile
                    ? 'opacity-0 scale-95 pointer-events-none'
                    : 'opacity-0 lg:group-hover:opacity-100 scale-95 lg:group-hover:scale-100 z-10 pointer-events-none lg:group-hover:pointer-events-auto'
                  }
                `}>
                  <Button variant="secondary" size="sm" onClick={() => openEditForm(user)}>✏️</Button>
                  <Button variant="warning" size="sm" onClick={() => openPasswordModal(user)}>🔑</Button>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteUser(user.id)} disabled={user.rol === 'admin' || user.id === currentUser?.userId}>🗑️</Button>
                </div>

                {/* Mobile Actions (Visible) */}
                <div className="mt-auto pt-6 border-t border-slate-100 flex gap-2 lg:hidden">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEditForm(user)}>Editar</Button>
                  <Button variant="warning" size="sm" className="px-3" onClick={() => openPasswordModal(user)}>🔑</Button>
                  <Button variant="danger" size="sm" className="flex-1" onClick={() => handleDeleteUser(user.id)} disabled={user.rol === 'admin' || user.id === currentUser?.userId}>Eliminar</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Modals Section --- */}

      {/* 1. Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Desactivar Acceso"
        message={`¿Estás seguro de que quieres eliminar al usuario ${selectedUser?.nombre}? Esta acción es irreversible.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      {/* 2. Create User Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Nuevo Usuario"
        size="max-w-lg"
      >
        <div className="p-0 bg-transparent">
          <form onSubmit={handleCreateUser} className="space-y-5">
            <Input
              label="Nombre Completo"
              placeholder="Ej: Ana García"
              value={createFormData.nombre}
              onChange={e => setCreateFormData({ ...createFormData, nombre: e.target.value })}
              required
            />
            <Input
              label="Correo Electrónico"
              placeholder="correo@empresa.com"
              type="email"
              value={createFormData.email}
              onChange={e => setCreateFormData({ ...createFormData, email: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-6">
              <Input
                label="Contraseña"
                placeholder="••••••"
                type="password"
                value={createFormData.password}
                onChange={e => setCreateFormData({ ...createFormData, password: e.target.value })}
                required
              />
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 pl-1">Rol</label>
                <select
                  className="px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500/50 focus:border-slate-300 block w-full transition-all duration-300 bg-white text-slate-900 outline-none"
                  value={createFormData.rol}
                  onChange={e => setCreateFormData({ ...createFormData, rol: e.target.value })}
                >
                  <option value="usuario">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-4">
              <Button type="button" onClick={() => setShowCreateForm(false)} variant="secondary" className="w-full sm:w-auto">Cancelar</Button>
              <Button type="submit" variant="primary" loading={creating} className="w-full sm:w-auto">Crear Usuario</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* 3. Edit User Modal */}
      <Modal
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        title="Editar Usuario"
        size="max-w-lg"
      >
        <div className="p-0 bg-transparent">
          <form onSubmit={handleEditUser} className="space-y-6">
            <Input
              label="Nombre Completo"
              value={editFormData.nombre}
              onChange={e => setEditFormData({ ...editFormData, nombre: e.target.value })}
              required
            />
            <Input
              label="Correo Electrónico"
              value={editFormData.email}
              onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
              required
            />
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 pl-1">Rol</label>
              <select
                className="px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500/50 focus:border-slate-300 block w-full transition-all duration-300 bg-white text-slate-900 outline-none"
                value={editFormData.rol}
                onChange={e => setEditFormData({ ...editFormData, rol: e.target.value })}
              >
                <option value="usuario">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-4">
              <Button type="button" onClick={() => setShowEditForm(false)} variant="secondary" className="w-full sm:w-auto">Cancelar</Button>
              <Button type="submit" variant="primary" loading={editing} className="w-full sm:w-auto">Guardar Cambios</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* 4. Password Reset Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setSelectedUser(null);
        }}
        title="Seguridad"
        size="max-w-md"
      >
        <div className="p-0 bg-transparent">
          <form onSubmit={handlePasswordReset} className="space-y-8">

            {/* Warning Box */}
            <div className="rounded-3xl bg-amber-400/5 p-6 border border-amber-400/10">
              <div className="flex gap-4">
                <div className="flex-shrink-0 text-amber-400 text-xl">⚠️</div>
                <div>
                  <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">Acción de Seguridad</h3>
                  <p className="text-xs text-amber-400/50 leading-relaxed">
                    Estás restableciendo la contraseña de <strong>{selectedUser?.nombre}</strong>. Asegúrate de notificar al usuario.
                  </p>
                </div>
              </div>
            </div>

            <Input
              label="Nueva Contraseña"
              type="password"
              value={passwordFormData.newPassword}
              onChange={(e) => setPasswordFormData({ newPassword: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              minLength="6"
              required
            />

            <div className="mt-10 pt-8 border-t border-white/5 flex flex-col-reverse sm:flex-row sm:justify-end gap-4">
              <Button type="button" onClick={() => setShowPasswordModal(false)} variant="secondary" className="w-full sm:w-auto">Cancelar</Button>
              <Button
                type="submit"
                variant="warning"
                loading={editing}
                className="w-full sm:w-auto"
              >
                Actualizar
              </Button>
            </div>
          </form>
        </div>
      </Modal>

    </div>
  );
};

export default Users;