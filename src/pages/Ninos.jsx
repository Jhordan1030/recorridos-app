import { useState, useEffect } from 'react';
import { useApp } from "../context/AppContext";
import { useAlert } from "../context/AlertContext";
import { getNinos, createNino, deleteNino, updateNino } from "../services/api";
import Modal from "../components/ui/Modal";
import ConfirmModal from "../components/ui/ConfirmModal";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

const Ninos = () => {
  const { ninos, setNinos } = useApp();
  const { showAlert } = useAlert();
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    direccion: '',
    telefono_contacto: '',
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ninoAEliminar, setNinoAEliminar] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNinos();
  }, []);

  const loadNinos = async () => {
    setLoading(true);
    try {
      const response = await getNinos();
      if (response.data.success) {
        setNinos(response.data.data);
      }
    } catch (error) {
      showAlert('error', 'Error al cargar niños: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setEditMode(false);
    setEditId(null);
    setFormData({
      nombre: '',
      apellidos: '',
      direccion: '',
      telefono_contacto: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.apellidos) {
      showAlert('error', 'Nombre y apellidos son requeridos');
      return;
    }
    
    setLoading(true);
    try {
      let response;
      if (editMode) {
        response = await updateNino(editId, formData);
        if (response.data.success) {
          showAlert('success', 'Niño actualizado exitosamente');
        }
      } else {
        response = await createNino(formData);
        if (response.data.success) {
          showAlert('success', 'Niño creado exitosamente');
        }
      }

      if (response.data.success) {
        resetForm();
        loadNinos();
        setMostrarModal(false);
      }

    } catch (error) {
      showAlert('error', `Error al ${editMode ? 'actualizar' : 'crear'} niño: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setNinoAEliminar(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!ninoAEliminar) return;
    
    setLoading(true);
    try {
      const response = await deleteNino(ninoAEliminar);
      if (response.data.success) {
        showAlert('success', 'Niño desactivado exitosamente');
        loadNinos();
      }
    } catch (error) {
      showAlert('error', 'Error al eliminar: ' + error.message);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setNinoAEliminar(null);
    }
  };

  const handleEdit = (nino) => {
    setEditMode(true);
    setEditId(nino.id);
    setFormData({
      nombre: nino.nombre,
      apellidos: nino.apellidos,
      direccion: nino.direccion || '',
      telefono_contacto: nino.telefono_contacto || '',
    });
    setMostrarModal(true);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setMostrarModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setMostrarModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <Alert />
      
      {/* --- Header Section --- */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="md:flex md:items-center md:justify-between md:space-x-5">
          <div className="flex items-start space-x-5">
            <div className="pt-1.5">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Gestión de Niños</h1>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1">
                Administra la información de los estudiantes registrados en el sistema.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-col-reverse justify-stretch space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-y-0 sm:space-x-3 sm:space-x-reverse md:mt-0 md:flex-row md:space-x-3">
            <Button
              variant="white" // Asegúrate que tu botón 'white' maneje dark mode, o usa secondary
              onClick={loadNinos}
              disabled={loading}
              icon="🔄"
              className="w-full md:w-auto justify-center shadow-sm bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Actualizar
            </Button>
            <Button
              variant="primary"
              onClick={handleOpenCreateModal}
              icon="➕"
              className="w-full md:w-auto justify-center shadow-md hover:shadow-lg transition-shadow"
            >
              Nuevo Niño
            </Button>
          </div>
        </div>
      </div>

      {/* --- Stats & Content --- */}
      <div className="max-w-7xl mx-auto">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white dark:bg-slate-900 overflow-hidden rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm px-4 py-5 sm:p-6 transition-colors">
            <dt className="text-sm font-medium text-gray-500 dark:text-slate-400 truncate">Total Estudiantes</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{ninos.length}</dd>
          </div>
          <div className="bg-white dark:bg-slate-900 overflow-hidden rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm px-4 py-5 sm:p-6 transition-colors">
            <dt className="text-sm font-medium text-gray-500 dark:text-slate-400 truncate">Estado</dt>
            <dd className="mt-1 text-3xl font-semibold text-emerald-600 dark:text-emerald-400">Activos</dd>
          </div>
        </div>

        {/* Loading State */}
        {loading && ninos.length === 0 && (
          <div className="flex justify-center items-center h-64 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 border-dashed">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-slate-400 font-medium">Cargando información...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && ninos.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 border-dashed">
            <div className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500 text-4xl">👶</div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay niños registrados</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Comienza agregando el primer niño al sistema.</p>
            <div className="mt-6">
              <Button variant="primary" onClick={handleOpenCreateModal} icon="➕">
                Registrar Niño
              </Button>
            </div>
          </div>
        )}

        {/* Grid de Niños */}
        {!loading && ninos.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ninos.map((nino) => (
              <div 
                key={nino.id} 
                className="group bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    {/* Avatar con Iniciales */}
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {nino.nombre.charAt(0)}{nino.apellidos.charAt(0)}
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                      Activo
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-1" title={`${nino.nombre} ${nino.apellidos}`}>
                    {nino.nombre} {nino.apellidos}
                  </h3>
                  
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-slate-400 flex items-center gap-1">
                        <span className="opacity-60">📍</span> Dirección
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-700 line-clamp-2 min-h-[2.5rem]">
                        {nino.direccion || 'No especificada'}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm pt-2">
                      <span className="text-gray-500 dark:text-slate-400 flex items-center gap-1">
                        <span className="opacity-60">📞</span> Contacto
                      </span>
                      <span className="font-mono font-medium text-gray-700 dark:text-slate-300">
                        {nino.telefono_contacto || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions - Botones ocultos que aparecen con hover */}
                <div className="bg-gray-50 dark:bg-slate-800/50 px-5 py-3 border-t border-gray-100 dark:border-slate-800 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    variant="secondary" // Cambiado a secondary para mejor contraste en dark mode
                    size="sm"
                    className="flex-1 justify-center text-xs bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600"
                    onClick={() => handleEdit(nino)}
                    icon="✏️"
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1 justify-center text-xs"
                    onClick={() => handleDeleteClick(nino.id)}
                    icon="🗑️"
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Modals --- */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Desactivar Niño"
        message="¿Estás seguro de que quieres eliminar este registro? Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      <Modal
        isOpen={mostrarModal}
        onClose={handleCloseModal}
        title={editMode ? 'Editar Niño' : 'Registrar Nuevo Niño'}
        size="max-w-2xl"
      >
        <div className="p-6 bg-white dark:bg-slate-900">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              
              {/* Nombre */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Juan"
                  required
                  disabled={loading}
                  className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
                />
              </div>

              {/* Apellidos */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Apellidos <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  placeholder="Ej: Pérez García"
                  required
                  disabled={loading}
                  className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
                />
              </div>

              {/* Dirección */}
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Dirección
                </label>
                <Input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="Ej: Calle Principal 123, Sector Norte"
                  disabled={loading}
                  className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
                />
              </div>

              {/* Teléfono */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Teléfono de Contacto
                </label>
                <Input
                  type="tel"
                  name="telefono_contacto"
                  value={formData.telefono_contacto}
                  onChange={handleChange}
                  placeholder="0999999999"
                  disabled={loading}
                  className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-8 pt-5 border-t border-gray-100 dark:border-slate-700 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 gap-3 sm:gap-0">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseModal}
                disabled={loading}
                className="w-full sm:w-auto justify-center bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full sm:w-auto justify-center"
              >
                {editMode ? 'Guardar Cambios' : 'Registrar Niño'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Ninos;