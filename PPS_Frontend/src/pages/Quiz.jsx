import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  HelpCircle,
  Mail,
  Layers,
  Inbox,
  Sparkles,
  ChevronRight,
  Calendar,
  User,
  AlertTriangle
} from 'lucide-react';

export default function Quiz() {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  
  const [campanasDisponibles, setCampanasDisponibles] = useState([]);
  const [campanaActiva, setCampanaActiva] = useState(null);
  const [escenarios, setEscenarios] = useState([]);
  const [sesionId, setSesionId] = useState(null);

  const [fase, setFase] = useState('CARGANDO'); 
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [acerto, setAcerto] = useState(null);
  const [pistaActiva, setPistaActiva] = useState(0);
  const [tiempoInicio, setTiempoInicio] = useState(null);
  
  // Contador de aciertos para el reporte final
  const [aciertosTotales, setAciertosTotales] = useState(0);

  const emailContainerRef = useRef(null);
  const [estiloPista, setEstiloPista] = useState({});
  const [tooltipArriba, setTooltipArriba] = useState(false);

  useEffect(() => {
    cargarCampana();
  }, []);

  useEffect(() => {
    if (fase === 'PISTAS') {
      setTimeout(calcularPosicionPista, 50);
    }
  }, [fase, pistaActiva]);

  const cargarCampana = async () => {
    try {
      const resQuizzes = await api.get('/quizzes/');
      const activas = resQuizzes.data.filter(q => q.activo && q.scenarios.length > 0);

      if (activas.length === 0) {
        setFase('SIN_CAMPANAS');
      } else {
        setCampanasDisponibles(activas);
        setFase('LISTA'); 
      }
      setCargando(false);
    } catch (err) {
      setError('Error al cargar tu módulo de entrenamiento.');
      setCargando(false);
    }
  };

  const iniciarCampanaDirecta = async (campana) => {
    try {
      setCargando(true);
      setCampanaActiva(campana);
      const escenariosMezclados = [...campana.scenarios].sort(() => Math.random() - 0.5);
      setEscenarios(escenariosMezclados);
      
      setPreguntaActual(0);
      setAciertosTotales(0);

      const resUser = await api.get('/users/me');
      const resSession = await api.post('/sessions/', {
        user_id: resUser.data.id,
        quiz_id: campana.id 
      });
      
      setSesionId(resSession.data.id);
      setTiempoInicio(Date.now());
      setFase('PREGUNTA');
      setCargando(false);
    } catch (err) {
      setError('Error al iniciar la sesión de evaluación.');
      setCargando(false);
    }
  };

  const handleRespuesta = async (respuestaUsuarioEsPhishing) => {
    const escenario = escenarios[preguntaActual];
    const esCorrecto = respuestaUsuarioEsPhishing === escenario.es_phishing;
    const tiempoTardadoSegundos = Math.round((Date.now() - tiempoInicio) / 1000);

    setAcerto(esCorrecto);
    
    if (esCorrecto) {
      setAciertosTotales(prev => prev + 1);
    }

    setFase('RESULTADO');

    try {
      await api.post(`/sessions/${sesionId}/answers`, {
        scenario_id: escenario.id,
        identificado_como_phishing: respuestaUsuarioEsPhishing,
        tiempo_en_segundos: tiempoTardadoSegundos
      });
    } catch (err) {}
  };

  const handleMostrarPistas = () => {
    setFase('PISTAS');
    setPistaActiva(0);
  };

  const handleSiguientePista = async () => {
    const escenario = escenarios[preguntaActual];
    if (escenario.clues && pistaActiva < escenario.clues.length - 1) {
      setPistaActiva(pistaActiva + 1);
    } else {
      if (preguntaActual < escenarios.length - 1) {
        setPreguntaActual(preguntaActual + 1);
        setFase('PREGUNTA');
        setTiempoInicio(Date.now());
      } else {
        setFase('FIN');
        try {
          await api.put(`/sessions/${sesionId}/finish`);
        } catch (err) {}
      }
    }
  };

  const calcularPosicionPista = () => {
    const pista = escenarios[preguntaActual]?.clues[pistaActiva];
    const container = emailContainerRef.current;
    
    if (!container || !pista) return;

    let targetElement = null;
    const pos = pista.posicion;

    if (pos.includes('top-8')) targetElement = container.querySelector('[data-id="asunto"]');
    else if (pos.includes('top-20 left')) targetElement = container.querySelector('[data-id="remitente"]');
    else if (pos.includes('top-20 right')) targetElement = container.querySelector('[data-id="fecha"]');
    else if (pos.includes('top-1/3')) targetElement = container.querySelector('.cuerpo-html p:first-of-type');
    else if (pos.includes('top-1/2')) targetElement = container.querySelector('.cuerpo-html a, .cuerpo-html button');
    else if (pos.includes('bottom-1/4')) targetElement = container.querySelector('.cuerpo-html img');
    else if (pos.includes('bottom-10')) targetElement = container.querySelector('.cuerpo-html p:last-of-type');

    if (targetElement) {
      const containerRect = container.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      
      let calculatedTop = targetRect.bottom - containerRect.top + 15; 
      let calculatedLeft = targetRect.left - containerRect.left;
      let isAbove = false;

      if (calculatedTop + 140 > containerRect.height) {
        calculatedTop = targetRect.top - containerRect.top - 150; 
        isAbove = true;
      }

      if (calculatedLeft + 320 > containerRect.width) {
        calculatedLeft = containerRect.width - 340;
      }
      
      setEstiloPista({
        top: `${calculatedTop}px`,
        left: `${Math.max(10, calculatedLeft)}px`
      });
      setTooltipArriba(isAbove);

    } else {
      setEstiloPista({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
      setTooltipArriba(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex flex-col justify-center items-center h-80">
        <div className="animate-spin h-8 w-8 border-4 border-cpce-blue border-t-transparent rounded-full mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Cargando evaluación de seguridad...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-red-200 text-center shadow-lg">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">Aviso del Sistema</h3>
        <p className="text-xs text-slate-500 font-medium mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="w-full bg-cpce-blue hover:bg-cpce-dark text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (fase === 'SIN_CAMPANAS') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
        <div className="w-16 h-16 bg-blue-50 text-cpce-blue rounded-2xl flex items-center justify-center mb-4 border border-blue-100">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Todo al Día</h2>
        <p className="text-xs text-slate-500 max-w-sm font-medium">No tienes evaluaciones pendientes en este momento. Vuelve a consultar más tarde.</p>
      </div>
    );
  }

  if (fase === 'LISTA') {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4 animate-fade-in space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Módulos de Entrenamiento</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Selecciona una evaluación interactiva para medir tu capacidad de detección de phishing.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {campanasDisponibles.map(c => (
            <div key={c.id} className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-cpce-blue"></div>
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-blue-50 text-cpce-blue rounded-xl flex items-center justify-center border border-blue-100">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {c.scenarios?.length} Escenarios
                  </span>
                </div>
                
                <h3 className="text-base font-bold text-slate-900 group-hover:text-cpce-blue transition-colors mb-1.5">{c.titulo}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium mb-6 line-clamp-2">
                  {c.descripcion || "Módulo institucional de detección de ciberamenazas y suplantación de identidad."}
                </p>
              </div>

              <button 
                onClick={() => iniciarCampanaDirecta(c)} 
                className="w-full bg-cpce-blue hover:bg-cpce-dark text-white rounded-xl py-2.5 text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Comenzar Evaluación</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // PANTALLA DE RESULTADOS FINALES
  if (fase === 'FIN') {
    const porcentaje = Math.round((aciertosTotales / escenarios.length) * 100) || 0;
    const esExcelente = porcentaje >= 80;
    const colorTexto = esExcelente ? "text-emerald-600" : "text-cpce-blue";
    const bgIcono = esExcelente ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-blue-50 text-cpce-blue border-blue-200";
    const mensaje = esExcelente 
      ? "¡Excelente agudeza visual! Identificaste correctamente la gran mayoría de los vectores de ataque." 
      : "Buen intento. Te recomendamos revisar minuciosamente los nombres de dominio de remitentes y los enlaces antes de interactuar.";

    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 animate-fade-in">
        
        <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200 max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-cpce-blue"></div>
          
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resultado del Módulo</span>
          
          <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center my-5 shadow-2xs border ${bgIcono}`}>
            {esExcelente ? (
              <ShieldCheck className="w-8 h-8" />
            ) : (
              <Sparkles className="w-8 h-8" />
            )}
          </div>

          <div className={`text-5xl font-black mb-2 tracking-tight ${colorTexto}`}>
            {porcentaje}%
          </div>
          
          <p className="text-slate-900 font-bold text-sm mb-2">
            {aciertosTotales} de {escenarios.length} respuestas correctas
          </p>
          
          <p className="text-slate-500 text-xs mb-8 leading-relaxed font-medium">
            {mensaje}
          </p>
          
          <button 
            onClick={() => {
              setFase('CARGANDO'); 
              window.location.reload(); 
            }} 
            className="w-full bg-cpce-blue text-white py-3 rounded-xl font-semibold text-xs hover:bg-cpce-dark transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Finalizar y Salir</span>
          </button>
        </div>
      </div>
    );
  }

  const escenario = escenarios[preguntaActual];
  const pistas = escenario?.clues || [];

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 font-sans animate-fade-in space-y-6">
      
      {/* BARRA DE PROGRESO */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">Evaluación:</span>
          <span>{campanaActiva?.titulo}</span>
        </div>
        <span className="bg-slate-100 text-slate-700 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
          Caso {preguntaActual + 1} de {escenarios.length}
        </span>
      </div>

      {/* CABECERA DINÁMICA: PREGUNTA O RESULTADO */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-cpce-blue"></div>

        {fase === 'PREGUNTA' && (
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              ¿Este correo electrónico es legítimo o es un ataque de phishing?
            </h2>
            <p className="text-xs text-slate-500 font-medium max-w-lg mx-auto">
              Inspecciona cuidadosamente el remitente, el asunto y los enlaces simulados en la bandeja inferior.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button 
                onClick={() => handleRespuesta(true)} 
                className="bg-cpce-red hover:bg-red-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Es Phishing</span>
              </button>
              <button 
                onClick={() => handleRespuesta(false)} 
                className="bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-300 font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Es Legítimo</span>
              </button>
            </div>
          </div>
        )}

        {(fase === 'RESULTADO' || fase === 'PISTAS') && (
          <div className="space-y-3 animate-fade-in">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {acerto ? (
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> ¡Respuesta Correcta!
                </span>
              ) : (
                <span className="text-cpce-red bg-red-50 border border-red-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> ¡Respuesta Incorrecta!
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {escenario.explicacion_titulo || (escenario.es_phishing ? 'Este correo era un ataque de Phishing.' : 'Este correo era una comunicación legítima.')}
            </h2>
            <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed font-medium">
              {escenario.explicacion_texto || "Presta siempre atención a las anomalías en dominios y solicitudes de urgencia."}
            </p>
            {fase === 'RESULTADO' && (
              <div className="pt-2">
                <button 
                  onClick={pistas.length > 0 ? handleMostrarPistas : handleSiguientePista} 
                  className="bg-cpce-blue hover:bg-cpce-dark text-white font-semibold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>{pistas.length > 0 ? 'Ver Pistas y Análisis' : 'Siguiente Caso'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BANDEJA DE CORREO SIMULADA */}
      <div 
        ref={emailContainerRef} 
        className={`relative bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all duration-300 ${
          fase !== 'PREGUNTA' ? 'ring-2 ring-cpce-blue/20' : ''
        }`}
      >
        {/* Cabecera del Email */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div className="flex gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-cpce-blue text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
              {escenario?.remitente_nombre ? escenario.remitente_nombre.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <div className="flex flex-wrap items-baseline gap-1.5">
                <span data-id="remitente" className="font-bold text-slate-900 text-xs">{escenario?.remitente_nombre}</span>
                <span className="text-[11px] text-slate-400 font-mono">&lt;{escenario?.remitente_email}&gt;</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">para: ti &lt;usuario@institucion.com&gt;</p>
            </div>
          </div>
          <span data-id="fecha" className="text-[10px] text-slate-400 font-medium">Hoy, 10:24 AM</span>
        </div>

        {/* Asunto y Cuerpo */}
        <div className="p-6 md:p-8 bg-white min-h-[300px]">
          <h3 data-id="asunto" className="text-base font-bold text-slate-900 mb-5 pb-3 border-b border-slate-100">
            {escenario?.asunto_simulado}
          </h3>
          
          <div 
            className="cuerpo-html text-xs text-slate-700 leading-relaxed space-y-3" 
            onClick={(e) => {
              if (e.target.tagName === 'A' || e.target.closest('a')) {
                e.preventDefault();
              }
            }}
            dangerouslySetInnerHTML={{ __html: escenario?.cuerpo_html || '' }} 
          />
        </div>

        {/* TOOLTIP DE PISTAS (JIGSAW STYLE) */}
        {fase === 'PISTAS' && pistas.length > 0 && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div 
              style={{ ...estiloPista, position: 'absolute' }} 
              className="bg-white border border-cpce-blue shadow-2xl rounded-2xl p-4 max-w-xs pointer-events-auto animate-fade-in z-20"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-cpce-blue uppercase tracking-wider mb-2">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Pista {pistaActiva + 1} de {pistas.length}</span>
              </div>
              
              <p className="text-xs text-slate-700 leading-relaxed font-medium mb-3">
                {pistas[pistaActiva].texto}
              </p>
              
              <div className="flex justify-end">
                <button 
                  onClick={handleSiguientePista} 
                  className="bg-cpce-blue hover:bg-cpce-dark text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>{pistaActiva < pistas.length - 1 ? 'Siguiente pista' : 'Siguiente caso'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
