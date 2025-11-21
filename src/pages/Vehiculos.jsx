import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAlert } from '../context/AlertContext';
import { getVehiculos, createVehiculo, deleteVehiculo, updateVehiculo } from '../services/api';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const Vehiculos = () => {
  const { vehiculos, setVehiculos } = useApp();
  const { showAlert } = useAlert();
  
  const [formData, setFormData] = useState({
    tipo: 'propio',
    descripcion: '',
    placa: '',
    capacidad: '',
    costo_por_recorrido: '',
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vehiculoAEliminar, setVehiculoAEliminar] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVehiculos();
  }, []);

  const loadVehiculos = async () => {
    setLoading(true);
    try {
      const response = await getVehiculos();
      if (response.data.success) {
        setVehiculos(response.data.data);
      }
    } catch (error) {
      showAlert('error', 'Error al cargar vehículos: ' + error.message);
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
      tipo: 'propio',
      descripcion: '',
      placa: '',
      capacidad: '',
      costo_por_recorrido: '',
    });
  };

  const handleCloseModal = () => {
    resetForm();
    setMostrarModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.descripcion || !formData.costo_por_recorrido) {
      showAlert('error', 'Descripción y costo son requeridos');
      return;
    }

    setLoading(true);
    const data = {
      tipo: formData.tipo,
      descripcion: formData.descripcion,
      placa: formData.placa || null,
      capacidad: formData.capacidad ? parseInt(formData.capacidad) : null,
      costo_por_recorrido: formData.costo_por_recorrido ? parseFloat(formData.costo_por_recorrido) : 0,
    };

    try {
      let response;
      if (editMode) {
        response = await updateVehiculo(editId, data);
        showAlert('success', 'Vehículo actualizado exitosamente');
      } else {
        response = await createVehiculo(data);
        showAlert('success', 'Vehículo creado exitosamente');
      }

      if (response.data.success) {
        resetForm();
        loadVehiculos();
        setMostrarModal(false);
      }
    } catch (error) {
      showAlert('error', `Error al ${editMode ? 'actualizar' : 'crear'} vehículo: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setVehiculoAEliminar(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!vehiculoAEliminar) return;
    
    setLoading(true);
    try {
      const response = await deleteVehiculo(vehiculoAEliminar);
      if (response.data.success) {
        showAlert('success', 'Vehículo desactivado exitosamente');
        loadVehiculos();
      }
    } catch (error) {
      showAlert('error', 'Error al eliminar: ' + error.message);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setVehiculoAEliminar(null);
    }
  };

  const handleEdit = (vehiculo) => {
    setEditMode(true);
    setEditId(vehiculo.id);
    setFormData({
      tipo: vehiculo.tipo,
      descripcion: vehiculo.descripcion,
      placa: vehiculo.placa || '',
      capacidad: vehiculo.capacidad || '',
      costo_por_recorrido: vehiculo.costo_por_recorrido || '',
    });
    setMostrarModal(true);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setMostrarModal(true);
  };

  // Helpers de UI con soporte Dark Mode
  const getTipoInfo = (tipo) => {
    const config = {
      propio: { 
        icon: '🚗', 
        color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' 
      },
      empresa: { 
        icon: '🏢', 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' 
      },
      alquilado: { 
        icon: '📋', 
        color: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800' 
      },
      taxi: { 
        icon: '🚕', 
        color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' 
      },
      default: { 
        icon: '🚗', 
        color: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' 
      }
    };
    return config[tipo] || config.default;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <Alert />
      
      {/* --- Header Section --- */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="md:flex md:items-center md:justify-between md:space-x-5">
          <div className="flex items-start space-x-5">
            <div className="pt-1.5">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Gestión de Vehículos</h1>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1">
                Administra la flota disponible para recorridos y asignaciones.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-col-reverse justify-stretch space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-y-0 sm:space-x-3 sm:space-x-reverse md:mt-0 md:flex-row md:space-x-3">
            <Button
              variant="white"
              onClick={loadVehiculos}
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
              Nuevo Vehículo
            </Button>
          </div>
        </div>
      </div>

      {/* --- Stats & Content --- */}
      <div className="max-w-7xl mx-auto">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white dark:bg-slate-900 overflow-hidden rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm px-4 py-5 sm:p-6 transition-colors">
            <dt className="text-sm font-medium text-gray-500 dark:text-slate-400 truncate">Total Flota</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{vehiculos.length}</dd>
          </div>
          <div className="bg-white dark:bg-slate-900 overflow-hidden rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm px-4 py-5 sm:p-6 transition-colors">
            <dt className="text-sm font-medium text-gray-500 dark:text-slate-400 truncate">Vehículos Propios</dt>
            <dd className="mt-1 text-3xl font-semibold text-blue-600 dark:text-blue-400">
              {vehiculos.filter(v => v.tipo === 'propio').length}
            </dd>
          </div>
        </div>

        {/* Loading State */}
        {loading && vehiculos.length === 0 && (
          <div className="flex justify-center items-center h-64 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 border-dashed">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-slate-400 font-medium">Cargando información...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && vehiculos.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 border-dashed">
            <div className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500 text-4xl">🚗</div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay vehículos</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Comienza registrando un nuevo vehículo en el sistema.</p>
            <div className="mt-6">
              <Button variant="primary" onClick={handleOpenCreateModal} icon="➕">
                Registrar Vehículo
              </Button>
            </div>
          </div>
        )}

        {/* Grid de Vehículos */}
        {!loading && vehiculos.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {vehiculos.map((vehiculo) => {
              const styleInfo = getTipoInfo(vehiculo.tipo);
              return (
                <div 
                  key={vehiculo.id} 
                  className="group bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 flex flex-col overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-3xl filter drop-shadow-sm">{styleInfo.icon}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styleInfo.color} capitalize`}>
                        {vehiculo.tipo}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-1" title={vehiculo.descripcion}>
                      {vehiculo.descripcion}
                    </h3>
                    
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-slate-400 flex items-center gap-1">
                          <span className="opacity-60">🔢</span> Placa
                        </span>
                        <span className="font-mono font-medium text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {vehiculo.placa || 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-slate-400 flex items-center gap-1">
                          <span className="opacity-60">👥</span> Capacidad
                        </span>
                        <span className="font-medium text-gray-700 dark:text-slate-300">
                          {vehiculo.capacidad ? `${vehiculo.capacidad} Pas.` : '--'}
                        </span>
                      </div>

                      <div className="pt-3 mt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Costo/Recorrido</span>
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          ${parseFloat(vehiculo.costo_por_recorrido || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="bg-gray-50 dark:bg-slate-800/50 px-5 py-3 border-t border-gray-100 dark:border-slate-800 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 justify-center text-xs bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600"
                      onClick={() => handleEdit(vehiculo)}
                      icon="✏️"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="flex-1 justify-center text-xs"
                      onClick={() => handleDeleteClick(vehiculo.id)}
                      icon="🗑️"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- Modals --- */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Desactivar Vehículo"
        message="¿Estás seguro de que quieres desactivar este vehículo? Esta acción podría afectar recorridos históricos."
        confirmText="Sí, desactivar"
        cancelText="Cancelar"
        type="danger"
      />

      <Modal
        isOpen={mostrarModal}
        onClose={handleCloseModal}
        title={editMode ? 'Editar Vehículo' : 'Nuevo Vehículo'}
        size="max-w-2xl"
      >
        <div className="p-6 bg-white dark:bg-slate-900">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              
              {/* Tipo */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Tipo de Vehículo <span className="text-red-500">*</span>
                </label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-lg border-gray-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 px-3 border bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  disabled={loading}
                >
                  <option value="propio">🚗 Propio</option>
                  <option value="empresa">🏢 Empresa</option>
                  <option value="alquilado">📋 Alquilado</option>
                  <option value="taxi">🚕 Taxi</option>
                </select>
              </div>

              {/* Placa */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Placa
                </label>
                <Input
                  type="text"
                  name="placa"
                  value={formData.placa}
                  onChange={handleChange}
                  placeholder="ABC-1234"
                  className="uppercase bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
                  disabled={loading}
                />
              </div>

              {/* Descripción */}
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Descripción / Modelo <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Ej: Toyota Hilux Blanca 2023"
                  required
                  disabled={loading}
                  className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
                />
              </div>

              {/* Capacidad */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Capacidad (Personas)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 dark:text-slate-400 sm:text-sm">👥</span>
                  </div>
                  <Input
                    type="number"
                    name="capacidad"
                    value={formData.capacidad}
                    onChange={handleChange}
                    placeholder="4"
                    min="1"
                    className="pl-10 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Costo */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Costo por Recorrido <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 dark:text-slate-400 sm:text-sm">$</span>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    name="costo_por_recorrido"
                    value={formData.costo_por_recorrido}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                    min="0"
                    className="pl-7 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
                    disabled={loading}
                  />
                </div>
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
                {editMode ? 'Guardar Cambios' : 'Registrar Vehículo'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Vehiculos;