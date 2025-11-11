import { useState, useEffect } from 'react';
import { useAlert } from '../context/AlertContext';
import { getRecorridos, deleteRecorrido } from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
import RecorridoForm from '../components/RecorridoForm';
import Alert from '../components/Alert';

const Recorridos = () => {
  const { showAlert } = useAlert();
  const [recorridos, setRecorridos] = useState([]);
  
  // Estados para el modal
  const [mostrarModal, setMostrarModal] = useState(false); 
  const [recorridoAEditar, setRecorridoAEditar] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recorridoAEliminar, setRecorridoAEliminar] = useState(null);
  
  // Estados para el filtro de mes/año
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  useEffect(() => {
    loadRecorridos();
  }, []);

  const loadRecorridos = async () => {
    setLoading(true);
    try {
      const response = await getRecorridos();
      if (response.data.success) {
        setRecorridos(response.data.data);
      }
    } catch (error) {
      showAlert('error', 'Error al cargar recorridos: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Función para filtrar recorridos por mes/año
  const recorridosFiltrados = recorridos.filter(recorrido => {
    if (!recorrido.fecha) return false;
    
    const fecha = new Date(recorrido.fecha);
    const mes = fecha.getMonth() + 1;
    const año = fecha.getFullYear();
    
    return mes === mesSeleccionado && año === añoSeleccionado;
  });

  // Calcular el total del mes
  const totalMes = recorridosFiltrados.reduce((total, recorrido) => {
    return total + (parseFloat(recorrido.costo) || 0);
  }, 0);

  const cambiarMes = (delta) => {
    let nuevoMes = mesSeleccionado + delta;
    let nuevoAño = añoSeleccionado;
    
    if (nuevoMes > 12) {
      nuevoMes = 1;
      nuevoAño += 1;
    } else if (nuevoMes < 1) {
      nuevoMes = 12;
      nuevoAño -= 1;
    }
    
    setMesSeleccionado(nuevoMes);
    setAñoSeleccionado(nuevoAño);
  };

  // Función para abrir el modal y preparar la edición
  const handleEdit = (recorrido) => {
    setRecorridoAEditar(recorrido);
    setMostrarModal(true);
  };

  // Función para abrir el modal para crear
  const handleOpenCreateModal = () => {
    setRecorridoAEditar(null);
    setMostrarModal(true);
  };

  const handleCloseModal = (shouldReload = false, message = null) => {
    setMostrarModal(false);
    setRecorridoAEditar(null);
    
    // ✅ MOSTRAR ALERTA SI HAY UN MENSAJE
    if (message) {
      showAlert('success', message);
    }
    
    if (shouldReload) {
      loadRecorridos();
    }
  };

  // ✅ NUEVA FUNCIÓN PARA MANEJAR ÉXITO DEL FORMULARIO
  const handleFormSuccess = (isEdit = false) => {
    const message = isEdit 
      ? 'Recorrido actualizado exitosamente' 
      : 'Recorrido registrado exitosamente';
    
    handleCloseModal(true, message);
  };

  const handleDelete = (recorrido) => {
    setRecorridoAEliminar(recorrido);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!recorridoAEliminar) return;
    
    setLoading(true);
    try {
      const response = await deleteRecorrido(recorridoAEliminar.id);
      if (response.data.success) {
        showAlert('success', 'Recorrido eliminado exitosamente');
        loadRecorridos();
      }
    } catch (error) {
      showAlert('error', 'Error al eliminar: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setRecorridoAEliminar(null);
    }
  };

  const formatearHora = (hora) => {
    if (!hora) return '—';
    try {
      if (hora.includes('T')) {
        const fecha = new Date(hora);
        return fecha.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false });
      }
      return hora.slice(0, 5);
    } catch {
      return hora;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      
      {/* ✅ COMPONENTE ALERT AGREGADO AQUÍ */}
      <Alert />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Título y descripción */}
            <div className="text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 flex items-center justify-center lg:justify-start mb-2">
                <span className="mr-2 sm:mr-3">📍</span>
                Gestión de Recorridos
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Administra y visualiza todos los recorridos registrados en el sistema
              </p>
            </div>
            
            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-2 justify-center lg:justify-end">
              <button 
                type="button" 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center text-sm sm:text-base whitespace-nowrap"
                onClick={loadRecorridos}
                disabled={loading}
              >
                <span className="mr-2">🔄</span>
                Actualizar
              </button>
              <button
                type="button"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center text-sm sm:text-base whitespace-nowrap"
                onClick={handleOpenCreateModal}
                disabled={loading}
              >
                <span className="mr-2">➕</span>
                Nuevo Recorrido
              </button>
            </div>
          </div>
        </div>

        {/* Modal de Confirmación para Eliminar */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          title="Eliminar Recorrido"
          message={`¿Estás seguro de que quieres eliminar el recorrido del ${recorridoAEliminar?.fecha?.split('T')[0]}? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          type="danger"
        />

        {/* Modal de Formulario */}
        {mostrarModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => handleCloseModal(false)} />
              <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="bg-white px-6 pt-6 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                      <span className="text-xl">
                        {recorridoAEditar ? '✏️' : '➕'}
                      </span>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                        {recorridoAEditar ? 'Editar Recorrido Existente' : 'Registrar Nuevo Recorrido'}
                      </h3>
                      <RecorridoForm
                        recorridoParaEditar={recorridoAEditar}
                        onSuccess={() => handleFormSuccess(!!recorridoAEditar)} // ✅ ACTUALIZADO
                        onCancel={() => handleCloseModal(false)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controles de mes/año - VERSIÓN MEJORADA RESPONSIVE */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-6 overflow-hidden">
          <div className="flex flex-col gap-4">
            
            {/* Navegación del mes - MEJORADA PARA MOBILE */}
            <div className="flex items-center justify-between gap-2 sm:gap-3 w-full">
              <button 
                onClick={() => cambiarMes(-1)} 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-2 sm:px-4 rounded-lg transition-colors duration-200 flex items-center justify-center text-sm flex-shrink-0"
                disabled={loading}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Anterior</span>
              </button>
              
              <div className="text-center flex-1 px-2">
                <h3 className="text-lg sm:text-xl font-bold text-indigo-600">
                  {nombresMeses[mesSeleccionado - 1]}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base">{añoSeleccionado}</p>
              </div>
              
              <button 
                onClick={() => cambiarMes(1)} 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-2 sm:px-4 rounded-lg transition-colors duration-200 flex items-center justify-center text-sm flex-shrink-0"
                disabled={loading}
              >
                <span className="hidden sm:inline">Siguiente</span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 sm:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {/* Total del mes */}
            <div className="text-center pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600 font-medium mb-1">Total del mes</div>
              <div className="text-2xl sm:text-3xl font-bold text-green-600">
                ${totalMes.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Resumen estadístico */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-indigo-600 mb-2">
              {recorridosFiltrados.length}
            </div>
            <div className="text-gray-600 font-medium text-sm sm:text-base">Total Recorridos</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
              ${totalMes.toFixed(2)}
            </div>
            <div className="text-gray-600 font-medium text-sm sm:text-base">Costo Total</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">
              {new Set(recorridosFiltrados.map(r => r.vehiculo_id)).size}
            </div>
            <div className="text-gray-600 font-medium text-sm sm:text-base">Vehículos Usados</div>
          </div>
        </div>

        {/* Loading State */}
        {loading && recorridosFiltrados.length === 0 && (
          <div className="flex justify-center items-center h-48 sm:h-64 bg-white rounded-xl shadow-lg">
            <div className="text-center">
              <svg className="animate-spin h-8 sm:h-12 w-8 sm:w-12 text-indigo-600 mx-auto mb-3 sm:mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600 text-sm sm:text-lg">Cargando recorridos...</p>
            </div>
          </div>
        )}

        {/* Grid de recorridos */}
        {!loading && recorridosFiltrados.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {recorridosFiltrados.map((recorrido) => (
              <div key={recorrido.id} className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="p-4 sm:p-6">
                  {/* Header de la tarjeta */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                        <span className="mr-2">📅</span>
                        {recorrido.fecha.split('T')[0]}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {formatearHora(recorrido.hora_inicio)}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-xl sm:text-2xl font-bold text-green-600">
                        ${parseFloat(recorrido.costo || 0).toFixed(2)}
                      </div>
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full capitalize mt-1">
                        {recorrido.tipo_recorrido}
                      </span>
                    </div>
                  </div>

                  {/* Información del recorrido */}
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600">
                      <span className="mr-3 text-lg flex-shrink-0">🚗</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500">Vehículo</p>
                        <p className="text-gray-900 font-medium truncate">
                          {recorrido.vehiculo_descripcion || 'Sin vehículo'}
                        </p>
                      </div>
                    </div>

                    {/* Niños en el recorrido */}
                    {recorrido.ninos && recorrido.ninos.length > 0 && (
                      <div className="flex items-start text-gray-600">
                        <span className="mr-3 text-lg mt-1 flex-shrink-0">👦</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-500 mb-1">Niños ({recorrido.ninos.length})</p>
                          <div className="space-y-1 max-h-20 overflow-y-auto">
                            {recorrido.ninos.map((nino, idx) => (
                              <div key={idx} className="text-gray-900 text-sm">
                                • {nino.nombre} {nino.apellidos}
                                {nino.notas && (
                                  <span className="text-gray-500 text-xs ml-2">({nino.notas})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notas del recorrido */}
                    {recorrido.notas && (
                      <div className="flex items-start text-gray-600">
                        <span className="mr-3 text-lg mt-1 flex-shrink-0">📝</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-500">Notas</p>
                          <p className="text-gray-900 text-sm break-words">{recorrido.notas}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="mt-6 pt-4 border-t border-gray-200 flex gap-2">
                    <button
                      className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-2.5 px-3 rounded-lg text-sm transition-colors duration-200 flex items-center justify-center"
                      onClick={() => handleEdit(recorrido)}
                      disabled={loading}
                    >
                      <span className="mr-1">✏️</span>
                      Editar
                    </button>
                    <button
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-2.5 px-3 rounded-lg text-sm transition-colors duration-200 flex items-center justify-center"
                      onClick={() => handleDelete(recorrido)}
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
        {!loading && recorridosFiltrados.length === 0 && (
          <div className="text-center py-12 sm:py-16 bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="max-w-md mx-auto px-4">
              <div className="text-4xl sm:text-6xl mb-4">📍</div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                No hay recorridos registrados
              </h3>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                No se encontraron recorridos para {nombresMeses[mesSeleccionado - 1]} {añoSeleccionado}.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors duration-200 inline-flex items-center text-sm sm:text-base"
              >
                <span className="mr-2">➕</span>
                Crear Primer Recorrido
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recorridos;