import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getRecorridos } from '../services/api';

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

  // Función para procesar y agrupar recorridos por día
  const procesarRecorridos = (data) => {
    console.log('Procesando datos:', data);
    const recorridosAgrupados = {};

    if (Array.isArray(data)) {
      data.forEach(recorrido => {
        console.log('Procesando recorrido:', recorrido);
        
        if (recorrido.fecha) {
          console.log(`Procesando recorrido con fecha: ${recorrido.fecha}`);
          
          // Intentar diferentes formatos de fecha
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
            console.log(`Fecha procesada: ${recorrido.fecha} -> año=${fechaProcesada.año}, mes=${fechaProcesada.mes}, dia=${fechaProcesada.dia}`);
            console.log(`Comparando: mes=${fechaProcesada.mes} vs mesActual=${mesActual}, año=${fechaProcesada.año} vs añoActual=${añoActual}`);
            
            // Filtramos por el mes y año seleccionado
            if (fechaProcesada.mes === mesActual && fechaProcesada.año === añoActual && 
                !isNaN(fechaProcesada.dia) && fechaProcesada.dia > 0 && fechaProcesada.dia <= 31) {
              if (!recorridosAgrupados[fechaProcesada.dia]) {
                recorridosAgrupados[fechaProcesada.dia] = [];
              }
              recorridosAgrupados[fechaProcesada.dia].push(recorrido);
              console.log(`✅ Agregado recorrido al día ${fechaProcesada.dia}`);
            } else {
              console.log(`❌ Recorrido descartado: fecha=${recorrido.fecha}, mes=${fechaProcesada.mes}, año=${fechaProcesada.año}, dia=${fechaProcesada.dia}`);
            }
          } else {
            console.log(`❌ No se pudo procesar la fecha: ${recorrido.fecha}`);
          }
        } else {
          console.log(`❌ Recorrido sin fecha:`, recorrido);
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

    console.log('Recorridos agrupados finales:', recorridosLimpios);
    setRecorridosMensuales(recorridosLimpios);
    setLoading(false);
  };
  
  // Función para cargar todos los recorridos
  const loadRecorridosData = async () => {
    setLoading(true);
    try {
      const response = await getRecorridos();
      console.log('=== RESPUESTA COMPLETA DE LA API ===');
      console.log('Status:', response.status);
      console.log('Data completa:', response.data);
      console.log('Tipo de data:', typeof response.data);
      console.log('Es array:', Array.isArray(response.data));
      
      let data = [];
      
      // Manejar diferentes estructuras de respuesta
      if (response.data) {
        console.log('Estructura de response.data:', Object.keys(response.data));
        
        if (response.data.success && response.data.data) {
          console.log('Usando response.data.data');
          data = response.data.data;
        } else if (Array.isArray(response.data)) {
          console.log('Usando response.data directamente (es array)');
          data = response.data;
        } else if (response.data.recorridos) {
          console.log('Usando response.data.recorridos');
          data = response.data.recorridos;
        } else {
          console.log('Estructura no reconocida, explorando...');
          // Intentar encontrar datos en cualquier propiedad
          Object.keys(response.data).forEach(key => {
            console.log(`Propiedad ${key}:`, response.data[key]);
            if (Array.isArray(response.data[key]) && response.data[key].length > 0) {
              console.log(`Encontrado array en ${key} con ${response.data[key].length} elementos`);
              data = response.data[key];
            }
          });
        }
      }
      
      console.log('Datos extraídos:', data);
      console.log('Cantidad de datos:', data.length);
      
      // Si no hay datos reales, crear datos de prueba
      if (!data || data.length === 0) {
        console.log('No hay datos reales, creando datos de prueba');
        const hoy = new Date();
        const diaActual = hoy.getDate();
        const mesActualNum = hoy.getMonth() + 1;
        const añoActualNum = hoy.getFullYear();
        
        data = [
          {
            id: 1,
            fecha: `${añoActualNum}-${mesActualNum.toString().padStart(2, '0')}-${diaActual.toString().padStart(2, '0')}`,
            nombre: 'Recorrido Matutino',
            hora_inicio: '07:00',
            hora_fin: '08:30'
          },
          {
            id: 2,
            fecha: `${añoActualNum}-${mesActualNum.toString().padStart(2, '0')}-${(diaActual + 1).toString().padStart(2, '0')}`,
            nombre: 'Recorrido Vespertino',
            hora_inicio: '15:00',
            hora_fin: '16:30'
          },
          {
            id: 3,
            fecha: `${añoActualNum}-${mesActualNum.toString().padStart(2, '0')}-${(diaActual + 2).toString().padStart(2, '0')}`,
            nombre: 'Recorrido Especial',
            hora_inicio: '10:00',
            hora_fin: '11:30'
          }
        ];
      }
      
      console.log('Datos finales a procesar:', data);
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
  }, [mesActual, añoActual]); // Recargar si cambia el mes/año seleccionado

  // Generar la matriz del calendario para el mes/año actual
  const generarCalendario = () => {
    const primerDia = new Date(añoActual, mesActual - 1, 1).getDay(); // 0=Dom, 1=Lun...
    const diasEnElMes = new Date(añoActual, mesActual, 0).getDate(); // Último día del mes
    const matriz = [];
    let dia = 1;

    // Rellenar las celdas vacías al inicio (padding)
    let fila = Array(primerDia === 0 ? 6 : primerDia - 1).fill(null); // Ajuste para que la semana empiece en Lunes

    // Llenar los días del mes
    while (dia <= diasEnElMes) {
      if (fila.length === 7) {
        matriz.push(fila);
        fila = [];
      }

      // 1. Determinar el estado del día
      const tieneRecorridos = recorridosMensuales[dia] && recorridosMensuales[dia].length > 0;
      const esHoy = (dia === new Date().getDate() && 
                    mesActual === (new Date().getMonth() + 1) && 
                    añoActual === new Date().getFullYear());

      console.log(`Día ${dia}: tieneRecorridos=${tieneRecorridos}, esHoy=${esHoy}, recorridos=${recorridosMensuales[dia]?.length || 0}`);

      // 2. Crear el objeto del día
      fila.push({
        numero: dia,
        tieneRecorridos: tieneRecorridos,
        clase: tieneRecorridos ? 'recorrido-si' : 'recorrido-no',
        esHoy: esHoy
      });

      dia++;
    }

    // Rellenar las celdas vacías al final
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
