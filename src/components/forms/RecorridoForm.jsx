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

  const inputClass = "px-4 py-3 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary-500/50 focus:border-white/20 block w-full transition-all duration-300 bg-white/5 text-white placeholder-white/20 outline-none backdrop-blur-sm";

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
      <div className="min-h-52 flex items-center justify-center bg-transparent p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent p-0 max-w-2xl mx-auto w-full">
      <h3 className="text-2xl font-black text-white mb-8 tracking-tighter">
        {editando ? 'Editar Recorrido' : 'Nuevo Recorrido'}
      </h3>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Fecha */}
          <div className="flex flex-col space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">
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
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">
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
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">
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
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">
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
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">
              Notas Generales
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
        <div className="mt-10 pt-8 border-t border-white/5">
          <h4 className="text-lg font-black text-white mb-6 uppercase tracking-widest">
            Estudiantes ({ninosSeleccionados.length})
          </h4>

          <div className="mb-4">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2 pl-1">
              Agregar Estudiante
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
              <div className="text-center py-8 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">No hay estudiantes agregados</p>
              </div>
            ) : (
              ninosSeleccionados.map((nino, index) => (
                <div key={nino.nino_id} className="flex flex-col sm:flex-row items-start sm:items-center border border-white/10 p-4 rounded-2xl bg-white/5 backdrop-blur-md">
                  <div className="flex justify-between items-center w-full sm:w-auto sm:flex-grow sm:pr-4 mb-2 sm:mb-0">
                    <span className="font-black text-white tracking-tight">
                      {nino.nombre} {nino.apellidos}
                    </span>
                    <button
                      type="button"
                      onClick={() => eliminarNino(index)}
                      className="text-white/20 hover:text-red-400 p-2 text-xl transition-all ml-4 sm:ml-0 flex-shrink-0"
                      title="Eliminar niño del recorrido"
                      disabled={submitting}
                    >
                      ✕
                    </button>
                  </div>


                </div>
              ))
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-10 pt-8 border-t border-white/5 flex flex-col-reverse sm:flex-row justify-end gap-4">
          <button
            type="button"
            onClick={() => onCancel(false)}
            className="bg-white/5 hover:bg-white/10 text-white/40 font-black uppercase tracking-[0.2em] py-4 px-8 rounded-2xl border border-white/10 transition-all active:scale-95 w-full sm:w-auto text-[10px]"
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-primary-500 hover:bg-primary-400 text-white font-black uppercase tracking-[0.2em] py-4 px-8 rounded-2xl shadow-2xl shadow-primary-500/20 transition-all active:scale-95 w-full sm:w-auto text-[10px] flex items-center justify-center"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></div>
                {editando ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              editando ? 'Actualizar Recorrido' : 'Crear Recorrido'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecorridoForm;