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

  // ESTADOS
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

  const cambiarAMes = (mes, año) => {
    setMesActual(mes);
    setAñoActual(año);
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

      if (editando) {
        const response = await updateRecorrido(recorridoId, data);
        if (response.data.success) {
          showAlert('success', 'Recorrido actualizado exitosamente');
          handleCloseModal(true);
        }
      } else {
        const response = await createRecorrido(data);
        if (response.data.success) {
          showAlert('success', 'Recorrido creado exitosamente');
          handleCloseModal(true);
        }
      }
    } catch (error) {
      showAlert('error', 'Error al guardar recorrido');
    }
  };

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
    <div className="min-h-screen bg-gray-50 py-4 px-3 sm:px-4 lg:px-6 xl:px-8">
      <Alert />
      
      {/* Header Principal */}
      <div className="mb-6 pt-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 text-center sm:text-left mb-2">
            Dashboard de Recorridos
          </h1>
          <p className="text-gray-600 text-center sm:text-left text-sm sm:text-base lg:text-lg">
            Gestión y seguimiento de transportes escolares
          </p>
        </div>
      </div>

      {/* Controles del Calendario */}
      <Card className="mb-6 shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 sm:p-6">
          {/* Navegación del Mes */}
          <div className="flex items-center justify-center w-full lg:w-auto order-2 lg:order-1">
            <div className="flex flex-col sm:flex-row items-center bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 w-full sm:w-auto">
              <div className="flex w-full sm:w-auto mb-2 sm:mb-0">
                <Button
                  variant="secondary"
                  onClick={() => cambiarMes(-1)}
                  className="rounded-l-lg rounded-r-sm sm:rounded-r-none p-2 sm:p-3 hover:bg-gray-50 transition-colors flex-1 sm:flex-none border-r border-gray-200"
                >
                  <span className="hidden xs:inline text-sm">Anterior</span>
                  <span className="xs:hidden">‹</span>
                </Button>

                <div className="flex flex-col items-center mx-2 sm:mx-4 min-w-[120px] sm:min-w-[160px] flex-1">
                  <h3 className="text-base sm:text-xl font-bold text-gray-900 text-center">
                    {nombresMeses[mesActual - 1]} {añoActual}
                  </h3>
                </div>

                <Button
                  variant="secondary"
                  onClick={() => cambiarMes(1)}
                  className="rounded-r-lg rounded-l-sm sm:rounded-l-none p-2 sm:p-3 hover:bg-gray-50 transition-colors flex-1 sm:flex-none border-l border-gray-200"
                >
                  <span className="hidden xs:inline text-sm">Siguiente</span>
                  <span className="xs:hidden">›</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className='flex flex-col xs:flex-row gap-2 sm:gap-3 w-full lg:w-auto justify-center lg:justify-end order-1 lg:order-2'>
            <Button
              variant="primary"
              onClick={handleOpenModal}
              className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-blue-600 transition-colors shadow-sm bg-blue-500 text-white text-sm sm:text-base w-full xs:w-auto"
            >
              <span className="text-sm sm:text-base">➕</span>
              <span className="font-semibold whitespace-nowrap">
                <span className="hidden sm:inline">Nuevo Recorrido</span>
                <span className="sm:hidden">Nuevo</span>
              </span>
            </Button>

            <Button
              variant="secondary"
              onClick={exportarPDF}
              disabled={loading || totalRecorridosMes === 0}
              className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-gray-50 transition-colors shadow-sm bg-white text-gray-700 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base w-full xs:w-auto"
            >
              <span className="text-sm sm:text-base">📄</span>
              <span className="font-semibold whitespace-nowrap">
                <span className="hidden sm:inline">Exportar PDF</span>
                <span className="sm:hidden">PDF</span>
              </span>
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="flex justify-center items-center h-48 sm:h-64 shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-500 mx-auto mb-3 sm:mb-4"></div>
            <p className="text-base sm:text-lg text-gray-600 font-medium">Cargando datos del recorrido...</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Resumen del Mes */}
          <Card className="mb-6 shadow-sm border border-gray-200">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6 mb-4 sm:mb-6 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
                <span className="text-lg sm:text-xl font-bold text-gray-700 whitespace-nowrap">Resumen del Mes:</span>
                <div className="bg-gray-900 px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-sm w-full sm:w-auto">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                      ${costoTotalMes.toFixed(2)}
                    </span>
                    <span className="text-gray-300 text-xs sm:text-sm font-medium">Costo total</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-4 w-full lg:w-auto justify-start lg:justify-end">
                <div className="bg-blue-500 px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-sm text-center min-w-[100px] sm:min-w-[120px]">
                  <div className="text-xl sm:text-2xl font-bold text-white">{diasConRecorridos}</div>
                  <div className="text-blue-100 text-xs sm:text-sm font-medium">Días activos</div>
                </div>
                <div className="bg-green-500 px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-sm text-center min-w-[100px] sm:min-w-[120px]">
                  <div className="text-xl sm:text-2xl font-bold text-white">{totalRecorridosMes}</div>
                  <div className="text-green-100 text-xs sm:text-sm font-medium">Total viajes</div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 sm:pt-6 mt-4 sm:mt-6 px-4 sm:px-6 pb-4 sm:pb-6">
              <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">Leyenda:</h4>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 sm:gap-6 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-500 mr-2 sm:mr-3 shadow-sm"></div>
                  <span className="text-gray-600 font-medium text-sm sm:text-base">Día con Recorrido</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gray-300 mr-2 sm:mr-3 border border-gray-400 shadow-sm"></div>
                  <span className="text-gray-600 font-medium text-sm sm:text-base">Día sin Recorrido</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-white mr-2 sm:mr-3 border-2 border-blue-500 shadow-sm"></div>
                  <span className="text-gray-600 font-medium text-sm sm:text-base">Día Actual</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Calendario */}
          <Card className="mb-6 p-0 overflow-hidden shadow-sm border border-gray-200">
            <div className="grid grid-cols-7 text-center font-bold text-xs sm:text-sm text-white bg-gray-800 rounded-t-lg">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia, index) => (
                <span key={index} className="p-2 sm:p-3 lg:p-4 border-r border-gray-700 last:border-r-0 text-xs sm:text-sm">
                  {dia}
                </span>
              ))}
            </div>

            <div className="bg-white">
              {matrizCalendario.map((semana, idx) => (
                <div key={idx} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0">
                  {semana.map((dia, dIdx) => {
                    let dayClasses = "p-1 sm:p-2 lg:p-3 h-12 sm:h-16 lg:h-20 border-r border-gray-200 last:border-r-0 flex items-start justify-end text-sm sm:text-base lg:text-lg cursor-default transition-all duration-200";

                    if (!dia) {
                      dayClasses += " bg-gray-50 text-gray-300 pointer-events-none";
                    } else {
                      dayClasses += " hover:bg-gray-50";

                      const tieneRecorridos = dia.tieneRecorridos;
                      const esHoy = dia.esHoy;

                      if (tieneRecorridos) {
                        dayClasses += " bg-green-50 text-green-800 hover:bg-green-100 font-semibold";
                      } else if (esHoy) {
                        dayClasses += " bg-blue-50 text-blue-800 font-bold border-2 border-blue-400";
                      } else {
                        dayClasses += " bg-white text-gray-700";
                      }
                    }

                    return (
                      <div
                        key={dIdx}
                        className={dayClasses}
                        title={dia ? (dia.tieneRecorridos ? `Recorridos: ${recorridosMensuales[dia.numero]?.length || 0}` : 'Sin recorridos') : ''}
                      >
                        {dia && (
                          <span className={`
                            ${dia.tieneRecorridos ? 'bg-green-500 text-white shadow-sm' : ''}
                            ${dia.esHoy ? 'ring-2 ring-blue-500 bg-blue-500 text-white' : ''}
                            w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 flex items-center justify-center rounded-full font-semibold transition-all duration-200 text-xs sm:text-sm
                          `}>
                            {dia.numero}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>

          {/* Resumen Detallado */}
          <Card className="shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 pb-3 sm:pb-4 mb-4 sm:mb-6 p-4 sm:p-6">
              <h4 className="text-xl sm:text-2xl font-bold text-gray-900 text-center sm:text-left">
                Resumen de Recorridos del Mes
              </h4>
            </div>

            {Object.keys(recorridosMensuales).length === 0 ? (
              <div className="p-6 sm:p-8 lg:p-12 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 m-4 sm:m-6">
                <div className="text-5xl sm:text-6xl lg:text-7xl mb-4 sm:mb-6">📅</div>
                <p className="text-lg sm:text-xl lg:text-2xl text-gray-500 mb-2 sm:mb-3 font-medium">No hay recorridos registrados</p>
                <p className="text-gray-400 text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">para {nombresMeses[mesActual - 1]} {añoActual}</p>
                <Button
                  variant="primary"
                  onClick={handleOpenModal}
                  className="px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:bg-blue-600 transition-colors bg-blue-500 text-white"
                >
                  Crear primer recorrido
                </Button>
              </div>
            ) : (
              <div className="space-y-6 sm:space-y-8 p-4 sm:p-6">
                {/* Estadísticas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="bg-blue-500 p-4 sm:p-6 lg:p-8 rounded-lg shadow-sm text-center text-white">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">{diasConRecorridos}</div>
                    <div className="text-blue-100 font-medium text-sm sm:text-base">Días con Recorridos</div>
                  </div>

                  <div className="bg-green-500 p-4 sm:p-6 lg:p-8 rounded-lg shadow-sm text-center text-white">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">{totalRecorridosMes}</div>
                    <div className="text-green-100 font-medium text-sm sm:text-base">Total de Recorridos</div>
                  </div>

                  <div className="bg-purple-500 p-4 sm:p-6 lg:p-8 rounded-lg shadow-sm text-center text-white">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">${costoTotalMes.toFixed(2)}</div>
                    <div className="text-purple-100 font-medium text-sm sm:text-base">Costo Total</div>
                  </div>
                </div>

                {/* Cronología */}
                <div className="mt-6 sm:mt-8">
                  <h5 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4 sm:mb-6 border-l-4 border-blue-500 pl-3 sm:pl-4 flex items-center">
                    <span className="mr-2 sm:mr-3">🗓️</span>
                    Cronología del Mes
                  </h5>

                  <div className="space-y-4 sm:space-y-6">
                    {Object.keys(recorridosMensuales)
                      .filter(dia => !isNaN(parseInt(dia)))
                      .sort((a, b) => parseInt(a) - parseInt(b))
                      .map(dia => (
                        <div key={dia} className="flex border-l-2 border-blue-200 ml-3 sm:ml-4 pl-4 sm:pl-6 relative">
                          <div className="absolute -left-3 sm:-left-4 top-0 flex flex-col items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 text-white rounded-full shadow-sm">
                            <span className="text-xs sm:text-sm font-bold leading-none">{dia}</span>
                          </div>

                          <div className="flex-grow bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 w-full">
                            <div className="font-bold text-gray-800 mb-3 sm:mb-4 text-base sm:text-lg">
                              {recorridosMensuales[dia].length} recorrido{recorridosMensuales[dia].length > 1 ? 's' : ''} el día {dia}
                            </div>

                            <div className="space-y-2 sm:space-y-3">
                              {recorridosMensuales[dia].map((recorrido, idx) => (
                                <div key={idx} className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all duration-200">
                                  <div className="flex flex-col lg:flex-row items-start lg:items-center w-full lg:w-auto gap-2 sm:gap-4 mb-2 lg:mb-0">
                                    <span className="font-semibold text-gray-700 bg-white px-2 sm:px-3 py-1 sm:py-2 rounded shadow-sm min-w-[60px] sm:min-w-[70px] text-center text-sm sm:text-base">
                                      {formatearHora(recorrido.hora_inicio)}
                                    </span>
                                    <span className="text-gray-600 flex-grow text-sm sm:text-base">
                                      {recorrido.vehiculo_descripcion || 'Sin Vehículo'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between lg:justify-end w-full lg:w-auto gap-2 sm:gap-4">
                                    <span className="font-bold text-green-600 text-base sm:text-lg">
                                      {recorrido.costo ? `$${parseFloat(recorrido.costo).toFixed(2)}` : '$0.00'}
                                    </span>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleEdit(recorrido)}
                                      className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 px-3 sm:px-4 py-1 sm:py-2 rounded font-medium hover:bg-blue-100 transition-colors text-sm sm:text-base"
                                    >
                                      ✏️ <span className="hidden sm:inline">Editar</span>
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => handleCloseModal(false)}
        title={editando ? '✏️ Editar Recorrido' : '➕ Crear Recorrido'}
        size="max-w-2xl lg:max-w-4xl"
      >
        {loadingForm ? (
          <div className="min-h-48 sm:min-h-64 flex items-center justify-center bg-white p-6 sm:p-8 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-500 mx-auto mb-3 sm:mb-4"></div>
              <p className="text-gray-600 font-medium text-base sm:text-lg">Cargando datos necesarios...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 sm:p-6 rounded-lg">
            <div className="mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center sm:text-left">
                {editando ? '✏️ Editar Recorrido' : '➕ Crear Nuevo Recorrido'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Fecha *</label>
                  <Input
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    required
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Hora *</label>
                  <Input
                    type="time"
                    name="hora_inicio"
                    value={formData.hora_inicio}
                    onChange={handleChange}
                    required
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Vehículo *</label>
                  <select
                    name="vehiculo_id"
                    value={formData.vehiculo_id}
                    onChange={handleChange}
                    required
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 text-sm sm:text-base"
                  >
                    <option value="">Seleccionar vehículo...</option>
                    {vehiculos.map((vehiculo) => (
                      <option key={vehiculo.id} value={vehiculo.id}>
                        {vehiculo.descripcion} (${parseFloat(vehiculo.costo_por_recorrido || 0).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Tipo de Recorrido *</label>
                  <select
                    name="tipo_recorrido"
                    value={formData.tipo_recorrido}
                    onChange={handleChange}
                    required
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 text-sm sm:text-base"
                  >
                    <option value="traer">Traer</option>
                    <option value="llevar">Llevar</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Notas Generales del Recorrido</label>
                  <Input
                    type="text"
                    name="notas"
                    value={formData.notas}
                    onChange={handleChange}
                    placeholder="Observaciones del recorrido..."
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Sección de Niños */}
              <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
                  <h4 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
                    <span className="mr-2 sm:mr-3">👦</span>
                    Niños en el Recorrido
                  </h4>
                  <span className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                    {ninosSeleccionados.length} niño{ninosSeleccionados.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="mb-4 sm:mb-6">
                  <label className="text-sm font-semibold text-gray-700 block mb-2 sm:mb-3">Agregar Niño</label>
                  <select
                    onChange={agregarNino}
                    value=""
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 text-sm sm:text-base"
                  >
                    <option value="">Seleccionar niño...</option>
                    {ninos
                      .filter(nino => !ninosSeleccionados.some(ns => ns.nino_id.toString() === nino.id.toString()))
                      .map((nino) => (
                        <option key={nino.id} value={nino.id}>
                          {nino.nombre} {nino.apellidos}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {ninosSeleccionados.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">👶</div>
                      <p className="text-base sm:text-lg font-medium">No hay niños agregados al recorrido</p>
                    </div>
                  ) : (
                    ninosSeleccionados.map((nino, index) => (
                      <div key={nino.nino_id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-blue-200 p-3 sm:p-4 rounded-lg bg-blue-50 shadow-sm hover:bg-blue-100 transition-all duration-200">
                        <div className="flex items-center w-full sm:w-auto sm:flex-grow mb-2 sm:mb-0">
                          <span className="font-semibold text-blue-800 text-base sm:text-lg">
                            {nino.nombre} {nino.apellidos}
                          </span>
                        </div>

                        <div className="flex items-center w-full sm:w-auto justify-between sm:justify-end">
                          <button
                            type="button"
                            onClick={() => eliminarNino(index)}
                            className="text-red-500 hover:text-red-700 p-1 sm:p-2 text-base sm:text-lg transition-all duration-200 bg-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shadow-sm hover:bg-red-50"
                            title="Eliminar niño"
                          >
                            ✖
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 sm:space-x-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleCloseModal(false)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 text-sm sm:text-base"
                >
                  ❌ Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full sm:w-auto flex items-center justify-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200 text-sm sm:text-base"
                >
                  {editando ? (
                    <>
                      <span>💾</span>
                      <span>Actualizar Recorrido</span>
                    </>
                  ) : (
                    <>
                      <span>✅</span>
                      <span>Crear Recorrido</span>
                    </>
                  )}
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