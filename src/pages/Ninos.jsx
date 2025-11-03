import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getNinos, createNino, deleteNino, updateNino } from '../services/api';
// Importamos el componente Modal
import Modal from '../components/Modal';

const Ninos = () => {
  const { showAlert, ninos, setNinos } = useApp();
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    direccion: '',
    telefono_contacto: '',
  });

  // Nuevo estado para el modal
  const [mostrarModal, setMostrarModal] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    loadNinos();
  }, []);

  const loadNinos = async () => {
    try {
      const response = await getNinos();
      if (response.data.success) {
        setNinos(response.data.data);
      }
    } catch (error) {
      showAlert('Error al cargar niños: ' + error.message, 'error');
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
      showAlert('Nombre y apellidos son requeridos', 'error');
      return;
    }
    try {
      let response;
      if (editMode) {
        // Actualizar niño existente
        response = await updateNino(editId, formData);
        if (response.data.success) {
          showAlert('Niño actualizado exitosamente', 'success');
        }
      } else {
        // Crear nuevo niño
        response = await createNino(formData);
        if (response.data.success) {
          showAlert('Niño creado exitosamente', 'success');
        }
      }

      // Acciones comunes tras éxito
      if (response.data.success) {
        resetForm();
        loadNinos();
        setMostrarModal(false); // Cierra el modal
      }

    } catch (error) {
      showAlert(`Error al ${editMode ? 'actualizar' : 'crear'} niño: ` + error.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de desactivar este niño?')) return;
    try {
      const response = await deleteNino(id);
      if (response.data.success) {
        showAlert('Niño desactivado exitosamente', 'success');
        loadNinos();
      }
    } catch (error) {
      showAlert('Error al eliminar: ' + error.message, 'error');
    }
  };

  // Función para cargar datos de edición y abrir el modal
  const handleEdit = (nino) => {
    setEditMode(true);
    setEditId(nino.id);
    setFormData({
      nombre: nino.nombre,
      apellidos: nino.apellidos,
      direccion: nino.direccion || '',
      telefono_contacto: nino.telefono_contacto || '',
    });
    setMostrarModal(true); // Abre el modal
  };

  // Función para abrir el modal en modo creación
  const handleOpenCreateModal = () => {
    resetForm();
    setMostrarModal(true);
  };

  // Función para cancelar edición y cerrar modal
  const handleCloseModal = () => {
    resetForm();
    setMostrarModal(false);
  };

  // -------------------------------------------------------------------------
  // COMPONENTE DEL FORMULARIO (renderizado dentro del Modal)
  // -------------------------------------------------------------------------
  const NinoForm = (
    <div className="form-card">
      <h3>{editMode ? '✏️ Editar Niño' : '➕ Agregar Nuevo Niño'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="input-group">
            <label>Nombre *</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Juan"
              required
            />
          </div>
          <div className="input-group">
            <label>Apellidos *</label>
            <input
              type="text"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleChange}
              placeholder="Ej: Pérez García"
              required
            />
          </div>
          <div className="input-group">
            <label>Dirección</label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Ej: Calle Principal 123"
            />
          </div>
          <div className="input-group">
            <label>Teléfono de Contacto</label>
            <input
              type="text"
              name="telefono_contacto"
              value={formData.telefono_contacto}
              onChange={handleChange}
              placeholder="Ej: 0999999999"
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editMode ? '💾 Actualizar Niño' : '✅ Agregar Niño'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCloseModal}
          >
            ❌ Cancelar
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <h2>👦 Gestión de Niños</h2>
      </div>

      {/* Botón para abrir el Modal de Creación */}
      <div className="form-actions" style={{ marginBottom: '2rem' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleOpenCreateModal}
        >
          ➕ Registrar Nuevo Niño
        </button>
        <button type="button" className="btn btn-secondary" onClick={loadNinos}>
          🔄 Actualizar Lista
        </button>
      </div>

      {/* Modal */}
      {mostrarModal && (
        <Modal
          title={editMode ? 'Editar Datos del Niño' : 'Registrar Nuevo Niño'}
          onClose={handleCloseModal}
        >
          {NinoForm}
        </Modal>
      )}

      <div className="cards-grid">
        {ninos.map((nino) => (
          <div key={nino.id} className="card">
            <h4>{nino.nombre} {nino.apellidos}</h4>
            <p><strong>📍</strong> {nino.direccion || 'Sin dirección'}</p>
            <p><strong>📞</strong> {nino.telefono_contacto || 'Sin teléfono'}</p>
            <div className="card-actions">
              <button
                className="btn btn-primary btn-small"
                onClick={() => handleEdit(nino)}
              >
                ✏️ Editar
              </button>
              <button
                className="btn btn-danger btn-small"
                onClick={() => handleDelete(nino.id)}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
      {ninos.length === 0 && (
        <div className="empty-state">
          <p>No hay niños registrados</p>
        </div>
      )}
    </div>
  );
};

export default Ninos;