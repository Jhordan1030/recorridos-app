import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  getRecorridos,
  createRecorrido,
  deleteRecorrido,
  updateRecorrido,
  getNinos,
  getVehiculos,
} from '../services/api';
// Importamos el nuevo componente Modal
import Modal from '../components/Modal'; 

const Recorridos = () => {
  const { showAlert, recorridos, setRecorridos } = useApp();
  const [ninos, setNinos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [ninosSeleccionados, setNinosSeleccionados] = useState([]);
  
  // Nuevo estado para controlar la visibilidad del modal
  const [mostrarModal, setMostrarModal] = useState(false); 
  
  const [editando, setEditando] = useState(false);
  const [recorridoId, setRecorridoId] = useState(null);
  
  // Estados para el filtro de mes/año
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear());
  
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora_inicio: new Date().toTimeString().slice(0, 5),
    vehiculo_id: '',
    tipo_recorrido: 'llevar',
    notas: '',
  });

  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

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

  // Función para filtrar recorridos por mes/año
  const recorridosFiltrados = recorridos.filter(recorrido => {
    if (!recorrido.fecha) return false;
    
    const fecha = new Date(recorrido.fecha);
    const mes = fecha.getMonth() + 1;
    const año = fecha.getFullYear();
    
    return mes === mesSeleccionado && año === añoSeleccionado;
  });

  // Calcular el total del mes
  const totalMes = recorridosFiltrados.reduce((total, recorrido) => {
    return total + (parseFloat(recorrido.costo) || 0);
  }, 0);

  const cambiarMes = (delta) => {
    let nuevoMes = mesSeleccionado + delta;
    let nuevoAño = añoSeleccionado;
    
    if (nuevoMes > 12) {
      nuevoMes = 1;
      nuevoAño += 1;
    } else if (nuevoMes < 1) {
      nuevoMes = 12;
      nuevoAño -= 1;
    }
    
    setMesSeleccionado(nuevoMes);
    setAñoSeleccionado(nuevoAño);
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
        notas: '',
      },
    ]);
    e.target.value = '';
  };

  const eliminarNino = (index) => {
    const nuevosNinos = ninosSeleccionados.filter((_, i) => i !== index);
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
        vehiculo_id: formData.vehiculo_id,
        tipo_recorrido: formData.tipo_recorrido,
        notas: formData.notas || null,
        ninos: ninosSeleccionados,
      };
      if (editando) {
        const response = await updateRecorrido(recorridoId, data);
        if (response.data.success) {
          showAlert('Recorrido actualizado exitosamente', 'success');
          resetForm();
          loadRecorridos();
          setMostrarModal(false); // Cierra el modal
        }
      } else {
        const response = await createRecorrido(data);
        if (response.data.success) {
          showAlert('Recorrido creado exitosamente', 'success');
          resetForm();
          loadRecorridos();
          setMostrarModal(false); // Cierra el modal
        }
      }
    } catch (error) {
      showAlert('Error al guardar recorrido: ' + error.message, 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      hora_inicio: new Date().toTimeString().slice(0, 5),
      vehiculo_id: '',
      tipo_recorrido: 'llevar',
      notas: '',
    });
    setNinosSeleccionados([]);
    setEditando(false);
    setRecorridoId(null);
  };
  
  // Función para abrir el modal y preparar la edición
  const handleEdit = (recorrido) => {
    setEditando(true);
    setRecorridoId(recorrido.id);
    setFormData({
      fecha: recorrido.fecha.split('T')[0],
      hora_inicio: recorrido.hora_inicio,
      vehiculo_id: recorrido.vehiculo_id,
      tipo_recorrido: recorrido.tipo_recorrido,
      notas: recorrido.notas || '',
    });
    if (recorrido.ninos && recorrido.ninos.length > 0) {
      setNinosSeleccionados(
        recorrido.ninos.map((nino) => ({
          nino_id: nino.nino_id,
          nombre: nino.nombre,
          apellidos: nino.apellidos,
          notas: nino.notas || '',
        }))
      );
    }
    setMostrarModal(true); // Abre el modal
  };

  // Función para abrir el modal para crear
  const handleOpenCreateModal = () => {
    resetForm();
    setMostrarModal(true);
  }

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

  // -------------------------------------------------------------------------
  // COMPONENTE DEL FORMULARIO (renderizado dentro del Modal)
  // -------------------------------------------------------------------------
  const RecorridoForm = (
    <div className="form-card">
      <h3>{editando ? 'Editar Recorrido' : 'Crear Nuevo Recorrido'}</h3>
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
            <label>Hora *</label>
            <input
              type="time"
              name="hora_inicio"
              value={formData.hora_inicio}
              onChange={handleChange}
              required
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
            {editando ? '💾 Actualizar Recorrido' : '✅ Crear Recorrido'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => {
              resetForm();
              setMostrarModal(false); // Cierra el modal
            }}>
            ❌ Cancelar
          </button>
        </div>
      </form>
    </div>
  );
  
  return (
    <div className="page">
      <div className="page-header">
        <h2>📍 Gestión de Recorridos</h2>
      </div>

      {/* Botón para abrir el Modal de Creación/Edición */}
      <div className="form-actions" style={{ marginBottom: '2rem' }}>
        <button 
          type="button" 
          className="btn btn-primary" 
          onClick={handleOpenCreateModal}
        >
          ➕ Nuevo Recorrido
        </button>
        <button type="button" className="btn btn-secondary" onClick={loadRecorridos}>
          🔄 Actualizar Lista
        </button>
      </div>

      {/* Modal */}
      {mostrarModal && (
        <Modal 
          title={editando ? 'Editar Recorrido Existente' : 'Registrar Nuevo Recorrido'} 
          onClose={() => {
            setMostrarModal(false);
            resetForm();
          }}
        >
          {RecorridoForm}
        </Modal>
      )}

      {/* Filtro por mes/año */}
      <div className="calendar-controls" style={{ marginTop: '2rem', marginBottom: '1rem' }}>
        <button onClick={() => cambiarMes(-1)} className="btn btn-secondary">{'< Mes Anterior'}</button>
        <h3>{nombresMeses[mesSeleccionado - 1]} {añoSeleccionado}</h3>
        <button onClick={() => cambiarMes(1)} className="btn btn-secondary">{'Siguiente Mes >'}</button>
      </div>

      {/* Resumen del mes */}
      <div className="dashboard-summary" style={{ marginBottom: '1rem' }}>
        <h4>Resumen del Mes:</h4>
        <p><strong>Total de recorridos:</strong> {recorridosFiltrados.length}</p>
        <p style={{ color: '#333' }}><strong>💰 Costo total:</strong> ${totalMes.toFixed(2)}</p>
      </div>

      <div className="cards-grid">
        {recorridosFiltrados.map((recorrido) => (
          <div key={recorrido.id} className="card recorrido-card">
            <h4>
              📅 {recorrido.fecha.split('T')[0]} - {recorrido.hora_inicio}
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
                    {nino.notas && ` (${nino.notas})`}
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
                className="btn btn-primary btn-small"
                onClick={() => handleEdit(recorrido)}
              >
                ✏️ Editar
              </button>
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
      
      {recorridosFiltrados.length === 0 && (
        <div className="empty-state">
          <p>No hay recorridos registrados para {nombresMeses[mesSeleccionado - 1]} {añoSeleccionado}</p>
        </div>
      )}
    </div>
  );
};

export default Recorridos;