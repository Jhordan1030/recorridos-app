import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getNinos, createNino, deleteNino, updateNino } from '../services/api';

const Ninos = () => {
  const { showAlert, ninos, setNinos } = useApp();
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    direccion: '',
    telefono_contacto: '',
  });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.apellidos) {
      showAlert('Nombre y apellidos son requeridos', 'error');
      return;
    }
    try {
      if (editMode) {
        // Actualizar niño existente
        const response = await updateNino(editId, formData);
        if (response.data.success) {
          showAlert('Niño actualizado exitosamente', 'success');
          setEditMode(false);
          setEditId(null);
          setFormData({
            nombre: '',
            apellidos: '',
            direccion: '',
            telefono_contacto: '',
          });
          loadNinos();
        }
      } else {
        // Crear nuevo niño
        const response = await createNino(formData);
        if (response.data.success) {
          showAlert('Niño creado exitosamente', 'success');
          setFormData({
            nombre: '',
            apellidos: '',
            direccion: '',
            telefono_contacto: '',
          });
          loadNinos();
        }
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

  const handleEdit = (nino) => {
    setEditMode(true);
    setEditId(nino.id);
    setFormData({
      nombre: nino.nombre,
      apellidos: nino.apellidos,
      direccion: nino.direccion || '',
      telefono_contacto: nino.telefono_contacto || '',
    });
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditId(null);
    setFormData({
      nombre: '',
      apellidos: '',
      direccion: '',
      telefono_contacto: '',
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>👦 Gestión de Niños</h2>
      </div>
      <div className="form-card">
        <h3>{editMode ? 'Editar Niño' : 'Agregar Nuevo Niño'}</h3>
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
              {editMode ? '✅ Actualizar Niño' : '➕ Agregar Niño'}
            </button>
            {editMode && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={cancelEdit}
              >
                ❌ Cancelar
              </button>
            )}
            {!editMode && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={loadNinos}
              >
                🔄 Actualizar Lista
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="cards-grid">
        {ninos.map((nino) => (
          <div key={nino.id} className="card">
            <h4>{nino.nombre} {nino.apellidos}</h4>
            <p><strong>📍</strong> {nino.direccion || 'Sin dirección'}</p>
            <p><strong>📞</strong> {nino.telefono_contacto || 'Sin teléfono'}</p>
            <div className="card-actions">
              <button
                className="btn btn-edit btn-small"
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
