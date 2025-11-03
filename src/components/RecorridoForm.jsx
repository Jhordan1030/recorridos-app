// src/components/RecorridoForm.jsx

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  createRecorrido,
  updateRecorrido,
  getNinos,
  getVehiculos,
} from '../services/api';

/**
 * Componente de formulario para Crear o Editar un Recorrido.
 * * @param {object} props
 * @param {object | null} props.recorridoParaEditar - El objeto de recorrido si es para editar, o null para crear.
 * @param {function} props.onSuccess - Función que se llama al guardar exitosamente.
 * @param {function} props.onCancel - Función para cerrar el formulario/modal sin guardar.
 */
const RecorridoForm = ({ recorridoParaEditar, onSuccess, onCancel }) => {
  const { showAlert } = useApp();
  const [ninos, setNinos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [ninosSeleccionados, setNinosSeleccionados] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const editando = !!recorridoParaEditar;
  
  const estadoInicialFormulario = {
    fecha: new Date().toISOString().split('T')[0],
    hora_inicio: new Date().toTimeString().slice(0, 5),
    vehiculo_id: '',
    tipo_recorrido: 'llevar',
    notas: '',
  };
  
  const [formData, setFormData] = useState(estadoInicialFormulario);

  // ------------------------------------
  // 1. Carga de datos iniciales
  // ------------------------------------

  useEffect(() => {
    // Carga niños y vehículos al montar el componente
    Promise.all([loadNinos(), loadVehiculos()])
      .then(() => setLoadingData(false))
      .catch(() => setLoadingData(false)); // Continuar aunque haya error

    // Pre-llenar si estamos editando
    if (recorridoParaEditar) {
      setFormData({
        fecha: recorridoParaEditar.fecha.split('T')[0],
        hora_inicio: recorridoParaEditar.hora_inicio,
        vehiculo_id: recorridoParaEditar.vehiculo_id || '',
        tipo_recorrido: recorridoParaEditar.tipo_recorrido,
        notas: recorridoParaEditar.notas || '',
      });
      // Mapear niños para el estado de niños seleccionados
      if (recorridoParaEditar.ninos && recorridoParaEditar.ninos.length > 0) {
        setNinosSeleccionados(
          recorridoParaEditar.ninos.map((nino) => ({
            // Se asume que la respuesta del servidor incluye nino_id, nombre y apellidos
            nino_id: nino.nino_id || nino.id, // A veces la API devuelve id
            nombre: nino.nombre,
            apellidos: nino.apellidos,
            notas: nino.notas || '',
          }))
        );
      } else {
           setNinosSeleccionados([]);
      }
    } else {
        // Asegurar que el formulario esté limpio si es para crear
        setFormData(estadoInicialFormulario);
        setNinosSeleccionados([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorridoParaEditar]);

  const loadNinos = async () => {
    try {
      const response = await getNinos();
      if (response.data?.success) {
        setNinos(response.data.data);
      }
    } catch (error) {
      showAlert('Error al cargar niños: ' + error.message, 'error');
    }
  };

  const loadVehiculos = async () => {
    try {
      const response = await getVehiculos();
      if (response.data?.success) {
        setVehiculos(response.data.data);
      }
    } catch (error) {
      showAlert('Error al cargar vehículos: ' + error.message, 'error');
    }
  };

  // ------------------------------------
  // 2. Handlers de formulario
  // ------------------------------------

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleNinoNotasChange = (index, value) => {
    const nuevosNinos = [...ninosSeleccionados];
    nuevosNinos[index].notas = value;
    setNinosSeleccionados(nuevosNinos);
  };


  const agregarNino = (e) => {
    const ninoId = e.target.value;
    if (!ninoId) return;
    
    const nino = ninos.find((n) => n.id.toString() === ninoId.toString());
    if (!nino) return;
    
    const yaExiste = ninosSeleccionados.some((n) => n.nino_id.toString() === ninoId.toString());
    if (yaExiste) {
      showAlert('Este niño ya está agregado', 'error');
      e.target.value = ''; // Limpiar el select
      return;
    }
    
    // Aseguramos que el ID del niño se guarde como nino_id
    setNinosSeleccionados([
      ...ninosSeleccionados,
      {
        nino_id: nino.id.toString(), 
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

  // ------------------------------------
  // 3. Envío del formulario
  // ------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fecha || !formData.hora_inicio || !formData.vehiculo_id) {
      showAlert('Fecha, hora de inicio y vehículo son requeridos', 'error');
      return;
    }
    
    // Se extraen solo los IDs de los niños y sus notas para el backend
    const ninosPayload = ninosSeleccionados.map(n => ({
        nino_id: n.nino_id,
        notas: n.notas || null,
    }));
    
    try {
      const data = {
        ...formData,
        notas: formData.notas || null,
        ninos: ninosPayload, // Usar el payload limpio
      };
      
      if (editando) {
          const recorridoId = recorridoParaEditar.id;
          const response = await updateRecorrido(recorridoId, data);
          if (response.data?.success) {
            showAlert('Recorrido actualizado exitosamente', 'success');
            onSuccess(true); // Indica éxito y pide recargar
          } else {
                showAlert(response.data?.message || 'Error al actualizar recorrido.', 'error');
          }
      } else {
          const response = await createRecorrido(data);
          if (response.data?.success) {
            showAlert('Recorrido creado exitosamente', 'success');
            onSuccess(true); // Indica éxito y pide recargar
          } else {
                showAlert(response.data?.message || 'Error al crear recorrido.', 'error');
          }
      }
    } catch (error) {
      showAlert('Error al guardar recorrido: ' + (error.message || 'Error de red'), 'error');
    }
  };
  
  // ------------------------------------
  // 4. Renderizado
  // ------------------------------------

  if (loadingData) {
    return (
        <div className="loading-container" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p>🔄 Cargando datos necesarios...</p>
        </div>
    );
  }

  return (
    <div className="form-card">
      <h3>{editando ? 'Editar Recorrido' : 'Crear Nuevo Recorrido'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
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
                  {vehiculo.descripcion} (${parseFloat(vehiculo.costo_por_recorrido || 0).toFixed(2)})
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
          <div className="input-group" style={{ gridColumn: 'span 2' }}>
            <label>Notas Generales del Recorrido</label>
            <input
              type="text"
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              placeholder="Observaciones del recorrido"
            />
          </div>
        </div>

        <div className="ninos-section" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
          <h4>👦 Niños en el Recorrido ({ninosSeleccionados.length})</h4>
          <div className="input-group" style={{ marginBottom: '15px' }}>
            <label>Agregar Niño</label>
            <select onChange={agregarNino} value="">
              <option value="">Seleccionar...</option>
              {ninos
                 .filter(nino => !ninosSeleccionados.some(ns => ns.nino_id.toString() === nino.id.toString()))
                 .map((nino) => (
                <option key={nino.id} value={nino.id}>
                  {nino.nombre} {nino.apellidos}
                </option>
              ))}
            </select>
          </div>
          
          <div className="ninos-list" style={{ display: 'grid', gap: '10px' }}>
            {ninosSeleccionados.length === 0 ? (
              <p className="empty-message" style={{ color: '#777', fontStyle: 'italic' }}>No hay niños agregados</p>
            ) : (
              ninosSeleccionados.map((nino, index) => (
                <div key={nino.nino_id} className="nino-item" style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', padding: '8px', borderRadius: '4px', background: '#f9f9f9' }}>
                  <span className="nino-name" style={{ flexGrow: 1, fontWeight: 'bold' }}>
                    {nino.nombre} {nino.apellidos}
                  </span>
                  
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => eliminarNino(index)}
                    style={{ background: 'transparent', border: 'none', color: 'red', fontSize: '1.2em', cursor: 'pointer' }}
                  >
                    ✖
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="form-actions" style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="submit" className="btn btn-primary">
            {editando ? '💾 Actualizar Recorrido' : '✅ Crear Recorrido'}
          </button>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => onCancel(false)}
          >
            ❌ Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecorridoForm;