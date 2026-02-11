import { useState, useEffect } from 'react';
import { useApp } from "../context/AppContext";
import { useAlert } from "../context/AlertContext";
import { getNinos, createNino, deleteNino, updateNino } from "../services/api";
import Modal from "../components/ui/Modal";
import ConfirmModal from "../components/ui/ConfirmModal";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import Skeleton from "../components/ui/Skeleton";
import {
  Plus,
  Users,
  Search,
  MoreVertical,
  MapPin,
  Phone,
  UserCheck,
  Activity,
  UserPlus
} from 'lucide-react';

const Ninos = () => {
  const { ninos, setNinos, isMobile } = useApp();
  const { showAlert } = useAlert();

  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    direccion: '',
    telefono_contacto: '',
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ninoAEliminar, setNinoAEliminar] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
      showAlert('error', 'Error al cargar niños: ' + error.message);
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
      showAlert('error', 'Nombre y apellidos son requeridos');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (editMode) {
        response = await updateNino(editId, formData);
        if (response.data.success) {
          showAlert('success', 'Niño actualizado exitosamente');
        }
      } else {
        response = await createNino(formData);
        if (response.data.success) {
          showAlert('success', 'Niño creado exitosamente');
        }
      }

      if (response.data.success) {
        resetForm();
        loadNinos();
        setMostrarModal(false);
      }

    } catch (error) {
      showAlert('error', `Error al ${editMode ? 'actualizar' : 'crear'} niño: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setNinoAEliminar(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!ninoAEliminar) return;

    setLoading(true);
    try {
      const response = await deleteNino(ninoAEliminar);
      if (response.data.success) {
        showAlert('success', 'Niño desactivado exitosamente');
        loadNinos();
      }
    } catch (error) {
      showAlert('error', 'Error al eliminar: ' + error.message);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setNinoAEliminar(null);
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

  const filteredNinos = ninos.filter(nino =>
    nino.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nino.apellidos.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-transparent py-4 sm:py-8 px-0 sm:px-6 lg:px-8 transition-colors duration-300">
      <Alert />

      {/* --- Page Header --- */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Estudiantes</h1>
            <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Gestión de alumnos e información de contacto</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar estudiante..."
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
                <UserPlus size={18} />
                <span>Nuevo Estudiante</span>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="w-full mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 mb-8">
          <Card variant="base" className="p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Matriculados</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{ninos.length}</h3>
              </div>
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Users size={20} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-slate-400">
              <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">100%</span>
              <span>activos este ciclo</span>
            </div>
          </Card>

          <Card variant="base" className="p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Estado del Sistema</p>
                <h3 className="text-3xl font-black text-emerald-600 tracking-tighter uppercase">Óptimo</h3>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <Activity size={20} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-slate-400">
              <span className="text-slate-600">Sincronización</span>
              <span>completada</span>
            </div>
          </Card>
        </div>

        {/* Students Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} variant="card" className="h-[280px]" />
            ))}
          </div>
        ) : filteredNinos.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 border-dashed">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
              <Users size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Sin estudiantes encontrados</h3>
            <p className="text-slate-500 text-sm">No hay registros que coincidan con tu búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredNinos.map((nino) => (
              <Card
                key={nino.id}
                variant="base"
                className="group relative overflow-visible hover:shadow-lg transition-all duration-300 border-slate-200"
                padding="p-0"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/20">
                      {nino.nombre?.charAt(0)}{nino.apellidos?.charAt(0)}
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                      Activo
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 truncate" title={`${nino.nombre} ${nino.apellidos}`}>
                    {nino.nombre} {nino.apellidos}
                  </h3>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-2 text-sm text-slate-500">
                      <Phone size={14} className="mt-0.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-xs">{nino.telefono_contacto || 'Sin teléfono'}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-slate-500">
                      <MapPin size={14} className="mt-0.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-xs leading-relaxed line-clamp-2">{nino.direccion || 'Sin dirección registrada'}</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 text-xs justify-center gap-2 hover:bg-white hover:border-indigo-200 hover:text-indigo-600 shadow-sm"
                    onClick={() => handleEdit(nino)}
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
                    onClick={() => handleDeleteClick(nino.id)}
                  >
                    <span className="sr-only">Eliminar</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* --- Modals --- */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Desactivar Estudiante"
        message="¿Estás seguro de que deseas eliminar este registro? Esta acción podría afectar los historiales de recorridos."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      <Modal
        isOpen={mostrarModal}
        onClose={handleCloseModal}
        title={editMode ? 'Editar Estudiante' : 'Registrar Nuevo Estudiante'}
        size="max-w-xl"
      >
        <div className="p-0 bg-transparent">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Input
                label="Nombres"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Juan Andrés"
                required
                disabled={loading}
              />
              <Input
                label="Apellidos"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                placeholder="Ej: Pérez García"
                required
                disabled={loading}
              />
            </div>

            <Input
              label="Dirección Residencial"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Ej: Av. Principal 123 y Calle Secundaria"
              icon={<MapPin size={16} />}
              disabled={loading}
            />

            <Input
              label="Teléfono de Contacto"
              name="telefono_contacto"
              type="tel"
              value={formData.telefono_contacto}
              onChange={handleChange}
              placeholder="0999999999"
              icon={<Phone size={16} />}
              disabled={loading}
            />

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <Button type="button" onClick={handleCloseModal} variant="secondary" className="w-full sm:w-auto">Cancelar</Button>
              <Button type="submit" variant="primary" loading={loading} className="w-full sm:w-auto shadow-lg shadow-indigo-500/20">
                {editMode ? 'Guardar Cambios' : 'Registrar Estudiante'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Ninos;
