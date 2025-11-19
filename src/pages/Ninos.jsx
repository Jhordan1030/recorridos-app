import { useState, useEffect } from 'react';
import { useApp } from "../context/AppContext";
import { useAlert } from "../context/AlertContext";
import { getNinos, createNino, deleteNino, updateNino } from "../services/api";
import Modal from "../components/ui/Modal";
import ConfirmModal from "../components/ui/ConfirmModal";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";

const Ninos = () => {
  const { ninos, setNinos } = useApp();
  const { showAlert } = useAlert(); // ✅ Usando el contexto correcto de Alert
  
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
    <div className="min-h-screen bg-gray-50 py-4 px-3 sm:px-4 lg:px-6 xl:px-8">
      
      {/* Componente Alert */}
      <Alert />
      
      {/* Header Principal */}
      <div className="mb-6 pt-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 text-center sm:text-left mb-2">
            Gestión de Niños
          </h1>
          <p className="text-gray-600 text-center sm:text-left text-sm sm:text-base lg:text-lg">
            Administra la información de los niños registrados en el sistema
          </p>
        </div>
      </div>

      {/* Modal de Confirmación para Eliminar */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Desactivar Niño"
        message="¿Estás seguro de que quieres desactivar este niño? Esta acción no se puede deshacer."
        confirmText="Desactivar"
        type="danger"
      />

      {/* Controles y Estadísticas */}
      <Card className="mb-6 shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 sm:p-6">
          {/* Estadísticas */}
          <div className="flex items-center justify-center w-full lg:w-auto">
            <div className="bg-indigo-500 px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-sm text-center min-w-[120px] sm:min-w-[140px]">
              <div className="text-xl sm:text-2xl font-bold text-white">{ninos.length}</div>
              <div className="text-indigo-100 text-xs sm:text-sm font-medium">Total Niños</div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className='flex flex-col xs:flex-row gap-2 sm:gap-3 w-full lg:w-auto justify-center lg:justify-end'>
            <Button
              variant="secondary"
              onClick={loadNinos}
              disabled={loading}
              icon="🔄"
              className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-gray-50 transition-colors shadow-sm bg-white text-gray-700 border border-gray-300 text-sm sm:text-base w-full xs:w-auto"
            >
              <span className="font-semibold whitespace-nowrap">
                Actualizar
              </span>
            </Button>

            <Button
              variant="primary"
              onClick={handleOpenCreateModal}
              icon="➕"
              className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-blue-600 transition-colors shadow-sm bg-blue-500 text-white text-sm sm:text-base w-full xs:w-auto"
            >
              <span className="font-semibold whitespace-nowrap">
                <span className="hidden sm:inline">Nuevo Niño</span>
                <span className="sm:hidden">Nuevo</span>
              </span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal de Formulario */}
      <Modal
        isOpen={mostrarModal}
        onClose={handleCloseModal}
        title={editMode ? '✏️ Editar Niño' : '👶 Registrar Nuevo Niño'}
        size="max-w-2xl"
      >
        <div className="p-4 sm:p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              
              {/* Nombre */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <span className="mr-2">👶</span>
                  Nombre *
                </label>
                <Input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Juan"
                  required
                  disabled={loading}
                />
              </div>
              
              {/* Apellidos */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <span className="mr-2">👨‍👩‍👧‍👦</span>
                  Apellidos *
                </label>
                <Input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  placeholder="Ej: Pérez García"
                  required
                  disabled={loading}
                />
              </div>
              
              {/* Dirección */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <span className="mr-2">📍</span>
                  Dirección
                </label>
                <Input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="Ej: Calle Principal 123, Ciudad"
                  disabled={loading}
                />
              </div>
              
              {/* Teléfono */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <span className="mr-2">📞</span>
                  Teléfono de Contacto
                </label>
                <Input
                  type="tel"
                  name="telefono_contacto"
                  value={formData.telefono_contacto}
                  onChange={handleChange}
                  placeholder="Ej: 0999999999"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseModal}
                disabled={loading}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 text-sm sm:text-base"
              >
                ❌ Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200 text-sm sm:text-base"
              >
                {editMode ? (
                  <>
                    <span>💾</span>
                    <span>Actualizar Niño</span>
                  </>
                ) : (
                  <>
                    <span>✅</span>
                    <span>Agregar Niño</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Loading State */}
      {loading && ninos.length === 0 && (
        <Card className="flex justify-center items-center h-48 sm:h-64 shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-500 mx-auto mb-3 sm:mb-4"></div>
            <p className="text-base sm:text-lg text-gray-600 font-medium">Cargando niños...</p>
          </div>
        </Card>
      )}

      {/* Grid de niños */}
      {!loading && ninos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {ninos.map((nino) => (
            <Card key={nino.id} className="hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6">
                {/* Header de la tarjeta */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
                      {nino.nombre.charAt(0)}{nino.apellidos.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {nino.nombre} {nino.apellidos}
                      </h3>
                      <p className="text-sm text-green-600 font-medium">Activo</p>
                    </div>
                  </div>
                </div>

                {/* Información del niño */}
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <span className="mr-3 text-lg flex-shrink-0">📍</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-500">Dirección</p>
                      <p className="text-gray-900 text-sm line-clamp-2">
                        {nino.direccion || 'No especificada'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <span className="mr-3 text-lg flex-shrink-0">📞</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-500">Teléfono</p>
                      <p className="text-gray-900 text-sm">
                        {nino.telefono_contacto || 'No especificado'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="mt-6 pt-4 border-t border-gray-200 flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleEdit(nino)}
                    disabled={loading}
                    icon="✏️"
                    className="flex-1"
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteClick(nino.id)}
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
      {!loading && ninos.length === 0 && (
        <Card className="text-center py-12 sm:py-16 shadow-sm border border-gray-200">
          <div className="max-w-md mx-auto px-4">
            <div className="text-4xl sm:text-6xl mb-4">👶</div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              No hay niños registrados
            </h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              Comienza agregando el primer niño al sistema para gestionar sus recorridos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleOpenCreateModal}
                variant="primary"
                size="lg"
                icon="➕"
              >
                Registrar Primer Niño
              </Button>
              <Button
                onClick={loadNinos}
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

export default Ninos;