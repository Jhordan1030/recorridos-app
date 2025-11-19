import React, { useState, useEffect } from 'react';
import { getUsers, deleteUser, createUser, updateUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import ConfirmModal from '../components/ui/ConfirmModal';
import Alert from '../components/ui/Alert';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

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
    const styles = rol === 'admin' 
      ? 'bg-purple-50 text-purple-700 ring-purple-600/20'
      : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
      
    return (
      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles} capitalize`}>
        {rol}
      </span>
    );
  };

  // UI Helper: Get Initials
  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <Alert />
      
      {/* --- Page Header --- */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="md:flex md:items-center md:justify-between md:space-x-5">
          <div className="flex items-start space-x-5">
            <div className="pt-1.5">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl tracking-tight">Gestión de Usuarios</h1>
              <p className="text-sm text-gray-500 mt-1">Administra el acceso y los roles de los miembros del equipo.</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col-reverse justify-stretch space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-y-0 sm:space-x-3 sm:space-x-reverse md:mt-0 md:flex-row md:space-x-3">
            <Button
              variant="white"
              onClick={loadUsers}
              disabled={loading}
              icon="🔄"
              className="w-full md:w-auto justify-center shadow-sm border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Refrescar
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowCreateForm(true)}
              icon="➕"
              className="w-full md:w-auto justify-center shadow-md hover:shadow-lg transition-all"
            >
              Nuevo Usuario
            </Button>
          </div>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="max-w-7xl mx-auto">
        
        {/* KPI Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="overflow-hidden rounded-xl bg-white px-4 py-5 shadow-sm border border-gray-100 sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">Total Usuarios</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{usersArray.length}</dd>
          </div>
          <div className="overflow-hidden rounded-xl bg-white px-4 py-5 shadow-sm border border-gray-100 sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">Administradores</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-purple-600">
              {usersArray.filter(u => u.rol === 'admin').length}
            </dd>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col justify-center items-center py-20 bg-white rounded-xl border border-gray-100 border-dashed">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 text-sm">Sincronizando datos...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && usersArray.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
            <div className="mx-auto h-12 w-12 text-gray-300 text-4xl mb-3">👥</div>
            <h3 className="text-lg font-medium text-gray-900">No hay usuarios</h3>
            <p className="mt-1 text-sm text-gray-500">Comienza agregando miembros al sistema.</p>
          </div>
        )}

        {/* Users Grid */}
        {!loading && usersArray.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {usersArray.map((user) => (
              <div 
                key={user.id} 
                className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Card Body */}
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    {/* Avatar */}
                    <div className="h-12 w-12 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-sm border border-gray-200">
                      {getInitials(user.nombre)}
                    </div>
                    {/* Role Badge */}
                    {getRoleBadge(user.rol)}
                  </div>

                  <div>
                    <h3 className="text-base font-semibold leading-6 text-gray-900 truncate" title={user.nombre}>
                      {user.nombre}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-gray-500 truncate" title={user.email}>
                        {user.email}
                      </p>
                    </div>
                    
                    {/* Metadata extra (opcional) */}
                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                      <span>ID: {user.id}</span>
                      <span>Activo</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="bg-gray-50/80 px-4 py-3 border-t border-gray-100 grid grid-cols-3 gap-2">
                  {/* Editar */}
                  <button
                    onClick={() => openEditForm(user)}
                    className="flex items-center justify-center w-full rounded-md py-1.5 text-sm text-gray-600 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all border border-transparent hover:border-gray-200"
                    title="Editar Información"
                  >
                    ✏️
                  </button>

                  {/* Contraseña */}
                  <button
                    onClick={() => openPasswordModal(user)}
                    className="flex items-center justify-center w-full rounded-md py-1.5 text-sm text-gray-600 hover:bg-white hover:text-amber-600 hover:shadow-sm transition-all border border-transparent hover:border-gray-200"
                    title="Restablecer Contraseña"
                  >
                    🔑
                  </button>

                  {/* Eliminar */}
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={user.rol === 'admin' || user.id === currentUser?.userId}
                    className={`flex items-center justify-center w-full rounded-md py-1.5 text-sm transition-all border border-transparent hover:border-gray-200 hover:shadow-sm ${
                      (user.rol === 'admin' || user.id === currentUser?.userId) 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-600 hover:bg-white hover:text-red-600'
                    }`}
                    title="Eliminar Usuario"
                  >
                    🗑️
                  </button>
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
        confirmText="Sí, eliminar usuario"
        cancelText="Cancelar"
        type="danger"
      />

      {/* 2. Create User Modal */}
      <Modal 
        isOpen={showCreateForm} 
        onClose={() => setShowCreateForm(false)} 
        title="Registrar Nuevo Usuario"
        size="max-w-lg"
      >
        <div className="p-6">
          <form onSubmit={handleCreateUser} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
              <Input 
                placeholder="Ej: Ana García" 
                value={createFormData.nombre} 
                onChange={e => setCreateFormData({...createFormData, nombre: e.target.value})} 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
              <Input 
                placeholder="correo@empresa.com" 
                type="email" 
                value={createFormData.email} 
                onChange={e => setCreateFormData({...createFormData, email: e.target.value})} 
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <Input 
                  placeholder="••••••" 
                  type="password" 
                  value={createFormData.password} 
                  onChange={e => setCreateFormData({...createFormData, password: e.target.value})} 
                  required 
                  minLength="6"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select 
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 px-3 border"
                  value={createFormData.rol} 
                  onChange={e => setCreateFormData({...createFormData, rol: e.target.value})}
                >
                  <option value="usuario">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
              <Button type="button" onClick={() => setShowCreateForm(false)} variant="secondary">Cancelar</Button>
              <Button type="submit" variant="primary" loading={creating}>Crear Usuario</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* 3. Edit User Modal */}
      <Modal 
        isOpen={showEditForm} 
        onClose={() => setShowEditForm(false)} 
        title="Editar Información"
        size="max-w-lg"
      >
        <div className="p-6">
          <form onSubmit={handleEditUser} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <Input 
                value={editFormData.nombre} 
                onChange={e => setEditFormData({...editFormData, nombre: e.target.value})} 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
              <Input 
                value={editFormData.email} 
                onChange={e => setEditFormData({...editFormData, email: e.target.value})} 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select 
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 px-3 border"
                value={editFormData.rol} 
                onChange={e => setEditFormData({...editFormData, rol: e.target.value})}
              >
                <option value="usuario">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
              <Button type="button" onClick={() => setShowEditForm(false)} variant="secondary">Cancelar</Button>
              <Button type="submit" variant="primary" loading={editing}>Guardar Cambios</Button>
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
        title="Restablecer Contraseña"
        size="max-w-md"
      >
        <div className="p-6">
          <form onSubmit={handlePasswordReset} className="space-y-5">
            
            {/* Warning Box */}
            <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
              <div className="flex">
                <div className="flex-shrink-0 text-amber-400">⚠️</div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">Acción de Seguridad</h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p>Estás cambiando la contraseña de <strong>{selectedUser?.nombre}</strong>. Deberás notificar al usuario sus nuevas credenciales.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
              <Input
                type="password"
                value={passwordFormData.newPassword}
                onChange={(e) => setPasswordFormData({ newPassword: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                minLength="6"
                required
                className="focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
              <Button type="button" onClick={() => setShowPasswordModal(false)} variant="secondary">Cancelar</Button>
              <Button 
                type="submit" 
                variant="primary" 
                loading={editing}
                className="bg-amber-500 hover:bg-amber-600 border-amber-600 focus:ring-amber-500"
              >
                Actualizar Contraseña
              </Button>
            </div>
          </form>
        </div>
      </Modal>

    </div>
  );
};

export default Users;