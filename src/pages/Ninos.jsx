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
import { Plus } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-transparent py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <Alert />

      {/* --- Page Header --- */}
      <div className="w-full mx-auto mb-10">
        <div className="md:flex md:items-center md:justify-between md:space-x-8">
          <div className="flex items-start">
            <div className="pt-1.5">
              <h1 className="text-4xl font-black text-slate-900 sm:text-5xl tracking-tighter">Niños</h1>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-3">Gestión de estudiantes y asignaciones</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col-reverse justify-stretch gap-4 md:mt-0 md:flex-row md:items-center">
            <Button
              variant="secondary"
              onClick={loadNinos}
              disabled={loading}
              size={isMobile ? 'sm' : 'lg'}
              className="w-full md:w-auto !bg-white !border !border-slate-200 !text-slate-700 hover:!text-indigo-600 hover:!border-indigo-200 hover:!bg-indigo-50 transition-all shadow-sm"
            >
              Refrescar
            </Button>
            <Button
              variant="primary"
              onClick={handleOpenCreateModal}
              size={isMobile ? 'sm' : 'lg'}
              className="w-full md:w-auto shadow-2xl shadow-primary-500/20"
            >
              Nuevo Niño
            </Button>
          </div>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="w-full mx-auto">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          <Card className="p-8">
            <dt className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Total Estudiantes</dt>
            <dd className="text-4xl font-black text-slate-900 tracking-tighter">{ninos.length}</dd>
          </Card>
          <Card className="p-8 border-emerald-500/20">
            <dt className="text-[10px] font-black text-emerald-400/50 uppercase tracking-[0.2em] mb-2">Estado Sistema</dt>
            <dd className="text-4xl font-black text-emerald-400 tracking-tighter uppercase">Óptimo</dd>
          </Card>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} variant="card" className="h-[300px]" />
            ))}
          </div>
        ) : ninos.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2.5rem] border border-slate-200 border-dashed">
            <div className="text-5xl mb-6 opacity-30">👶</div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Sin registros</h3>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Inicia el registro de estudiantes para comenzar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ninos.map((nino) => (
              <div
                key={nino.id}
                className="group relative bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 p-7 hover:bg-white/10 transition-all duration-500 hover:shadow-2xl flex flex-col"
              >
                <div className="flex items-start justify-between mb-6">
                  {/* Avatar */}
                  <div className="h-14 w-14 rounded-2xl bg-white/10 text-white flex items-center justify-center font-black text-xs shadow-2xl border border-white/20 ring-4 ring-white/5">
                    {nino.nombre?.charAt(0) || '?'}{nino.apellidos?.charAt(0) || '?'}
                  </div>
                  <span className="inline-flex items-center px-3 py-1 text-[10px] font-black uppercase tracking-widest border border-emerald-200 bg-emerald-50 text-emerald-600 rounded-full">
                    Activo
                  </span>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-black text-slate-900 truncate tracking-tighter" title={`${nino.nombre} ${nino.apellidos}`}>
                    {nino.nombre} {nino.apellidos}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {nino.telefono_contacto || 'SIN TELÉFONO'}
                  </p>
                </div>

                <div className="space-y-4 py-6 border-t border-slate-100">
                  <div className="flex items-start flex-col gap-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dirección Residencial</span>
                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-tight leading-relaxed line-clamp-2">
                      {nino.direccion || 'Dirección no registrada'}
                    </p>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className={`
                  absolute inset-0 bg-white/90 backdrop-blur-xl rounded-[2rem] flex items-center justify-center gap-3 transition-all duration-500
                  ${isMobile
                    ? 'opacity-0 scale-95 pointer-events-none'
                    : 'opacity-0 lg:group-hover:opacity-100 scale-95 lg:group-hover:scale-100 z-10 pointer-events-none lg:group-hover:pointer-events-auto'
                  }
                `}>
                  <Button variant="secondary" size="sm" onClick={() => handleEdit(nino)}>✏️</Button>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteClick(nino.id)}>🗑️</Button>
                </div>

                {/* Mobile Actions (Visible) */}
                <div className="mt-auto pt-6 border-t border-slate-100 flex gap-2 lg:hidden">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleEdit(nino)}>Editar</Button>
                  <Button variant="danger" size="sm" className="flex-1" onClick={() => handleDeleteClick(nino.id)}>Eliminar</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Modals --- */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Desactivar Niño"
        message="¿Estás seguro de que quieres eliminar este registro? Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      <Modal
        isOpen={mostrarModal}
        onClose={handleCloseModal}
        title={editMode ? 'Editar Niño' : 'Registrar Estudiante'}
        size="max-w-xl"
      >
        <div className="p-0 bg-transparent">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Input
                label="Nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Juan"
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
              placeholder="Ej: Calle Principal 123, Sector Norte"
              disabled={loading}
            />

            <Input
              label="Teléfono de Contacto"
              name="telefono_contacto"
              type="tel"
              value={formData.telefono_contacto}
              onChange={handleChange}
              placeholder="0999999999"
              disabled={loading}
            />

            <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-4">
              <Button type="button" onClick={handleCloseModal} variant="secondary" className="w-full sm:w-auto">Cancelar</Button>
              <Button type="submit" variant="primary" loading={loading} className="w-full sm:w-auto">
                {editMode ? 'Guardar Cambios' : 'Registrar'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Ninos;
