import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getRecorridos, deleteRecorrido } from '../services/api';
import Modal from '../components/Modal';
import RecorridoForm from '../components/RecorridoForm';

const Recorridos = () => {
  const { showAlert, recorridos, setRecorridos } = useApp();
  
  // Estados para el modal
  const [mostrarModal, setMostrarModal] = useState(false); 
  const [recorridoAEditar, setRecorridoAEditar] = useState(null);
  
  // Estados para el filtro de mes/año
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Clases de utilidad
  const btnPrimaryClass = "bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50";
  const btnSecondaryClass = "bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50";
  const btnDangerClass = "bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50";

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
      showAlert('Error al cargar recorridos: ' + error.message, 'error');
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

  const handleCloseModal = (shouldReload = false) => {
    setMostrarModal(false);
    setRecorridoAEditar(null);
    if (shouldReload) {
      loadRecorridos();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este recorrido?')) return;
    setLoading(true);
    try {
      const response = await deleteRecorrido(id);
      if (response.data.success) {
        showAlert('Recorrido eliminado exitosamente', 'success');
        loadRecorridos();
      }
    } catch (error) {
      showAlert('Error al eliminar: ' + error.message, 'error');
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                <span className="mr-3">📍</span>
                Gestión de Recorridos
              </h2>
              <p className="text-gray-600 mt-2">
                Administra y visualiza todos los recorridos registrados en el sistema
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
                Nuevo Recorrido
              </button>
              <button 
                type="button" 
                className={`${btnSecondaryClass} flex items-center justify-center w-full sm:w-auto`} 
                onClick={loadRecorridos}
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
            title={recorridoAEditar ? '✏️ Editar Recorrido Existente' : '➕ Registrar Nuevo Recorrido'} 
            onClose={() => handleCloseModal(false)}
          >
            <RecorridoForm
              recorridoParaEditar={recorridoAEditar}
              onSuccess={() => handleCloseModal(true)}
              onCancel={() => handleCloseModal(false)}
            />
          </Modal>
        )}

        {/* Controles de mes/año */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => cambiarMes(-1)} 
                className={`${btnSecondaryClass} flex items-center py-2 px-4`}
                disabled={loading}
              >
                <span className="mr-2">‹</span>
                Anterior
              </button>
              
              <h3 className="text-xl font-bold text-indigo-600 text-center min-w-[200px]">
                {nombresMeses[mesSeleccionado - 1]} {añoSeleccionado}
              </h3>
              
              <button 
                onClick={() => cambiarMes(1)} 
                className={`${btnSecondaryClass} flex items-center py-2 px-4`}
                disabled={loading}
              >
                Siguiente
                <span className="ml-2">›</span>
              </button>
            </div>
            
            {/* Resumen del mes */}
            <div className="text-center sm:text-right">
              <div className="text-sm text-gray-600">Total del mes</div>
              <div className="text-2xl font-bold text-green-600">
                ${totalMes.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Resumen estadístico */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-2">
              {recorridosFiltrados.length}
            </div>
            <div className="text-gray-600 font-medium">Total Recorridos</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              ${totalMes.toFixed(2)}
            </div>
            <div className="text-gray-600 font-medium">Costo Total</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {new Set(recorridosFiltrados.map(r => r.vehiculo_id)).size}
            </div>
            <div className="text-gray-600 font-medium">Vehículos Usados</div>
          </div>
        </div>

        {/* Loading State */}
        {loading && recorridosFiltrados.length === 0 && (
          <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-lg">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600 text-lg">Cargando recorridos...</p>
            </div>
          </div>
        )}

        {/* Grid de recorridos */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {recorridosFiltrados.map((recorrido) => (
              <div key={recorrido.id} className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="p-6">
                  {/* Header de la tarjeta */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <span className="mr-2">📅</span>
                        {recorrido.fecha.split('T')[0]}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {formatearHora(recorrido.hora_inicio)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ${parseFloat(recorrido.costo || 0).toFixed(2)}
                      </div>
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full capitalize">
                        {recorrido.tipo_recorrido}
                      </span>
                    </div>
                  </div>

                  {/* Información del recorrido */}
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600">
                      <span className="mr-3 text-lg">🚗</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">Vehículo</p>
                        <p className="text-gray-900 font-medium">
                          {recorrido.vehiculo_descripcion || 'Sin vehículo'}
                        </p>
                      </div>
                    </div>

                    {/* Niños en el recorrido */}
                    {recorrido.ninos && recorrido.ninos.length > 0 && (
                      <div className="flex items-start text-gray-600">
                        <span className="mr-3 text-lg mt-1">👦</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500 mb-1">Niños ({recorrido.ninos.length})</p>
                          <div className="space-y-1">
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
                        <span className="mr-3 text-lg mt-1">📝</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500">Notas</p>
                          <p className="text-gray-900 text-sm">{recorrido.notas}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="mt-6 pt-4 border-t border-gray-200 flex space-x-2">
                    <button
                      className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-2 px-3 rounded-lg text-sm transition-colors duration-200 flex items-center justify-center"
                      onClick={() => handleEdit(recorrido)}
                      disabled={loading}
                    >
                      <span className="mr-1">✏️</span>
                      Editar
                    </button>
                    <button
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-2 px-3 rounded-lg text-sm transition-colors duration-200 flex items-center justify-center"
                      onClick={() => handleDelete(recorrido.id)}
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
          <div className="text-center py-16 bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">📍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No hay recorridos registrados
              </h3>
              <p className="text-gray-600 mb-6">
                No se encontraron recorridos para {nombresMeses[mesSeleccionado - 1]} {añoSeleccionado}.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className={`${btnPrimaryClass} inline-flex items-center`}
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