import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getVehiculos, createVehiculo, deleteVehiculo, updateVehiculo } from '../services/api';
import Modal from '../components/Modal';

const Vehiculos = () => {
  const { showAlert, vehiculos, setVehiculos } = useApp();
  const [formData, setFormData] = useState({
    tipo: 'propio',
    descripcion: '',
    placa: '',
    capacidad: '',
    costo_por_recorrido: '',
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Clases de utilidad
  const inputClass = "p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full transition-all duration-200 shadow-sm bg-white text-gray-900 placeholder-gray-500";
  const btnPrimaryClass = "bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50";
  const btnSecondaryClass = "bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50";
  const btnDangerClass = "bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50";

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
      showAlert('Error al cargar vehículos: ' + error.message, 'error');
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
      showAlert('Descripción y costo son requeridos', 'error');
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
        if (response.data.success) {
          showAlert('Vehículo actualizado exitosamente', 'success');
        }
      } else {
        response = await createVehiculo(data);
        if (response.data.success) {
          showAlert('Vehículo creado exitosamente', 'success');
        }
      }

      if (response.data.success) {
        resetForm();
        loadVehiculos();
        setMostrarModal(false);
      }

    } catch (error) {
      showAlert(`Error al ${editMode ? 'actualizar' : 'crear'} vehículo: ` + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de desactivar este vehículo?')) return;
    setLoading(true);
    try {
      const response = await deleteVehiculo(id);
      if (response.data.success) {
        showAlert('Vehículo desactivado exitosamente', 'success');
        loadVehiculos();
      }
    } catch (error) {
      showAlert('Error al eliminar: ' + error.message, 'error');
    } finally {
      setLoading(false);
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

  // Función para obtener el icono según el tipo de vehículo
  const getTipoIcono = (tipo) => {
    switch (tipo) {
      case 'propio': return '🚗';
      case 'empresa': return '🏢';
      case 'alquilado': return '📋';
      case 'taxi': return '🚕';
      default: return '🚗';
    }
  };

  // Función para obtener el color según el tipo de vehículo
  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'propio': return 'bg-blue-100 text-blue-800';
      case 'empresa': return 'bg-green-100 text-green-800';
      case 'alquilado': return 'bg-purple-100 text-purple-800';
      case 'taxi': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // -------------------------------------------------------------------------
  // COMPONENTE DEL FORMULARIO
  // -------------------------------------------------------------------------
  const VehiculoForm = (
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          
          {/* Tipo */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <span className="mr-2">🏷️</span>
              Tipo *
            </label>
            <select 
              name="tipo" 
              value={formData.tipo} 
              onChange={handleChange} 
              required
              className={inputClass}
              disabled={loading}
            >
              <option value="propio">Propio</option>
              <option value="empresa">Empresa</option>
              <option value="alquilado">Alquilado</option>
              <option value="taxi">Taxi</option>
            </select>
          </div>

          {/* Descripción */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <span className="mr-2">📝</span>
              Descripción *
            </label>
            <input
              type="text"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Ej: Toyota Corolla Blanco 2023"
              required
              className={inputClass}
              disabled={loading}
            />
          </div>

          {/* Placa */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <span className="mr-2">🔢</span>
              Placa
            </label>
            <input
              type="text"
              name="placa"
              value={formData.placa}
              onChange={handleChange}
              placeholder="Ej: ABC-1234"
              className={inputClass}
              disabled={loading}
            />
          </div>

          {/* Capacidad */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <span className="mr-2">👥</span>
              Capacidad
            </label>
            <input
              type="number"
              name="capacidad"
              value={formData.capacidad}
              onChange={handleChange}
              placeholder="Ej: 5"
              min="1"
              className={inputClass}
              disabled={loading}
            />
          </div>

          {/* Costo por Recorrido */}
          <div className="flex flex-col space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <span className="mr-2">💰</span>
              Costo por Recorrido ($) *
            </label>
            <input
              type="number"
              step="0.01"
              name="costo_por_recorrido"
              value={formData.costo_por_recorrido}
              onChange={handleChange}
              placeholder="Ej: 3.50"
              required
              min="0"
              className={inputClass}
              disabled={loading}
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            className={`${btnSecondaryClass} w-full sm:w-auto`}
            onClick={handleCloseModal}
            disabled={loading}
          >
            ❌ Cancelar
          </button>
          <button 
            type="submit" 
            className={`${btnPrimaryClass} w-full sm:w-auto flex items-center justify-center`}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {editMode ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              editMode ? '💾 Actualizar Vehículo' : '✅ Agregar Vehículo'
            )}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                <span className="mr-3">🚗</span>
                Gestión de Vehículos
              </h2>
              <p className="text-gray-600 mt-2">
                Administra la flota de vehículos disponibles para los recorridos
              </p>
            </div>
            
            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                type="button"
                className={`${btnPrimaryClass} flex items-center justify-center w-full sm:w-auto`}
                onClick={handleOpenCreateModal}
                disabled={loading}
              >
                <span className="mr-2">➕</span>
                Nuevo Vehículo
              </button>
              <button 
                type="button" 
                className={`${btnSecondaryClass} flex items-center justify-center w-full sm:w-auto`} 
                onClick={loadVehiculos}
                disabled={loading}
              >
                <span className="mr-2">🔄</span>
                Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Modal */}
        {mostrarModal && (
          <Modal
            title={
              <div className="flex items-center">
                <span className="mr-2 text-2xl">{editMode ? '✏️' : '🚗'}</span>
                {editMode ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo'}
              </div>
            }
            onClose={handleCloseModal}
          >
            {VehiculoForm}
          </Modal>
        )}

        {/* Loading State */}
        {loading && vehiculos.length === 0 && (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600 text-lg">Cargando vehículos...</p>
            </div>
          </div>
        )}

        {/* Grid de vehículos */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vehiculos.map((vehiculo) => (
              <div key={vehiculo.id} className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="p-6">
                  {/* Header de la tarjeta */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="text-3xl mr-3">
                        {getTipoIcono(vehiculo.tipo)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {vehiculo.descripcion}
                        </h3>
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getTipoColor(vehiculo.tipo)} capitalize`}>
                          {vehiculo.tipo}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Información del vehículo */}
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600">
                      <span className="mr-3 text-lg">🔢</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">Placa</p>
                        <p className="text-gray-900 font-mono">
                          {vehiculo.placa || 'No registrada'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <span className="mr-3 text-lg">👥</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">Capacidad</p>
                        <p className="text-gray-900">
                          {vehiculo.capacidad ? `${vehiculo.capacidad} personas` : 'No especificada'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <span className="mr-3 text-lg">💰</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">Costo por Recorrido</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${parseFloat(vehiculo.costo_por_recorrido || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="mt-6 pt-4 border-t border-gray-200 flex space-x-2">
                    <button
                      className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-2 px-3 rounded-lg text-sm transition-colors duration-200 flex items-center justify-center"
                      onClick={() => handleEdit(vehiculo)}
                      disabled={loading}
                    >
                      <span className="mr-1">✏️</span>
                      Editar
                    </button>
                    <button
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-2 px-3 rounded-lg text-sm transition-colors duration-200 flex items-center justify-center"
                      onClick={() => handleDelete(vehiculo.id)}
                      disabled={loading}
                    >
                      <span className="mr-1">🗑️</span>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && vehiculos.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">🚗</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No hay vehículos registrados
              </h3>
              <p className="text-gray-600 mb-6">
                Comienza agregando el primer vehículo para poder asignarlo a recorridos.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className={`${btnPrimaryClass} inline-flex items-center`}
              >
                <span className="mr-2">➕</span>
                Registrar Primer Vehículo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vehiculos;