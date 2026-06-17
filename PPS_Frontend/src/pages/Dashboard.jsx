import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell } from 'recharts';

export default function Dashboard() {
  const [usuario, setUsuario] = useState(null);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // --- Estados para los filtros ---
  const [busquedaEmpresa, setBusquedaEmpresa] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroRiesgo, setFiltroRiesgo] = useState('TODOS');
  const [seccionActual, setSeccionActual] = useState('QUIZ');
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    cargarDashboard(null);
  }, []);

  const cargarDashboard = async (companyId = null) => {
    try {
      setCargando(true);
      const resUser = await api.get('/users/me');
      setUsuario(resUser.data);

      if (resUser.data.rol === 'EMPLEADO') {
        navigate('/quiz');
        return;
      }

      const url = companyId 
        ? `/stats/dashboard?company_id=${companyId}` 
        : '/stats/dashboard';

      const resStats = await api.get(url);
      setDatos(resStats.data);
      setCargando(false);
    } catch (err) {
      setError('Error al cargar las métricas. Verifica la conexión con el servidor.');
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64 bg-slate-50 min-h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-[#0A4F9F] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto mt-6 p-4 bg-white border border-red-100 text-red-700 text-sm rounded-lg shadow-sm font-semibold">
        {error}
      </div>
    );
  }

  // ============================================================================
  // VISTA 1: SUPERADMIN (Look Institucional y Moderno)
  // ============================================================================
  if (usuario?.rol === 'SUPERADMIN' && Array.isArray(datos) && !empresaSeleccionada) {
    
    const empresasFiltradas = datos.filter(emp => 
      emp.empresa_nombre.toLowerCase().includes(busquedaEmpresa.toLowerCase()) ||
      emp.dominio.toLowerCase().includes(busquedaEmpresa.toLowerCase())
    );

    const totalEmpresas = datos.length;
    const totalEmpleadosGlobal = datos.reduce((acc, emp) => acc + emp.empleados, 0);
    const empresasConPartidas = datos.filter(emp => emp.partidas > 0);
    const promedioAciertosGlobal = empresasConPartidas.length > 0 
      ? Math.round(empresasConPartidas.reduce((acc, emp) => acc + emp.tasa_acierto, 0) / empresasConPartidas.length) 
      : 0;

    return (
      <div className="animate-fade-in bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8 pt-10">
          
          {/* HEADER SECCIÓN */}
          <div className="mb-10 pb-5 border-b border-slate-200">
            <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">Monitor Global de Instituciones</h1>
            <p className="text-base font-medium text-slate-600 mt-1.5">Resumen operativo y nivel de resiliencia del ecosistema adherido.</p>
          </div>

          {/* Tarjetas KPI Modernas (Estilo CPCE) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            
            {/* KPI: Acierto Global */}
            <div className="bg-white p-7 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-6 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-[#0A4F9F]"></div>
               <div className="bg-blue-50 text-[#0A4F9F] h-14 w-14 rounded-xl flex items-center justify-center border border-blue-100">
                 <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
               </div>
               <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Acierto Global</p>
                  <h3 className="text-4xl font-black text-[#0A4F9F] tracking-tight">{promedioAciertosGlobal}%</h3>
               </div>
            </div>

            {/* KPI: Instituciones */}
            <div className="bg-white p-7 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-6">
               <div className="bg-slate-100 text-slate-600 h-14 w-14 rounded-xl flex items-center justify-center border border-slate-200">
                 <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
               </div>
               <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Instituciones</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight">{totalEmpresas}</h3>
               </div>
            </div>

            {/* KPI: Empleados */}
            <div className="bg-white p-7 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-6">
               <div className="bg-slate-100 text-slate-600 h-14 w-14 rounded-xl flex items-center justify-center border border-slate-200">
                 <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
               </div>
               <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Personal Evaluado</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight">{totalEmpleadosGlobal}</h3>
               </div>
            </div>
          </div>

          {/* Tabla de Instituciones */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            
            {/* Barra de Herramientas de Tabla */}
            <div className="p-6 border-b border-slate-100 bg-white flex flex-col md:flex-row justify-between items-center gap-4">
               <h2 className="text-xl font-bold text-slate-950">Rendimiento Detallado</h2>
               
               <div className="relative w-full md:w-80">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Buscar por nombre o dominio institucional..." 
                    value={busquedaEmpresa}
                    onChange={(e) => setBusquedaEmpresa(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0A4F9F] focus:border-[#0A4F9F] bg-white outline-none"
                  />
                </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold text-left">Institución</th>
                    <th className="px-6 py-4 font-bold text-center">Evaluados</th>
                    <th className="px-6 py-4 font-bold text-center">Partidas</th>
                    <th className="px-6 py-4 font-bold text-left min-w-[200px]">Acierto Promedio</th>
                    <th className="px-6 py-4 font-bold text-center">Estado General</th>
                    <th className="px-6 py-4 font-bold text-right">Reportes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {empresasFiltradas.map((emp, index) => {
                    const esSeguro = emp.tasa_acierto >= 80;
                    const esRiesgo = emp.tasa_acierto < 50;
                    const barColor = esSeguro ? 'bg-[#0A4F9F]' : (esRiesgo ? 'bg-red-600' : 'bg-amber-500');

                    return (
                      <tr key={index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{emp.empresa_nombre}</span>
                            <span className="text-xs text-slate-500 font-mono mt-0.5">@{emp.dominio}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center font-semibold text-slate-700">{emp.empleados}</td>
                        <td className="px-6 py-5 text-center text-slate-500">{emp.partidas}</td>
                        <td className="px-6 py-5">
                          {emp.partidas > 0 ? (
                            <div className="flex flex-col gap-1.5">
                              <span className={`font-black text-lg ${esSeguro ? 'text-emerald-600' : esRiesgo ? 'text-red-600' : 'text-amber-500'}`}>
                                {emp.tasa_acierto}%
                              </span>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                                <div className={`h-full ${barColor}`} style={{ width: `${emp.tasa_acierto}%` }}></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Sin datos aún</span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-center">
                          {emp.partidas > 0 ? (
                             <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                esSeguro ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                esRiesgo ? 'bg-red-50 text-red-700 border-red-200' : 
                                'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {esSeguro ? 'Óptimo' : esRiesgo ? 'Riesgo' : 'Mejorable'}
                             </span>
                          ) : (
                            <span className="inline-flex px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button 
                            onClick={() => {
                              setEmpresaSeleccionada(emp);
                              cargarDashboard(emp.empresa_id);
                            }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-md text-cpce-blue bg-white border border-cpce-blue hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                          >
                            Ver Detalles
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {empresasFiltradas.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-500 text-sm font-medium">No se encontraron instituciones.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VISTA 2: ADMIN EMPRESA (Look Institucional y Moderno)
  // ============================================================================
  if ((usuario?.rol === 'ADMIN_EMPRESA' || empresaSeleccionada) && datos?.empleados) {

    const exportarCSV = () => {
      const cabeceras = ["ID,Nombre,Email,Estado de Riesgo,Aciertos (%),Tiempo Promedio (s)"];
      const filas = empleadosFiltrados.map(emp => 
        `${emp.id},"${emp.nombre}","${emp.email}","${emp.estado}",${emp.aciertos},${emp.tiempo}`
      );
      const contenidoCSV = cabeceras.concat(filas).join("\n");
      const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Reporte_Auditoria_CPCE_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const totalEmpleados = datos.empleados.length;
    const promedioAciertos = totalEmpleados > 0 
      ? Math.round(datos.empleados.reduce((acc, emp) => acc + emp.aciertos, 0) / totalEmpleados) 
      : 0;
    const promedioTiempo = totalEmpleados > 0 
      ? (datos.empleados.reduce((acc, emp) => acc + emp.tiempo, 0) / totalEmpleados).toFixed(1) 
      : 0;

    const empleadosFiltrados = datos.empleados.filter(emp => {
      const coincideBusqueda = emp.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                               emp.email.toLowerCase().includes(busqueda.toLowerCase());
      const coincideRiesgo = filtroRiesgo === 'TODOS' || emp.estado === filtroRiesgo;
      return coincideBusqueda && coincideRiesgo;
    });

    const simStats = datos.simulacion || {
      total_destinatarios: 0, total_enviados: 0, total_abiertos: 0, total_clics: 0, ctr_global: 0.0,
      campanas: [], departamentos: [], ultimos_eventos: []
    };

    const colorCTR = simStats.ctr_global >= 30 ? 'text-red-600' : simStats.ctr_global >= 10 ? 'text-amber-500' : 'text-emerald-600';
    const borderCTR = simStats.ctr_global >= 30 ? 'bg-red-500' : simStats.ctr_global >= 10 ? 'bg-amber-500' : 'bg-emerald-500';

    return (
      <div className="animate-fade-in bg-slate-50 min-h-screen print:bg-white print:p-0">
        
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            .print\\:hidden { display: none !important; }
            .print\\:full-width { width: 100% !important; max-width: 100% !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; border: none !important; background: transparent !important; }
            .print\\:page-break { page-break-before: always; }
            .print\\:border { border: 1px solid #cbd5e1 !important; border-radius: 4px !important; }
            body { font-size: 11pt !important; background: #fff !important; }
          }
        `}} />

        <div className="max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8 pt-10 print:full-width">
          
          {/* HEADER SECCIÓN CON BOTÓN EXPORTAR */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-5 border-b border-slate-200 gap-4 print:full-width">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">Reporte de Auditoría de Ciberseguridad</h1>
              <p className="text-base font-medium text-slate-600 mt-1.5 font-semibold">
                Métricas de concientización y resiliencia del personal ({empresaSeleccionada ? empresaSeleccionada.empresa_nombre : 'CPCE Mendoza'}).
              </p>
            </div>
            
            <div className="flex gap-3 print:hidden">
              {empresaSeleccionada && (
                <button 
                  onClick={() => {
                    setEmpresaSeleccionada(null);
                    cargarDashboard(null);
                  }}
                  className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                >
                  Volver al Monitor Global
                </button>
              )}
              {seccionActual === 'QUIZ' ? (
                <button 
                  onClick={exportarCSV} 
                  className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                >
                  <svg className="w-5 h-5 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Exportar CSV
                </button>
              ) : null}
              
              <button 
                onClick={() => window.print()} 
                className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-[#0A4F9F] rounded-lg hover:bg-[#084183] transition-colors shadow-sm cursor-pointer"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Exportar PDF (Imprimir)
              </button>
            </div>
          </div>

          {/* Selector de subsecciones */}
          <div className="flex space-x-6 mb-8 border-b border-slate-200 pb-2 print:hidden">
            <button 
              onClick={() => setSeccionActual('QUIZ')} 
              className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${seccionActual === 'QUIZ' ? 'text-[#0A4F9F]' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <span className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> Quiz de Concientización</span>
              {seccionActual === 'QUIZ' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0A4F9F]"></span>}
            </button>
            
            <button 
              onClick={() => setSeccionActual('SIMULACION')} 
              className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${seccionActual === 'SIMULACION' ? 'text-[#0A4F9F]' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <span className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> Simulaciones de Correo (SMTP)</span>
              {seccionActual === 'SIMULACION' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0A4F9F]"></span>}
            </button>
          </div>

          {/* ==================================================================== */}
          {/* MÓDULO A: ESTADÍSTICAS DEL QUIZ INTERACTIVO */}
          {/* ==================================================================== */}
          {seccionActual === 'QUIZ' && (
            <div className="space-y-10 animate-fade-in print:full-width">
              {/* Tarjetas KPI (Quiz) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-7 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-6 relative overflow-hidden print:border">
                  <div className={`absolute top-0 left-0 w-full h-1 ${promedioAciertos >= 80 ? 'bg-emerald-500' : promedioAciertos >= 50 ? 'bg-amber-500' : 'bg-red-600'}`}></div>
                   <div className="bg-blue-50 text-[#0A4F9F] h-14 w-14 rounded-xl flex items-center justify-center border border-blue-100">
                     <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                   </div>
                   <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Índice de Resiliencia (Quiz)</p>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tight">{promedioAciertos}%</h3>
                   </div>
                </div>

                <div className="bg-white p-7 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-6 print:border">
                   <div className="bg-slate-100 text-slate-600 h-14 w-14 rounded-xl flex items-center justify-center border border-slate-200">
                     <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                   </div>
                   <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Personal Evaluado</p>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tight">{totalEmpleados}</h3>
                   </div>
                </div>

                <div className="bg-white p-7 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-6 print:border">
                   <div className="bg-slate-100 text-slate-600 h-14 w-14 rounded-xl flex items-center justify-center border border-slate-200">
                     <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   </div>
                   <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Reacción Promedio</p>
                      <div className="flex items-baseline gap-1.5">
                        <h3 className="text-4xl font-black text-slate-900 tracking-tight">{promedioTiempo}</h3>
                        <span className="text-xl font-semibold text-slate-500">s</span>
                      </div>
                   </div>
                </div>
              </div>

              {/* Tabla de Personal */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden print:border">
                <div className="p-6 border-b border-slate-100 bg-white flex flex-col md:flex-row gap-4 justify-between items-center print:hidden">
                  <h2 className="text-xl font-bold text-slate-950">Auditoría Operativa de Personal</h2>
                  
                  <div className="flex w-full md:w-auto gap-3">
                    <div className="relative w-full md:w-80">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Buscar por nombre o correo..." 
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0A4F9F] focus:border-[#0A4F9F] bg-white outline-none"
                      />
                    </div>
                    
                    <select 
                      value={filtroRiesgo}
                      onChange={(e) => setFiltroRiesgo(e.target.value)}
                      className="block w-full md:w-48 px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A4F9F] focus:border-[#0A4F9F] bg-white cursor-pointer font-semibold text-slate-700"
                    >
                      <option value="TODOS">Todos los perfiles</option>
                      <option value="En Riesgo">En Riesgo (Crítico)</option>
                      <option value="Vulnerable">Mejorable (Alerta)</option>
                      <option value="Protegido">Seguro (Óptimo)</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-auto">
                    <thead>
                      <tr className="bg-blue-50 text-xs text-slate-600 uppercase tracking-wider">
                        <th className="px-6 py-4 font-bold">Colaborador</th>
                        <th className="px-6 py-4 font-bold text-center">Nivel de Riesgo</th>
                        <th className="px-6 py-4 font-bold text-center">Tasa de Acierto</th>
                        <th className="px-6 py-4 font-bold text-center">Tiempo de Reacción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {empleadosFiltrados.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-1">
                              <span className="font-bold text-slate-900">{emp.nombre}</span>
                              <span className="text-xs text-slate-500 font-mono tracking-tight">{emp.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                              emp.estado === 'Protegido' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              emp.estado === 'Vulnerable' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {emp.estado === 'En Riesgo' ? 'Crítico' : emp.estado === 'Vulnerable' ? 'Alerta' : 'Óptimo'}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center font-semibold text-lg text-slate-700">
                            {emp.aciertos}%
                          </td>
                          <td className="px-6 py-5 text-center text-slate-700">
                            <span className="font-semibold text-base">{emp.tiempo}</span>
                            <span className="text-slate-500 text-sm ml-1">seg</span>
                          </td>
                        </tr>
                      ))}
                      {empleadosFiltrados.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center text-slate-500 text-sm font-medium">No se encontraron registros.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* MÓDULO B: ESTADÍSTICAS DE SIMULACIÓN REAL SMTP */}
          {/* ==================================================================== */}
          {seccionActual === 'SIMULACION' && (
            <div className="space-y-10 animate-fade-in print:full-width">
              
              {/* Tarjetas KPI (Simulación) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-4 relative overflow-hidden print:border">
                   <div className="bg-blue-50 text-[#0A4F9F] h-12 w-12 rounded-xl flex items-center justify-center border border-blue-100">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                   </div>
                   <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nómina Objetivos</p>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight">{simStats.total_destinatarios}</h3>
                   </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-4 relative overflow-hidden print:border">
                   <div className="bg-slate-100 text-slate-600 h-12 w-12 rounded-xl flex items-center justify-center border border-slate-200">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                   </div>
                   <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Simulacros Enviados</p>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight">{simStats.total_enviados}</h3>
                   </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-4 relative overflow-hidden print:border">
                   <div className="bg-slate-100 text-slate-600 h-12 w-12 rounded-xl flex items-center justify-center border border-slate-200">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                   </div>
                   <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Aperturas Detectadas</p>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight">{simStats.total_abiertos}</h3>
                   </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-4 relative overflow-hidden print:border">
                   <div className={`absolute top-0 left-0 w-full h-1 ${borderCTR}`}></div>
                   <div className="bg-blue-50 text-[#0A4F9F] h-12 w-12 rounded-xl flex items-center justify-center border border-blue-100">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                   </div>
                   <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tasa Clics Global</p>
                      <h3 className={`text-3xl font-black tracking-tight ${colorCTR}`}>{simStats.ctr_global}%</h3>
                   </div>
                </div>
              </div>

              {/* Sección Gráficos (Recharts) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:full-width">
                
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 print:border">
                  <h3 className="text-lg font-bold text-slate-950 mb-6">Nivel de Clics (Riesgo) por Departamento</h3>
                  <div className="h-64 w-full">
                    {simStats.departamentos.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={simStats.departamentos} layout="vertical" margin={{ left: 20, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 100]} unit="%" />
                          <YAxis dataKey="departamento" type="category" width={80} />
                          <Tooltip formatter={(value) => [`${value}%`, 'Tasa de Riesgo (Clics)']} />
                          <Bar dataKey="riesgo" fill="#0A4F9F" radius={[0, 4, 4, 0]}>
                            {simStats.departamentos.map((entry, index) => {
                              const color = entry.riesgo >= 30 ? '#ef4444' : entry.riesgo >= 10 ? '#f59e0b' : '#10b981';
                              return <Cell key={`cell-${index}`} fill={color} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-sm text-slate-400 italic">No hay datos por departamento registrados.</div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 print:border">
                  <h3 className="text-lg font-bold text-slate-950 mb-6">Embudo Operativo por Departamento</h3>
                  <div className="h-64 w-full">
                    {simStats.departamentos.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={simStats.departamentos}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="departamento" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="enviados" name="Enviados" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="clics" name="Clicks" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-sm text-slate-400 italic">No hay datos registrados.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabla de Campañas SMTP */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden print:border">
                <div className="p-6 border-b border-slate-100 bg-white">
                  <h2 className="text-xl font-bold text-slate-950">Historial Detallado de Simulaciones SMTP</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-auto">
                    <thead>
                      <tr className="bg-blue-50 text-xs text-slate-600 uppercase tracking-wider">
                        <th className="px-6 py-4 font-bold">Campaña</th>
                        <th className="px-6 py-4 font-bold text-center">Enviados</th>
                        <th className="px-6 py-4 font-bold text-center">Abiertos (Pixel)</th>
                        <th className="px-6 py-4 font-bold text-center">Clickeados (Enlace)</th>
                        <th className="px-6 py-4 font-bold text-center">CTR (Tasa Clics)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {simStats.campanas.map((c) => {
                        const esCritico = c.ctr >= 30;
                        const esAlerta = c.ctr >= 10 && c.ctr < 30;
                        return (
                          <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-5 font-bold text-slate-900">{c.campana}</td>
                            <td className="px-6 py-5 text-center font-semibold text-slate-700">{c.enviados}</td>
                            <td className="px-6 py-5 text-center text-slate-600">{c.abiertos}</td>
                            <td className="px-6 py-5 text-center text-slate-600 font-bold">{c.clics}</td>
                            <td className="px-6 py-5 text-center">
                              <span className={`font-black text-base ${esCritico ? 'text-red-600' : esAlerta ? 'text-amber-500' : 'text-emerald-600'}`}>
                                {c.ctr}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {simStats.campanas.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center text-slate-500 text-sm font-medium">No se han registrado campañas de simulación.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Feed de Últimos Eventos de Simulación */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden print:border">
                <div className="p-6 border-b border-slate-100 bg-white">
                  <h2 className="text-xl font-bold text-slate-950">Bitácora de Eventos de Tracking Recientes</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-auto">
                    <thead>
                      <tr className="bg-blue-50 text-xs text-slate-600 uppercase tracking-wider">
                        <th className="px-6 py-4 font-bold">Fecha / Hora</th>
                        <th className="px-6 py-4 font-bold">Destinatario</th>
                        <th className="px-6 py-4 font-bold">Campaña</th>
                        <th className="px-6 py-4 font-bold text-center">Evento</th>
                        <th className="px-6 py-4 font-bold">Detalle Conexión</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {simStats.ultimos_eventos.map((e) => (
                        <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                            {new Date(e.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900">{e.destinatario}</span>
                              <span className="text-xs text-slate-500 font-mono">{e.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-700">{e.campana}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${
                              e.tipo === 'CLICK' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-cpce-blue border-blue-200'
                            }`}>
                              {e.tipo === 'CLICK' ? 'Acceso Link' : 'Apertura'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                            <div className="flex flex-col gap-0.5">
                              <span>IP: {e.ip || "N/A"}</span>
                              <span className="max-w-xs truncate" title={e.ua}>UA: {e.ua || "N/A"}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {simStats.ultimos_eventos.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center text-slate-500 text-sm font-medium">Esperando interacciones de los destinatarios...</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
            </div>
          )}

        </div>
      </div>
    );
  }

  return null;
}