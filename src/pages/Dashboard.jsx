import React, { useEffect, useState, useMemo } from 'react';
import { useAlert } from '../context/AlertContext';
import { useApp } from '../context/AppContext';
import { getRecorridos, getNinos, getVehiculos, createRecorrido, updateRecorrido, deleteRecorrido } from '../services/api';
// Imports dinámicos para optimización (jsPDF y autoTable)
import {
  Users,
  Route,
  Truck,
  Calendar as CalendarIcon,
  FileText,
  ChevronLeft,
  ChevronRight,
  Clock,
  Trash2,

  Plus,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Skeleton from '../components/ui/Skeleton';

const Dashboard = () => {
  const { showAlert } = useAlert();
  const { isMobile } = useApp();

  // --- ESTADOS ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [recorridoId, setRecorridoId] = useState(null);
  const [ninos, setNinos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [ninosSeleccionados, setNinosSeleccionados] = useState([]);
  const [loadingForm, setLoadingForm] = useState(false);
  const [recorridosMensuales, setRecorridosMensuales] = useState({});
  const [chartData, setChartData] = useState([]);
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

    // --- LÓGICA DE GRÁFICO COMPARATIVO ---
    const chartDataMap = {};
    const diasDelMes = new Date(añoActual, mesActual, 0).getDate();



    // Inicializar mapa con días
    for (let i = 1; i <= diasDelMes; i++) {
      chartDataMap[i] = { name: i.toString(), actual: 0, anterior: 0 };
    }

    if (Array.isArray(data)) {
      data.forEach(r => {
        if (!r?.fecha) return;

        // Manejo robusto de fechas - ZONA HORARIA NEUTRA
        let a, m, d;
        if (typeof r.fecha === 'string') {
          // Tomamos la fecha YYYY-MM-DD ignorando hora y zona
          const fechaStr = r.fecha.includes('T') ? r.fecha.split('T')[0] : r.fecha;
          const parts = fechaStr.split('-');

          if (parts.length === 3) {
            // Parseo directo de componentes
            a = parseInt(parts[0], 10);
            m = parseInt(parts[1], 10);
            d = parseInt(parts[2], 10);
          } else {
            return;
          }
        } else {
          return;
        }

        // Datos Mes Actual
        if (m === mesActual && a === añoActual) {
          if (chartDataMap[d]) chartDataMap[d].actual += 1;
        }

        // Datos Mes Anterior
        const fechaMesAnterior = new Date(añoActual, mesActual - 1, 0); // Último día mes anterior
        const mesAnterior = fechaMesAnterior.getMonth() + 1;
        const anioAnterior = fechaMesAnterior.getFullYear();

        if (m === mesAnterior && a === anioAnterior) {
          if (chartDataMap[d]) chartDataMap[d].anterior += 1;
        }
      });
    }



    setChartData(Object.values(chartDataMap));
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
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [recorridosRes, ninosRes, vehiculosRes] = await Promise.all([
          getRecorridos(),
          getNinos(),
          getVehiculos()
        ]);

        // Procesar Recorridos
        let data = [];
        if (recorridosRes?.data) {
          if (recorridosRes.data.success && recorridosRes.data.data) {
            data = recorridosRes.data.data;
          } else if (Array.isArray(recorridosRes.data)) {
            data = recorridosRes.data;
          } else if (recorridosRes.data.recorridos) {
            data = recorridosRes.data.recorridos;
          } else {
            Object.keys(recorridosRes.data).forEach(key => {
              if (Array.isArray(recorridosRes.data[key])) {
                data = recorridosRes.data[key];
              }
            });
          }
        }
        procesarRecorridos(data || []);

        // Setear Niños y Vehiculos para los Stats
        if (ninosRes.data.success) setNinos(ninosRes.data.data);
        if (vehiculosRes.data.success) setVehiculos(vehiculosRes.data.data);

      } catch (error) {
        console.error("Error loading dashboard data", error);
        showAlert('error', 'Error al cargar datos del dashboard');
        setRecorridosMensuales({});
        setLoading(false);
      }
    };

    loadDashboardData();
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
  // (Data loaded on mount now, but we keep these if needed for refresh)
  const refreshCatalogs = async () => {
    try {
      const [nRes, vRes] = await Promise.all([getNinos(), getVehiculos()]);
      if (nRes.data.success) setNinos(nRes.data.data);
      if (vRes.data.success) setVehiculos(vRes.data.data);
    } catch (e) {
      console.error(e);
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
      // Refresh just in case
      await refreshCatalogs();
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
  const exportarPDF = async () => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;

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
    <div className="min-h-screen bg-transparent py-4 sm:py-8 px-0 sm:px-6 lg:px-8 transition-colors duration-300">
      <Alert />

      {/* --- Header Section --- */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Panel de Control</h1>
            <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Gestión centralizada de operaciones</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Button
              variant="secondary"
              size={isMobile ? 'sm' : 'lg'}
              onClick={exportarPDF}
              disabled={loading || totalRecorridosMes === 0}
              className="w-full sm:w-auto justify-center !bg-white !border !border-slate-200 !text-slate-700 hover:!text-indigo-600 hover:!border-indigo-200 hover:!bg-indigo-50 transition-all shadow-sm"
            >
              <div className="flex items-center gap-2">
                <FileText size={isMobile ? 16 : 20} className="text-slate-400 group-hover:text-indigo-600" />
                <span>Exportar Reporte</span>
              </div>
            </Button>
            <Button
              variant="primary"
              size={isMobile ? 'sm' : 'lg'}
              onClick={handleOpenModal}
              icon={<Plus size={isMobile ? 14 : 20} />}
              className="w-full sm:w-auto justify-center shadow-lg shadow-primary-500/20"
            >
              Nueva Ruta
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid - Redesigned */}
      {/* Stats Grid - Redesigned */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        {loading ? (
          Array(2).fill(0).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-32" />
          ))
        ) : (
          <>
            <Card variant="base" className="p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Est. Financiera</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">${costoTotalMes.toFixed(2)}</h3>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <FileText size={20} strokeWidth={2.5} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-slate-400">
                <span className="text-slate-600">Acumulado</span>
                <span>en {nombresMeses[mesActual - 1]}</span>
              </div>
            </Card>

            <Card variant="base" className="p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Rutas Activas</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{totalRecorridosMes}</h3>
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <Route size={20} strokeWidth={2.5} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-slate-400">
                <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+{diasConRecorridos} días</span>
                <span>de operación este mes</span>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* --- GRÁFICO COMPARATIVO --- */}
      <div className="mb-8">
        <Card variant="base" className="p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          {loading ? (
            <Skeleton variant="rect" className="h-[250px] w-full" />
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <TrendingUp size={20} className="text-indigo-600" />
                    Rendimiento Operativo
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">Comparativa de rutas: {nombresMeses[mesActual - 1]} vs Mes Anterior</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                    <span className="text-slate-600">Actual</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                    <span className="text-slate-400">Anterior</span>
                  </div>
                </div>
              </div>

              <div className="h-[250px] w-full min-w-0">
                {chartData && chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: '#1e293b'
                        }}
                        itemStyle={{ color: '#475569' }}
                        cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="anterior"
                        stroke="#cbd5e1"
                        strokeWidth={2}
                        fill="transparent"
                        activeDot={{ r: 4, strokeWidth: 0 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="actual"
                        stroke="#6366f1"
                        strokeWidth={3}
                        fill="url(#colorActual)"
                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>

                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
                    No hay datos para mostrar
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div >

      {
        loading ? (
          <div className="space-y-6" >
            <Skeleton variant="card" className="h-[400px]" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton variant="card" className="h-[300px]" />
              <Skeleton variant="card" className="h-[300px]" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Lado Izquierdo: Calendario Estilo Enterprise */}
            <div className="lg:col-span-12 xl:col-span-8">
              <Card variant="base" padding="p-0" className="h-full overflow-hidden border border-slate-200 shadow-sm">
                <div className="p-6 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <CalendarIcon size={20} className="text-primary-600" />
                      Cronograma Operativo
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-1">Gestión visual de rutas y despachos</p>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                    <button onClick={() => cambiarMes(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all"><ChevronLeft size={18} /></button>
                    <span className="text-sm font-black text-slate-800 px-4 min-w-[140px] text-center uppercase tracking-widest leading-none">
                      {nombresMeses[mesActual - 1]} <span className="text-slate-400 font-medium">{añoActual}</span>
                    </span>
                    <button onClick={() => cambiarMes(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all"><ChevronRight size={18} /></button>
                  </div>
                </div>

                <div className="p-2 sm:p-6 bg-slate-50/50">
                  <div className="pb-2">
                    <div className="w-full">
                      <div className="grid grid-cols-7 mb-4">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                          <div key={d} className="text-[9px] sm:text-[11px] font-black text-slate-400 uppercase text-center tracking-wider">{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1 sm:gap-3">
                        {matrizCalendario.map((semana, idx) => (
                          <React.Fragment key={idx}>
                            {semana.map((dia, dIdx) => {
                              if (!dia) return <div key={`empty-${dIdx}`} className="h-14 sm:h-32 bg-transparent" />;

                              const recorridoDelDia = recorridosMensuales[dia.numero] || [];
                              const tieneRecorridos = recorridoDelDia.length > 0;
                              const esHoy = dia.esHoy;

                              return (
                                <div
                                  key={dia.numero}
                                  className={`
                                  relative h-14 sm:h-32 p-1 sm:p-3 rounded-xl sm:rounded-2xl border transition-all duration-200 flex flex-col group
                                  ${esHoy ? 'bg-white border-primary-500 ring-2 sm:ring-4 ring-primary-500/10 z-10' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'}
                                `}
                                >
                                  <span className={`
                                   absolute top-1 right-1 sm:top-3 sm:right-3 w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-[10px] sm:text-xs font-bold transition-colors
                                   ${esHoy ? 'bg-primary-600 text-white' : 'text-slate-400 group-hover:text-slate-600 bg-slate-50'}
                                 `}>
                                    {dia.numero}
                                  </span>

                                  {/* Mobile Dots View */}
                                  <div className="mt-6 sm:hidden flex flex-wrap gap-0.5 justify-center">
                                    {recorridoDelDia.slice(0, 4).map((r, ri) => (
                                      <div
                                        key={ri}
                                        className={`w-1.5 h-1.5 rounded-full ${r.tipo_recorrido === 'traer' ? 'bg-emerald-500' :
                                          r.tipo_recorrido === 'llevar' ? 'bg-amber-500' : 'bg-blue-500'
                                          }`}
                                      />
                                    ))}
                                    {recorridoDelDia.length > 4 && (
                                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                    )}
                                  </div>

                                  {/* Desktop List View */}
                                  <div className="hidden sm:block mt-8 space-y-1.5 overflow-y-auto custom-scrollbar pr-1">
                                    {recorridoDelDia.map((r, ri) => (
                                      <div key={ri} className={`
                                      flex items-center gap-2 px-2 py-1.5 rounded-lg border text-[10px] font-bold truncate transition-colors
                                      ${r.tipo_recorrido === 'traer'
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                                          : r.tipo_recorrido === 'llevar'
                                            ? 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'
                                            : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100'
                                        }
                                    `}>
                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.tipo_recorrido === 'traer' ? 'bg-emerald-500' :
                                          r.tipo_recorrido === 'llevar' ? 'bg-amber-500' : 'bg-blue-500'
                                          }`} />
                                        <span className="truncate">{r.vehiculo_descripcion || 'Sin Unidad'}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* --- Bitácora de Operaciones (Derecha) --- */}
            <div className="lg:col-span-12 xl:col-span-4 h-full">
              <Card variant="base" padding="p-0" className="h-[500px] lg:h-[650px] flex flex-col border border-slate-200 shadow-sm">
                <div className="p-6 border-b border-slate-100 bg-white flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Clock size={16} className="text-emerald-600" />
                      Actividad Reciente
                    </h3>
                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">Operaciones de {nombresMeses[mesActual - 1]}</p>
                  </div>
                  <div className="animate-pulse">
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md border border-emerald-200 tracking-wider">LIVE</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-slate-50/30">
                  {Object.keys(recorridosMensuales).length > 0 ? (
                    Object.keys(recorridosMensuales)
                      .filter(dia => !isNaN(parseInt(dia)))
                      .sort((a, b) => parseInt(b) - parseInt(a))
                      .map(dia => (
                        <div key={dia} className="relative pl-4 border-l-2 border-slate-200 space-y-4">
                          <div className="absolute -left-[9px] top-0 w-4 h-4 bg-slate-200 rounded-full border-2 border-white"></div>
                          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none mb-2">{dia} de {nombresMeses[mesActual - 1]}</h4>

                          {recorridosMensuales[dia].map((recorrido, idx) => {
                            // Calcular pasajeros aquí si no viene del backend
                            const totalPasajeros = recorrido.total_ninos !== undefined ? recorrido.total_ninos : (recorrido.ninos?.length || 0);

                            return (
                              <div
                                key={idx}
                                className="group p-4 bg-white border border-slate-200 rounded-xl hover:border-primary-200 hover:shadow-md transition-all duration-200 relative overflow-hidden"
                              >
                                {/* Hover Accent */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                <div className="flex items-center justify-between mb-2">
                                  <span className={`
                                  text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider
                                  ${recorrido.tipo_recorrido === 'traer' ? 'bg-emerald-50 text-emerald-600' :
                                      recorrido.tipo_recorrido === 'llevar' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}
                                `}>
                                    {recorrido.tipo_recorrido?.toUpperCase() || 'GENERAL'}
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                    <Clock size={12} />
                                    {formatearHora(recorrido.hora_inicio)}
                                  </span>
                                </div>

                                <h5 className="text-sm font-bold text-slate-800 mb-3 pr-6">{recorrido.vehiculo_descripcion}</h5>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                  <div className="flex items-center gap-2">
                                    <div className="bg-slate-100 p-1.5 rounded-full text-slate-500">
                                      <Users size={12} />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-600">{totalPasajeros} Pasajeros</span>
                                  </div>

                                  <button
                                    onClick={() => handleDelete(recorrido.id)}
                                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                                    title="Eliminar registro"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                      <div className="bg-slate-100 p-4 rounded-full mb-4">
                        <FileText size={32} className="text-slate-400" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">No hay actividad registrada</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
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
            <div className="space-y-8 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton variant="title" className="w-1/3 h-4" />
                  <Skeleton variant="text" className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton variant="title" className="w-1/3 h-4" />
                  <Skeleton variant="text" className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton variant="title" className="w-2/3 h-4" />
                  <Skeleton variant="text" className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton variant="title" className="w-1/2 h-4" />
                  <Skeleton variant="text" className="h-10 w-full" />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Skeleton variant="title" className="w-1/4 h-4" />
                  <Skeleton variant="text" className="h-16 w-full" />
                </div>
              </div>
              <div className="pt-8 border-t border-slate-100 flex justify-end gap-4">
                <Skeleton variant="rect" className="w-24 h-10 rounded-xl" />
                <Skeleton variant="rect" className="w-32 h-10 rounded-xl" />
              </div>
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
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 pl-1">Selección de Unidad</label>
                  <select
                    name="vehiculo_id"
                    value={formData.vehiculo_id}
                    onChange={handleChange}
                    required
                    className="px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500/50 focus:border-slate-300 block w-full transition-all duration-300 bg-white text-slate-900 outline-none"
                  >
                    <option value="">Buscar unidad...</option>
                    {vehiculos.map(v => <option key={v.id} value={v.id}>{v.descripcion}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 pl-1">Modalidad de Ruta</label>
                  <select
                    name="tipo_recorrido"
                    value={formData.tipo_recorrido}
                    onChange={handleChange}
                    required
                    className="px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500/50 focus:border-slate-300 block w-full transition-all duration-300 bg-white text-slate-900 outline-none"
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
              <div className="pt-8 border-t border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nómina de Pasajeros ({ninosSeleccionados.length})</h4>
                </div>

                <div className="mb-6">
                  <select
                    onChange={agregarNino}
                    value=""
                    className="px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500/50 focus:border-slate-300 block w-full transition-all duration-300 bg-white text-slate-900 outline-none"
                  >
                    <option value="">+ Vincular estudiante a este trayecto...</option>
                    {(ninos || []).filter(n => !ninosSeleccionados.some(sel => sel.nino_id?.toString() === n.id?.toString())).map(n => (
                      <option key={n.id} value={n.id}>{n.nombre} {n.apellidos}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {(ninosSeleccionados || []).map((n, idx) => (
                    <div key={n.nino_id} className="group flex items-center justify-between bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-3 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-black border border-slate-200">
                          {n.nombre?.charAt(0) || '?'}
                        </div>
                        <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{n.nombre} {n.apellidos}</span>
                      </div>
                      <button type="button" onClick={() => eliminarNino(idx)} className="text-slate-400 hover:text-red-500 p-2 transition-colors">✕</button>
                    </div>
                  ))}
                  {ninosSeleccionados.length === 0 && (
                    <div className="sm:col-span-2 py-8 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nómina vacía</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones Finales */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-8 border-t border-slate-100">
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
    </div >
  );
};

export default Dashboard;