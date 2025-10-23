import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getRecorridos } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Dashboard = () => {
  const { showAlert } = useApp();
  const [recorridosMensuales, setRecorridosMensuales] = useState({});
  const [loading, setLoading] = useState(true);
  const [mesActual, setMesActual] = useState(new Date().getMonth() + 1);
  const [añoActual, setAñoActual] = useState(new Date().getFullYear());
  
  // Nombres de los meses para la visualización
  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Función para exportar a PDF
  const exportarPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(20);
      doc.setTextColor(102, 126, 234);
      doc.text('Reporte de Recorridos', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
      
      // Subtítulo con mes y año
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`${nombresMeses[mesActual - 1]} ${añoActual}`, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
      
      // Línea separadora
      doc.setDrawColor(102, 126, 234);
      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);
      
      // Estadísticas generales
      const totalDias = Object.keys(recorridosMensuales).length;
      const totalRecorridos = Object.values(recorridosMensuales).reduce(
        (total, recorridos) => total + recorridos.length, 
        0
      );
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Total de días con recorridos: ${totalDias}`, 20, 45);
      doc.text(`Total de recorridos: ${totalRecorridos}`, 20, 52);
      
      // Preparar datos para la tabla
      const datosTabla = [];
      
      Object.keys(recorridosMensuales)
        .filter(dia => !isNaN(parseInt(dia)))
        .sort((a, b) => parseInt(a) - parseInt(b))
        .forEach(dia => {
          recorridosMensuales[dia].forEach((recorrido, idx) => {
            datosTabla.push([
              idx === 0 ? `${dia} ${nombresMeses[mesActual - 1]}` : '',
              recorrido.hora_inicio || 'N/A',
              recorrido.tipo_recorrido || 'N/A',
              recorrido.vehiculo_descripcion || 'N/A',
              `$${recorrido.costo || '0.00'}`,
              recorrido.ninos?.length || 0,
              recorrido.notas || '-'
            ]);
          });
        });
      
      // Crear la tabla usando autoTable como función
      autoTable(doc, {
        startY: 60,
        head: [['Fecha', 'Hora', 'Tipo', 'Vehículo', 'Costo', 'Niños', 'Notas']],
        body: datosTabla,
        theme: 'striped',
        headStyles: {
          fillColor: [102, 126, 234],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 35 },
          4: { cellWidth: 20, halign: 'right' },
          5: { cellWidth: 15, halign: 'center' },
          6: { cellWidth: 45 }
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });
      
      // Footer con fecha de generación
      const fechaGeneracion = new Date().toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Generado el: ${fechaGeneracion}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
        doc.text(
          `Página ${i} de ${pageCount}`,
          190,
          doc.internal.pageSize.height - 10,
          { align: 'right' }
        );
      }
      
      // Guardar el PDF
      doc.save(`Recorridos_${nombresMeses[mesActual - 1]}_${añoActual}.pdf`);
      showAlert('PDF generado exitosamente', 'success');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      showAlert('Error al generar el PDF: ' + error.message, 'error');
    }
  };

  // Función para procesar y agrupar recorridos por día
  const procesarRecorridos = (data) => {
    const recorridosAgrupados = {};

    if (Array.isArray(data)) {
      data.forEach(recorrido => {
        if (recorrido.fecha) {
          let fechaProcesada = null;
          
          // Formato YYYY-MM-DD
          if (recorrido.fecha.includes('-')) {
            const fechaParts = recorrido.fecha.split('-');
            if (fechaParts.length === 3) {
              fechaProcesada = {
                año: parseInt(fechaParts[0]),
                mes: parseInt(fechaParts[1]),
                dia: parseInt(fechaParts[2])
              };
            }
          }
          // Formato DD/MM/YYYY
          else if (recorrido.fecha.includes('/')) {
            const fechaParts = recorrido.fecha.split('/');
            if (fechaParts.length === 3) {
              fechaProcesada = {
                año: parseInt(fechaParts[2]),
                mes: parseInt(fechaParts[1]),
                dia: parseInt(fechaParts[0])
              };
            }
          }
          // Intentar parsear como Date
          else {
            const fechaDate = new Date(recorrido.fecha);
            if (!isNaN(fechaDate.getTime())) {
              fechaProcesada = {
                año: fechaDate.getFullYear(),
                mes: fechaDate.getMonth() + 1,
                dia: fechaDate.getDate()
              };
            }
          }
          
          if (fechaProcesada) {
            // Filtramos por el mes y año seleccionado
            if (fechaProcesada.mes === mesActual && fechaProcesada.año === añoActual && 
                !isNaN(fechaProcesada.dia) && fechaProcesada.dia > 0 && fechaProcesada.dia <= 31) {
              if (!recorridosAgrupados[fechaProcesada.dia]) {
                recorridosAgrupados[fechaProcesada.dia] = [];
              }
              recorridosAgrupados[fechaProcesada.dia].push(recorrido);
            }
          }
        }
      });
    }

    // Limpiar el objeto de días inválidos
    const recorridosLimpios = {};
    Object.keys(recorridosAgrupados).forEach(dia => {
      const diaNum = parseInt(dia);
      if (!isNaN(diaNum) && diaNum > 0 && diaNum <= 31) {
        recorridosLimpios[diaNum] = recorridosAgrupados[dia];
      }
    });

    setRecorridosMensuales(recorridosLimpios);
    setLoading(false);
  };
  
  // Función para cargar todos los recorridos
  const loadRecorridosData = async () => {
    setLoading(true);
    try {
      const response = await getRecorridos();
      
      let data = [];
      
      if (response.data) {
        if (response.data.success && response.data.data) {
          data = response.data.data;
        } else if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data.recorridos) {
          data = response.data.recorridos;
        }
      }
      
      procesarRecorridos(data);
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

  // Generar la matriz del calendario para el mes/año actual
  const generarCalendario = () => {
    const primerDia = new Date(añoActual, mesActual - 1, 1).getDay();
    const diasEnElMes = new Date(añoActual, mesActual, 0).getDate();
    const matriz = [];
    let dia = 1;

    let fila = Array(primerDia === 0 ? 6 : primerDia - 1).fill(null);

    while (dia <= diasEnElMes) {
      if (fila.length === 7) {
        matriz.push(fila);
        fila = [];
      }

      const tieneRecorridos = recorridosMensuales[dia] && recorridosMensuales[dia].length > 0;
      const esHoy = (dia === new Date().getDate() && 
                    mesActual === (new Date().getMonth() + 1) && 
                    añoActual === new Date().getFullYear());

      fila.push({
        numero: dia,
        tieneRecorridos: tieneRecorridos,
        clase: tieneRecorridos ? 'recorrido-si' : 'recorrido-no',
        esHoy: esHoy
      });

      dia++;
    }

    while (fila.length < 7) {
      fila.push(null);
    }
    matriz.push(fila);

    return matriz;
  };
  
  // Manejadores para cambiar de mes/año
  const cambiarMes = (delta) => {
    let nuevoMes = mesActual + delta;
    let nuevoAño = añoActual;
    
    if (nuevoMes > 12) {
      nuevoMes = 1;
      nuevoAño += 1;
    } else if (nuevoMes < 1) {
      nuevoMes = 12;
      nuevoAño -= 1;
    }
    
    setMesActual(nuevoMes);
    setAñoActual(nuevoAño);
  };

  const matrizCalendario = generarCalendario();

  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <h2>📊 Dashboard de Recorridos</h2>
      </div>

      <div className="calendar-controls">
        <button onClick={() => cambiarMes(-1)} className="btn btn-secondary">{'< Mes Anterior'}</button>
        <h3>{nombresMeses[mesActual - 1]} {añoActual}</h3>
        <button onClick={() => cambiarMes(1)} className="btn btn-secondary">{'Siguiente Mes >'}</button>
        <button 
          onClick={exportarPDF} 
          className="btn btn-primary"
          disabled={Object.keys(recorridosMensuales).length === 0}
        >
          📄 Exportar PDF
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <p>🔄 Cargando datos del recorrido...</p>
        </div>
      ) : (
        <>
          <div className="dashboard-summary">
            <h4>Resumen del Mes:</h4>
            <div className="legend">
              <span className="recorrido-si-leyenda">Día con Recorrido</span>
              <span className="recorrido-no-leyenda">Día sin Recorrido</span>
            </div>
          </div>

          <div className="calendar-grid">
            <div className="calendar-header">
              <span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span>
            </div>
            {matrizCalendario.map((semana, idx) => (
              <div key={idx} className="calendar-week">
                {semana.map((dia, dIdx) => (
                  <div 
                    key={dIdx} 
                    className={`calendar-day ${dia ? dia.clase : 'empty'} ${dia && dia.esHoy ? 'today' : ''}`}
                    title={dia ? (dia.tieneRecorridos ? `Recorridos: ${recorridosMensuales[dia.numero]?.length || 0}` : 'Sin recorridos') : ''}
                  >
                    {dia && dia.numero}
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          <div className="recorridos-detail">
            <h4>📊 Resumen de Recorridos del Mes</h4>
            {Object.keys(recorridosMensuales).length === 0 ? (
              <div className="empty-state">
                <p>📅 No hay recorridos registrados para este mes.</p>
                <p>Los recorridos aparecerán aquí una vez que se creen en la sección de Recorridos.</p>
              </div>
            ) : (
              <div className="recorridos-summary">
                <div className="summary-header">
                  <div className="summary-stat">
                    <span className="stat-number">{Object.keys(recorridosMensuales).length}</span>
                    <span className="stat-label">Días con Recorridos</span>
                  </div>
                  <div className="summary-stat">
                    <span className="stat-number">
                      {Object.values(recorridosMensuales).reduce((total, recorridos) => total + recorridos.length, 0)}
                    </span>
                    <span className="stat-label">Total de Recorridos</span>
                  </div>
                </div>
                
                <div className="recorridos-timeline">
                  <h5>🗓️ Cronología del Mes</h5>
                  <div className="timeline-grid">
                    {Object.keys(recorridosMensuales)
                      .filter(dia => !isNaN(parseInt(dia)))
                      .sort((a, b) => parseInt(a) - parseInt(b))
                      .map(dia => (
                        <div key={dia} className="timeline-item">
                          <div className="timeline-date">
                            <span className="dia-numero">{dia}</span>
                            <span className="dia-mes">{nombresMeses[mesActual - 1].substring(0, 3)}</span>
                          </div>
                          <div className="timeline-content">
                            <div className="recorrido-count">
                              {recorridosMensuales[dia].length} recorrido{recorridosMensuales[dia].length > 1 ? 's' : ''}
                            </div>
                            <div className="recorrido-details">
                              {recorridosMensuales[dia].map((recorrido, idx) => (
                                <div key={idx} className="recorrido-mini">
                                  <span className="recorrido-hora">{recorrido.hora_inicio}</span>
                                  <span className="recorrido-tipo">{recorrido.tipo_recorrido || 'Recorrido'}</span>
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
    </div>
  );
};

export default Dashboard;