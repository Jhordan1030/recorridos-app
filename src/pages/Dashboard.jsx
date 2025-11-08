// src/pages/Dashboard.jsx 

import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getRecorridos, getNinos, getVehiculos, createRecorrido, updateRecorrido } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// =======================================================
// IMPORTACIÓN DE COMPONENTES DEL MODAL Y FORMULARIO
// =======================================================
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
  // LÓGICA DEL DASHBOARD (sin cambios)
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
  // 🎨 RENDER (Estilos Tailwind)
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> 
      
      {/* page-header */}
      <div className="mb-8 pt-4"> 
        <h2 className="text-3xl font-bold text-gray-800">
          <span role="img" aria-label="dashboard">📊</span> Dashboard de Recorridos
        </h2>
      </div>
      
      {/* calendar-controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between bg-white p-4 rounded-xl shadow-lg mb-6 border border-gray-200">
        
        {/* Botones de navegación del mes y título */}
        <div className='flex items-center justify-between w-full md:w-auto mb-3 md:mb-0'>
            <div className='flex items-center'>
                <button 
                  onClick={() => cambiarMes(-1)} 
                  className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-3 rounded-l-lg transition-colors text-sm"
                >
                  {'< Anterior'}
                </button>
                <h3 className="text-xl font-bold text-indigo-600 mx-2 text-center w-32">
                  {nombresMeses[mesActual - 1]} {añoActual}
                </h3>
                <button 
                  onClick={() => cambiarMes(1)} 
                  className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-3 rounded-r-lg transition-colors text-sm"
                >
                  {'Siguiente >'}
                </button>
            </div>
        </div>
        
        {/* Botones de Acción */}
        <div className='flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full md:w-auto md:ml-auto'>
            {/* BOTÓN QUE ABRE EL MODAL */}
            <button
                onClick={handleOpenModal}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors w-full sm:w-auto"
            >
                ➕ Nuevo Recorrido
            </button>
            
            <button
                onClick={exportarPDF}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors disabled:bg-indigo-400 w-full sm:w-auto"
                disabled={loading || totalRecorridosMes === 0}
            >
                📄 Exportar PDF
            </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-48 bg-white rounded-xl shadow-md border border-gray-200">
          <p className="text-xl text-gray-600">🔄 Cargando datos del recorrido...</p>
        </div>
      ) : (
        <>
          {/* dashboard-summary y legend */}
          <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border border-gray-200">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
              <span className="text-lg font-bold text-gray-700 mb-2 sm:mb-0">Resumen del Mes:</span>
              <span className="text-2xl font-bold text-green-700">
                💰 Costo total: ${costoTotalMes.toFixed(2)}
              </span>
            </div>
            
            <h4 className="text-lg font-semibold text-gray-700 mb-3 border-t pt-4 mt-4">Leyenda:</h4>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-600"> 
              <span className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-green-500 mr-2"></span>
                Día con Recorrido
              </span>
              <span className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-gray-300 mr-2 border border-gray-400"></span>
                Día sin Recorrido
              </span>
            </div>
          </div>
          
          {/* calendar-grid */}
          <div className="bg-white p-4 rounded-xl shadow-lg mb-8 border border-gray-200">
            <div className="grid grid-cols-7 text-center font-bold text-sm text-white bg-indigo-600 rounded-t-lg border-b-2 border-indigo-700">
                <span className="p-2">Lun</span><span className="p-2">Mar</span><span className="p-2">Mié</span><span className="p-2">Jue</span><span className="p-2">Vie</span><span className="p-2">Sáb</span><span className="p-2">Dom</span>
            </div>

            {matrizCalendario.map((semana, idx) => (
              <div key={idx} className="grid grid-cols-7">
                {semana.map((dia, dIdx) => {
                  let dayClasses = "p-2 h-16 border border-gray-200 flex items-start justify-end text-lg cursor-default";
                  
                  if (!dia) {
                    dayClasses += " bg-gray-50 text-gray-400 pointer-events-none font-medium"; 
                  } else {
                    dayClasses += " hover:bg-gray-100 transition-colors duration-150";
                    
                    const tieneRecorridos = dia.tieneRecorridos;
                    const esHoy = dia.esHoy;
                    
                    if (tieneRecorridos) {
                        dayClasses += " bg-green-100 text-green-800 hover:bg-green-200 font-bold";
                    } else if (esHoy) {
                        dayClasses += " bg-indigo-100 text-gray-700 font-bold";
                    } else {
                        dayClasses += " bg-white text-gray-700 font-medium";
                    }

                    if (esHoy) {
                      dayClasses += " ring-2 ring-indigo-500 ring-offset-2"; 
                    }
                  }

                  return (
                    <div
                      key={dIdx}
                      className={dayClasses}
                      title={dia ? (dia.tieneRecorridos ? `Recorridos: ${recorridosMensuales[dia.numero]?.length || 0}` : 'Sin recorridos') : ''}
                    >
                      {dia && dia.numero}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          
          {/* recorridos-detail */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h4 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3">
              📊 Resumen de Recorridos del Mes
            </h4>
            
            {Object.keys(recorridosMensuales).length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-lg">
                <p className="text-xl text-gray-500">📅 No hay recorridos registrados para este mes.</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                <div className="flex justify-around bg-indigo-50 p-4 rounded-lg shadow-inner">
                  <div className="text-center">
                    <span className="stat-number text-3xl font-extrabold text-indigo-700 block">
                      {diasConRecorridos}
                    </span>
                    <span className="stat-label text-sm text-indigo-600">Días con Recorridos</span>
                  </div>
                  <div className="text-center">
                    <span className="stat-number text-3xl font-extrabold text-indigo-700 block">
                      {totalRecorridosMes}
                    </span>
                    <span className="stat-label text-sm text-indigo-600">Total de Recorridos</span>
                  </div>
                </div>

                <div className="mt-6">
                  <h5 className="text-lg font-semibold text-gray-700 mb-4 border-l-4 border-indigo-500 pl-3">
                    🗓️ Cronología del Mes
                  </h5>
                  
                  <div className="space-y-6">
                    {Object.keys(recorridosMensuales)
                      .filter(dia => !isNaN(parseInt(dia)))
                      .sort((a, b) => parseInt(a) - parseInt(b))
                      .map(dia => (
                        <div key={dia} className="flex border-l-2 border-gray-300 ml-4 pl-4 relative">
                          
                          <div className="absolute -left-3 top-0 flex flex-col items-center justify-center w-8 h-8 bg-indigo-600 text-white rounded-full shadow-md">
                            <span className="dia-numero text-sm font-bold leading-none">{dia}</span>
                          </div>
                          
                          <div className="flex-grow bg-gray-50 p-3 rounded-lg shadow-sm">
                            
                            <div className="font-bold text-indigo-800 mb-2">
                              {recorridosMensuales[dia].length} recorrido{recorridosMensuales[dia].length > 1 ? 's' : ''} en este día
                            </div>
                            
                            <div className="space-y-1">
                              {recorridosMensuales[dia].map((recorrido, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm p-2 bg-white rounded border border-gray-100">
                                  <span className="recorrido-hora font-semibold text-gray-700 w-full sm:w-1/5 mb-1 sm:mb-0">
                                    {formatearHora(recorrido.hora_inicio)}
                                  </span>
                                  <span className="recorrido-vehiculo text-gray-600 flex-grow px-0 sm:px-2 w-full sm:w-auto">
                                    {recorrido.vehiculo_descripcion || 'Sin Vehículo'}
                                  </span>
                                  <span className="recorrido-costo font-bold text-green-600 w-full sm:w-1/5 text-left sm:text-right">
                                    {recorrido.costo ? `$${parseFloat(recorrido.costo).toFixed(2)}` : '$0.00'}
                                  </span>
                                  <div className="flex space-x-2 mt-2 sm:mt-0 w-full sm:w-auto">
                                    <button
                                      onClick={() => handleEdit(recorrido)}
                                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
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
        MODAL PARA CREAR/EDITAR RECORRIDOS
        ======================================== */}
      {isModalOpen && (
        <Modal 
          title={editando ? '✏️ Editar Recorrido Existente' : '➕ Crear Nuevo Recorrido'}
          onClose={() => handleCloseModal(false)}
        >
          {loadingForm ? (
            <div className="min-h-52 flex items-center justify-center bg-white p-6 rounded-xl">
              <p className="text-gray-600 font-medium">🔄 Cargando datos necesarios...</p>
            </div>
          ) : (
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl max-w-2xl mx-auto w-full">
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
                      className="p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full transition-colors duration-150 shadow-sm bg-white"
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
                      className="p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full transition-colors duration-150 shadow-sm bg-white"
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
                      className="p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full transition-colors duration-150 shadow-sm bg-white"
                    >
                      <option value="">Seleccionar...</option>
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
                      className="p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full transition-colors duration-150 shadow-sm bg-white"
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
                      placeholder="Observaciones del recorrido"
                      className="p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full transition-colors duration-150 shadow-sm bg-white"
                    />
                  </div>
                </div>

                {/* Niños en el Recorrido */}
                <div className="mt-8 pt-4 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">👦 Niños en el Recorrido ({ninosSeleccionados.length})</h4>
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 block mb-1">Agregar Niño</label>
                    <select onChange={agregarNino} value="" className="p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full transition-colors duration-150 shadow-sm bg-white">
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

                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {ninosSeleccionados.length === 0 ? (
                      <p className="text-gray-500 italic py-2">No hay niños agregados</p>
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
                <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => handleCloseModal(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg shadow-sm transition-colors w-full sm:w-auto"
                  >
                    ❌ Cancelar
                  </button>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors disabled:bg-indigo-400 w-full sm:w-auto">
                    {editando ? '💾 Actualizar Recorrido' : '✅ Crear Recorrido'}
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