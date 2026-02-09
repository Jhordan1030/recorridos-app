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
import { Settings, Trash2 } from 'lucide-react';

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
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/20'
      },
      empresa: {
        icon: '🏢',
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
      },
      alquilado: {
        icon: '📋',
        color: 'bg-violet-500/20 text-violet-400 border-violet-500/20'
      },
      taxi: {
        icon: '🚕',
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/20'
      },
      default: {
        icon: '🚗',
        color: 'bg-slate-100 text-slate-600 border-slate-200'
      }
    };
    return config[tipo] || config.default;
  };

  return (
    <div className="min-h-screen bg-transparent py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <Alert />

      {/* --- Page Header --- */}
      <div className="w-full mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Vehículos</h1>
            <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Control de flota y costos operativos</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={loadVehiculos} disabled={loading} icon={<Settings size={14} />}>
              Actualizar
            </Button>
            <Button variant="primary" size="sm" onClick={handleOpenCreateModal} icon={<Plus size={14} />}>
              Añadir Transporte
            </Button>
          </div>
        </div>
      </div>

      {/* --- Content Section --- */}
      <div className="w-full mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card variant="base" padding="p-5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Flota</span>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{vehiculos.length}</span>
              <span className="text-[10px] text-slate-400 mb-1 font-semibold uppercase">Vehículos</span>
            </div>
          </Card>
          <Card variant="base" padding="p-5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Costo Promedio</span>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-primary-600 tracking-tight">$42.50</span>
              <span className="text-[10px] text-slate-400 mb-1 font-semibold uppercase">Por ruta</span>
            </div>
          </Card>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} variant="card" className="h-[200px] border border-white/5 bg-white/[0.02] rounded-xl" />
            ))}
          </div>
        ) : vehiculos.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
            <div className="text-4xl mb-4 opacity-30">🚗</div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Sin vehículos</h3>
            <p className="text-xs text-slate-500 mt-1 tracking-tight">Registra tu primer transporte para comenzar a operar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(vehiculos || []).map((vehiculo) => {
              const styleInfo = getTipoInfo(vehiculo.tipo);
              return (
                <Card
                  key={vehiculo.id}
                  variant="base"
                  padding="p-0"
                  hover
                  className="flex flex-col group/v"
                >
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center text-lg">
                        {styleInfo.icon}
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${styleInfo.color}`}>
                        {vehiculo.tipo}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 tracking-tight truncate line-clamp-1 mb-1 uppercase" title={vehiculo.descripcion}>
                      {vehiculo.descripcion}
                    </h3>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] font-mono text-slate-500">PLACA: {vehiculo.placa || 'N/D'}</span>
                    </div>

                    <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Capacidad</p>
                        <p className="text-xs font-bold text-slate-700">{vehiculo.capacidad || '--'} PAS.</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Costo</p>
                        <p className="text-sm font-bold text-emerald-600">${parseFloat(vehiculo.costo_por_recorrido || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2 opacity-0 group-hover/v:opacity-100 transition-opacity">
                    <Button variant="secondary" size="sm" className="flex-1 h-8 text-[10px]" onClick={() => handleEdit(vehiculo)}>
                      Editar
                    </Button>
                    <Button variant="danger" size="sm" className="w-8 h-8 p-0" onClick={() => handleDeleteClick(vehiculo.id)}>
                      <Trash2 size={12} />
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
