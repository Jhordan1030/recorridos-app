import { useState, useEffect, useMemo } from 'react';
import { useAlert } from '../context/AlertContext';
import { getRecorridos, deleteRecorrido, getNinos, getVehiculos, createRecorrido, updateRecorrido } from '../services/api';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

const Recorridos = () => {
  const { showAlert } = useAlert();
  const [recorridos, setRecorridos] = useState([]);
  
  // --- Estados ---
  const [mostrarModal, setMostrarModal] = useState(false); 
  const [editando, setEditando] = useState(false);
  const [recorridoId, setRecorridoId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recorridoAEliminar, setRecorridoAEliminar] = useState(null);
  
  // Datos auxiliares
  const [ninos, setNinos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [ninosSeleccionados, setNinosSeleccionados] = useState([]);
  const [loadingForm, setLoadingForm] = useState(false);

  // Filtros
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Estado Formulario
  const [formData, setFormData] = useState({
    fecha: '',
    hora_inicio: '',
    vehiculo_id: '',
    tipo_recorrido: 'traer',
    notas: '',
  });

  // --- Funciones de Fecha ---
  const obtenerFechaActual = () => {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  };

  const obtenerHoraActual = () => {
    const ahora = new Date();
    const horas = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    return `${horas}:${minutos}`;
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

  useEffect(() => {
    loadRecorridos();
  }, []);

  // --- Cargas de API ---
  const loadRecorridos = async () => {
    setLoading(true);
    try {
      const response = await getRecorridos();
      if (response.data.success) setRecorridos(response.data.data);
    } catch (error) {
      showAlert('error', 'Error al cargar recorridos');
    } finally {
      setLoading(false);
    }
  };

  const loadNinos = async () => {
    try {
      const response = await getNinos();
      if (response.data.success) setNinos(response.data.data);
    } catch (error) { showAlert('error', 'Error al cargar niños'); }
  };

  const loadVehiculos = async () => {
    try {
      const response = await getVehiculos();
      if (response.data.success) setVehiculos(response.data.data);
    } catch (error) { showAlert('error', 'Error al cargar vehículos'); }
  };

  // --- Filtros ---
  const recorridosFiltrados = useMemo(() => {
    return recorridos.filter(recorrido => {
      if (!recorrido.fecha) return false;
      const fecha = new Date(recorrido.fecha);
      return (fecha.getMonth() + 1) === mesSeleccionado && fecha.getFullYear() === añoSeleccionado;
    });
  }, [recorridos, mesSeleccionado, añoSeleccionado]);

  const estadisticas = useMemo(() => {
    const totalMes = recorridosFiltrados.reduce((total, r) => total + (parseFloat(r.costo) || 0), 0);
    const vehiculosUsados = new Set(recorridosFiltrados.map(r => r.vehiculo_id)).size;
    return { totalMes, vehiculosUsados, totalRecorridos: recorridosFiltrados.length };
  }, [recorridosFiltrados]);

  const cambiarMes = (delta) => {
    let nuevoMes = mesSeleccionado + delta;
    let nuevoAño = añoSeleccionado;
    if (nuevoMes > 12) { nuevoMes = 1; nuevoAño += 1; }
    else if (nuevoMes < 1) { nuevoMes = 12; nuevoAño -= 1; }
    setMesSeleccionado(nuevoMes);
    setAñoSeleccionado(nuevoAño);
  };

  // --- Handlers ---
  const resetForm = () => {
    setFormData({
      fecha: obtenerFechaActual(),
      hora_inicio: obtenerHoraActual(),
      vehiculo_id: '',
      tipo_recorrido: 'traer',
      notas: '',
    });
    setNinosSeleccionados([]);
    setEditando(false);
    setRecorridoId(null);
  };

  const handleOpenModal = async () => {
    setLoadingForm(true);
    setMostrarModal(true);
    resetForm();
    try { await Promise.all([loadNinos(), loadVehiculos()]); } 
    catch (error) { showAlert('error', 'Error al cargar datos'); } 
    finally { setLoadingForm(false); }
  };

  const handleCloseModal = () => {
    setMostrarModal(false);
    resetForm();
  };

  const handleEdit = async (recorrido) => {
    setLoadingForm(true);
    setMostrarModal(true);
    try {
      await Promise.all([loadNinos(), loadVehiculos()]);
      setEditando(true);
      setRecorridoId(recorrido.id);
      
      setFormData({
        fecha: recorrido.fecha.split('T')[0],
        hora_inicio: recorrido.hora_inicio?.slice(0, 5) || obtenerHoraActual(),
        vehiculo_id: recorrido.vehiculo_id || '',
        tipo_recorrido: recorrido.tipo_recorrido || 'traer',
        notas: recorrido.notas || '',
      });

      if (recorrido.ninos?.length > 0) {
        setNinosSeleccionados(recorrido.ninos.map(n => ({
          nino_id: n.nino_id || n.id,
          nombre: n.nombre,
          apellidos: n.apellidos,
          notas: n.notas || '',
        })));
      } else {
        setNinosSeleccionados([]);
      }
    } catch (error) { showAlert('error', 'Error al cargar datos'); } 
    finally { setLoadingForm(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const agregarNino = (e) => {
    const ninoId = e.target.value;
    if (!ninoId) return;
    const nino = ninos.find(n => n.id.toString() === ninoId.toString());
    if (!nino || ninosSeleccionados.some(n => n.nino_id.toString() === ninoId.toString())) return;
    
    setNinosSeleccionados([...ninosSeleccionados, {
      nino_id: ninoId,
      nombre: nino.nombre,
      apellidos: nino.apellidos,
      notas: '',
    }]);
    e.target.value = '';
  };

  const eliminarNino = (index) => {
    setNinosSeleccionados(ninosSeleccionados.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fecha || !formData.hora_inicio || !formData.vehiculo_id) {
      showAlert('error', 'Campos requeridos incompletos');
      return;
    }

    try {
      const data = { ...formData, notas: formData.notas || null, ninos: ninosSeleccionados };
      const action = editando ? updateRecorrido(recorridoId, data) : createRecorrido(data);
      const response = await action;

      if (response.data.success) {
        showAlert('success', editando ? 'Recorrido actualizado' : 'Recorrido creado');
        handleCloseModal();
        loadRecorridos();
      }
    } catch (error) { showAlert('error', 'Error al guardar'); }
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
        showAlert('success', 'Recorrido eliminado');
        loadRecorridos();
      }
    } catch (error) { showAlert('error', 'Error al eliminar'); } 
    finally {
      setLoading(false);
      setShowDeleteModal(false);
      setRecorridoAEliminar(null);
    }
  };

  // Helper UI para Tipo de Recorrido
  const getTipoBadge = (tipo) => {
    return tipo === 'traer' 
      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800'
      : tipo === 'llevar'
      ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800'
      : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <Alert />
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="md:flex md:items-center md:justify-between md:space-x-5">
          <div className="flex items-start space-x-5">
            <div className="pt-1.5">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Gestión de Recorridos</h1>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1">
                Planificación y seguimiento de rutas escolares.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controles y Stats */}
      <div className="max-w-7xl mx-auto mb-8 space-y-6">
        <Card className="shadow-sm border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 sm:p-6">
            {/* Navegación Mes */}
            <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
              <button onClick={() => cambiarMes(-1)} disabled={loading} className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-200 transition-colors border-r border-gray-200 dark:border-slate-700">‹</button>
              <div className="px-6 py-2 min-w-[140px] text-center">
                <h3 className="text-base font-bold text-indigo-600 dark:text-indigo-400">{nombresMeses[mesSeleccionado - 1]}</h3>
                <span className="text-xs text-gray-500 dark:text-slate-400">{añoSeleccionado}</span>
              </div>
              <button onClick={() => cambiarMes(1)} disabled={loading} className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-200 transition-colors border-l border-gray-200 dark:border-slate-700">›</button>
            </div>

            {/* Botones Acción */}
            <div className='flex gap-3'>
              <Button variant="secondary" onClick={loadRecorridos} disabled={loading} icon="🔄" className="bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700">Actualizar</Button>
              <Button variant="primary" onClick={handleOpenModal} icon="➕">Nuevo Recorrido</Button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="border-t border-gray-100 dark:border-slate-800 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
             <div>
                <p className="text-xs text-gray-500 dark:text-slate-500 uppercase tracking-wide font-semibold">Total del mes</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">${estadisticas.totalMes.toFixed(2)}</p>
             </div>
             <div className="flex gap-8">
                <div className="text-center">
                   <p className="text-xs text-gray-400 dark:text-slate-500 uppercase">Recorridos</p>
                   <p className="text-xl font-semibold text-gray-900 dark:text-white">{estadisticas.totalRecorridos}</p>
                </div>
                <div className="text-center">
                   <p className="text-xs text-gray-400 dark:text-slate-500 uppercase">Vehículos</p>
                   <p className="text-xl font-semibold text-gray-900 dark:text-white">{estadisticas.vehiculosUsados}</p>
                </div>
             </div>
          </div>
        </Card>
      </div>

      {/* Grid de Tarjetas */}
      <div className="max-w-7xl mx-auto">
        {!loading && recorridosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recorridosFiltrados.map((recorrido) => (
              <div 
                key={recorrido.id} 
                className="group bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Header de la Tarjeta */}
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Fecha</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        📅 {recorrido.fecha.split('T')[0]}
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${getTipoBadge(recorrido.tipo_recorrido)}`}>
                      {recorrido.tipo_recorrido}
                    </span>
                  </div>

                  {/* Info Cuerpo */}
                  <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-slate-400">Hora Salida</span>
                        <span className="text-sm font-mono font-medium text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                           {formatearHora(recorrido.hora_inicio)}
                        </span>
                     </div>
                     
                     <div>
                        <p className="text-xs text-gray-400 dark:text-slate-500 uppercase mb-1">Vehículo</p>
                        <div className="flex items-center gap-2">
                           <span className="text-lg">🚗</span>
                           <span className="text-sm font-medium text-gray-900 dark:text-white truncate" title={recorrido.vehiculo_descripcion}>
                              {recorrido.vehiculo_descripcion || 'Sin asignar'}
                           </span>
                        </div>
                     </div>

                     {recorrido.ninos?.length > 0 && (
                        <div>
                           <p className="text-xs text-gray-400 dark:text-slate-500 uppercase mb-1">Niños ({recorrido.ninos.length})</p>
                           <div className="flex -space-x-2 overflow-hidden">
                              {recorrido.ninos.slice(0, 5).map((n, i) => (
                                 <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300" title={n.nombre}>
                                    {n.nombre.charAt(0)}
                                 </div>
                              ))}
                              {recorrido.ninos.length > 5 && (
                                 <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-xs font-medium text-gray-500">
                                    +{recorrido.ninos.length - 5}
                                 </div>
                              )}
                           </div>
                        </div>
                     )}
                     
                     <div className="pt-3 mt-3 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase">Costo</span>
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                           ${parseFloat(recorrido.costo || 0).toFixed(2)}
                        </span>
                     </div>
                  </div>
                </div>

                {/* Footer Actions (Oculto hasta hover) */}
                <div className="bg-gray-50 dark:bg-slate-800/50 px-5 py-3 border-t border-gray-100 dark:border-slate-800 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 justify-center text-xs bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600"
                    onClick={() => handleEdit(recorrido)}
                    icon="✏️"
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1 justify-center text-xs"
                    onClick={() => handleDelete(recorrido)}
                    icon="🗑️"
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          !loading && (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 border-dashed">
              <div className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500 text-4xl">📍</div>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay recorridos</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">No se encontraron registros para este mes.</p>
              <div className="mt-6">
                <Button variant="primary" onClick={handleOpenModal} icon="➕">Crear Recorrido</Button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Eliminar Recorrido"
        message="¿Estás seguro de que quieres eliminar este recorrido? Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      <Modal
        isOpen={mostrarModal}
        onClose={handleCloseModal}
        title={editando ? 'Editar Recorrido' : 'Nuevo Recorrido'}
        size="max-w-3xl"
      >
        <div className="p-6 bg-white dark:bg-slate-900">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Grid de Inputs (Igual que Dashboard) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Fecha</label>
                  <Input type="date" name="fecha" value={formData.fecha} onChange={handleChange} required className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Hora</label>
                  <Input type="time" name="hora_inicio" value={formData.hora_inicio} onChange={handleChange} required className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Vehículo</label>
                  <select name="vehiculo_id" value={formData.vehiculo_id} onChange={handleChange} required className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-gray-900 dark:text-white">
                    <option value="">Seleccionar...</option>
                    {vehiculos.map(v => <option key={v.id} value={v.id}>{v.descripcion}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Tipo</label>
                  <select name="tipo_recorrido" value={formData.tipo_recorrido} onChange={handleChange} required className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-gray-900 dark:text-white">
                    <option value="traer">Traer</option>
                    <option value="llevar">Llevar</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Notas</label>
                  <Input type="text" name="notas" value={formData.notas} onChange={handleChange} placeholder="Opcional..." className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white" />
                </div>
              </div>

              {/* Sección Niños */}
              <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
                 <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white">Niños ({ninosSeleccionados.length})</h4>
                 </div>
                 <div className="mb-4">
                    <select onChange={agregarNino} value="" className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-gray-900 dark:text-white">
                       <option value="">+ Agregar niño...</option>
                       {ninos.filter(n => !ninosSeleccionados.some(sel => sel.nino_id.toString() === n.id.toString())).map(n => (
                          <option key={n.id} value={n.id}>{n.nombre} {n.apellidos}</option>
                       ))}
                    </select>
                 </div>
                 <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {ninosSeleccionados.map((n, idx) => (
                       <div key={n.nino_id} className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-2">
                          <span className="text-sm text-gray-800 dark:text-slate-200">{n.nombre} {n.apellidos}</span>
                          <button type="button" onClick={() => eliminarNino(idx)} className="text-red-500 hover:text-red-700 p-1">✕</button>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Footer Formulario */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                <Button type="button" variant="secondary" onClick={handleCloseModal} className="w-full sm:w-auto justify-center bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border-gray-300 dark:border-slate-600">Cancelar</Button>
                <Button type="submit" variant="primary" className="w-full sm:w-auto justify-center">{editando ? 'Guardar Cambios' : 'Crear Recorrido'}</Button>
              </div>
            </form>
        </div>
      </Modal>
    </div>
  );
};

export default Recorridos;