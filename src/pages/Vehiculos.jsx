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
        color: 'bg-white/10 text-white/70 border-white/10'
      }
    };
    return config[tipo] || config.default;
  };

  return (
    <div className="min-h-screen bg-transparent py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <Alert />

      {/* --- Page Header --- */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="md:flex md:items-center md:justify-between md:space-x-8">
          <div className="flex items-start">
            <div className="pt-1.5">
              <h1 className="text-4xl font-black text-white sm:text-5xl tracking-tighter">Vehículos</h1>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-3">Gestión de flota y costos operativos</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col-reverse justify-stretch gap-4 md:mt-0 md:flex-row md:items-center">
            <Button
              variant="secondary"
              onClick={loadVehiculos}
              disabled={loading}
              className="w-full md:w-auto"
            >
              Refrescar
            </Button>
            <Button
              variant="primary"
              onClick={handleOpenCreateModal}
              className="w-full md:w-auto shadow-2xl shadow-primary-500/20"
            >
              Nuevo Vehículo
            </Button>
          </div>
        </div>
      </div>

      {/* --- Content Section --- */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          <Card className="p-8">
            <dt className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Total Flota</dt>
            <dd className="text-4xl font-black text-white tracking-tighter">{vehiculos.length}</dd>
          </Card>
          <Card className="p-8 border-blue-500/20">
            <dt className="text-[10px] font-black text-blue-400/50 uppercase tracking-[0.2em] mb-2">Vehículos Propios</dt>
            <dd className="text-4xl font-black text-blue-400 tracking-tighter">
              {vehiculos.filter(v => v.tipo === 'propio').length}
            </dd>
          </Card>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} variant="card" className="h-[280px]" />
            ))}
          </div>
        ) : vehiculos.length === 0 ? (
          <div className="text-center py-24 bg-white/5 rounded-[2.5rem] border border-white/5 border-dashed">
            <div className="text-5xl mb-6 opacity-30">🚗</div>
            <h3 className="text-xl font-black text-white mb-2">Sin vehículos</h3>
            <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Registra tu primer transporte para comenzar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(vehiculos || []).map((vehiculo) => {
              const styleInfo = getTipoInfo(vehiculo.tipo);
              return (
                <div
                  key={vehiculo.id}
                  className="group relative bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 p-7 hover:bg-white/10 transition-all duration-500 hover:shadow-2xl flex flex-col"
                >
                  <div className="flex items-start justify-between mb-6">
                    <span className="text-3xl filter drop-shadow-2xl">{styleInfo.icon}</span>
                    <span className={`inline-flex items-center px-3 py-1 text-[10px] font-black uppercase tracking-widest border rounded-full ${styleInfo.color}`}>
                      {vehiculo.tipo}
                    </span>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-xl font-black text-white truncate tracking-tighter" title={vehiculo.descripcion}>
                      {vehiculo.descripcion}
                    </h3>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">
                      {vehiculo.placa || 'SIN PLACA'}
                    </p>
                  </div>

                  <div className="space-y-4 py-6 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Capacidad</span>
                      <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">
                        {vehiculo.capacidad ? `${vehiculo.capacidad} Pas.` : '--'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Costo/Recorrido</span>
                      <span className="text-xl font-black text-emerald-400 tracking-tighter">
                        ${parseFloat(vehiculo.costo_por_recorrido || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl rounded-[2rem] flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-95 group-hover:scale-100 z-10 pointer-events-none group-hover:pointer-events-auto">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="shadow-2xl"
                      onClick={() => handleEdit(vehiculo)}
                      title="Editar"
                    >
                      ✏️
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="shadow-2xl"
                      onClick={() => handleDeleteClick(vehiculo.id)}
                      title="Eliminar"
                    >
                      🗑️
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
        size="max-w-xl"
      >
        <div className="p-0 bg-transparent">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2 pl-1">Tipo de Vehículo</label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  required
                  className="px-4 py-3 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary-500/50 focus:border-white/20 block w-full transition-all duration-300 bg-white/5 text-white outline-none backdrop-blur-sm"
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

            <div className="mt-10 pt-8 border-t border-white/5 flex flex-col-reverse sm:flex-row sm:justify-end gap-4">
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
