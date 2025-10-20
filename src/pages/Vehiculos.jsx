import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getVehiculos, createVehiculo, deleteVehiculo } from '../services/api';

const Vehiculos = () => {
  const { showAlert, vehiculos, setVehiculos } = useApp();
  const [formData, setFormData] = useState({
    tipo: 'propio',
    descripcion: '',
    placa: '',
    capacidad: '',
    costo_por_recorrido: '',
  });

  useEffect(() => {
    loadVehiculos();
  }, []);

  const loadVehiculos = async () => {
    try {
      const response = await getVehiculos();
      if (response.data.success) {
        setVehiculos(response.data.data);
      }
    } catch (error) {
      showAlert('Error al cargar vehículos: ' + error.message, 'error');
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

    if (!formData.descripcion) {
      showAlert('Descripción es requerida', 'error');
      return;
    }

    try {
      const data = {
        tipo: formData.tipo,
        descripcion: formData.descripcion,
        placa: formData.placa || null,
        capacidad: formData.capacidad ? parseInt(formData.capacidad) : null,
        costo_por_recorrido: formData.costo_por_recorrido ? parseFloat(formData.costo_por_recorrido) : 0,
      };

      const response = await createVehiculo(data);
      if (response.data.success) {
        showAlert('Vehículo creado exitosamente', 'success');
        setFormData({
          tipo: 'propio',
          descripcion: '',
          placa: '',
          capacidad: '',
          costo_por_recorrido: '',
        });
        loadVehiculos();
      }
    } catch (error) {
      showAlert('Error al crear vehículo: ' + error.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de desactivar este vehículo?')) return;

    try {
      const response = await deleteVehiculo(id);
      if (response.data.success) {
        showAlert('Vehículo desactivado exitosamente', 'success');
        loadVehiculos();
      }
    } catch (error) {
      showAlert('Error al eliminar: ' + error.message, 'error');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>🚗 Gestión de Vehículos</h2>
      </div>

      <div className="form-card">
        <h3>Agregar Nuevo Vehículo</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="input-group">
              <label>Tipo *</label>
              <select name="tipo" value={formData.tipo} onChange={handleChange} required>
                <option value="propio">Propio</option>
                <option value="empresa">Empresa</option>
                <option value="alquilado">Alquilado</option>
                <option value="taxi">Taxi</option>
              </select>
            </div>

            <div className="input-group">
              <label>Descripción *</label>
              <input
                type="text"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Ej: Toyota Corolla Blanco"
                required
              />
            </div>

            <div className="input-group">
              <label>Placa</label>
              <input
                type="text"
                name="placa"
                value={formData.placa}
                onChange={handleChange}
                placeholder="Ej: ABC-1234"
              />
            </div>

            <div className="input-group">
              <label>Capacidad</label>
              <input
                type="number"
                name="capacidad"
                value={formData.capacidad}
                onChange={handleChange}
                placeholder="Ej: 5"
              />
            </div>

            <div className="input-group">
              <label>Costo por Recorrido ($) *</label>
              <input
                type="number"
                step="0.01"
                name="costo_por_recorrido"
                value={formData.costo_por_recorrido}
                onChange={handleChange}
                placeholder="Ej: 3.00"
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              ➕ Agregar Vehículo
            </button>
            <button type="button" className="btn btn-secondary" onClick={loadVehiculos}>
              🔄 Actualizar Lista
            </button>
          </div>
        </form>
      </div>

      <div className="cards-grid">
        {vehiculos.map((vehiculo) => (
          <div key={vehiculo.id} className="card">
            <h4>{vehiculo.descripcion}</h4>
            <p><strong>Tipo:</strong> {vehiculo.tipo}</p>
            <p><strong>Placa:</strong> {vehiculo.placa || 'Sin placa'}</p>
            <p><strong>Capacidad:</strong> {vehiculo.capacidad || 'N/A'} personas</p>
            <p className="cost"><strong>💰 Costo:</strong> ${vehiculo.costo_por_recorrido || '0.00'}</p>
            <div className="card-actions">
              <button
                className="btn btn-danger btn-small"
                onClick={() => handleDelete(vehiculo.id)}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {vehiculos.length === 0 && (
        <div className="empty-state">
          <p>No hay vehículos registrados</p>
        </div>
      )}
    </div>
  );
};

export default Vehiculos;