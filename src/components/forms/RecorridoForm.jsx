import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext'; // ✅ CORREGIDO - agrega ../ extra
import {
  createRecorrido,
  updateRecorrido,
  getNinos,
  getVehiculos,
} from '../../services/api'; // También verifica esta línea

const RecorridoForm = ({ recorridoParaEditar, onSuccess, onCancel }) => {
  const { showAlert } = useApp();
  const [ninos, setNinos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [ninosSeleccionados, setNinosSeleccionados] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const editando = !!recorridoParaEditar;

  // Estado inicial con valores por defecto
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  const estadoInicialFormulario = {
    fecha: `${year}-${month}-${day}`,
    hora_inicio: `${hours}:${minutes}`,
    vehiculo_id: '',
    tipo_recorrido: 'llevar',
    notas: '',
  };
  
  const [formData, setFormData] = useState(estadoInicialFormulario);

  const inputClass = "p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full transition-all duration-200 shadow-sm bg-white text-gray-900 placeholder-gray-500";

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingData(true);
        await Promise.all([loadNinos(), loadVehiculos()]);
      } catch (error) {
        console.error('Error cargando datos:', error);
        showAlert('Error al cargar datos necesarios', 'error');
      } finally {
        setLoadingData(false);
      }
    };

    cargarDatos();
  }, []);

  // Actualizar formulario cuando cambia recorridoParaEditar
  useEffect(() => {
    if (recorridoParaEditar) {
      console.log('Editando recorrido:', recorridoParaEditar); // Para debug
      setFormData({
        fecha: recorridoParaEditar.fecha?.split('T')[0] || estadoInicialFormulario.fecha,
        hora_inicio: recorridoParaEditar.hora_inicio?.slice(0, 5) || estadoInicialFormulario.hora_inicio,
        vehiculo_id: recorridoParaEditar.vehiculo_id?.toString() || '',
        tipo_recorrido: recorridoParaEditar.tipo_recorrido || 'llevar',
        notas: recorridoParaEditar.notas || '',
      });

      if (recorridoParaEditar.ninos && recorridoParaEditar.ninos.length > 0) {
        setNinosSeleccionados(
          recorridoParaEditar.ninos.map((nino) => ({
            nino_id: nino.nino_id?.toString() || nino.id?.toString(),
            nombre: nino.nombre,
            apellidos: nino.apellidos,
            notas: nino.notas || '',
          }))
        );
      } else {
        setNinosSeleccionados([]);
      }
    } else {
      // Modo creación - resetear a valores por defecto
      setFormData(estadoInicialFormulario);
      setNinosSeleccionados([]);
    }
  }, [recorridoParaEditar]);

  const loadNinos = async () => {
    try {
      const response = await getNinos();
      if (response.data.success) {
        setNinos(response.data.data);
      }
    } catch (error) {
      showAlert('Error al cargar niños: ' + error.message, 'error');
      throw error;
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
      throw error;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
    
    const yaExiste = ninosSeleccionados.find((n) => 
      n.nino_id.toString() === ninoId.toString()
    );
    
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

    setSubmitting(true);
    try {
      const data = {
        fecha: formData.fecha,
        hora_inicio: formData.hora_inicio + ':00', // Añadir segundos si la API lo requiere
        vehiculo_id: formData.vehiculo_id,
        tipo_recorrido: formData.tipo_recorrido,
        notas: formData.notas || null,
        ninos: ninosSeleccionados,
      };

      let response;
      if (editando) {
        response = await updateRecorrido(recorridoParaEditar.id, data);
      } else {
        response = await createRecorrido(data);
      }

      if (response.data.success) {
        showAlert(
          `Recorrido ${editando ? 'actualizado' : 'creado'} exitosamente`, 
          'success'
        );
        onSuccess(true);
      }
    } catch (error) {
      console.error('Error guardando recorrido:', error);
      showAlert(
        `Error al ${editando ? 'actualizar' : 'crear'} recorrido: ` + 
        (error.response?.data?.message || error.message), 
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Renderizado
  if (loadingData) {
    return (
      <div className="min-h-52 flex items-center justify-center bg-white p-6 rounded-xl">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 font-medium">Cargando datos necesarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl max-w-2xl mx-auto w-full">
      <h3 className="text-xl sm:text-2xl font-bold text-indigo-700 mb-6 border-b pb-3">
        {editando ? '✏️ Editar Recorrido' : '➕ Crear Nuevo Recorrido'}
      </h3>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Fecha */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <span className="mr-2">📅</span>
              Fecha *
            </label>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              required
              className={inputClass}
              disabled={submitting}
            />
          </div>

          {/* Hora */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <span className="mr-2">⏰</span>
              Hora *
            </label>
            <input
              type="time"
              name="hora_inicio"
              value={formData.hora_inicio}
              onChange={handleChange}
              required
              className={inputClass}
              disabled={submitting}
            />
          </div>

          {/* Vehículo */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <span className="mr-2">🚗</span>
              Vehículo *
            </label>
            <select
              name="vehiculo_id"
              value={formData.vehiculo_id}
              onChange={handleChange}
              required
              className={inputClass}
              disabled={submitting}
            >
              <option value="">Seleccionar vehículo...</option>
              {vehiculos.map((vehiculo) => (
                <option key={vehiculo.id} value={vehiculo.id}>
                  {vehiculo.descripcion} - ${parseFloat(vehiculo.costo_por_recorrido || 0).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Recorrido */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <span className="mr-2">🔄</span>
              Tipo de Recorrido *
            </label>
            <select
              name="tipo_recorrido"
              value={formData.tipo_recorrido}
              onChange={handleChange}
              required
              className={inputClass}
              disabled={submitting}
            >
              <option value="llevar">Llevar</option>
              <option value="traer">Traer</option>
              <option value="ambos">Ambos</option>
            </select>
          </div>

          {/* Notas Generales */}
          <div className="flex flex-col space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <span className="mr-2">📝</span>
              Notas Generales del Recorrido
            </label>
            <input
              type="text"
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              placeholder="Observaciones del recorrido..."
              className={inputClass}
              disabled={submitting}
            />
          </div>
        </div>

        {/* Sección de Niños */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">👦</span>
            Niños en el Recorrido ({ninosSeleccionados.length})
          </h4>
          
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Agregar Niño
            </label>
            <select 
              onChange={agregarNino} 
              value="" 
              className={inputClass}
              disabled={submitting}
            >
              <option value="">Seleccionar niño...</option>
              {ninos
                .filter(nino => !ninosSeleccionados.some(ns => 
                  ns.nino_id.toString() === nino.id.toString()
                ))
                .map((nino) => (
                  <option key={nino.id} value={nino.id}>
                    {nino.nombre} {nino.apellidos}
                  </option>
                ))}
            </select>
          </div>

          {/* Lista de niños */}
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {ninosSeleccionados.length === 0 ? (
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 italic">No hay niños agregados al recorrido</p>
              </div>
            ) : (
              ninosSeleccionados.map((nino, index) => (
                <div key={nino.nino_id} className="flex flex-col sm:flex-row items-start sm:items-center border border-indigo-200 p-3 rounded-lg bg-indigo-50 shadow-sm">
                  <div className="flex justify-between items-center w-full sm:w-auto sm:flex-grow sm:pr-4 mb-2 sm:mb-0">
                    <span className="font-semibold text-indigo-800 flex-grow">
                      {nino.nombre} {nino.apellidos}
                    </span>
                    <button
                      type="button"
                      onClick={() => eliminarNino(index)}
                      className="text-red-500 hover:text-red-700 p-1 text-xl transition-colors ml-4 sm:ml-0 flex-shrink-0"
                      title="Eliminar niño del recorrido"
                      disabled={submitting}
                    >
                      ✖
                    </button>
                  </div>
                  
                  
                </div>
              ))
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            onClick={() => onCancel(false)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg shadow-sm transition-colors duration-200 w-full sm:w-auto disabled:opacity-50"
            disabled={submitting}
          >
            ❌ Cancelar
          </button>
          <button 
            type="submit" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 w-full sm:w-auto disabled:opacity-50 flex items-center justify-center"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {editando ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              editando ? '💾 Actualizar Recorrido' : '✅ Crear Recorrido'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecorridoForm;