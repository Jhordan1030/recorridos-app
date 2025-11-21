import React, { useEffect, useState, useMemo } from 'react';
import { useAlert } from '../context/AlertContext';
import { getRecorridos, getNinos, getVehiculos, createRecorrido, updateRecorrido } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

const Dashboard = () => {
  const { showAlert } = useAlert();

  // --- ESTADOS ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [recorridoId, setRecorridoId] = useState(null);
  const [ninos, setNinos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [ninosSeleccionados, setNinosSeleccionados] = useState([]);
  const [loadingForm, setLoadingForm] = useState(false);
  const [recorridosMensuales, setRecorridosMensuales] = useState({});
  const [loading, setLoading] = useState(true);
  const [mesActual, setMesActual] = useState(new Date().getMonth() + 1);
  const [añoActual, setAñoActual] = useState(new Date().getFullYear());

  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Función para obtener la fecha actual en formato YYYY-MM-DD
  const obtenerFechaActual = () => {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  };

  // Función para obtener la hora actual en formato HH:MM
  const obtenerHoraActual = () => {
    const ahora = new Date();
    const horas = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    return `${horas}:${minutos}`;
  };

  // Estado inicial del formulario
  const [formData, setFormData] = useState({
    fecha: obtenerFechaActual(),
    hora_inicio: obtenerHoraActual(),
    vehiculo_id: '',
    tipo_recorrido: 'traer',
    notas: '',
  });

  // FUNCIONES DEL DASHBOARD
  const formatearHora = (hora) => {
    if (!hora) return '—';
    try {
      if (hora.includes('T')) {
        const fecha = new Date(hora);
        return fecha.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false });
      }
      const partes = hora.split(':');
      if (partes.length >= 2) {
        return `${partes[0].padStart(2, '0')}:${partes[1].padStart(2, '0')}`;
      }
      return hora;
    } catch {
      return hora;
    }
  };

  const procesarRecorridos = (data) => {
    const recorridosAgrupados = {};

    if (Array.isArray(data)) {
      data.forEach(recorrido => {
        if (!recorrido?.fecha) return;

        const [anioStr, mesStr, diaStr] = recorrido.fecha.split('-');
        const anioRecorrido = parseInt(anioStr);
        const mesRecorrido = parseInt(mesStr);
        const dia = parseInt(diaStr);

        if (mesRecorrido === mesActual && anioRecorrido === añoActual) {
          if (!recorridosAgrupados[dia]) {
            recorridosAgrupados[dia] = [];
          }
          recorridosAgrupados[dia].push(recorrido);
        }
      });
    }

    const recorridosLimpios = {};
    Object.keys(recorridosAgrupados)
      .map(k => parseInt(k))
      .filter(k => !isNaN(k) && k > 0 && k <= 31)
      .sort((a, b) => a - b)
      .forEach(k => {
        recorridosLimpios[k] = recorridosAgrupados[k];
        recorridosLimpios[k].sort((a, b) => {
          const horaA = a.hora_inicio || '00:00';
          const horaB = b.hora_inicio || '00:00';
          return horaA.localeCompare(horaB);
        });
      });

    setRecorridosMensuales(recorridosLimpios);
    setLoading(false);
  };

  const loadRecorridosData = async () => {
    setLoading(true);
    try {
      const response = await getRecorridos();
      let data = [];

      if (response?.data) {
        if (response.data.success && response.data.data) {
          data = response.data.data;
        } else if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data.recorridos) {
          data = response.data.recorridos;
        } else {
          Object.keys(response.data).forEach(key => {
            if (Array.isArray(response.data[key])) {
              data = response.data[key];
            }
          });
        }
      }

      procesarRecorridos(data || []);

    } catch (error) {
      showAlert('error', 'Error de conexión al cargar recorridos');
      setRecorridosMensuales({});
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecorridosData();
    // eslint-disable-next-line
  }, [mesActual, añoActual]);

  const { diasConRecorridos, totalRecorridosMes, costoTotalMes } = useMemo(() => {
    const allRecorridos = Object.values(recorridosMensuales).flat();
    const totalRec = allRecorridos.length;
    const diasConRec = Object.keys(recorridosMensuales).length;
    const costoTotal = allRecorridos.reduce((acc, recorrido) => acc + (parseFloat(recorrido.costo || '0') || 0), 0);
    return { totalRecorridosMes: totalRec, diasConRecorridos: diasConRec, costoTotalMes: costoTotal };
  }, [recorridosMensuales]);

  const generarCalendario = () => {
    const primerDia = new Date(añoActual, mesActual - 1, 1).getDay();
    const diasEnElMes = new Date(añoActual, mesActual, 0).getDate();
    const matriz = [];
    let dia = 1;

    const offset = primerDia === 0 ? 6 : primerDia - 1;
    let fila = Array(offset).fill(null);

    while (dia <= diasEnElMes) {
      if (fila.length === 7) {
        matriz.push(fila);
        fila = [];
      }

      const tieneRecorridos = Array.isArray(recorridosMensuales[dia]) && recorridosMensuales[dia].length > 0;
      const hoy = new Date();
      const esHoy = dia === hoy.getDate() &&
        mesActual === (hoy.getMonth() + 1) &&
        añoActual === hoy.getFullYear();

      fila.push({
        numero: dia,
        tieneRecorridos,
        esHoy
      });
      dia++;
    }

    while (fila.length < 7) fila.push(null);
    if (fila.length > 0) matriz.push(fila);

    return matriz;
  };

  const cambiarMes = (delta) => {
    let nuevoMes = mesActual + delta;
    let nuevoAño = añoActual;
    if (nuevoMes > 12) { nuevoMes = 1; nuevoAño++; }
    else if (nuevoMes < 1) { nuevoMes = 12; nuevoAño--; }
    setMesActual(nuevoMes);
    setAñoActual(nuevoAño);
  };

  const matrizCalendario = useMemo(() => generarCalendario(), [mesActual, añoActual, recorridosMensuales]);

  // FUNCIONES DEL FORMULARIO
  const loadNinos = async () => {
    try {
      const response = await getNinos();
      if (response.data.success) {
        setNinos(response.data.data);
      }
    } catch (error) {
      showAlert('error', 'Error al cargar niños');
    }
  };

  const loadVehiculos = async () => {
    try {
      const response = await getVehiculos();
      if (response.data.success) {
        setVehiculos(response.data.data);
      }
    } catch (error) {
      showAlert('error', 'Error al cargar vehículos');
    }
  };

  // Reset form actualizado
  const resetForm = () => {
    setFormData({
      fecha: obtenerFechaActual(),
      hora_inicio: obtenerHoraActual(),
      vehiculo_id: '',
      tipo_recorrido: 'traer',
      notas: '',
    });
    setNinosSeleccionados([]);
    setEditando(false);
    setRecorridoId(null);
  };

  const handleOpenModal = async () => {
    setLoadingForm(true);
    setIsModalOpen(true);
    try {
      await Promise.all([loadNinos(), loadVehiculos()]);
    } catch (error) {
      showAlert('error', 'Error al cargar datos del formulario');
    } finally {
      setLoadingForm(false);
    }
  };

  const handleCloseModal = (shouldReload = false) => {
    setIsModalOpen(false);
    resetForm();
    if (shouldReload) {
      loadRecorridosData();
    }
  };

  // Handle edit mejorado
  const handleEdit = (recorrido) => {
    setEditando(true);
    setRecorridoId(recorrido.id);

    // Para edición, usar la fecha del recorrido existente
    const fechaRecorrido = recorrido.fecha.split('T')[0];
    const horaRecorrido = recorrido.hora_inicio?.slice(0, 5) || obtenerHoraActual();

    setFormData({
      fecha: fechaRecorrido,
      hora_inicio: horaRecorrido,
      vehiculo_id: recorrido.vehiculo_id || '',
      tipo_recorrido: recorrido.tipo_recorrido || 'traer',
      notas: recorrido.notas || '',
    });

    if (recorrido.ninos && recorrido.ninos.length > 0) {
      setNinosSeleccionados(
        recorrido.ninos.map((nino) => ({
          nino_id: nino.nino_id || nino.id,
          nombre: nino.nombre,
          apellidos: nino.apellidos,
          notas: nino.notas || '',
        }))
      );
    } else {
      setNinosSeleccionados([]);
    }
    handleOpenModal();
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
    const nino = ninos.find((n) => n.id.toString() === ninoId.toString());
    if (!nino) return;
    const yaExiste = ninosSeleccionados.find((n) => n.nino_id.toString() === ninoId.toString());
    if (yaExiste) {
      showAlert('error', 'Este niño ya está agregado');
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
      showAlert('error', 'Fecha, hora de inicio y vehículo son requeridos');
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

      let response;
      if (editando) {
        response = await updateRecorrido(recorridoId, data);
        if (response.data.success) {
          showAlert('success', 'Recorrido actualizado exitosamente');
          handleCloseModal(true);
        }
      } else {
        response = await createRecorrido(data);
        if (response.data.success) {
          showAlert('success', 'Recorrido creado exitosamente');
          handleCloseModal(true);
        }
      }
    } catch (error) {
      showAlert('error', 'Error al guardar recorrido');
    }
  };

  // --- FUNCIÓN EXPORTAR PDF ---
  const exportarPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setTextColor(55, 65, 81);
      doc.text('Reporte de Recorridos', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

      doc.setFontSize(14);
      doc.setTextColor(107, 114, 128);
      doc.text(`${nombresMeses[mesActual - 1]} ${añoActual}`, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });

      const datosTabla = [];
      let totalCosto = 0;

      Object.keys(recorridosMensuales)
        .filter(dia => !isNaN(parseInt(dia)))
        .sort((a, b) => parseInt(a) - parseInt(b))
        .forEach(dia => {
          recorridosMensuales[dia].forEach((recorrido, idx) => {
            const costoNum = parseFloat(recorrido.costo || '0') || 0;
            totalCosto += costoNum;

            datosTabla.push([
              idx === 0 ? `${dia} ${nombresMeses[mesActual - 1]}` : '',
              formatearHora(recorrido.hora_inicio),
              recorrido.vehiculo_descripcion || 'Sin Vehículo',
              `$${costoNum.toFixed(2)}`
            ]);
          });
        });

      datosTabla.push([
        { content: 'TOTAL', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', fillColor: [229, 231, 235] } },
        { content: `$${totalCosto.toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold', fillColor: [229, 231, 235] } }
      ]);

      autoTable(doc, {
        startY: 50,
        head: [['Fecha', 'Hora', 'Vehículo', 'Costo']],
        body: datosTabla,
        theme: 'striped',
        headStyles: {
          fillColor: [99, 102, 241],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        }
      });

      doc.save(`Recorridos_${nombresMeses[mesActual - 1]}_${añoActual}.pdf`);
      showAlert('success', 'PDF generado exitosamente');
    } catch (error) {
      showAlert('error', 'Error al generar el PDF');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 py-4 px-3 sm:px-4 lg:px-6 xl:px-8 transition-colors duration-300">
      <Alert />
      
      {/* Header Principal Simplificado */}
      <div className="mb-8 pt-4 max-w-7xl mx-auto">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard de Recorridos
          </h1>
          <p className="text-gray-600 dark:text-slate-400 text-sm sm:text-base lg:text-lg">
            Gestión y seguimiento de transportes escolares
          </p>
        </div>
      </div>

      {/* Controles del Calendario - CORREGIDO */}
      <Card className="mb-6 shadow-sm border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 sm:p-6">
          
          {/* Navegación del Mes */}
          <div className="flex items-center justify-center w-full lg:w-auto order-2 lg:order-1">
            <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
              
              {/* Botón Anterior */}
              <button
                onClick={() => cambiarMes(-1)}
                className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-200 transition-colors border-r border-gray-200 dark:border-slate-700 flex items-center focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                title="Mes anterior"
              >
                <span className="hidden xs:inline text-sm font-medium mr-1">Anterior</span>
                <span className="text-xl font-bold leading-none">‹</span>
              </button>

              {/* Texto del Mes */}
              <div className="px-6 py-2 min-w-[160px] text-center bg-white dark:bg-slate-800">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  {nombresMeses[mesActual - 1]}
                </h3>
                <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                  {añoActual}
                </span>
              </div>

              {/* Botón Siguiente */}
              <button
                onClick={() => cambiarMes(1)}
                className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-200 transition-colors border-l border-gray-200 dark:border-slate-700 flex items-center focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                title="Mes siguiente"
              >
                <span className="text-xl font-bold leading-none">›</span>
                <span className="hidden xs:inline text-sm font-medium ml-1">Siguiente</span>
              </button>

            </div>
          </div>

          {/* Botones de Acción */}
          <div className='flex flex-col xs:flex-row gap-3 w-full lg:w-auto justify-center lg:justify-end order-1 lg:order-2'>
            <Button
              variant="primary"
              onClick={handleOpenModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg hover:bg-blue-600 transition-colors shadow-md bg-blue-500 text-white font-medium text-sm sm:text-base w-full xs:w-auto"
            >
              <span>➕</span>
              <span className="whitespace-nowrap">Nuevo Recorrido</span>
            </Button>

            <Button
              variant="secondary"
              onClick={exportarPDF}
              disabled={loading || totalRecorridosMes === 0}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors shadow-sm bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base w-full xs:w-auto"
            >
              <span>📄</span>
              <span className="whitespace-nowrap">Exportar PDF</span>
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="flex justify-center items-center h-48 sm:h-64 shadow-sm border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-base sm:text-lg text-gray-600 dark:text-slate-400 font-medium">Cargando datos...</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Resumen del Mes - Grid Responsivo */}
          <Card className="mb-6 shadow-sm border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <span className="text-lg font-bold text-gray-700 dark:text-slate-200">Resumen:</span>
                  <div className="bg-gray-900 dark:bg-black/40 px-5 py-3 rounded-xl shadow-sm w-full sm:w-auto border border-gray-800 dark:border-slate-700 flex items-center gap-3">
                    <span className="text-2xl sm:text-3xl font-bold text-white">
                      ${costoTotalMes.toFixed(2)}
                    </span>
                    <span className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Costo Total</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3">
                  <div className="bg-blue-500 dark:bg-blue-600/90 px-4 py-3 rounded-lg shadow-sm text-center flex-1">
                    <div className="text-xl sm:text-2xl font-bold text-white">{diasConRecorridos}</div>
                    <div className="text-blue-100 text-xs font-medium uppercase">Días Activos</div>
                  </div>
                  <div className="bg-green-500 dark:bg-green-600/90 px-4 py-3 rounded-lg shadow-sm text-center flex-1">
                    <div className="text-xl sm:text-2xl font-bold text-white">{totalRecorridosMes}</div>
                    <div className="text-green-100 text-xs font-medium uppercase">Viajes</div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-slate-800 pt-4">
                <div className="flex flex-wrap gap-4 text-xs sm:text-sm font-medium text-gray-600 dark:text-slate-400">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span>Con Recorrido</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-white dark:bg-slate-800 border-2 border-blue-500 mr-2"></div>
                    <span>Hoy</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Calendario */}
          <Card className="mb-6 p-0 overflow-hidden shadow-sm border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
            <div className="grid grid-cols-7 text-center font-semibold text-xs sm:text-sm text-white bg-gray-800 dark:bg-slate-950 border-b border-gray-700 dark:border-slate-800">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia, index) => (
                <span key={index} className="py-3 border-r border-gray-700/50 last:border-r-0">
                  {dia}
                </span>
              ))}
            </div>

            <div className="bg-white dark:bg-slate-900">
              {matrizCalendario.map((semana, idx) => (
                <div key={idx} className="grid grid-cols-7 border-b border-gray-200 dark:border-slate-800 last:border-b-0">
                  {semana.map((dia, dIdx) => {
                    let dayClasses = "relative p-1 sm:p-2 h-14 sm:h-20 lg:h-24 border-r border-gray-200 dark:border-slate-800 last:border-r-0 flex flex-col items-center sm:items-end justify-start transition-all duration-200";

                    if (!dia) {
                      dayClasses += " bg-gray-50 dark:bg-slate-950/50 pointer-events-none";
                    } else {
                      dayClasses += " hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer";
                      
                      if (dia.tieneRecorridos) {
                        dayClasses += " bg-green-50 dark:bg-green-900/10";
                      } else if (dia.esHoy) {
                        dayClasses += " bg-blue-50 dark:bg-blue-900/10";
                      } else {
                        dayClasses += " bg-white dark:bg-slate-900";
                      }
                    }

                    return (
                      <div key={dIdx} className={dayClasses}>
                        {dia && (
                          <>
                            <span className={`
                              flex items-center justify-center rounded-full text-xs sm:text-sm font-medium mb-1
                              w-6 h-6 sm:w-7 sm:h-7
                              ${dia.esHoy 
                                ? 'bg-blue-500 text-white ring-2 ring-blue-200 dark:ring-blue-900' 
                                : dia.tieneRecorridos 
                                  ? 'text-green-700 dark:text-green-400 font-bold' 
                                  : 'text-gray-700 dark:text-slate-400'}
                            `}>
                              {dia.numero}
                            </span>
                            
                            {/* Indicadores de Recorridos (Puntos) */}
                            {dia.tieneRecorridos && (
                              <div className="flex gap-1 mt-auto sm:mb-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                {recorridosMensuales[dia.numero]?.length > 1 && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500/50"></div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>

          {/* Lista Detallada de Recorridos */}
          <Card className="shadow-sm border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
            <div className="border-b border-gray-200 dark:border-slate-800 p-4 sm:p-6">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                Detalle de Actividad
              </h4>
            </div>

            {Object.keys(recorridosMensuales).length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-5xl mb-4 opacity-50">📅</div>
                <p className="text-gray-500 dark:text-slate-400 text-lg">No hay recorridos registrados este mes.</p>
                <Button
                  variant="primary"
                  onClick={handleOpenModal}
                  className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Crear el primero
                </Button>
              </div>
            ) : (
              <div className="p-4 sm:p-6 space-y-6">
                {Object.keys(recorridosMensuales)
                  .filter(dia => !isNaN(parseInt(dia)))
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map(dia => (
                    <div key={dia} className="relative pl-6 sm:pl-8 border-l-2 border-gray-200 dark:border-slate-700 pb-2 last:pb-0">
                      {/* Badge de Día */}
                      <div className="absolute -left-[11px] top-0 bg-blue-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm ring-4 ring-white dark:ring-slate-900">
                        {dia}
                      </div>

                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                           {dia} de {nombresMeses[mesActual-1]}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {recorridosMensuales[dia].map((recorrido, idx) => (
                          <div key={idx} className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                            <div className="flex flex-col sm:flex-row justify-between gap-3">
                              {/* Info Principal */}
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                <span className="bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 px-2 py-1 rounded border border-gray-200 dark:border-slate-600 text-sm font-mono">
                                  {formatearHora(recorrido.hora_inicio)}
                                </span>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {recorrido.vehiculo_descripcion || 'Vehículo no asignado'}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">
                                    {recorrido.tipo_recorrido} • {recorrido.ninos?.length || 0} niños
                                  </p>
                                </div>
                              </div>

                              {/* Costo y Acciones */}
                              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 border-t sm:border-t-0 border-gray-200 dark:border-slate-700 pt-2 sm:pt-0 mt-2 sm:mt-0">
                                <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                                  ${parseFloat(recorrido.costo || 0).toFixed(2)}
                                </span>
                                <button
                                  onClick={() => handleEdit(recorrido)}
                                  className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1.5 rounded transition-colors"
                                  title="Editar"
                                >
                                  ✏️
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Modal Formulario - AQUI ESTA LA CORRECCION DE ESTILO */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => handleCloseModal(false)}
        title={editando ? 'Editar Recorrido' : 'Crear Recorrido'}
        size="max-w-3xl"
      >
        {loadingForm ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <span className="text-gray-500 dark:text-slate-400">Cargando formulario...</span>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 transition-colors">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Grid de Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Fecha</label>
                  <Input
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    required
                    className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Hora</label>
                  <Input
                    type="time"
                    name="hora_inicio"
                    value={formData.hora_inicio}
                    onChange={handleChange}
                    required
                    className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Vehículo</label>
                  <select
                    name="vehiculo_id"
                    value={formData.vehiculo_id}
                    onChange={handleChange}
                    required
                    className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                  >
                    <option value="">-- Seleccionar --</option>
                    {vehiculos.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.descripcion} (${parseFloat(v.costo_por_recorrido || 0).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Tipo</label>
                  <select
                    name="tipo_recorrido"
                    value={formData.tipo_recorrido}
                    onChange={handleChange}
                    required
                    className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="traer">Traer (Recogida)</option>
                    <option value="llevar">Llevar (Retorno)</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Notas</label>
                  <Input
                    type="text"
                    name="notas"
                    value={formData.notas}
                    onChange={handleChange}
                    placeholder="Opcional: Notas sobre el viaje..."
                    className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Sección Niños */}
              <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-bold text-gray-800 dark:text-white">Niños Asignados</h4>
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full font-bold">
                    {ninosSeleccionados.length}
                  </span>
                </div>

                <div className="mb-4">
                  <select
                    onChange={agregarNino}
                    value=""
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">+ Agregar un niño al recorrido...</option>
                    {ninos
                      .filter(n => !ninosSeleccionados.some(ns => ns.nino_id.toString() === n.id.toString()))
                      .map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.nombre} {n.apellidos}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {ninosSeleccionados.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 dark:text-slate-500 italic py-4">
                      No se han seleccionado niños aún.
                    </p>
                  ) : (
                    ninosSeleccionados.map((nino, idx) => (
                      <div key={nino.nino_id} className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3">
                        <span className="text-sm font-medium text-gray-800 dark:text-slate-200">
                          {nino.nombre} {nino.apellidos}
                        </span>
                        <button
                          type="button"
                          onClick={() => eliminarNino(idx)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Botones Finales - ESTILOS CORREGIDOS */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleCloseModal(false)}
                  className="w-full sm:w-auto justify-center bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full sm:w-auto justify-center"
                >
                  {editando ? 'Guardar Cambios' : 'Crear Recorrido'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;