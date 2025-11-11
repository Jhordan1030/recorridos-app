// src/pages/Dashboard.jsx 
import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getRecorridos, getNinos, getVehiculos, createRecorrido, updateRecorrido } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Modal from '../components/Modal';

const Dashboard = () => {
  const { showAlert } = useApp();

  // ESTADOS PARA EL MODAL Y FORMULARIO
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

  // Estado inicial del formulario
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

  // ---------------------------------------------------------------------------
  // LÓGICA DEL DASHBOARD
  // ---------------------------------------------------------------------------

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

  const exportarPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setTextColor(55, 65, 81);
      doc.text('Reporte de Recorridos', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

      doc.setFontSize(14);
      doc.setTextColor(107, 114, 128);
      doc.text(`${nombresMeses[mesActual - 1]} ${añoActual}`, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });

      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);

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
        },
        columnStyles: {
          0: { cellWidth: 40 }, 1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 60 }, 3: { cellWidth: 25, halign: 'right' }
        },
        styles: { fontSize: 10, cellPadding: 3 },
        alternateRowStyles: { fillColor: [249, 250, 251] }
      });

      const fechaGeneracion = new Date().toLocaleDateString('es-EC', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(`Generado el: ${fechaGeneracion}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        doc.text(`Página ${i} de ${pageCount}`, 190, doc.internal.pageSize.height - 10, { align: 'right' });
      }

      doc.save(`Recorridos_${nombresMeses[mesActual - 1]}_${añoActual}.pdf`);
      showAlert('PDF generado exitosamente', 'success');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      showAlert('Error al generar el PDF: ' + (error?.message || error), 'error');
    }
  };

  const procesarRecorridos = (data) => {
    const recorridosAgrupados = {};
    if (Array.isArray(data)) {
      data.forEach(recorrido => {
        if (!recorrido?.fecha) return;
        const parts = recorrido.fecha.split('-');
        if (parts.length !== 3) return;
        const anioRecorrido = parseInt(parts[0], 10);
        const mesRecorrido = parseInt(parts[1], 10);
        const dia = parseInt(parts[2], 10);

        if (mesRecorrido === mesActual && anioRecorrido === añoActual) {
          if (!isNaN(dia) && dia > 0 && dia <= 31) {
            if (!recorridosAgrupados[dia]) recorridosAgrupados[dia] = [];
            recorridosAgrupados[dia].push(recorrido);
          }
        }
      });
    }

    const recorridosLimpios = {};
    Object.keys(recorridosAgrupados)
      .map(k => parseInt(k))
      .filter(k => !isNaN(k) && k > 0 && k <= 31)
      .sort((a, b) => a - b)
      .forEach(k => { recorridosLimpios[k] = recorridosAgrupados[k]; });

    setRecorridosMensuales(recorridosLimpios);
    setLoading(false);
  };

  const loadRecorridosData = async () => {
    setLoading(true);
    try {
      const response = await getRecorridos();
      let data = [];
      if (response?.data) {
        if (response.data.success && response.data.data) data = response.data.data;
        else if (Array.isArray(response.data)) data = response.data;
        else if (response.data.recorridos) data = response.data.recorridos;
        else Object.keys(response.data).forEach(key => {
          if (Array.isArray(response.data[key]) && response.data[key].length > 0 && data.length === 0) data = response.data[key];
        });
      }

      procesarRecorridos(data || []);
    } catch (error) {
      console.error('Error al cargar recorridos:', error);
      showAlert('Error de conexión al cargar recorridos.', 'error');
      setRecorridosMensuales({});
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecorridosData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (fila.length === 7) { matriz.push(fila); fila = []; }

      const tieneRecorridos = Array.isArray(recorridosMensuales[dia]) && recorridosMensuales[dia].length > 0;
      const hoy = new Date();
      const esHoy = dia === hoy.getDate() && mesActual === (hoy.getMonth() + 1) && añoActual === hoy.getFullYear();

      fila.push({ numero: dia, tieneRecorridos, esHoy });
      dia++;
    }
    while (fila.length < 7) fila.push(null);
    matriz.push(fila);
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

  // ---------------------------------------------------------------------------
  // LÓGICA DEL MODAL Y FORMULARIO
  // ---------------------------------------------------------------------------

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

  const resetForm = () => {
    setFormData(estadoInicialFormulario);
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
      showAlert('Error al cargar datos del formulario', 'error');
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

  const handleEdit = (recorrido) => {
    setEditando(true);
    setRecorridoId(recorrido.id);
    setFormData({
      fecha: recorrido.fecha.split('T')[0],
      hora_inicio: recorrido.hora_inicio.slice(0, 5),
      vehiculo_id: recorrido.vehiculo_id || '',
      tipo_recorrido: recorrido.tipo_recorrido,
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

  const handleNinoNotasChange = (index, value) => {
    const nuevosNinos = [...ninosSeleccionados];
    nuevosNinos[index].notas = value;
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
          handleCloseModal(true);
        }
      } else {
        const response = await createRecorrido(data);
        if (response.data.success) {
          showAlert('Recorrido creado exitosamente', 'success');
          handleCloseModal(true);
        }
      }
    } catch (error) {
      showAlert('Error al guardar recorrido: ' + error.message, 'error');
    }
  };

  // ---------------------------------------------------------------------------
  // 🎨 RENDER MEJORADO CON RESPONSIVIDAD COMPLETA
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 py-4 px-3 sm:px-4 lg:px-6 xl:px-8">

      {/* Header responsivo */}
      <div className="mb-6 pt-2">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 text-center sm:text-left px-2">
          <span role="img" aria-label="dashboard" className="mr-2">📊</span>
          Dashboard de Recorridos
        </h2>
      </div>

      {/* Controles de calendario - COMPLETAMENTE REDISEÑADO */}
      <div className="bg-white p-4 rounded-xl shadow-lg mb-6 border border-gray-200 mx-2 sm:mx-0">

        {/* Navegación del mes - Mejorada para móviles */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Navegación del mes */}
          <div className="flex items-center justify-center w-full sm:w-auto order-2 sm:order-1">
            <button
              onClick={() => cambiarMes(-1)}
              className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-3 sm:px-4 rounded-l-lg transition-colors text-sm flex items-center shadow-sm"
            >
              <span className="hidden xs:inline">Anterior</span>
              <span className="xs:hidden">‹</span>
            </button>

            <h3 className="text-lg sm:text-xl font-bold text-indigo-600 mx-2 sm:mx-4 text-center min-w-[140px] sm:min-w-[160px]">
              {nombresMeses[mesActual - 1]} {añoActual}
            </h3>

            <button
              onClick={() => cambiarMes(1)}
              className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-3 sm:px-4 rounded-r-lg transition-colors text-sm flex items-center shadow-sm"
            >
              <span className="hidden xs:inline">Siguiente</span>
              <span className="xs:hidden">›</span>
            </button>
          </div>

          {/* Botones de acción - Mejorados para móviles */}
          <div className='flex flex-col xs:flex-row gap-2 w-full sm:w-auto justify-center sm:justify-end order-1 sm:order-2'>
            <button
              onClick={handleOpenModal}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 sm:px-4 rounded-lg shadow-md transition-colors text-sm sm:text-base flex items-center justify-center gap-1 w-full xs:w-auto"
            >
              <span>➕</span>
              <span className="hidden xs:inline">Nuevo Recorrido</span>
              <span className="xs:hidden">Nuevo</span>
            </button>

            <button
              onClick={exportarPDF}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 sm:px-4 rounded-lg shadow-md transition-colors text-sm sm:text-base disabled:bg-indigo-400 flex items-center justify-center gap-1 w-full xs:w-auto"
              disabled={loading || totalRecorridosMes === 0}
            >
              <span>📄</span>
              <span className="hidden xs:inline">Exportar PDF</span>
              <span className="xs:hidden">PDF</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48 bg-white rounded-xl shadow-md border border-gray-200 mx-2 sm:mx-0">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Cargando datos del recorrido...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Resumen y leyenda - MEJORADO */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg mb-6 border border-gray-200 mx-2 sm:mx-0">

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                <span className="text-lg font-bold text-gray-700 whitespace-nowrap">Resumen del Mes:</span>
                <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200 w-full sm:w-auto">
                  <span className="text-xl sm:text-2xl font-bold text-green-700">
                    💰 ${costoTotalMes.toFixed(2)}
                  </span>
                  <span className="text-green-600 text-sm ml-2">Costo total</span>
                </div>
              </div>

              {/* Estadísticas rápidas */}
              <div className="flex flex-wrap gap-3 w-full lg:w-auto justify-start lg:justify-end">
                <div className="bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 text-center min-w-[80px]">
                  <div className="text-blue-700 font-bold text-sm">{diasConRecorridos}</div>
                  <div className="text-blue-600 text-xs">Días activos</div>
                </div>
                <div className="bg-purple-50 px-3 py-1 rounded-lg border border-purple-200 text-center min-w-[80px]">
                  <div className="text-purple-700 font-bold text-sm">{totalRecorridosMes}</div>
                  <div className="text-purple-600 text-xs">Total viajes</div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="text-md font-semibold text-gray-700 mb-3">Leyenda:</h4>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-green-500 mr-2 shadow-sm"></span>
                  Día con Recorrido
                </span>
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-gray-300 mr-2 border border-gray-400 shadow-sm"></span>
                  Día sin Recorrido
                </span>
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-indigo-100 mr-2 border-2 border-indigo-500 shadow-sm"></span>
                  Día Actual
                </span>
              </div>
            </div>
          </div>

          {/* Calendario - MEJORADO PARA MÓVILES */}
          <div className="bg-white p-3 sm:p-4 rounded-xl shadow-lg mb-6 border border-gray-200 mx-2 sm:mx-0 overflow-hidden">
            {/* Días de la semana */}
            <div className="grid grid-cols-7 text-center font-bold text-xs sm:text-sm text-white bg-indigo-600 rounded-t-lg">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia, index) => (
                <span key={index} className="p-1 sm:p-2 truncate">{dia}</span>
              ))}
            </div>

            {/* Días del mes */}
            <div className="bg-white">
              {matrizCalendario.map((semana, idx) => (
                <div key={idx} className="grid grid-cols-7 border-b border-gray-100 last:border-b-0">
                  {semana.map((dia, dIdx) => {
                    let dayClasses = "p-1 sm:p-2 h-12 sm:h-16 border-r border-gray-100 last:border-r-0 flex items-start justify-end text-sm sm:text-lg cursor-default transition-all duration-200";

                    if (!dia) {
                      dayClasses += " bg-gray-50 text-gray-300 pointer-events-none font-medium";
                    } else {
                      dayClasses += " hover:bg-gray-50";

                      const tieneRecorridos = dia.tieneRecorridos;
                      const esHoy = dia.esHoy;

                      if (tieneRecorridos) {
                        dayClasses += " bg-green-50 text-green-800 hover:bg-green-100 font-semibold";
                      } else if (esHoy) {
                        dayClasses += " bg-indigo-50 text-gray-800 font-bold border-2 border-indigo-400";
                      } else {
                        dayClasses += " bg-white text-gray-700 font-normal";
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
                            ${dia.tieneRecorridos ? 'bg-green-500 text-white' : ''}
                            ${dia.esHoy ? 'ring-2 ring-indigo-500' : ''}
                            w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full
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
          </div>

          {/* Detalles de recorridos - MEJORADO */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 mx-2 sm:mx-0">
            <h4 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3 flex items-center">
              <span className="mr-2">📊</span>
              Resumen de Recorridos del Mes
            </h4>

            {Object.keys(recorridosMensuales).length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-lg">
                <div className="text-6xl mb-4">📅</div>
                <p className="text-xl text-gray-500 mb-2">No hay recorridos registrados</p>
                <p className="text-gray-400">para {nombresMeses[mesActual - 1]} {añoActual}</p>
                <button
                  onClick={handleOpenModal}
                  className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Crear primer recorrido
                </button>
              </div>
            ) : (
              <div className="space-y-6">

                {/* Tarjetas de estadísticas */}
                <div className="w-full max-w-screen-lg mx-auto p-4">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                    <div className="w-full bg-blue-50 p-6 rounded-lg border border-blue-200 text-center flex flex-col items-center justify-center">
                      <div className="text-3xl font-extrabold text-blue-700">{diasConRecorridos}</div>
                      <div className="text-blue-600 text-sm mt-1">Días con Recorridos</div>
                    </div>

                    <div className="w-full bg-green-50 p-6 rounded-lg border border-green-200 text-center flex flex-col items-center justify-center">
                      <div className="text-3xl font-extrabold text-green-700">{totalRecorridosMes}</div>
                      <div className="text-green-600 text-sm mt-1">Total de Recorridos</div>
                    </div>

                    <div className="w-full bg-purple-50 p-6 rounded-lg border border-purple-200 text-center flex flex-col items-center justify-center">
                      <div className="text-3xl font-extrabold text-purple-700">${costoTotalMes.toFixed(2)}</div>
                      <div className="text-purple-600 text-sm mt-1">Costo Total</div>
                    </div>
                  </div>
                </div>


                {/* Cronología */}
                <div className="mt-8">
                  <h5 className="text-lg font-semibold text-gray-700 mb-4 border-l-4 border-indigo-500 pl-3 flex items-center">
                    <span className="mr-2">🗓️</span>
                    Cronología del Mes
                  </h5>

                  <div className="space-y-4">
                    {Object.keys(recorridosMensuales)
                      .filter(dia => !isNaN(parseInt(dia)))
                      .sort((a, b) => parseInt(a) - parseInt(b))
                      .map(dia => (
                        <div key={dia} className="flex border-l-2 border-gray-300 ml-3 sm:ml-4 pl-3 sm:pl-4 relative">

                          {/* Marcador del día */}
                          <div className="absolute -left-3 sm:-left-4 top-0 flex flex-col items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-indigo-600 text-white rounded-full shadow-md">
                            <span className="dia-numero text-xs sm:text-sm font-bold leading-none">{dia}</span>
                          </div>

                          {/* Contenido del día */}
                          <div className="flex-grow bg-gray-50 p-3 sm:p-4 rounded-lg shadow-sm w-full">

                            <div className="font-bold text-indigo-800 mb-2 text-sm sm:text-base">
                              {recorridosMensuales[dia].length} recorrido{recorridosMensuales[dia].length > 1 ? 's' : ''} el día {dia}
                            </div>

                            <div className="space-y-2">
                              {recorridosMensuales[dia].map((recorrido, idx) => (
                                <div key={idx} className="flex flex-col xs:flex-row justify-between items-start xs:items-center text-xs sm:text-sm p-2 bg-white rounded border border-gray-100 hover:bg-gray-50 transition-colors">
                                  <div className="flex flex-col xs:flex-row items-start xs:items-center w-full xs:w-auto gap-2 xs:gap-4">
                                    <span className="recorrido-hora font-semibold text-gray-700 bg-blue-50 px-2 py-1 rounded min-w-[60px] text-center">
                                      {formatearHora(recorrido.hora_inicio)}
                                    </span>
                                    <span className="recorrido-vehiculo text-gray-600 flex-grow">
                                      {recorrido.vehiculo_descripcion || 'Sin Vehículo'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between xs:justify-end w-full xs:w-auto mt-2 xs:mt-0 gap-2">
                                    <span className="recorrido-costo font-bold text-green-600 text-sm sm:text-base">
                                      {recorrido.costo ? `$${parseFloat(recorrido.costo).toFixed(2)}` : '$0.00'}
                                    </span>
                                    <button
                                      onClick={() => handleEdit(recorrido)}
                                      className="text-indigo-600 hover:text-indigo-800 font-medium text-xs sm:text-sm bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors"
                                    >
                                      ✏️ Editar
                                    </button>
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
          </div>
        </>
      )}

      {/* ========================================
        MODAL PARA CREAR/EDITAR RECORRIDOS - MEJORADO
        ======================================== */}
      {isModalOpen && (
        <Modal
          title={editando ? '✏️ Editar Recorrido Existente' : '➕ Crear Nuevo Recorrido'}
          onClose={() => handleCloseModal(false)}
          size="max-w-2xl"
        >
          {loadingForm ? (
            <div className="min-h-52 flex items-center justify-center bg-white p-6 rounded-xl">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Cargando datos necesarios...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white p-4 sm:p-6 rounded-xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-indigo-700 mb-6 border-b pb-3">
                {editando ? '✏️ Editar Recorrido' : '➕ Crear Nuevo Recorrido'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Fecha */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-sm font-medium text-gray-700">Fecha *</label>
                    <input
                      type="date"
                      name="fecha"
                      value={formData.fecha}
                      onChange={handleChange}
                      required
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full transition-colors duration-150 shadow-sm bg-white"
                    />
                  </div>

                  {/* Hora */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-sm font-medium text-gray-700">Hora *</label>
                    <input
                      type="time"
                      name="hora_inicio"
                      value={formData.hora_inicio}
                      onChange={handleChange}
                      required
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full transition-colors duration-150 shadow-sm bg-white"
                    />
                  </div>

                  {/* Vehículo */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-sm font-medium text-gray-700">Vehículo *</label>
                    <select
                      name="vehiculo_id"
                      value={formData.vehiculo_id}
                      onChange={handleChange}
                      required
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full transition-colors duration-150 shadow-sm bg-white"
                    >
                      <option value="">Seleccionar vehículo...</option>
                      {vehiculos.map((vehiculo) => (
                        <option key={vehiculo.id} value={vehiculo.id}>
                          {vehiculo.descripcion} (${parseFloat(vehiculo.costo_por_recorrido || 0).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tipo de Recorrido */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-sm font-medium text-gray-700">Tipo de Recorrido *</label>
                    <select
                      name="tipo_recorrido"
                      value={formData.tipo_recorrido}
                      onChange={handleChange}
                      required
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full transition-colors duration-150 shadow-sm bg-white"
                    >
                      <option value="llevar">Llevar</option>
                      <option value="traer">Traer</option>
                      <option value="ambos">Ambos</option>
                    </select>
                  </div>

                  {/* Notas Generales */}
                  <div className="flex flex-col space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Notas Generales del Recorrido</label>
                    <input
                      type="text"
                      name="notas"
                      value={formData.notas}
                      onChange={handleChange}
                      placeholder="Observaciones del recorrido..."
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full transition-colors duration-150 shadow-sm bg-white"
                    />
                  </div>
                </div>

                {/* Niños en el Recorrido */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="mr-2">👦</span>
                    Niños en el Recorrido ({ninosSeleccionados.length})
                  </h4>

                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 block mb-2">Agregar Niño</label>
                    <select
                      onChange={agregarNino}
                      value=""
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full transition-colors duration-150 shadow-sm bg-white"
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

                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {ninosSeleccionados.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <div className="text-4xl mb-2">👶</div>
                        <p>No hay niños agregados al recorrido</p>
                      </div>
                    ) : (
                      ninosSeleccionados.map((nino, index) => (
                        <div key={nino.nino_id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-indigo-200 p-3 rounded-lg bg-indigo-50 shadow-sm hover:bg-indigo-100 transition-colors">
                          <div className="flex items-center w-full sm:w-auto sm:flex-grow mb-2 sm:mb-0">
                            <span className="font-semibold text-indigo-800">
                              {nino.nombre} {nino.apellidos}
                            </span>
                          </div>

                          <div className="flex items-center w-full sm:w-auto justify-between sm:justify-end">
                            <button
                              type="button"
                              onClick={() => eliminarNino(index)}
                              className="text-red-500 hover:text-red-700 p-1 text-lg transition-colors bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm"
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

                {/* Botones de acción */}
                <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => handleCloseModal(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg shadow-sm transition-colors w-full sm:w-auto text-sm sm:text-base"
                  >
                    ❌ Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors disabled:bg-indigo-400 w-full sm:w-auto text-sm sm:text-base flex items-center justify-center gap-2"
                  >
                    {editando ? (
                      <>
                        <span>💾</span>
                        Actualizar Recorrido
                      </>
                    ) : (
                      <>
                        <span>✅</span>
                        Crear Recorrido
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;