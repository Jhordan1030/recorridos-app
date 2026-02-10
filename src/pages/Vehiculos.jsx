import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAlert } from '../context/AlertContext';
import { getVehiculos, createVehiculo, deleteVehiculo, updateVehiculo } from '../services/api';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import { Settings, Trash2, Plus, Search, Truck, Zap } from 'lucide-react';

const Vehiculos = () => {
  const { vehiculos, setVehiculos, isMobile } = useApp();
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
  const [searchTerm, setSearchTerm] = useState('');

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

  // Helpers de UI con soporte Neutral Glass
  const getTipoInfo = (tipo) => {
    const config = {
      propio: {
        icon: '🚗',
        color: 'bg-blue-50 text-blue-600 border-blue-200'
      },
      empresa: {
        icon: '🏢',
        color: 'bg-emerald-50 text-emerald-600 border-emerald-200'
      },
      alquilado: {
        icon: '📋',
        color: 'bg-violet-50 text-violet-600 border-violet-200'
      },
      taxi: {
        icon: '🚕',
        color: 'bg-amber-50 text-amber-600 border-amber-200'
      },
      default: {
        icon: '🚗',
        color: 'bg-slate-50 text-slate-600 border-slate-200'
      }
    };
    return config[tipo] || config.default;
  };

  const filteredVehiculos = (vehiculos || []).filter(v =>
    v.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.placa && v.placa.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-transparent py-4 sm:py-8 px-0 sm:px-6 lg:px-8 transition-colors duration-300">
      <Alert />

      {/* --- Page Header --- */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Vehículos</h1>
            <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Control de flota y asignaciones</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar vehículo..."
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant="primary"
              onClick={handleOpenCreateModal}
              size={isMobile ? 'sm' : 'lg'}
              className="w-full sm:w-auto shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Plus size={18} />
                <span>Nuevo Vehículo</span>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* --- Content Section --- */}
      <div className="w-full mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 mb-8">
          <Card variant="base" className="p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Flota</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{vehiculos.length}</h3>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <Truck size={20} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-slate-400">
              <span className="text-slate-600">Unidades</span>
              <span>disponibles</span>
            </div>
          </Card>

          <Card variant="base" className="p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Operatividad</p>
                <h3 className="text-3xl font-black text-emerald-600 tracking-tighter uppercase">100%</h3>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <Zap size={20} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-slate-400">
              <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">En servicio</span>
            </div>
          </Card>
        </div>


        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} variant="card" className="h-[200px]" />
            ))}
          </div>
        ) : filteredVehiculos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
              <Truck size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Sin vehículos</h3>
            <p className="text-slate-500 text-sm">Registra tu primer transporte para comenzar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredVehiculos.map((vehiculo) => {
              const styleInfo = getTipoInfo(vehiculo.tipo);
              return (
                <Card
                  key={vehiculo.id}
                  variant="base"
                  padding="p-0"
                  className="group relative overflow-visible hover:shadow-lg transition-all duration-300 border-slate-200 flex flex-col"
                >
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-xl shadow-sm border border-slate-100">
                        {styleInfo.icon}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${styleInfo.color}`}>
                        {vehiculo.tipo}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 tracking-tight truncate line-clamp-1 mb-1" title={vehiculo.descripcion}>
                      {vehiculo.descripcion}
                    </h3>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4">
                      {vehiculo.placa || 'SIN PLACA'}
                    </p>

                    <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Capacidad</p>
                        <p className="text-sm font-bold text-slate-700">{vehiculo.capacidad || '0'} Pas.</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Costo</p>
                        <p className="text-sm font-bold text-emerald-600">${parseFloat(vehiculo.costo_por_recorrido || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 text-xs justify-center gap-2 hover:bg-white hover:border-indigo-200 hover:text-indigo-600 shadow-sm"
                      onClick={() => handleEdit(vehiculo)}
                    >
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                        <span>Editar</span>
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 border border-transparent px-3"
                      onClick={() => handleDeleteClick(vehiculo.id)}
                    >
                      <span className="sr-only">Eliminar</span>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </Card>
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
        size="max-w-xl"
      >
        <div className="p-0 bg-transparent">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 pl-1">Tipo de Vehículo</label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  required
                  className="px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500/50 focus:border-slate-300 block w-full transition-all duration-300 bg-white text-slate-900 outline-none"
                  disabled={loading}
                >
                  <option value="propio">🚗 Propio</option>
                  <option value="empresa">🏢 Empresa</option>
                  <option value="alquilado">📋 Alquilado</option>
                  <option value="taxi">🚕 Taxi</option>
                </select>
              </div>
              <Input
                label="Placa / Chasis"
                name="placa"
                value={formData.placa}
                onChange={handleChange}
                placeholder="ABC-1234"
                className="uppercase"
                disabled={loading}
              />
            </div>

            <Input
              label="Descripción o Modelo"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Ej: Toyota Hilux Blanca 2023"
              required
              disabled={loading}
            />

            <div className="grid grid-cols-2 gap-6">
              <Input
                label="Capacidad (Personas)"
                type="number"
                name="capacidad"
                value={formData.capacidad}
                onChange={handleChange}
                placeholder="4"
                min="1"
                disabled={loading}
              />
              <Input
                label="Costo por Recorrido ($)"
                type="number"
                step="0.01"
                name="costo_por_recorrido"
                value={formData.costo_por_recorrido}
                onChange={handleChange}
                placeholder="0.00"
                required
                min="0"
                disabled={loading}
              />
            </div>

            <div className="mt-10 pt-8 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-4">
              <Button type="button" onClick={handleCloseModal} variant="secondary" className="w-full sm:w-auto">Cancelar</Button>
              <Button type="submit" variant="primary" loading={loading} className="w-full sm:w-auto">
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
