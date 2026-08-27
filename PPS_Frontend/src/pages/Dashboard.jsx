import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Building2,
  Send,
  MailOpen,
  AlertTriangle,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  GraduationCap,
  Mail,
  Activity,
  Layers
} from 'lucide-react';

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
      <div className="flex flex-col justify-center items-center h-96 bg-slate-50">
        <div className="animate-spin h-10 w-10 border-4 border-cpce-blue border-t-transparent rounded-full mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Cargando métricas de seguridad...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto mt-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl shadow-xs font-semibold flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <span>{error}</span>
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
      <div className="space-y-6 animate-fade-in">
        
        {/* HEADER SECCIÓN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Monitor Global de Instituciones</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">Resumen operativo y nivel de resiliencia del ecosistema adherido a CPCE Mendoza.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-cpce-blue border border-blue-200">
              <Building2 className="w-3.5 h-3.5" />
              <span>{totalEmpresas} Instituciones Registradas</span>
            </span>
          </div>
        </div>

        {/* Tarjetas KPI Modernas (Estilo CPCE) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          
          {/* KPI: Acierto Global */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs relative overflow-hidden flex items-center gap-4 hover:shadow-sm transition-all">
            <div className="absolute top-0 left-0 w-full h-1 bg-cpce-blue"></div>
            <div className="bg-blue-50 text-cpce-blue h-12 w-12 rounded-xl flex items-center justify-center border border-blue-100 shrink-0">
              <ShieldCheck className="w-6 h-6 text-cpce-blue" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Acierto Global</p>
              <h3 className="text-3xl font-extrabold text-cpce-blue tracking-tight">{promedioAciertosGlobal}%</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Promedio ponderado</p>
            </div>
          </div>

          {/* KPI: Instituciones */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs relative overflow-hidden flex items-center gap-4 hover:shadow-sm transition-all">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-400"></div>
            <div className="bg-slate-100 text-slate-700 h-12 w-12 rounded-xl flex items-center justify-center border border-slate-200 shrink-0">
              <Building2 className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Instituciones</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalEmpresas}</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Organizaciones activas</p>
            </div>
          </div>

          {/* KPI: Empleados */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs relative overflow-hidden flex items-center gap-4 hover:shadow-sm transition-all">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
            <div className="bg-emerald-50 text-emerald-700 h-12 w-12 rounded-xl flex items-center justify-center border border-emerald-200 shrink-0">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Personal Evaluado</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalEmpleadosGlobal}</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Usuarios alcanzados</p>
            </div>
          </div>
        </div>

        {/* Tabla de Instituciones */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          
          {/* Barra de Herramientas de Tabla */}
          <div className="p-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Rendimiento por Institución</h2>
              <p className="text-xs text-slate-500 font-medium">Haz clic en "Ver Detalles" para auditar cada organización.</p>
            </div>
             
            <div className="relative w-full sm:w-80">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Buscar institución o dominio..." 
                value={busquedaEmpresa}
                onChange={(e) => setBusquedaEmpresa(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-cpce-blue focus:ring-1 focus:ring-cpce-blue transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3.5 px-4">Institución</th>
                  <th className="py-3.5 px-4 text-center">Evaluados</th>
                  <th className="py-3.5 px-4 text-center">Partidas</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Acierto Promedio</th>
                  <th className="py-3.5 px-4 text-center">Estado General</th>
                  <th className="py-3.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {empresasFiltradas.map((emp, index) => {
                  const esSeguro = emp.tasa_acierto >= 80;
                  const esRiesgo = emp.tasa_acierto < 50;
                  const barColor = esSeguro ? 'bg-emerald-500' : (esRiesgo ? 'bg-red-500' : 'bg-amber-500');

                  return (
                    <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm">{emp.empresa_nombre}</span>
                          <span className="text-[11px] text-slate-400 font-mono">@{emp.dominio}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-800">{emp.empleados}</td>
                      <td className="py-3.5 px-4 text-center text-slate-500">{emp.partidas}</td>
                      <td className="py-3.5 px-4">
                        {emp.partidas > 0 ? (
                          <div className="flex flex-col gap-1">
                            <span className={`font-bold text-xs ${esSeguro ? 'text-emerald-700' : esRiesgo ? 'text-red-700' : 'text-amber-700'}`}>
                              {emp.tasa_acierto}%
                            </span>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                              <div className={`h-full ${barColor}`} style={{ width: `${emp.tasa_acierto}%` }}></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Sin partidas aún</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {emp.partidas > 0 ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            esSeguro ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                            esRiesgo ? 'bg-red-50 text-red-700 border-red-200' : 
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {esSeguro ? 'Óptimo' : esRiesgo ? 'Riesgo' : 'Alerta'}
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button 
                          onClick={() => {
                            setEmpresaSeleccionada(emp);
                            cargarDashboard(emp.empresa_id);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-cpce-blue bg-blue-50/50 hover:bg-cpce-blue hover:text-white border border-blue-200 transition-all cursor-pointer shadow-2xs"
                        >
                          <span>Ver Detalles</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {empresasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-400 text-xs font-medium">No se encontraron instituciones registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VISTA 2: ADMIN EMPRESA O VISTA ESPECÍFICA DE INSTITUCIÓN
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

    const exportarPDF = () => {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const docWidth = doc.internal.pageSize.getWidth();
      const docHeight = doc.internal.pageSize.getHeight();
      
      const simStats = {
        total_destinatarios: datos.simulacion?.total_destinatarios || 0,
        total_enviados: datos.simulacion?.total_enviados || 0,
        total_abiertos: datos.simulacion?.total_abiertos || 0,
        total_clics: datos.simulacion?.total_clics || 0,
        ctr_global: datos.simulacion?.ctr_global || 0.0,
        campanas: datos.simulacion?.campanas || [],
        departamentos: datos.simulacion?.departamentos || [],
        ultimos_eventos: datos.simulacion?.ultimos_eventos || []
      };

      const drawHeader = (title) => {
        doc.setFillColor(0, 74, 152); // CPCE Blue #004A98
        doc.rect(0, 0, docWidth, 32, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(title.toUpperCase(), 15, 17);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text("Plataforma de Simulación de Phishing (PPS) - CPCE Mendoza", 15, 24);
      };

      const drawFooter = (pageNumber, totalPages) => {
        doc.setDrawColor(226, 232, 240);
        doc.line(15, docHeight - 15, docWidth - 15, docHeight - 15);

        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text("Reporte de Auditoría Confidencial - CPCE Mendoza", 15, docHeight - 10);
        doc.text(`Página ${pageNumber} de ${totalPages}`, docWidth - 15, docHeight - 10, { align: 'right' });
      };

      // --- PAGE 1: RESUMEN EJECUTIVO ---
      drawHeader("Reporte de Auditoría de Ciberseguridad");

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text("Institución / Empresa:", 15, 45);
      doc.setFont('helvetica', 'normal');
      doc.text(empresaSeleccionada ? empresaSeleccionada.empresa_nombre : "CPCE Mendoza", 60, 45);

      doc.setFont('helvetica', 'bold');
      doc.text("Fecha del Reporte:", 15, 51);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }), 60, 51);

      doc.setFont('helvetica', 'bold');
      doc.text("Generado por:", 15, 57);
      doc.setFont('helvetica', 'normal');
      doc.text(`${usuario?.nombre || 'Administrador'} (${usuario?.rol || 'ADMIN'})`, 60, 57);

      doc.setDrawColor(226, 232, 240);
      doc.line(15, 63, docWidth - 15, 63);

      doc.setFillColor(248, 250, 252);
      doc.rect(15, 68, docWidth - 30, 38, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, 68, docWidth - 30, 38, 'S');

      doc.setTextColor(0, 74, 152);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("MÉTRICAS DE ENTRENAMIENTO (QUIZ DE CONCIENTIZACIÓN)", 20, 76);

      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("Personal Evaluado:", 20, 85);
      doc.setFont('helvetica', 'normal');
      doc.text(`${totalEmpleados} colaboradores`, 65, 85);

      doc.setFont('helvetica', 'bold');
      doc.text("Tasa Promedio de Acierto:", 20, 92);
      doc.setFont('helvetica', 'normal');
      doc.text(`${promedioAciertos}%`, 65, 92);

      doc.setFont('helvetica', 'bold');
      doc.text("Tiempo Medio de Respuesta:", 20, 99);
      doc.setFont('helvetica', 'normal');
      doc.text(`${promedioTiempo} segundos`, 65, 99);

      // Section 2: Simulaciones SMTP
      doc.setFillColor(248, 250, 252);
      doc.rect(15, 112, docWidth - 30, 44, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, 112, docWidth - 30, 44, 'S');

      doc.setTextColor(0, 74, 152);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("MÉTRICAS DE SIMULACIÓN REAL DE PHISHING (SMTP)", 20, 120);

      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("Envíos Totales:", 20, 129);
      doc.setFont('helvetica', 'normal');
      doc.text(`${simStats.total_enviados} correos`, 65, 129);

      doc.setFont('helvetica', 'bold');
      doc.text("Aperturas Detectadas:", 20, 136);
      doc.setFont('helvetica', 'normal');
      doc.text(`${simStats.total_abiertos} (${simStats.total_enviados > 0 ? Math.round((simStats.total_abiertos/simStats.total_enviados)*100) : 0}%)`, 65, 136);

      doc.setFont('helvetica', 'bold');
      doc.text("Clics en Enlace Trampa (CTR):", 20, 143);
      doc.setFont('helvetica', 'normal');
      doc.text(`${simStats.total_clics} clics (${simStats.ctr_global}%)`, 65, 143);

      doc.setFont('helvetica', 'bold');
      doc.text("Diagnóstico de Vulnerabilidad:", 20, 150);
      doc.setFont('helvetica', 'normal');
      doc.text(simStats.ctr_global >= 30 ? "NIVEL CRÍTICO" : simStats.ctr_global >= 10 ? "NIVEL MODERADO" : "NIVEL RESILIENTE", 65, 150);

      drawFooter(1, 3);

      // --- PAGE 2: PERSONAL DETALLADO ---
      doc.addPage();
      drawHeader("Detalle Operativo del Personal (Quiz)");

      const tableBodyPersonal = empleadosFiltrados.map((emp) => [
        emp.nombre,
        emp.email,
        emp.estado === 'En Riesgo' ? 'Crítico' : emp.estado === 'Vulnerable' ? 'Alerta' : 'Óptimo',
        `${emp.aciertos}%`,
        `${emp.tiempo}s`
      ]);

      autoTable(doc, {
        startY: 42,
        head: [['Colaborador', 'Correo Institucional', 'Nivel de Riesgo', 'Aciertos', 'Tiempo']],
        body: tableBodyPersonal,
        theme: 'striped',
        headStyles: { fillColor: [0, 74, 152], textColor: [255, 255, 255] },
        columnStyles: {
          2: { fontStyle: 'bold', halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' }
        },
        didParseCell: function(data) {
          if (data.section === 'body' && data.column.index === 2) {
            if (data.cell.raw === 'Crítico') data.cell.styles.textColor = [239, 68, 68];
            else if (data.cell.raw === 'Alerta') data.cell.styles.textColor = [245, 158, 11];
            else data.cell.styles.textColor = [16, 185, 129];
          }
        },
        margin: { left: 15, right: 15 },
        styles: { fontSize: 8.5 }
      });

      drawFooter(2, 3);

      // --- PAGE 3: SIMULACIONES SMTP ---
      doc.addPage();
      drawHeader("Detalle de Simulaciones de Correo");

      const tableBodyCampanas = simStats.campanas.map((c) => [
        c.campana,
        c.enviados,
        c.abiertos,
        c.clics,
        `${c.ctr}%`
      ]);

      autoTable(doc, {
        startY: 42,
        head: [['Campaña de Simulación', 'Enviados', 'Abiertos', 'Clics', 'Tasa Clics (CTR)']],
        body: tableBodyCampanas,
        theme: 'striped',
        headStyles: { fillColor: [0, 74, 152], textColor: [255, 255, 255] },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { fontStyle: 'bold', halign: 'center' }
        },
        margin: { left: 15, right: 15 },
        styles: { fontSize: 8.5 }
      });

      let currentY = doc.lastAutoTable.finalY + 10;
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("BITÁCORA DE INTERACCIONES RECIENTES", 15, currentY);

      const tableBodyEventos = simStats.ultimos_eventos.slice(0, 15).map((e) => [
        new Date(e.timestamp).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
        e.destinatario || e.email,
        e.campana,
        e.tipo === 'CLICK' ? 'ACCESO ENLACE' : 'APERTURA',
        e.ip || "N/A"
      ]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [['Fecha / Hora', 'Destinatario', 'Campaña', 'Evento', 'IP']],
        body: tableBodyEventos,
        theme: 'striped',
        headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255] },
        columnStyles: {
          3: { fontStyle: 'bold', halign: 'center' },
          4: { halign: 'center' }
        },
        margin: { left: 15, right: 15 },
        styles: { fontSize: 8 }
      });

      drawFooter(3, 3);

      const filename = `Reporte_Auditoria_PPS_${empresaSeleccionada ? empresaSeleccionada.empresa_nombre.replace(/\s+/g, '_') : 'CPCE_Mendoza'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
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

    const colorCTR = simStats.ctr_global >= 30 ? 'text-red-600' : simStats.ctr_global >= 10 ? 'text-amber-600' : 'text-emerald-600';
    const borderCTR = simStats.ctr_global >= 30 ? 'bg-red-500' : simStats.ctr_global >= 10 ? 'bg-amber-500' : 'bg-emerald-500';

    return (
      <div className="space-y-6 animate-fade-in">
        
        {/* HEADER SECCIÓN CON BOTÓN EXPORTAR */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b border-slate-200 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reporte de Auditoría de Ciberseguridad</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Métricas de concientización y resiliencia ({empresaSeleccionada ? empresaSeleccionada.empresa_nombre : 'CPCE Mendoza'}).
            </p>
          </div>
          
          <div className="flex items-center gap-2.5 flex-wrap">
            {empresaSeleccionada && (
              <button 
                onClick={() => {
                  setEmpresaSeleccionada(null);
                  cargarDashboard(null);
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al Monitor</span>
              </button>
            )}

            {seccionActual === 'QUIZ' && (
              <button 
                onClick={exportarCSV} 
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                <span>Exportar CSV</span>
              </button>
            )}
            
            <button 
              onClick={exportarPDF} 
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-cpce-blue rounded-lg hover:bg-cpce-dark transition-colors shadow-xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>

        {/* SELECTOR DE SUBSECCIONES (TABS) */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button 
            onClick={() => setSeccionActual('QUIZ')} 
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              seccionActual === 'QUIZ' 
                ? 'bg-cpce-blue text-white shadow-xs' 
                : 'text-slate-600 hover:text-cpce-blue hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Quiz de Concientización</span>
          </button>
          
          <button 
            onClick={() => setSeccionActual('SIMULACION')} 
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              seccionActual === 'SIMULACION' 
                ? 'bg-cpce-blue text-white shadow-xs' 
                : 'text-slate-600 hover:text-cpce-blue hover:bg-slate-100'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Simulaciones SMTP</span>
          </button>
        </div>

        {/* ==================================================================== */}
        {/* MÓDULO A: ESTADÍSTICAS DEL QUIZ INTERACTIVO */}
        {/* ==================================================================== */}
        {seccionActual === 'QUIZ' && (
          <div className="space-y-6 animate-fade-in">
            {/* Tarjetas KPI (Quiz) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex items-center gap-4 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 ${promedioAciertos >= 80 ? 'bg-emerald-500' : promedioAciertos >= 50 ? 'bg-amber-500' : 'bg-red-600'}`}></div>
                <div className="bg-blue-50 text-cpce-blue h-12 w-12 rounded-xl flex items-center justify-center border border-blue-100 shrink-0">
                  <ShieldCheck className="w-6 h-6 text-cpce-blue" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Índice de Resiliencia</p>
                  <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{promedioAciertos}%</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Acierto global</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex items-center gap-4 relative overflow-hidden">
                <div className="bg-slate-100 text-slate-700 h-12 w-12 rounded-xl flex items-center justify-center border border-slate-200 shrink-0">
                  <Users className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Personal Evaluado</p>
                  <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalEmpleados}</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Colaboradores registrados</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex items-center gap-4 relative overflow-hidden">
                <div className="bg-slate-100 text-slate-700 h-12 w-12 rounded-xl flex items-center justify-center border border-slate-200 shrink-0">
                  <Clock className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reacción Promedio</p>
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{promedioTiempo}</h3>
                    <span className="text-sm font-semibold text-slate-400">seg</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Tiempo por pregunta</p>
                </div>
              </div>
            </div>

            {/* Tabla de Personal */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">Auditoría Individual de Personal</h2>
                  <p className="text-xs text-slate-500 font-medium">Desempeño y diagnóstico de cada colaborador en el cuestionario.</p>
                </div>
                
                <div className="flex w-full sm:w-auto gap-2.5">
                  <div className="relative w-full sm:w-64">
                    <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      placeholder="Buscar colaborador..." 
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-cpce-blue focus:ring-1 focus:ring-cpce-blue transition-all"
                    />
                  </div>
                  
                  <select 
                    value={filtroRiesgo}
                    onChange={(e) => setFiltroRiesgo(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 font-semibold text-slate-700 focus:outline-none focus:border-cpce-blue cursor-pointer"
                  >
                    <option value="TODOS">Todos los perfiles</option>
                    <option value="En Riesgo">En Riesgo (Crítico)</option>
                    <option value="Vulnerable">Alerta (Mejorable)</option>
                    <option value="Protegido">Seguro (Óptimo)</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-3.5 px-4">Colaborador</th>
                      <th className="py-3.5 px-4 text-center">Nivel de Riesgo</th>
                      <th className="py-3.5 px-4 text-center">Tasa de Acierto</th>
                      <th className="py-3.5 px-4 text-center">Tiempo de Reacción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {empleadosFiltrados.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-sm">{emp.nombre}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{emp.email}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            emp.estado === 'Protegido' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            emp.estado === 'Vulnerable' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {emp.estado === 'En Riesgo' ? 'Crítico' : emp.estado === 'Vulnerable' ? 'Alerta' : 'Óptimo'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-sm text-slate-800">
                          {emp.aciertos}%
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-600">
                          <span className="font-semibold">{emp.tiempo}</span>
                          <span className="text-[11px] text-slate-400 ml-0.5">s</span>
                        </td>
                      </tr>
                    ))}
                    {empleadosFiltrados.length === 0 && (
                      <tr>
                        <td colSpan="4" className="py-10 text-center text-slate-400 text-xs font-medium">No se encontraron colaboradores coincidentes.</td>
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
          <div className="space-y-6 animate-fade-in">
            
            {/* Tarjetas KPI (Simulación) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex items-center gap-4 relative overflow-hidden">
                <div className="bg-blue-50 text-cpce-blue h-12 w-12 rounded-xl flex items-center justify-center border border-blue-100 shrink-0">
                  <Users className="w-6 h-6 text-cpce-blue" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nómina Objetivos</p>
                  <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{simStats.total_destinatarios}</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Destinatarios cargados</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex items-center gap-4 relative overflow-hidden">
                <div className="bg-slate-100 text-slate-700 h-12 w-12 rounded-xl flex items-center justify-center border border-slate-200 shrink-0">
                  <Send className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Simulacros Enviados</p>
                  <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{simStats.total_enviados}</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Correos disparados</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex items-center gap-4 relative overflow-hidden">
                <div className="bg-sky-50 text-sky-700 h-12 w-12 rounded-xl flex items-center justify-center border border-sky-100 shrink-0">
                  <MailOpen className="w-6 h-6 text-sky-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Aperturas Detectadas</p>
                  <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{simStats.total_abiertos}</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Interacción confirmada</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex items-center gap-4 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 ${borderCTR}`}></div>
                <div className="bg-red-50 text-cpce-red h-12 w-12 rounded-xl flex items-center justify-center border border-red-100 shrink-0">
                  <AlertTriangle className="w-6 h-6 text-cpce-red" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tasa Clics Global (CTR)</p>
                  <h3 className={`text-3xl font-extrabold tracking-tight ${colorCTR}`}>{simStats.ctr_global}%</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{simStats.total_clics} clics en trampa</p>
                </div>
              </div>
            </div>

            {/* Sección Gráficos (Recharts) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-4 tracking-tight">Nivel de Clics (Riesgo) por Departamento</h3>
                <div className="h-64 w-full">
                  {simStats.departamentos.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={simStats.departamentos} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="departamento" type="category" width={90} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Tasa de Riesgo']} />
                        <Bar dataKey="riesgo" fill="#004A98" radius={[0, 4, 4, 0]}>
                          {simStats.departamentos.map((entry, index) => {
                            const color = entry.riesgo >= 30 ? '#ef4444' : entry.riesgo >= 10 ? '#f59e0b' : '#10b981';
                            return <Cell key={`cell-${index}`} fill={color} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">No hay datos por departamento registrados.</div>
                  )}
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-4 tracking-tight">Embudo de Envíos y Clics por Área</h3>
                <div className="h-64 w-full">
                  {simStats.departamentos.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={simStats.departamentos} margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="departamento" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="enviados" name="Enviados" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="clics" name="Clicks" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">No hay datos registrados.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabla de Campañas SMTP */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-white">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Historial Detallado de Simulaciones SMTP</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-3.5 px-4">Campaña</th>
                      <th className="py-3.5 px-4 text-center">Enviados</th>
                      <th className="py-3.5 px-4 text-center">Abiertos</th>
                      <th className="py-3.5 px-4 text-center">Clics Trampa</th>
                      <th className="py-3.5 px-4 text-center">Tasa Clics (CTR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {simStats.campanas.map((c) => {
                      const esCritico = c.ctr >= 30;
                      const esAlerta = c.ctr >= 10 && c.ctr < 30;
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">{c.campana}</td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-700">{c.enviados}</td>
                          <td className="py-3.5 px-4 text-center text-slate-600">{c.abiertos}</td>
                          <td className="py-3.5 px-4 text-center font-bold text-cpce-red">{c.clics}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`font-extrabold text-sm ${esCritico ? 'text-red-600' : esAlerta ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {c.ctr}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {simStats.campanas.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-10 text-center text-slate-400 text-xs font-medium">No se han registrado campañas de simulación.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Feed de Últimos Eventos de Simulación */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-white">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Bitácora de Eventos de Tracking Recientes</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-3.5 px-4">Fecha / Hora</th>
                      <th className="py-3.5 px-4">Destinatario</th>
                      <th className="py-3.5 px-4">Campaña</th>
                      <th className="py-3.5 px-4 text-center">Evento</th>
                      <th className="py-3.5 px-4">Detalle Conexión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {simStats.ultimos_eventos.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-[11px] text-slate-500 font-mono">
                          {new Date(e.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-xs">{e.destinatario}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{e.email}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">{e.campana}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            e.tipo === 'CLICK' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-cpce-blue border-blue-200'
                          }`}>
                            {e.tipo === 'CLICK' ? 'Acceso Enlace' : 'Apertura'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-500 font-mono">
                          <div className="flex flex-col gap-0.5">
                            <span>IP: {e.ip || "N/A"}</span>
                            <span className="max-w-xs truncate" title={e.ua}>UA: {e.ua || "N/A"}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {simStats.ultimos_eventos.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-10 text-center text-slate-400 text-xs font-medium">Esperando interacciones de los destinatarios...</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>
        )}

      </div>
    );
  }

  return null;
}
