import React, { useEffect, useState, useMemo } from 'react';
import { useAlert } from '../context/AlertContext';
import { getRecorridos, getNinos, getVehiculos, createRecorrido, updateRecorrido, deleteRecorrido } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Skeleton from '../components/ui/Skeleton';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recorridoAEliminar, setRecorridoAEliminar] = useState(null);

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

  const handleDelete = (id) => {
    console.log('🗑️ Intentando eliminar recorrido con ID:', id);
    if (!id) {
      showAlert('error', 'ID de recorrido no válido');
      return;
    }
    setRecorridoAEliminar(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!recorridoAEliminar) return;
    try {
      const response = await deleteRecorrido(recorridoAEliminar);
      if (response.data.success) {
        showAlert('success', 'Recorrido eliminado correctamente');
        loadRecorridosData();
      }
    } catch (error) {
      showAlert('error', 'No se pudo eliminar el recorrido');
    } finally {
      setShowDeleteModal(false);
      setRecorridoAEliminar(null);
    }
  };

  // --- NUEVA FUNCIÓN EXPORTAR PDF (ESTILO MODERNO) ---
  const exportarPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // --- 1. ENCABEZADO ---
      // Banda Superior Color Indigo
      doc.setFillColor(79, 70, 229); // Indigo 600
      doc.rect(0, 0, pageWidth, 24, 'F');

      // Título App (Izquierda)
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text('Recorridos App', 14, 16);

      // Info Mes/Año (Derecha)
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`${nombresMeses[mesActual - 1]} ${añoActual}`.toUpperCase(), pageWidth - 14, 16, { align: 'right' });

      // Subtítulo y Fecha de generación
      doc.setTextColor(70, 70, 70); // Gris oscuro
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text('Reporte Mensual de Actividad', 14, 35);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-EC')}`, 14, 40);

      // --- 2. PROCESAMIENTO DE DATOS ---
      const bodyData = [];
      let totalCosto = 0;

      Object.keys(recorridosMensuales)
        .filter(dia => !isNaN(parseInt(dia)))
        .sort((a, b) => parseInt(a) - parseInt(b))
        .forEach(dia => {
          recorridosMensuales[dia].forEach((recorrido) => {
            const costoNum = parseFloat(recorrido.costo || '0') || 0;
            totalCosto += costoNum;

            // Construcción de detalles en una sola celda rica
            let detalleTexto = `${recorrido.vehiculo_descripcion || 'Sin Vehículo'} (${recorrido.tipo_recorrido.toUpperCase()})\n`;

            if (recorrido.ninos && recorrido.ninos.length > 0) {
              const nombresNinos = recorrido.ninos.map(n => n.nombre + ' ' + n.apellidos).join(', ');
              detalleTexto += `Pasajeros (${recorrido.ninos.length}): ${nombresNinos}\n`;
            }

            if (recorrido.notas) {
              detalleTexto += `Nota: ${recorrido.notas}`;
            }

            bodyData.push([
              `${dia}/${mesActual}/${añoActual}`, // Fecha
              formatearHora(recorrido.hora_inicio), // Hora
              detalleTexto, // Detalles completos
              `$${costoNum.toFixed(2)}` // Costo
            ]);
          });
        });

      // --- 3. TABLA ---
      autoTable(doc, {
        startY: 45,
        head: [['FECHA', 'HORA', 'DETALLES DEL SERVICIO', 'COSTO']],
        body: bodyData,
        theme: 'striped', // Rayado para fácil lectura
        styles: {
          fontSize: 9,
          cellPadding: 4,
          valign: 'top', // Alinear arriba para que el texto largo se vea bien
          overflow: 'linebreak',
          lineColor: [230, 230, 230],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [79, 70, 229], // Indigo 600 para el header de tabla
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'left'
        },
        columnStyles: {
          0: { cellWidth: 25, fontStyle: 'bold' }, // Fecha
          1: { cellWidth: 20 }, // Hora
          2: { cellWidth: 'auto' }, // Detalles (Autoexpandible)
          3: { cellWidth: 25, halign: 'right', fontStyle: 'bold' } // Costo
        }
      });

      // --- 4. TOTAL FINAL ---
      const finalY = doc.lastAutoTable.finalY + 10;

      // Caja de Total destacada
      doc.setFillColor(240, 245, 255); // Fondo azul muy claro
      doc.setDrawColor(79, 70, 229); // Borde índigo
      doc.roundedRect(pageWidth - 70, finalY, 56, 20, 2, 2, 'FD'); // Caja redondeada rellena

      doc.setFontSize(10);
      doc.setTextColor(79, 70, 229);
      doc.text("TOTAL A PAGAR", pageWidth - 42, finalY + 7, { align: 'center' });

      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42); // Texto oscuro
      doc.setFont("helvetica", "bold");
      doc.text(`$${totalCosto.toFixed(2)}`, pageWidth - 42, finalY + 16, { align: 'center' });

      // Numeración de página
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      }

      doc.save(`Reporte_${nombresMeses[mesActual - 1]}_${añoActual}.pdf`);
      showAlert('success', 'PDF generado exitosamente');
    } catch (error) {
      console.error(error);
      showAlert('error', 'Error al generar el PDF');
    }
  };

  return (
    <div className="min-h-screen bg-transparent py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <Alert />

      {/* --- Page Header --- */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="md:flex md:items-center md:justify-between md:space-x-8">
          <div className="flex items-start">
            <div className="pt-1.5">
              <h1 className="text-4xl font-black text-white sm:text-5xl tracking-tighter">Dashboard</h1>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-3">Panel central de operaciones logísticas</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col-reverse justify-stretch gap-4 md:mt-0 md:flex-row md:items-center">
            <Button
              variant="secondary"
              onClick={exportarPDF}
              disabled={loading || totalRecorridosMes === 0}
              className="w-full md:w-auto"
            >
              Exportar Reporte
            </Button>
            <Button
              variant="primary"
              onClick={handleOpenModal}
              className="w-full md:w-auto shadow-2xl shadow-primary-500/20"
            >
              Nuevo Registro
            </Button>
          </div>
        </div>
      </div>

      {/* --- Period Controls & Overview --- */}
      <div className="max-w-7xl mx-auto mb-10 space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Calendar Period Navigation */}
          <div className="lg:col-span-4">
            <div className="flex items-center bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden h-full">
              <button
                onClick={() => cambiarMes(-1)}
                className="px-6 py-4 hover:bg-white/10 text-white/50 hover:text-white transition-all border-r border-white/5 focus:outline-none"
              >
                ‹
              </button>
              <div className="flex-1 px-8 py-4 text-center">
                <h3 className="text-sm font-black text-primary-400 uppercase tracking-[0.2em]">
                  {nombresMeses[mesActual - 1]}
                </h3>
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{añoActual}</span>
              </div>
              <button
                onClick={() => cambiarMes(1)}
                className="px-6 py-4 hover:bg-white/10 text-white/50 hover:text-white transition-all border-l border-white/5 focus:outline-none"
              >
                ›
              </button>
            </div>
          </div>

          {/* Key Summary Stats */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="p-6 sm:p-8 border-white/5">
              <dt className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Presupuesto Mes</dt>
              <dd className="text-3xl sm:text-4xl font-black text-white tracking-tighter">
                ${costoTotalMes.toFixed(2)}
              </dd>
            </Card>
            <Card className="p-6 sm:p-8">
              <dt className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Operación</dt>
              <dd className="text-3xl sm:text-4xl font-black text-white tracking-tighter">{totalRecorridosMes} <span className="text-xs text-white/20 ml-1">Rutas</span></dd>
            </Card>
            <Card className="p-6 sm:p-8 border-emerald-500/20">
              <dt className="text-[10px] font-black text-emerald-400/50 uppercase tracking-[0.2em] mb-2">Consistencia</dt>
              <dd className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tighter">
                {diasConRecorridos} <span className="text-xs text-emerald-400/30 ml-1">Días</span>
              </dd>
            </Card>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="max-w-7xl mx-auto mb-10 space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton variant="stat" />
            <Skeleton variant="stat" />
            <Skeleton variant="stat" className="sm:col-span-2 lg:col-span-1" />
          </div>
          <Skeleton variant="card" className="h-[400px]" />
          <div className="space-y-4">
            <Skeleton variant="title" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton variant="card" />
              <Skeleton variant="card" />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* --- Main Calendar Interface --- */}
          <div className="max-w-7xl mx-auto mb-10">
            <Card className="p-0 overflow-hidden border-none bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl">
              {/* Day Headers */}
              <div className="grid grid-cols-7 text-center font-black text-[10px] text-white/20 bg-white/5 border-b border-white/5 uppercase tracking-[0.2em]">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia, index) => (
                  <span key={index} className="py-4 sm:py-5 border-r border-white/5 last:border-r-0">
                    <span className="hidden sm:inline">{dia}</span>
                    <span className="sm:hidden">{dia.charAt(0)}</span>
                  </span>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="bg-transparent">
                {matrizCalendario.map((semana, idx) => (
                  <div key={idx} className="grid grid-cols-7 border-b border-white/5 last:border-b-0">
                    {semana.map((dia, dIdx) => {
                      const tieneRecorridos = Array.isArray(recorridosMensuales[dia.numero]) && recorridosMensuales[dia.numero].length > 0;
                      let dayClasses = "relative h-20 sm:h-32 border-r border-white/5 last:border-r-0 p-2 sm:p-3 transition-all duration-300 group hover:bg-white/10";

                      if (dia.esHoy) dayClasses += " bg-white/5";
                      if (dia.tieneRecorridos) dayClasses += " bg-primary-500/[0.03]";

                      return (
                        <div key={dIdx} className={dayClasses}>
                          <div className="flex items-center justify-center sm:justify-end mb-1 sm:mb-2">
                            <span className={`
                          flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all duration-300
                          ${dia.esHoy
                                ? 'bg-primary-500 text-white shadow-2xl shadow-primary-500/40 ring-4 ring-primary-500/10'
                                : dia.tieneRecorridos
                                  ? 'text-white font-black bg-white/10 border border-white/10'
                                  : 'text-white/30 group-hover:text-white/60'}
                        `}>
                              {dia.numero}
                            </span>
                          </div>

                          {dia.tieneRecorridos && (
                            <div className="mt-auto flex flex-wrap gap-1 justify-center sm:justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                              {recorridosMensuales[dia.numero]?.length > 0 && (
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                              )}
                              {recorridosMensuales[dia.numero]?.length > 1 && (
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/40" />
                              )}
                              {recorridosMensuales[dia.numero]?.length > 2 && (
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/20" />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* --- Detailed Activity List --- */}
          <Card className="p-0 border-none bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
            <div className="border-b border-white/5 p-8 px-10">
              <h4 className="text-2xl font-black text-white tracking-tighter uppercase tracking-[0.05em]">
                Bitácora de Operaciones
              </h4>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-2">Detalle cronológico de actividad mensual</p>
            </div>

            {Object.keys(recorridosMensuales).length === 0 ? (
              <div className="py-24 text-center">
                <div className="text-6xl mb-6 opacity-20">📂</div>
                <h3 className="text-xl font-black text-white mb-2">Archivo vacío</h3>
                <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">No se detectaron movimientos en este periodo</p>
              </div>
            ) : (
              <div className="p-8 px-10 space-y-12">
                {Object.keys(recorridosMensuales)
                  .filter(dia => !isNaN(parseInt(dia)))
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map(dia => (
                    <div key={dia} className="relative pl-12 border-l border-white/10 pb-4 last:pb-0">
                      {/* Timeline Node */}
                      <div className="absolute -left-[9px] top-0 bg-primary-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.5)] ring-4 ring-slate-950">
                        {dia}
                      </div>

                      <div className="mb-6 flex items-center gap-4">
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                          {dia} {nombresMeses[mesActual - 1]}
                        </span>
                        <div className="h-[1px] flex-1 bg-white/[0.03]" />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {(recorridosMensuales[dia] || []).map((recorrido, idx) => (
                          <div
                            key={idx}
                            className="group relative bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-md border border-white/5 hover:border-white/10 rounded-3xl p-6 transition-all duration-500"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-4">
                                <span className="h-10 w-10 rounded-xl bg-white/10 text-white flex items-center justify-center text-[10px] font-black border border-white/10 shadow-xl">
                                  {formatearHora(recorrido.hora_inicio)}
                                </span>
                                <div>
                                  <p className="text-sm font-black text-white uppercase tracking-tight">
                                    {recorrido.vehiculo_descripcion || 'Ruta sin asignar'}
                                  </p>
                                  <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.1em] mt-1">
                                    {recorrido.tipo_recorrido}
                                  </p>
                                </div>
                              </div>
                              <span className="text-lg font-black text-emerald-400 tracking-tighter">
                                ${parseFloat(recorrido.costo || 0).toFixed(2)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                              <div className="flex items-center gap-2">
                                <div className="h-1 w-1 rounded-full bg-primary-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                                  {recorrido.ninos?.length || 0} Estudiantes
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEdit(recorrido)}
                                  className="lg:opacity-0 group-hover:opacity-100 bg-white/10 hover:bg-white/20 text-white/60 hover:text-white p-2.5 rounded-xl transition-all border border-white/10"
                                  title="Gestionar"
                                >
                                  ⚙️
                                </button>
                                <button
                                  onClick={() => handleDelete(recorrido.id)}
                                  className="lg:opacity-0 group-hover:opacity-100 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 p-2.5 rounded-xl transition-all border border-red-500/10"
                                  title="Eliminar"
                                >
                                  🗑️
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

      {/* --- Management Modal --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => handleCloseModal(false)}
        title={editando ? 'Modificar Registro' : 'Nueva Operación'}
        size="max-w-3xl"
      >
        <div className="p-0 bg-transparent">
          {loadingForm ? (
            <div className="py-24 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mx-auto mb-6"></div>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Preparando entorno...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input
                  label="Fecha de Operación"
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Hora Estimada"
                  type="time"
                  name="hora_inicio"
                  value={formData.hora_inicio}
                  onChange={handleChange}
                  required
                />
                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2 pl-1">Selección de Unidad</label>
                  <select
                    name="vehiculo_id"
                    value={formData.vehiculo_id}
                    onChange={handleChange}
                    required
                    className="px-4 py-3 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary-500/50 focus:border-white/20 block w-full transition-all duration-300 bg-white/5 text-white outline-none backdrop-blur-sm"
                  >
                    <option value="">Buscar unidad...</option>
                    {vehiculos.map(v => <option key={v.id} value={v.id}>{v.descripcion}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2 pl-1">Modalidad de Ruta</label>
                  <select
                    name="tipo_recorrido"
                    value={formData.tipo_recorrido}
                    onChange={handleChange}
                    required
                    className="px-4 py-3 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary-500/50 focus:border-white/20 block w-full transition-all duration-300 bg-white/5 text-white outline-none backdrop-blur-sm"
                  >
                    <option value="traer">Recolección (Traer)</option>
                    <option value="llevar">Despacho (Llevar)</option>
                    <option value="ambos">Operación Dual</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Observaciones"
                    name="notas"
                    value={formData.notas}
                    onChange={handleChange}
                    placeholder="Detalles sobre tráfico, desvíos o novedades..."
                  />
                </div>
              </div>

              {/* Passenger Management inside Modal */}
              <div className="pt-8 border-t border-white/5">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Nómina de Pasajeros ({ninosSeleccionados.length})</h4>
                </div>

                <div className="mb-6">
                  <select
                    onChange={agregarNino}
                    value=""
                    className="px-4 py-3 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary-500/50 focus:border-white/20 block w-full transition-all duration-300 bg-white/5 text-white outline-none backdrop-blur-sm"
                  >
                    <option value="">+ Vincular estudiante a este trayecto...</option>
                    {(ninos || []).filter(n => !ninosSeleccionados.some(sel => sel.nino_id?.toString() === n.id?.toString())).map(n => (
                      <option key={n.id} value={n.id}>{n.nombre} {n.apellidos}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {(ninosSeleccionados || []).map((n, idx) => (
                    <div key={n.nino_id} className="group flex items-center justify-between bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl p-3 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white/5 text-white flex items-center justify-center text-[10px] font-black border border-white/10">
                          {n.nombre?.charAt(0) || '?'}
                        </div>
                        <span className="text-xs font-black text-white/70 uppercase tracking-tight">{n.nombre} {n.apellidos}</span>
                      </div>
                      <button type="button" onClick={() => eliminarNino(idx)} className="text-white/20 hover:text-red-400 p-2 transition-colors">✕</button>
                    </div>
                  ))}
                  {ninosSeleccionados.length === 0 && (
                    <div className="sm:col-span-2 py-8 text-center border-2 border-dashed border-white/5 rounded-3xl">
                      <p className="text-[10px] font-black text-white/10 uppercase tracking-widest">Nómina vacía</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones Finales */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-8 border-t border-white/5">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleCloseModal(false)}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full sm:w-auto shadow-2xl shadow-primary-500/20"
                >
                  {editando ? 'Actualizar Registro' : 'Confirmar Operación'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Eliminar Recorrido"
        message="¿Estás seguro de que quieres eliminar este registro? Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default Dashboard;