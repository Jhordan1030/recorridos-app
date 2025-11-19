import { useState, useEffect, useMemo } from 'react';
import { useAlert } from '../context/AlertContext';
import { getRecorridos, deleteRecorrido } from '../services/api';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import RecorridoForm from '../components/forms/RecorridoForm';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

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
  const recorridosFiltrados = useMemo(() => {
    return recorridos.filter(recorrido => {
      if (!recorrido.fecha) return false;
      
      const fecha = new Date(recorrido.fecha);
      const mes = fecha.getMonth() + 1;
      const año = fecha.getFullYear();
      
      return mes === mesSeleccionado && año === añoSeleccionado;
    });
  }, [recorridos, mesSeleccionado, añoSeleccionado]);

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    const totalMes = recorridosFiltrados.reduce((total, recorrido) => {
      return total + (parseFloat(recorrido.costo) || 0);
    }, 0);

    const vehiculosUsados = new Set(recorridosFiltrados.map(r => r.vehiculo_id)).size;
    const totalRecorridos = recorridosFiltrados.length;

    return { totalMes, vehiculosUsados, totalRecorridos };
  }, [recorridosFiltrados]);

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
    
    if (message) {
      showAlert('success', message);
    }
    
    if (shouldReload) {
      loadRecorridos();
    }
  };

  // Función para manejar éxito del formulario
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

  // Función para exportar datos
  const handleExportData = () => {
    showAlert('info', 'Función de exportación en desarrollo');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-3 sm:px-4 lg:px-6 xl:px-8">
      
      {/* Componente Alert */}
      <Alert />
      
      {/* Header Principal */}
      <div className="mb-6 pt-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 text-center sm:text-left mb-2">
            Gestión de Recorridos
          </h1>
          <p className="text-gray-600 text-center sm:text-left text-sm sm:text-base lg:text-lg">
            Administra y visualiza todos los recorridos registrados en el sistema
          </p>
        </div>
      </div>

      {/* Controles del Mes */}
      <Card className="mb-6 shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 sm:p-6">
          {/* Navegación del Mes */}
          <div className="flex items-center justify-center w-full lg:w-auto">
            <div className="flex flex-col sm:flex-row items-center bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 w-full sm:w-auto">
              <div className="flex w-full sm:w-auto mb-2 sm:mb-0">
                <Button
                  variant="secondary"
                  onClick={() => cambiarMes(-1)}
                  className="rounded-l-lg rounded-r-sm sm:rounded-r-none p-2 sm:p-3 hover:bg-gray-50 transition-colors flex-1 sm:flex-none border-r border-gray-200"
                  disabled={loading}
                >
                  <span className="hidden xs:inline text-sm">Anterior</span>
                  <span className="xs:hidden">‹</span>
                </Button>

                <div className="flex flex-col items-center mx-2 sm:mx-4 min-w-[120px] sm:min-w-[160px] flex-1">
                  <h3 className="text-base sm:text-xl font-bold text-indigo-600 text-center">
                    {nombresMeses[mesSeleccionado - 1]}
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">{añoSeleccionado}</p>
                </div>

                <Button
                  variant="secondary"
                  onClick={() => cambiarMes(1)}
                  className="rounded-r-lg rounded-l-sm sm:rounded-l-none p-2 sm:p-3 hover:bg-gray-50 transition-colors flex-1 sm:flex-none border-l border-gray-200"
                  disabled={loading}
                >
                  <span className="hidden xs:inline text-sm">Siguiente</span>
                  <span className="xs:hidden">›</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className='flex flex-col xs:flex-row gap-2 sm:gap-3 w-full lg:w-auto justify-center lg:justify-end'>
            <Button
              variant="secondary"
              onClick={loadRecorridos}
              disabled={loading}
              icon="🔄"
              className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-gray-50 transition-colors shadow-sm bg-white text-gray-700 border border-gray-300 text-sm sm:text-base w-full xs:w-auto"
            >
              <span className="font-semibold whitespace-nowrap">
                <span className="hidden sm:inline">Actualizar</span>
                <span className="sm:hidden">Actualizar</span>
              </span>
            </Button>

            <Button
              variant="primary"
              onClick={handleOpenCreateModal}
              icon="➕"
              className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-blue-600 transition-colors shadow-sm bg-blue-500 text-white text-sm sm:text-base w-full xs:w-auto"
            >
              <span className="font-semibold whitespace-nowrap">
                <span className="hidden sm:inline">Nuevo Recorrido</span>
                <span className="sm:hidden">Nuevo</span>
              </span>
            </Button>

            
          </div>
        </div>

        {/* Total del Mes */}
        <div className="border-t border-gray-200 pt-4 mt-4 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <div className="text-sm text-gray-600 font-medium">Total del mes</div>
              <div className="text-2xl sm:text-3xl font-bold text-green-600">
                ${estadisticas.totalMes.toFixed(2)}
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-500">Recorridos</div>
                <div className="text-lg font-semibold text-indigo-600">{estadisticas.totalRecorridos}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Vehículos</div>
                <div className="text-lg font-semibold text-blue-600">{estadisticas.vehiculosUsados}</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Resumen Estadístico */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="text-center p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
          <div className="text-2xl sm:text-3xl font-bold text-indigo-600 mb-2">
            {estadisticas.totalRecorridos}
          </div>
          <div className="text-gray-600 font-medium text-sm sm:text-base">Total Recorridos</div>
        </Card>
        
        <Card className="text-center p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
          <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
            ${estadisticas.totalMes.toFixed(2)}
          </div>
          <div className="text-gray-600 font-medium text-sm sm:text-base">Costo Total</div>
        </Card>
        
        <Card className="text-center p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
          <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">
            {estadisticas.vehiculosUsados}
          </div>
          <div className="text-gray-600 font-medium text-sm sm:text-base">Vehículos Usados</div>
        </Card>
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
      <Modal
        isOpen={mostrarModal}
        onClose={() => handleCloseModal(false)}
        title={recorridoAEditar ? '✏️ Editar Recorrido' : '➕ Crear Recorrido'}
        size="max-w-2xl"
      >
        <div className="p-4 sm:p-6">
          <RecorridoForm
            recorridoParaEditar={recorridoAEditar}
            onSuccess={() => handleFormSuccess(!!recorridoAEditar)}
            onCancel={() => handleCloseModal(false)}
          />
        </div>
      </Modal>

      {/* Loading State */}
      {loading && recorridosFiltrados.length === 0 && (
        <Card className="flex justify-center items-center h-48 sm:h-64 shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-500 mx-auto mb-3 sm:mb-4"></div>
            <p className="text-base sm:text-lg text-gray-600 font-medium">Cargando recorridos...</p>
          </div>
        </Card>
      )}

      {/* Grid de recorridos */}
      {!loading && recorridosFiltrados.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {recorridosFiltrados.map((recorrido) => (
            <Card key={recorrido.id} className="hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden">
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
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleEdit(recorrido)}
                    disabled={loading}
                    icon="✏️"
                    className="flex-1"
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(recorrido)}
                    disabled={loading}
                    icon="🗑️"
                    className="flex-1"
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && recorridosFiltrados.length === 0 && (
        <Card className="text-center py-12 sm:py-16 shadow-sm border border-gray-200">
          <div className="max-w-md mx-auto px-4">
            <div className="text-4xl sm:text-6xl mb-4">📍</div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              No hay recorridos registrados
            </h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              No se encontraron recorridos para {nombresMeses[mesSeleccionado - 1]} {añoSeleccionado}.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleOpenCreateModal}
                variant="primary"
                size="lg"
                icon="➕"
              >
                Crear Primer Recorrido
              </Button>
              <Button
                onClick={loadRecorridos}
                variant="secondary"
                size="lg"
                icon="🔄"
              >
                Reintentar
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Recorridos;