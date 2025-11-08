import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getNinos, createNino, deleteNino, updateNino } from '../services/api';
import Modal from '../components/Modal';

const Ninos = () => {
  const { showAlert, ninos, setNinos } = useApp();
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    direccion: '',
    telefono_contacto: '',
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Clases de utilidad
  const inputClass = "p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full transition-all duration-200 shadow-sm bg-white text-gray-900 placeholder-gray-500";
  const btnPrimaryClass = "bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2";
  const btnSecondaryClass = "bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2";

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
      showAlert('Error al cargar niños: ' + error.message, 'error');
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
      showAlert('Nombre y apellidos son requeridos', 'error');
      return;
    }
    
    setLoading(true);
    try {
      let response;
      if (editMode) {
        response = await updateNino(editId, formData);
        if (response.data.success) {
          showAlert('Niño actualizado exitosamente', 'success');
        }
      } else {
        response = await createNino(formData);
        if (response.data.success) {
          showAlert('Niño creado exitosamente', 'success');
        }
      }

      if (response.data.success) {
        resetForm();
        loadNinos();
        setMostrarModal(false);
      }

    } catch (error) {
      showAlert(`Error al ${editMode ? 'actualizar' : 'crear'} niño: ` + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de desactivar este niño?')) return;
    setLoading(true);
    try {
      const response = await deleteNino(id);
      if (response.data.success) {
        showAlert('Niño desactivado exitosamente', 'success');
        loadNinos();
      }
    } catch (error) {
      showAlert('Error al eliminar: ' + error.message, 'error');
    } finally {
      setLoading(false);
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

  // -------------------------------------------------------------------------
  // COMPONENTE DEL FORMULARIO
  // -------------------------------------------------------------------------
  const NinoForm = (
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          
          {/* Nombre */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <span className="mr-1">👶</span>
              Nombre *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Juan"
              required
              className={inputClass}
              disabled={loading}
            />
          </div>
          
          {/* Apellidos */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <span className="mr-1">👨‍👩‍👧‍👦</span>
              Apellidos *
            </label>
            <input
              type="text"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleChange}
              placeholder="Ej: Pérez García"
              required
              className={inputClass}
              disabled={loading}
            />
          </div>
          
          {/* Dirección */}
          <div className="flex flex-col space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <span className="mr-1">📍</span>
              Dirección
            </label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Ej: Calle Principal 123, Ciudad"
              className={inputClass}
              disabled={loading}
            />
          </div>
          
          {/* Teléfono */}
          <div className="flex flex-col space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <span className="mr-1">📞</span>
              Teléfono de Contacto
            </label>
            <input
              type="tel"
              name="telefono_contacto"
              value={formData.telefono_contacto}
              onChange={handleChange}
              placeholder="Ej: 0999999999"
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
            className={`${btnPrimaryClass} w-full sm:w-auto`}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {editMode ? 'Actualizando...' : 'Creando...'}
              </span>
            ) : (
              editMode ? '💾 Actualizar Niño' : '✅ Agregar Niño'
            )}
          </button>
        </div>
      </form>
    </div>
  );

  // -------------------------------------------------------------------------
  // RENDERIZADO PRINCIPAL
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                <span className="mr-3">👦</span>
                Gestión de Niños
              </h2>
              <p className="text-gray-600 mt-2">
                Administra la información de los niños registrados en el sistema
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
                Nuevo Niño
              </button>
              <button 
                type="button" 
                className={`${btnSecondaryClass} flex items-center justify-center w-full sm:w-auto`} 
                onClick={loadNinos}
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
                <span className="mr-2 text-2xl">{editMode ? '✏️' : '👶'}</span>
                {editMode ? 'Editar Niño' : 'Registrar Nuevo Niño'}
              </div>
            }
            onClose={handleCloseModal}
          >
            {NinoForm}
          </Modal>
        )}

        {/* Loading State */}
        {loading && ninos.length === 0 && (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600 text-lg">Cargando niños...</p>
            </div>
          </div>
        )}

        {/* Grid de niños */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ninos.map((nino) => (
              <div key={nino.id} className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="p-6">
                  {/* Header de la tarjeta */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
                        {nino.nombre.charAt(0)}{nino.apellidos.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                          {nino.nombre} {nino.apellidos}
                        </h3>
                        <p className="text-sm text-green-600 font-medium">Activo</p>
                      </div>
                    </div>
                  </div>

                  {/* Información del niño */}
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600">
                      <span className="mr-3 text-lg">📍</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">Dirección</p>
                        <p className="text-gray-900 line-clamp-2">
                          {nino.direccion || 'No especificada'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <span className="mr-3 text-lg">📞</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">Teléfono</p>
                        <p className="text-gray-900">
                          {nino.telefono_contacto || 'No especificado'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="mt-6 pt-4 border-t border-gray-200 flex space-x-2">
                    <button
                      className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-2 px-3 rounded-lg text-sm transition-colors duration-200 flex items-center justify-center"
                      onClick={() => handleEdit(nino)}
                      disabled={loading}
                    >
                      <span className="mr-1">✏️</span>
                      Editar
                    </button>
                    <button
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-2 px-3 rounded-lg text-sm transition-colors duration-200 flex items-center justify-center"
                      onClick={() => handleDelete(nino.id)}
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
        {!loading && ninos.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">👶</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No hay niños registrados
              </h3>
              <p className="text-gray-600 mb-6">
                Comienza agregando el primer niño al sistema para gestionar sus recorridos.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className={`${btnPrimaryClass} inline-flex items-center`}
              >
                <span className="mr-2">➕</span>
                Registrar Primer Niño
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ninos;