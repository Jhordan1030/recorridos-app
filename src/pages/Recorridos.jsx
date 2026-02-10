import { useState, useEffect, useMemo } from 'react';
import { useAlert } from '../context/AlertContext';
import { useApp } from '../context/AppContext';
import { getRecorridos, deleteRecorrido, getNinos, getVehiculos, createRecorrido, updateRecorrido } from '../services/api';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Skeleton from '../components/ui/Skeleton';

const Recorridos = () => {
  const { showAlert } = useAlert();
  const { isMobile } = useApp();
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

  const handleDelete = (id) => {
    setRecorridoAEliminar(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!recorridoAEliminar) return;
    setLoading(true);
    try {
      const response = await deleteRecorrido(recorridoAEliminar);
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
  // Helper UI para Tipo de Recorrido
  const getTipoBadge = (tipo) => {
    return tipo === 'traer'
      ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
      : tipo === 'llevar'
        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
        : 'bg-primary-50 text-primary-600 border-primary-200';
  };

  return (
    <div className="min-h-screen bg-transparent py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <Alert />

      {/* --- Page Header --- */}
      <div className="w-full mx-auto mb-10">
        <div className="md:flex md:items-center md:justify-between md:space-x-8">
          <div className="flex items-start">
            <div className="pt-1.5">
              <h1 className="text-4xl font-black text-slate-900 sm:text-5xl tracking-tighter">Recorridos</h1>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-3">Gestión de rutas y logística escolar</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col-reverse justify-stretch gap-4 md:mt-0 md:flex-row md:items-center">
            <Button
              variant="secondary"
              onClick={loadRecorridos}
              disabled={loading}
              size={isMobile ? 'sm' : 'lg'}
              className="w-full md:w-auto !bg-white !border !border-slate-200 !text-slate-700 hover:!text-indigo-600 hover:!border-indigo-200 hover:!bg-indigo-50 transition-all shadow-sm"
            >
              Refrescar
            </Button>
            <Button
              variant="primary"
              onClick={handleOpenModal}
              size={isMobile ? 'sm' : 'lg'}
              className="w-full md:w-auto shadow-2xl shadow-primary-500/20"
            >
              Nuevo Recorrido
            </Button>
          </div>
        </div>
      </div>

      {/* --- Controls & Stats --- */}
      <div className="w-full mx-auto mb-10 space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Navegación Mes */}
          <div className="lg:col-span-4">
            <div className="flex items-center bg-white rounded-3xl border border-slate-200 overflow-hidden h-full shadow-sm">
              <button
                onClick={() => cambiarMes(-1)}
                disabled={loading}
                className="px-6 py-4 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all border-r border-slate-100"
              >
                ‹
              </button>
              <div className="flex-1 px-8 py-4 text-center">
                <h3 className="text-sm font-black text-primary-600 uppercase tracking-[0.2em]">
                  {nombresMeses[mesSeleccionado - 1]}
                </h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{añoSeleccionado}</span>
              </div>
              <button
                onClick={() => cambiarMes(1)}
                disabled={loading}
                className="px-6 py-4 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all border-l border-slate-100"
              >
                ›
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="p-8 border-emerald-200 bg-emerald-50/50">
              <dt className="text-[10px] font-black text-emerald-600/70 uppercase tracking-[0.2em] mb-2">Inversión Mes</dt>
              <dd className="text-4xl font-black text-emerald-600 tracking-tighter">
                ${estadisticas.totalMes.toFixed(2)}
              </dd>
            </Card>
            <Card className="p-8">
              <dt className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Trayectos</dt>
              <dd className="text-4xl font-black text-slate-900 tracking-tighter">{estadisticas.totalRecorridos}</dd>
            </Card>
            <Card className="p-8">
              <dt className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Flota Activa</dt>
              <dd className="text-4xl font-black text-slate-900 tracking-tighter">{estadisticas.vehiculosUsados}</dd>
            </Card>
          </div>
        </div>
      </div>

      {/* Recorridos Grid */}
      <div className="w-full mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} variant="card" className="h-[350px]" />
            ))}
          </div>
        ) : recorridosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recorridosFiltrados.map((recorrido) => (
              <div
                key={recorrido.id}
                className="group relative bg-white rounded-[2rem] border border-slate-100 p-7 hover:shadow-xl transition-all duration-500 flex flex-col"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha</span>
                    <span className="text-lg font-black text-slate-900 tracking-tighter flex items-center gap-2">
                      {recorrido.fecha.split('T')[0]}
                    </span>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getTipoBadge(recorrido.tipo_recorrido)}`}>
                    {recorrido.tipo_recorrido}
                  </span>
                </div>

                <div className="space-y-6 mb-8">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hora Salida</span>
                    <span className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-black text-slate-700 tracking-widest border border-slate-100 font-mono">
                      {formatearHora(recorrido.hora_inicio)}
                    </span>
                  </div>

                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Vehículo</p>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl opacity-50">🚗</span>
                      <span className="text-sm font-black text-slate-900 truncate tracking-tight" title={recorrido.vehiculo_descripcion}>
                        {recorrido.vehiculo_descripcion || 'Sin asignar'}
                      </span>
                    </div>
                  </div>

                  {recorrido.ninos?.length > 0 && (
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Estudiantes ({recorrido.ninos.length})</p>
                      <div className="flex -space-x-3 overflow-hidden">
                        {recorrido.ninos.slice(0, 4).map((n, i) => (
                          <div
                            key={i}
                            className="inline-block h-8 w-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-black shadow-sm border border-slate-50 ring-4 ring-white"
                            title={n.nombre}
                          >
                            {n.nombre?.charAt(0) || '?'}
                          </div>
                        ))}
                        {recorrido.ninos.length > 4 && (
                          <div className="inline-block h-8 w-8 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center text-[10px] font-black border border-slate-100">
                            +{recorrido.ninos.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-6 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Costo Incurrido</span>
                  <span className="text-xl font-black text-emerald-600 tracking-tighter">
                    ${parseFloat(recorrido.costo || 0).toFixed(2)}
                  </span>
                </div>

                {/* Card Actions Footer */}
                <div className={`
                  absolute inset-0 bg-white/90 backdrop-blur-xl rounded-[2rem] flex items-center justify-center gap-3 transition-all duration-500
                  ${isMobile
                    ? 'opacity-0 scale-95 pointer-events-none'
                    : 'opacity-0 lg:group-hover:opacity-100 scale-95 lg:group-hover:scale-100 z-10 pointer-events-none lg:group-hover:pointer-events-auto'
                  }
                `}>
                  <Button variant="secondary" size="sm" onClick={() => handleEdit(recorrido)}>✏️</Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(recorrido.id)}>🗑️</Button>
                </div>

                {/* Mobile Actions (Visible) */}
                <div className="mt-auto pt-6 border-t border-slate-100 flex gap-2 lg:hidden">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleEdit(recorrido)}>Editar</Button>
                  <Button variant="danger" size="sm" className="flex-1" onClick={() => handleDelete(recorrido.id)}>Eliminar</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && (
            <div className="text-center py-24 bg-slate-50 rounded-[2.5rem] border border-slate-200 border-dashed">
              <div className="text-5xl mb-6 opacity-30">📍</div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Sin recorridos</h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">No hay registros para el periodo seleccionado</p>
            </div>
          )
        )}
      </div>

      <Modal
        isOpen={mostrarModal}
        onClose={handleCloseModal}
        title={editando ? 'Editar Recorrido' : 'Nuevo Recorrido'}
        size="max-w-3xl"
      >
        <div className="p-0 bg-transparent">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="Fecha del Trayecto"
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                required
                disabled={loadingForm}
              />
              <Input
                label="Hora de Salida"
                type="time"
                name="hora_inicio"
                value={formData.hora_inicio}
                onChange={handleChange}
                required
                disabled={loadingForm}
              />
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 pl-1">Vehículo Asignado</label>
                <select
                  name="vehiculo_id"
                  value={formData.vehiculo_id}
                  onChange={handleChange}
                  required
                  disabled={loadingForm}
                  className="px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500/50 focus:border-slate-300 block w-full transition-all duration-300 bg-white text-slate-900 outline-none"
                >
                  <option value="">Seleccionar transporte...</option>
                  {vehiculos.map(v => <option key={v.id} value={v.id}>{v.descripcion}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 pl-1">Tipo de Servicio</label>
                <select
                  name="tipo_recorrido"
                  value={formData.tipo_recorrido}
                  onChange={handleChange}
                  required
                  disabled={loadingForm}
                  className="px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500/50 focus:border-slate-300 block w-full transition-all duration-300 bg-white text-slate-900 outline-none"
                >
                  <option value="traer">🚌 Traer Estudiantes</option>
                  <option value="llevar">🏠 Llevar Estudiantes</option>
                  <option value="ambos">🔄 Ambos</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Notas de Ruta"
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  placeholder="Detalles adicionales, cambios en ruta..."
                  disabled={loadingForm}
                />
              </div>
            </div>

            {/* Sección Niños */}
            <div className="pt-8 border-t border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudiantes Asignados ({ninosSeleccionados.length})</h4>
              </div>

              <div className="mb-6">
                <select
                  onChange={agregarNino}
                  value=""
                  disabled={loadingForm}
                  className="px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500/50 focus:border-slate-300 block w-full transition-all duration-300 bg-white text-slate-900 outline-none"
                >
                  <option value="">+ Vincular estudiante a esta ruta</option>
                  {(ninos || []).filter(n => !ninosSeleccionados.some(sel => sel.nino_id?.toString() === n.id?.toString())).map(n => (
                    <option key={n.id} value={n.id}>{n.nombre} {n.apellidos}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {(ninosSeleccionados || []).map((n, idx) => (
                  <div key={n.nino_id} className="group flex items-center justify-between bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-3 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-black border border-slate-200">
                        {n.nombre?.charAt(0) || '?'}
                      </div>
                      <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{n.nombre} {n.apellidos}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarNino(idx)}
                      className="text-slate-400 hover:text-red-500 p-2 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {ninosSeleccionados.length === 0 && (
                  <div className="col-span-2 py-8 text-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sin estudiantes vinculados</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-4">
              <Button type="button" onClick={handleCloseModal} variant="secondary" className="w-full sm:w-auto">Cancelar</Button>
              <Button
                type="submit"
                variant="primary"
                loading={loadingForm}
                className="w-full sm:w-auto shadow-2xl shadow-primary-500/20"
              >
                {editando ? 'Guardar Cambios' : 'Registrar Ruta'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Eliminar Recorrido"
        message="¿Estás seguro de que quieres eliminar esta ruta permanentemente? Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default Recorridos;
