import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  getRecorridos,
  createRecorrido,
  deleteRecorrido,
  getNinos,
  getVehiculos,
} from '../services/api';

const Recorridos = () => {
  const { showAlert, recorridos, setRecorridos } = useApp();
  const [ninos, setNinos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [ninosSeleccionados, setNinosSeleccionados] = useState([]);
  
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '',
    hora_fin: '',
    vehiculo_id: '',
    tipo_recorrido: 'llevar',
    costo: '',
    notas: '',
  });

  useEffect(() => {
    loadRecorridos();
    loadNinos();
    loadVehiculos();
  }, []);

  const loadRecorridos = async () => {
    try {
      const response = await getRecorridos();
      if (response.data.success) {
        setRecorridos(response.data.data);
      }
    } catch (error) {
      showAlert('Error al cargar recorridos: ' + error.message, 'error');
    }
  };

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

  const agregarNino = (e) => {
    const ninoId = e.target.value;
    if (!ninoId) return;

    const nino = ninos.find((n) => n.id === ninoId);
    if (!nino) return;

    const yaExiste = ninosSeleccionados.find((n) => n.nino_id === ninoId);
    if (yaExiste) {
      showAlert('Este niño ya está agregado', 'error');
      return;
    }

    setNinosSeleccionados([
      ...ninosSeleccionados,
      {
        nino_id: ninoId,
        nombre: nino.nombre,
        apellidos: nino.apellidos,
        hora_recogida: '',
        notas: '',
      },
    ]);

    e.target.value = '';
  };

  const eliminarNino = (index) => {
    const nuevosNinos = ninosSeleccionados.filter((_, i) => i !== index);
    setNinosSeleccionados(nuevosNinos);
  };

  const actualizarHoraNino = (index, hora) => {
    const nuevosNinos = [...ninosSeleccionados];
    nuevosNinos[index].hora_recogida = hora;
    setNinosSeleccionados(nuevosNinos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fecha || !formData.hora_inicio || !formData.vehiculo_id) {
      showAlert('Fecha, hora de inicio y vehículo son requeridos', 'error');
      return;
    }

    try {
      const data = {
        fecha: formData.fecha,
        hora_inicio: formData.hora_inicio,
        hora_fin: formData.hora_fin || null,
        vehiculo_id: formData.vehiculo_id,
        tipo_recorrido: formData.tipo_recorrido,
        costo: formData.costo ? parseFloat(formData.costo) : null,
        notas: formData.notas || null,
        ninos: ninosSeleccionados,
      };

      const response = await createRecorrido(data);
      if (response.data.success) {
        showAlert('Recorrido creado exitosamente', 'success');
        setFormData({
          fecha: new Date().toISOString().split('T')[0],
          hora_inicio: '',
          hora_fin: '',
          vehiculo_id: '',
          tipo_recorrido: 'llevar',
          costo: '',
          notas: '',
        });
        setNinosSeleccionados([]);
        loadRecorridos();
      }
    } catch (error) {
      showAlert('Error al crear recorrido: ' + error.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este recorrido?')) return;

    try {
      const response = await deleteRecorrido(id);
      if (response.data.success) {
        showAlert('Recorrido eliminado exitosamente', 'success');
        loadRecorridos();
      }
    } catch (error) {
      showAlert('Error al eliminar: ' + error.message, 'error');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>📍 Gestión de Recorridos</h2>
      </div>

      <div className="form-card">
        <h3>Crear Nuevo Recorrido</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="input-group">
              <label>Fecha *</label>
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Hora de Inicio *</label>
              <input
                type="time"
                name="hora_inicio"
                value={formData.hora_inicio}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Hora de Fin</label>
              <input
                type="time"
                name="hora_fin"
                value={formData.hora_fin}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label>Vehículo *</label>
              <select
                name="vehiculo_id"
                value={formData.vehiculo_id}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar...</option>
                {vehiculos.map((vehiculo) => (
                  <option key={vehiculo.id} value={vehiculo.id}>
                    {vehiculo.descripcion} - ${vehiculo.costo_por_recorrido}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Tipo de Recorrido *</label>
              <select
                name="tipo_recorrido"
                value={formData.tipo_recorrido}
                onChange={handleChange}
                required
              >
                <option value="llevar">Llevar</option>
                <option value="traer">Traer</option>
                <option value="ambos">Ambos</option>
              </select>
            </div>

            <div className="input-group">
              <label>Costo ($) - Opcional</label>
              <input
                type="number"
                step="0.01"
                name="costo"
                value={formData.costo}
                onChange={handleChange}
                placeholder="Se calcula automáticamente"
              />
            </div>

            <div className="input-group full-width">
              <label>Notas</label>
              <input
                type="text"
                name="notas"
                value={formData.notas}
                onChange={handleChange}
                placeholder="Observaciones del recorrido"
              />
            </div>
          </div>

          <div className="ninos-section">
            <h4>Niños en el Recorrido</h4>
            <div className="input-group">
              <label>Agregar Niño</label>
              <select onChange={agregarNino}>
                <option value="">Seleccionar...</option>
                {ninos.map((nino) => (
                  <option key={nino.id} value={nino.id}>
                    {nino.nombre} {nino.apellidos}
                  </option>
                ))}
              </select>
            </div>

            <div className="ninos-list">
              {ninosSeleccionados.length === 0 ? (
                <p className="empty-message">No hay niños agregados</p>
              ) : (
                ninosSeleccionados.map((nino, index) => (
                  <div key={index} className="nino-item">
                    <span className="nino-name">
                      {nino.nombre} {nino.apellidos}
                    </span>
                    <input
                      type="time"
                      value={nino.hora_recogida}
                      onChange={(e) => actualizarHoraNino(index, e.target.value)}
                      placeholder="Hora"
                    />
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => eliminarNino(index)}
                    >
                      ✖
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              ✅ Crear Recorrido
            </button>
            <button type="button" className="btn btn-secondary" onClick={loadRecorridos}>
              🔄 Actualizar Lista
            </button>
          </div>
        </form>
      </div>

      <div className="cards-grid">
        {recorridos.map((recorrido) => (
          <div key={recorrido.id} className="card recorrido-card">
            <h4>
              📅 {recorrido.fecha} - {recorrido.hora_inicio}
            </h4>
            <p>
              <strong>🚗</strong> {recorrido.vehiculo_descripcion || 'Sin vehículo'}
            </p>
            <p>
              <strong>Tipo:</strong> {recorrido.tipo_recorrido}
            </p>
            <p className="cost">
              <strong>💰 Costo:</strong> ${recorrido.costo || '0.00'}
            </p>
            {recorrido.ninos && recorrido.ninos.length > 0 && (
              <div className="ninos-info">
                <strong>👦 Niños:</strong>
                {recorrido.ninos.map((nino, idx) => (
                  <div key={idx} className="nino-detail">
                    • {nino.nombre} {nino.apellidos}
                    {nino.hora_recogida && ` (${nino.hora_recogida})`}
                  </div>
                ))}
              </div>
            )}
            {recorrido.notas && (
              <p>
                <strong>📝</strong> {recorrido.notas}
              </p>
            )}
            <div className="card-actions">
              <button
                className="btn btn-danger btn-small"
                onClick={() => handleDelete(recorrido.id)}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {recorridos.length === 0 && (
        <div className="empty-state">
          <p>No hay recorridos registrados</p>
        </div>
      )}
    </div>
  );
};

export default Recorridos;