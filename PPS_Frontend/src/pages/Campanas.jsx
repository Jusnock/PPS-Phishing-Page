import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Mail,
  Plus,
  Send,
  Layers,
  Edit2,
  Trash2,
  Play,
  CheckCircle2,
  AlertTriangle,
  X,
  Code,
  Sparkles,
  HelpCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Inbox
} from 'lucide-react';

export default function Campanas() {
  const [usuario, setUsuario] = useState(null);
  const [tabActual, setTabActual] = useState('ESCENARIOS');
  
  const [escenarios, setEscenarios] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [campaignsReal, setCampaignsReal] = useState([]);
  const [cargando, setCargando] = useState(true);

  // --- Sistema de Notificaciones ---
  const [toast, setToast] = useState({ visible: false, mensaje: '', tipo: 'exito' });
  const [confirmar, setConfirmar] = useState({ visible: false, mensaje: '', accion: null });

  const mostrarToast = (mensaje, tipo = 'exito') => {
    setToast({ visible: true, mensaje, tipo });
    setTimeout(() => setToast({ visible: false, mensaje: '', tipo: 'exito' }), 3000);
  };

  const pedirConfirmacion = (mensaje, accion) => {
    setConfirmar({ visible: true, mensaje, accion });
  };

  // --- Estados Escenarios (Bandeja de Entrada) ---
  const [panelEscenarioOpen, setPanelEscenarioOpen] = useState(false);
  const [modoEscenario, setModoEscenario] = useState('CREAR');
  const [escenarioActual, setEscenarioActual] = useState(null);
  const [formEscenario, setFormEscenario] = useState({
    titulo_interno: '', remitente_nombre: '', remitente_email: '', asunto_simulado: '', cuerpo_html: '', 
    es_phishing: true, dificultad: 'MEDIA', explicacion_titulo: '', explicacion_texto: '', clues: []
  });

  // --- Estados Quizzes (Campañas) ---
  const [panelQuizOpen, setPanelQuizOpen] = useState(false);
  const [modoQuiz, setModoQuiz] = useState('CREAR');
  const [quizActual, setQuizActual] = useState(null);
  const [formQuiz, setFormQuiz] = useState({
    titulo: '', descripcion: '', activo: true
  });

  // --- Estados Simulaciones Reales (SMTP) ---
  const [panelSimOpen, setPanelSimOpen] = useState(false);
  const [formSim, setFormSim] = useState({
    nombre: '', scenario_id: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const resUser = await api.get('/users/me');
      setUsuario(resUser.data);

      const [resEscenarios, resQuizzes, resCampaigns] = await Promise.all([
        api.get('/scenarios/'),
        api.get('/quizzes/'),
        api.get('/campaigns/')
      ]);
      
      setEscenarios(resEscenarios.data);
      setQuizzes(resQuizzes.data);
      setCampaignsReal(resCampaigns.data);
      setCargando(false);
    } catch (err) {
      mostrarToast('Error crítico al cargar el laboratorio.', 'error');
      setCargando(false);
    }
  };

  // ==========================================
  // HANDLERS ESCENARIOS
  // ==========================================
  const abrirPanelNuevoEscenario = () => {
    setModoEscenario('CREAR');
    setEscenarioActual(null);
    setFormEscenario({ titulo_interno: '', remitente_nombre: '', remitente_email: '', asunto_simulado: '', cuerpo_html: '', es_phishing: true, dificultad: 'MEDIA', explicacion_titulo: '', explicacion_texto: '', clues: [] });
    setPanelEscenarioOpen(true);
  };

  const iniciarEdicionEscenario = (esc) => {
    setModoEscenario('EDITAR');
    setEscenarioActual(esc);
    setFormEscenario({ ...esc, clues: esc.clues || [], explicacion_titulo: esc.explicacion_titulo || '', explicacion_texto: esc.explicacion_texto || '' });
    setPanelEscenarioOpen(true);
  };

  const cerrarPanelEscenario = () => {
    setPanelEscenarioOpen(false);
  };

  const handleSubmitEscenario = async (e) => {
    e.preventDefault();
    try {
      if (modoEscenario === 'CREAR') {
        await api.post('/scenarios/', formEscenario);
        mostrarToast('Correo simulado creado correctamente');
      } else {
        await api.put(`/scenarios/${escenarioActual.id}`, formEscenario);
        mostrarToast('Correo actualizado exitosamente');
      }
      cerrarPanelEscenario();
      cargarDatos();
    } catch (err) { mostrarToast('Error al guardar el escenario.', 'error'); }
  };

  const handleBorrarEscenario = (id) => {
    pedirConfirmacion("¿Borrar este correo? Desaparecerá de las evaluaciones que lo usen.", async () => {
      try {
        await api.delete(`/scenarios/${id}`);
        cargarDatos();
        mostrarToast('Correo eliminado');
      } catch (err) { mostrarToast('Error al borrar.', 'error'); }
    });
  };

  const agregarPista = () => {
    setFormEscenario(prev => ({ ...prev, clues: [...prev.clues, { texto: '', posicion: 'top-10 left-10' }] }));
  };

  const actualizarPista = (index, campo, valor) => {
    const nuevasPistas = [...formEscenario.clues];
    nuevasPistas[index][campo] = valor;
    setFormEscenario(prev => ({ ...prev, clues: nuevasPistas }));
  };

  const borrarPista = (index) => {
    const nuevasPistas = formEscenario.clues.filter((_, i) => i !== index);
    setFormEscenario(prev => ({ ...prev, clues: nuevasPistas }));
  };

  // ==========================================
  // HANDLERS QUIZZES (Campañas Automáticas)
  // ==========================================
  const abrirPanelNuevoQuiz = () => {
    setModoQuiz('CREAR');
    setQuizActual(null);
    setFormQuiz({ titulo: '', descripcion: '', activo: true });
    setPanelQuizOpen(true);
  };

  const iniciarEdicionQuiz = (quiz) => {
    setModoQuiz('EDITAR');
    setQuizActual(quiz);
    setFormQuiz({ titulo: quiz.titulo, descripcion: quiz.descripcion || '', activo: quiz.activo });
    setPanelQuizOpen(true);
  };

  const cerrarPanelQuiz = () => {
    setPanelQuizOpen(false);
  };

  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    try {
      if (modoQuiz === 'CREAR') {
        await api.post('/quizzes/', { ...formQuiz, scenario_ids: [] }); 
        mostrarToast('Campaña generada con éxito');
      } else {
        await api.put(`/quizzes/${quizActual.id}`, { ...formQuiz, scenario_ids: quizActual.scenarios.map(s => s.id) });
        mostrarToast('Estado de la campaña actualizado');
      }
      cerrarPanelQuiz();
      cargarDatos();
    } catch (err) { mostrarToast('Error al procesar la campaña.', 'error'); }
  };

  const handleBorrarQuiz = (id) => {
    pedirConfirmacion("¿Eliminar esta evaluación de entrenamiento por completo?", async () => {
      try {
        await api.delete(`/quizzes/${id}`);
        cargarDatos();
        mostrarToast('Campaña eliminada');
      } catch (err) { mostrarToast('Error al borrar.', 'error'); }
    });
  };

  // ==========================================
  // HANDLERS SIMULACIONES REALES (SMTP / TRACKING)
  // ==========================================
  const abrirPanelNuevaSim = () => {
    setFormSim({ nombre: '', scenario_id: '' });
    setPanelSimOpen(true);
  };

  const cerrarPanelSim = () => {
    setPanelSimOpen(false);
  };

  const handleSubmitSim = async (e) => {
    e.preventDefault();
    if (!formSim.scenario_id) {
      mostrarToast('Por favor, selecciona un correo plantilla.', 'error');
      return;
    }
    try {
      await api.post('/campaigns/', {
        nombre: formSim.nombre,
        scenario_id: parseInt(formSim.scenario_id)
      });
      mostrarToast('Campaña de simulación registrada correctamente.');
      cerrarPanelSim();
      cargarDatos();
    } catch (err) {
      mostrarToast('Error al registrar la campaña.', 'error');
    }
  };

  const handleLanzarSim = async (id, nombre) => {
    pedirConfirmacion(`¿Lanzar simulación real '${nombre}'? Esto enviará correos de simulación a toda tu nómina de destinatarios.`, async () => {
      try {
        await api.post(`/campaigns/${id}/launch`);
        mostrarToast('¡Simulación lanzada! Los correos se están enviando.');
        cargarDatos();
      } catch (err) {
        mostrarToast('Error al lanzar la simulación.', 'error');
      }
    });
  };

  const handleBorrarSim = (id) => {
    pedirConfirmacion("¿Eliminar esta campaña de simulación? Se borrarán todos sus registros asociados.", async () => {
      try {
        await api.delete(`/campaigns/${id}`);
        cargarDatos();
        mostrarToast('Campaña de simulación eliminada.');
      } catch (err) {
        mostrarToast('Error al borrar la campaña.', 'error');
      }
    });
  };

  if (cargando) {
    return (
      <div className="flex flex-col justify-center items-center h-80">
        <div className="animate-spin h-8 w-8 border-4 border-cpce-blue border-t-transparent rounded-full mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Cargando laboratorio de campañas...</p>
      </div>
    );
  }

  // NOTIFICACIONES UI
  const NotificacionesUI = (
    <>
      {toast.visible && (
        <div className={`fixed bottom-6 right-6 z-[80] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold animate-fade-in border ${
          toast.tipo === 'exito' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {toast.tipo === 'exito' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{toast.mensaje}</span>
        </div>
      )}

      {confirmar.visible && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[90] flex justify-center items-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 text-cpce-red flex items-center justify-center mx-auto mb-3 border border-red-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Confirmar Acción</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">{confirmar.mensaje}</p>
            </div>
            <div className="flex border-t border-slate-100 bg-slate-50 p-2 gap-2">
              <button 
                onClick={() => setConfirmar({ visible: false, mensaje: '', accion: null })} 
                className="flex-1 px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={() => { confirmar.accion(); setConfirmar({ visible: false, mensaje: '', accion: null }); }} 
                className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-cpce-red hover:bg-red-600 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Sí, proceder
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {NotificacionesUI}
      
      {/* Cabecera Principal y Tabs */}
      <div className="pb-2 border-b border-slate-200">
        <div className="mb-4">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Laboratorio de Simulación & Campañas
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Diseña correos de simulación, configura evaluaciones de concientización y administra envíos SMTP en vivo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setTabActual('ESCENARIOS')} 
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tabActual === 'ESCENARIOS' 
                ? 'bg-cpce-blue text-white shadow-xs' 
                : 'text-slate-600 hover:text-cpce-blue hover:bg-slate-100'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Banco de Casos ({escenarios.length})</span>
          </button>
          
          <button 
            onClick={() => setTabActual('QUIZZES')} 
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tabActual === 'QUIZZES' 
                ? 'bg-cpce-blue text-white shadow-xs' 
                : 'text-slate-600 hover:text-cpce-blue hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Quizzes de Concientización</span>
          </button>
          
          <button 
            onClick={() => setTabActual('SIMULACIONES')} 
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tabActual === 'SIMULACIONES' 
                ? 'bg-cpce-blue text-white shadow-xs' 
                : 'text-slate-600 hover:text-cpce-blue hover:bg-slate-100'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Simulaciones SMTP</span>
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* PESTAÑA 1: ESCENARIOS (Correos) */}
      {/* ========================================== */}
      {tabActual === 'ESCENARIOS' && (
        <div className="space-y-4 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Catálogo de Casos y Correos</h2>
              <p className="text-xs text-slate-500 font-medium">Plantillas de phishing y correos legítimos con pistas interactivas.</p>
            </div>
            <button 
              onClick={abrirPanelNuevoEscenario} 
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-cpce-blue rounded-lg hover:bg-cpce-dark transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Diseñar Nuevo Correo</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-700">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3.5 px-4">Identificador Interno</th>
                    <th className="py-3.5 px-4">Bandeja Simulada</th>
                    <th className="py-3.5 px-4 text-center">Clasificación</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {escenarios.map(esc => (
                    <tr key={esc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">{esc.titulo_interno}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{esc.remitente_nombre || 'Sin Remitente'}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{esc.remitente_email || 'correo@ejemplo.com'}</span>
                          <span className="text-[11px] text-slate-500 mt-0.5 italic truncate max-w-md">"{esc.asunto_simulado}"</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          esc.es_phishing 
                            ? 'bg-red-50 text-red-700 border-red-200' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {esc.es_phishing ? 'Phishing' : 'Legítimo'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => iniciarEdicionEscenario(esc)} 
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg text-cpce-blue bg-blue-50/50 hover:bg-cpce-blue hover:text-white border border-blue-200 transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                          <button 
                            onClick={() => handleBorrarEscenario(esc.id)} 
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg text-cpce-red hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Borrar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {escenarios.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-10 text-center text-slate-400 text-xs font-medium">El banco de correos está vacío. Crea tu primer escenario.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* PESTAÑA 2: QUIZZES (Campañas Automáticas) */}
      {/* ========================================== */}
      {tabActual === 'QUIZZES' && (
        <div className="space-y-4 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Evaluaciones Activas</h2>
              <p className="text-xs text-slate-500 font-medium">Cuestionarios configurados para que los empleados se autoevalúen.</p>
            </div>
            <button 
              onClick={abrirPanelNuevoQuiz} 
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-cpce-blue rounded-lg hover:bg-cpce-dark transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generar Campaña</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-700">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3.5 px-4">Nombre de la Campaña</th>
                    <th className="py-3.5 px-4 text-center">Escenarios</th>
                    <th className="py-3.5 px-4 text-center">Estado</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {quizzes.map(quiz => (
                    <tr key={quiz.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 text-sm">{quiz.titulo}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm truncate">{quiz.descripcion || 'Generada dinámicamente'}</p>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-cpce-blue font-bold font-mono text-xs border border-blue-100">
                          {quiz.scenarios?.length || 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          quiz.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {quiz.activo ? 'En Curso' : 'Finalizada'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => iniciarEdicionQuiz(quiz)} 
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg text-cpce-blue bg-blue-50/50 hover:bg-cpce-blue hover:text-white border border-blue-200 transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                          <button 
                            onClick={() => handleBorrarQuiz(quiz.id)} 
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg text-cpce-red hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {quizzes.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-10 text-center text-slate-400 text-xs font-medium">No hay evaluaciones configuradas.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* PESTAÑA 3: SIMULACIONES REALES (SMTP) */}
      {/* ========================================== */}
      {tabActual === 'SIMULACIONES' && (
        <div className="space-y-4 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Monitoreo de Envíos Masivos (SMTP)</h2>
              <p className="text-xs text-slate-500 font-medium">Lanzamiento de correos simulados a las bandejas reales de tus destinatarios.</p>
            </div>
            <button 
              onClick={abrirPanelNuevaSim} 
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-cpce-blue rounded-lg hover:bg-cpce-dark transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Simulación SMTP</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-700">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3.5 px-4">Campaña de Simulación</th>
                    <th className="py-3.5 px-4">Correo Plantilla (Escenario)</th>
                    <th className="py-3.5 px-4 text-center">Fecha Registro</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {campaignsReal.map(c => {
                    const esc = escenarios.find(e => e.id === c.scenario_id);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900 text-sm">{c.nombre}</p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">Ref: #SIM-{String(c.id).padStart(3, '0')}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">{esc?.titulo_interno || 'Plantilla Eliminada'}</span>
                            <span className="text-[11px] text-slate-400 font-mono">Remitente: {esc?.remitente_email}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-500">
                          {new Date(c.fecha_creacion).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button 
                              onClick={() => handleLanzarSim(c.id, c.nombre)} 
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Lanzar SMTP</span>
                            </button>
                            <button 
                              onClick={() => handleBorrarSim(c.id)} 
                              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-cpce-red hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {campaignsReal.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-10 text-center text-slate-400 text-xs font-medium">No hay simulaciones SMTP configuradas.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* PANEL LATERAL (OFF-CANVAS): CREADOR DE ESCENARIOS */}
      {/* ========================================== */}
      {panelEscenarioOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={cerrarPanelEscenario}></div>
          
          <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col border-l border-cpce-blue">
            
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900">{modoEscenario === 'EDITAR' ? 'Modificar Escenario' : 'Constructor de Escenario'}</h2>
                <p className="text-xs text-slate-500 font-medium">Define la plantilla HTML y la lógica de retroalimentación.</p>
              </div>
              <button onClick={cerrarPanelEscenario} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-200 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form id="form-escenario" onSubmit={handleSubmitEscenario} className="space-y-6">
                
                {/* Bloque 1: General */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <Settings className="w-4 h-4 text-cpce-blue" />
                    <span>Configuración General</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Identificador de uso interno</label>
                    <input type="text" required value={formEscenario.titulo_interno} onChange={e => setFormEscenario({...formEscenario, titulo_interno: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none bg-slate-50" placeholder="Ej: Microsoft 365 - Password Expiration" />
                  </div>
                  
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-xs font-semibold text-slate-700">¿Este correo es un Ataque Phishing?</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={formEscenario.es_phishing} onChange={e => setFormEscenario({...formEscenario, es_phishing: e.target.checked})} className="sr-only peer" />
                      <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cpce-red"></div>
                    </label>
                  </div>
                </div>

                <div className="border-t border-slate-200"></div>

                {/* Bloque 2: Anatomía del Correo */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <Mail className="w-4 h-4 text-cpce-blue" />
                    <span>Interfaz del Correo</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Remitente</label>
                      <input type="text" required value={formEscenario.remitente_nombre} onChange={e => setFormEscenario({...formEscenario, remitente_nombre: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none bg-slate-50" placeholder="Ej: Seguridad IT" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Remitente</label>
                      <input type="email" required value={formEscenario.remitente_email} onChange={e => setFormEscenario({...formEscenario, remitente_email: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-cpce-blue outline-none bg-slate-50" placeholder="security@microsoft-alert.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Asunto del Correo</label>
                    <input type="text" required value={formEscenario.asunto_simulado} onChange={e => setFormEscenario({...formEscenario, asunto_simulado: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none bg-slate-50" placeholder="URGENTE: Contraseña expirada" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cuerpo del Correo (HTML)
                    </label>
                    <textarea required value={formEscenario.cuerpo_html} onChange={e => setFormEscenario({...formEscenario, cuerpo_html: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none font-mono h-32 resize-y bg-zinc-900 text-emerald-400" placeholder="<div>...</div>"></textarea>
                  </div>
                </div>

                <div className="border-t border-slate-200"></div>

                {/* Bloque 3: Retroalimentación */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-cpce-blue" />
                    <span>Motor de Retroalimentación</span>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Título de la Explicación</label>
                    <input type="text" value={formEscenario.explicacion_titulo} onChange={e => setFormEscenario({...formEscenario, explicacion_titulo: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none bg-slate-50" placeholder="Ej: Phishing: Suplantación de Identidad" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Texto de la Explicación Pedagógica</label>
                    <textarea value={formEscenario.explicacion_texto} onChange={e => setFormEscenario({...formEscenario, explicacion_texto: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none h-20 resize-none bg-slate-50" placeholder="Explicación paso a paso de por qué es phishing o legítimo..."></textarea>
                  </div>

                  {/* Gestor de Pistas */}
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Pistas Flotantes (Tooltips)</label>
                      <button type="button" onClick={agregarPista} className="text-xs bg-blue-50 text-cpce-blue font-bold px-2.5 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">+ Pista</button>
                    </div>
                    
                    <div className="space-y-2">
                      {formEscenario.clues.map((pista, index) => (
                        <div key={index} className="flex gap-2 items-start bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <div className="flex-1 space-y-1.5">
                            <select 
                              value={pista.posicion} 
                              onChange={(e) => actualizarPista(index, 'posicion', e.target.value)} 
                              className="w-full border border-slate-300 rounded-lg text-xs px-2 py-1 text-slate-700 outline-none bg-white cursor-pointer"
                            >
                              <option value="">Elemento a señalar...</option>
                              <option value="top-8 left-10">Asunto del correo</option>
                              <option value="top-20 left-10">Dirección del remitente</option>
                              <option value="top-20 right-10">Fecha u hora</option>
                              <option value="top-1/3 left-10">Texto introductorio</option>
                              <option value="top-1/2 left-1/2 -translate-x-1/2">Botón de acción / Enlace</option>
                              <option value="bottom-1/4 left-10">Archivo adjunto</option>
                              <option value="bottom-10 left-10">Firma institucional</option>
                            </select>
                            <textarea value={pista.texto} onChange={(e) => actualizarPista(index, 'texto', e.target.value)} className="w-full border border-slate-300 rounded-lg text-xs px-2 py-1 outline-none h-10 resize-none bg-white" placeholder="Texto didáctico de la pista..."></textarea>
                          </div>
                          <button type="button" onClick={() => borrarPista(index)} className="p-1.5 text-cpce-red hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {formEscenario.clues.length === 0 && <p className="text-xs text-slate-400 italic text-center border border-dashed border-slate-300 rounded-xl py-3">Sin pistas agregadas.</p>}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2.5 shrink-0">
              <button type="button" onClick={cerrarPanelEscenario} className="flex-1 bg-white border border-slate-300 text-slate-700 font-semibold text-xs py-2.5 px-4 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button type="submit" form="form-escenario" className="flex-1 bg-cpce-blue text-white font-semibold text-xs py-2.5 px-4 rounded-lg hover:bg-cpce-dark transition-colors shadow-xs cursor-pointer">
                {modoEscenario === 'EDITAR' ? 'Guardar Cambios' : 'Crear Escenario'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* PANEL LATERAL: CREADOR DE QUIZZES */}
      {/* ========================================== */}
      {panelQuizOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={cerrarPanelQuiz}></div>
          
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col border-l border-cpce-blue">
            
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <h2 className="text-base font-bold text-slate-900">{modoQuiz === 'EDITAR' ? 'Modificar Campaña' : 'Generar Campaña'}</h2>
              <button onClick={cerrarPanelQuiz} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-200 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center">
              <form id="form-quiz" onSubmit={handleSubmitQuiz} className="space-y-5">
                
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex gap-3">
                  <Sparkles className="w-5 h-5 text-cpce-blue shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Generación Automática</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-medium">El sistema seleccionará escenarios del banco de correos para construir la evaluación del personal.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Título de la Evaluación</label>
                  <input type="text" required value={formQuiz.titulo} onChange={e => setFormQuiz({...formQuiz, titulo: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none bg-slate-50" placeholder="Ej: Evaluación Anual CPCE 2026" />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción / Objetivo</label>
                  <textarea value={formQuiz.descripcion} onChange={e => setFormQuiz({...formQuiz, descripcion: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none h-20 resize-none bg-slate-50" placeholder="Objetivo de esta evaluación..."></textarea>
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-700">Campaña Activa</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={formQuiz.activo} onChange={e => setFormQuiz({...formQuiz, activo: e.target.checked})} className="sr-only peer" />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2.5 shrink-0">
              <button type="button" onClick={cerrarPanelQuiz} className="flex-1 bg-white border border-slate-300 text-slate-700 font-semibold text-xs py-2.5 px-4 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button type="submit" form="form-quiz" className="flex-1 bg-cpce-blue text-white font-semibold text-xs py-2.5 px-4 rounded-lg hover:bg-cpce-dark transition-colors shadow-xs cursor-pointer">
                {modoQuiz === 'EDITAR' ? 'Actualizar Campaña' : 'Lanzar Campaña'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* PANEL LATERAL: SIMULACIONES SMTP */}
      {/* ========================================== */}
      {panelSimOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={cerrarPanelSim}></div>
          
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col border-l border-cpce-blue">
            
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <h2 className="text-base font-bold text-slate-900">Alta de Simulación SMTP</h2>
              <button onClick={cerrarPanelSim} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-200 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center">
              <form id="form-sim" onSubmit={handleSubmitSim} className="space-y-5">
                
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Advertencia de Seguridad</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-medium">Esta acción programará el envío de correos directos a la nómina de destinatarios para auditar su vulnerabilidad.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de la Campaña</label>
                  <input type="text" required value={formSim.nombre} onChange={e => setFormSim({...formSim, nombre: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none bg-slate-50" placeholder="Ej: Simulación AFIP - Agosto 2026" />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Plantilla (Escenario)</label>
                  <select 
                    required 
                    value={formSim.scenario_id} 
                    onChange={e => setFormSim({...formSim, scenario_id: e.target.value})} 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none bg-white cursor-pointer"
                  >
                    <option value="">Selecciona una plantilla...</option>
                    {escenarios.map(esc => (
                      <option key={esc.id} value={esc.id}>
                        {esc.titulo_interno} ({esc.es_phishing ? 'Phishing' : 'Legítimo'})
                      </option>
                    ))}
                  </select>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2.5 shrink-0">
              <button type="button" onClick={cerrarPanelSim} className="flex-1 bg-white border border-slate-300 text-slate-700 font-semibold text-xs py-2.5 px-4 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button type="submit" form="form-sim" className="flex-1 bg-cpce-blue text-white font-semibold text-xs py-2.5 px-4 rounded-lg hover:bg-cpce-dark transition-colors shadow-xs cursor-pointer">
                Registrar Campaña
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
