import React, { useState, useEffect } from 'react';
import { getUsers, deleteUser, createUser, updateUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ui/ConfirmModal'; // ✅ CORREGIDO
import Alert from '../components/ui/Alert'; // ✅ CORREGIDO
import { useAlert } from '../context/AlertContext';
import Modal from '../components/ui/Modal'; // ✅

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { isAdmin, user: currentUser } = useAuth();
  const { alert, showAlert, hideAlert } = useAlert();

  // Estados para formularios
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
        showAlert('error', 'Formato de datos incorrecto del servidor');
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
      showAlert('success', 'Usuario eliminado exitosamente');
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      showAlert('error', `Error al eliminar usuario: ${errorMessage}`);
    } finally {
      setShowDeleteModal(false);
      setSelectedUser(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!createFormData.nombre || !createFormData.email || !createFormData.password) {
      showAlert('warning', 'Todos los campos son requeridos');
      return;
    }

    if (createFormData.password.length < 6) {
      showAlert('warning', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setCreating(true);
      const response = await createUser(createFormData);
      
      if (response.data.success) {
        setShowCreateForm(false);
        setCreateFormData({ nombre: '', email: '', password: '', rol: 'usuario' });
        await loadUsers();
        showAlert('success', 'Usuario creado exitosamente');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      showAlert('error', `Error al crear usuario: ${errorMessage}`);
    } finally {
      setCreating(false);
    }
  };

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
        showAlert('success', 'Usuario actualizado exitosamente');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      showAlert('error', `Error al actualizar usuario: ${errorMessage}`);
    } finally {
      setEditing(false);
    }
  };

  const openEditForm = (user) => {
    setSelectedUser(user);
    setEditFormData({
      nombre: user.nombre,
      email: user.email,
      rol: user.rol
    });
    setShowEditForm(true);
  };

  const handleRefresh = () => {
    loadUsers();
    showAlert('info', 'Lista de usuarios actualizada');
  };

  const closeAllModals = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const usersArray = Array.isArray(users) ? users : [];

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600 mb-6">No tienes permisos de administrador para acceder a esta sección.</p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 font-medium"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 lg:p-6">
      {/* Alert Component */}
      <Alert alert={alert} onClose={hideAlert} />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Eliminar Usuario"
        message={`¿Estás seguro de que quieres eliminar al usuario "${selectedUser?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        type="danger"
      />

      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
              Gestión de Usuarios
            </h1>
            <p className="text-gray-600 text-lg">
              Administra y gestiona los usuarios del sistema
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-xl font-medium text-sm">
              👑 Modo Administrador
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2 shadow-lg"
            >
              <span>➕</span>
              Crear Usuario
            </button>
            <button
              onClick={handleRefresh}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2 shadow-lg"
            >
              <span>🔄</span>
              Actualizar
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                Lista de Usuarios
              </h2>
              <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border">
                {usersArray.length} usuario{usersArray.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Users Table */}
          {usersArray.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Registro
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {usersArray.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {user.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.nombre}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {user.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          user.rol === 'admin' 
                            ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                            : 'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                          {user.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditForm(user)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-1"
                          >
                            <span>✏️</span>
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.rol === 'admin' || user.id === currentUser?.userId}
                            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-1"
                            title={
                              user.id === currentUser?.userId 
                                ? 'No puedes eliminar tu propio usuario' 
                                : user.rol === 'admin' 
                                ? 'No se puede eliminar administradores' 
                                : 'Eliminar usuario'
                            }
                          >
                            <span>🗑️</span>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-300 text-6xl mb-4">👥</div>
              <h3 className="text-2xl font-semibold text-gray-600 mb-2">
                No hay usuarios registrados
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Comienza agregando el primer usuario al sistema para gestionar los accesos y permisos.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 inline-flex items-center gap-2 shadow-lg"
              >
                <span>➕</span>
                Crear Primer Usuario
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeAllModals} />
            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-6 pt-6 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <span className="text-xl">👤</span>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                      Crear Nuevo Usuario
                    </h3>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre Completo *
                        </label>
                        <input
                          type="text"
                          name="nombre"
                          value={createFormData.nombre}
                          onChange={(e) => setCreateFormData(prev => ({ ...prev, nombre: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Ingresa el nombre completo"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={createFormData.email}
                          onChange={(e) => setCreateFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="usuario@ejemplo.com"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contraseña *
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={createFormData.password}
                          onChange={(e) => setCreateFormData(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Mínimo 6 caracteres"
                          minLength="6"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rol
                        </label>
                        <select
                          name="rol"
                          value={createFormData.rol}
                          onChange={(e) => setCreateFormData(prev => ({ ...prev, rol: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="usuario">Usuario</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          type="button"
                          onClick={closeAllModals}
                          className="px-6 py-3 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                          disabled={creating}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 transform hover:scale-105 font-medium flex items-center gap-2 disabled:opacity-50"
                          disabled={creating}
                        >
                          {creating ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              Creando...
                            </>
                          ) : (
                            'Crear Usuario'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditForm && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeAllModals} />
            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-6 pt-6 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <span className="text-xl">✏️</span>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                      Editar Usuario: {selectedUser.nombre}
                    </h3>
                    <form onSubmit={handleEditUser} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre Completo *
                        </label>
                        <input
                          type="text"
                          name="nombre"
                          value={editFormData.nombre}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, nombre: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={editFormData.email}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rol
                        </label>
                        <select
                          name="rol"
                          value={editFormData.rol}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, rol: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="usuario">Usuario</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-amber-800 text-sm">
                          <strong>Nota:</strong> Para cambiar la contraseña, el usuario debe usar la función "Olvidé mi contraseña" desde el login.
                        </p>
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          type="button"
                          onClick={closeAllModals}
                          className="px-6 py-3 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                          disabled={editing}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 transform hover:scale-105 font-medium flex items-center gap-2 disabled:opacity-50"
                          disabled={editing}
                        >
                          {editing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              Actualizando...
                            </>
                          ) : (
                            'Actualizar Usuario'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;