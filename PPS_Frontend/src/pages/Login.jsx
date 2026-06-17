import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [paso, setPaso] = useState(1); 
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [usuarioData, setUsuarioData] = useState(null); 
  
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState(''); 
  const [cargando, setCargando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);
  const [verNuevaPassword, setVerNuevaPassword] = useState(false);
  const [verConfirmarPassword, setVerConfirmarPassword] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParams = params.get("token");
    
    if (tokenParams) {
      localStorage.setItem("access_token", tokenParams); 
      verificarPerfil(tokenParams);
    }
  }, [location, navigate]);

  const verificarPerfil = async (tokenGuardado) => {
    try {
      const resUser = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${tokenGuardado}` }
      });
      
      if (resUser.data.debe_cambiar_password) {
        setUsuarioData(resUser.data);
        setPaso(2);
        setCargando(false);
      } else {
        redireccionarSegunRol(resUser.data.rol);
      }
    } catch (err) {
      setError('Error al verificar perfil.');
      setCargando(false);
    }
  };

  const redireccionarSegunRol = (rol) => {
    if (rol === 'EMPLEADO') navigate('/quiz', { replace: true });
    else navigate('/dashboard', { replace: true });
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMensajeExito('');
    setCargando(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const tokenRecibido = response.data.access_token || response.data.token; 
      
      localStorage.setItem('access_token', tokenRecibido);
      await verificarPerfil(tokenRecibido);

    } catch (err) {
      setError('Credenciales inválidas o incorrectas.');
      setCargando(false);
    }
  };

  const handleCambioPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMensajeExito('');

    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (nuevaPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setCargando(true);
    try {
      const tokenGuardado = localStorage.getItem('access_token');

      await api.put('/users/change-password', 
        { nueva_password: nuevaPassword }
      );
      
      localStorage.removeItem('access_token'); 
      setPaso(1); 
      setPassword(''); 
      setNuevaPassword(''); 
      setConfirmarPassword('');
      setMensajeExito('¡Contraseña actualizada! Por favor, inicia sesión con tu nueva clave.');
      setCargando(false);

      } catch (err) {
      console.error("Error completo del backend:", err.response);
      const detalleError = err.response?.data?.detail;

      if (Array.isArray(detalleError)) {
        const mensajeFastAPI = detalleError.map(e => `${e.loc[e.loc.length-1]}: ${e.msg}`).join(', ');
        setError(`Error del Backend -> ${mensajeFastAPI}`);
      } else if (typeof detalleError === 'string') {
        setError(detalleError);
      } else {
        setError('Ocurrió un error en el servidor al actualizar la contraseña.');
      }
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-800">
      
      {/* CABECERA ESTILO CPCE (MODIFICADA: Logo Grande y Solo) */}
      <header className="bg-cpce-blue w-full py-3 px-6 md:px-12 shadow-md shrink-0 border-b border-[#084183]">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          
          {/* AQUÍ VA EL LOGO GRANDE Y SOLO */}
          <img 
            src="/logo_cpce.png" 
            alt="Logo CPCE" 
            className="h-12 md:h-16 object-contain" 
          />
          
          <div className="flex items-center gap-2 text-xs md:text-sm text-white font-medium bg-cpce-dark px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-inner border border-blue-800">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            Plataforma de Capacitación
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center flex-1 p-4 md:py-6 md:px-12">
        <div className="hidden md:block">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-blue-100 text-cpce-blue text-xs font-bold px-3 py-1.5 rounded-sm uppercase tracking-wide border-l-4 border-cpce-blue">
              Seguridad Informática
            </span>
          </div>
          <h1 className="text-3xl lg:text-5xl font-bold leading-tight tracking-tight text-gray-900 mb-4">
            Protegiendo a<br />nuestros <span className="text-cpce-blue">Profesionales.</span>
          </h1>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-md">
            Accede al portal de concientización para entrenar tus habilidades de detección de amenazas y phishing.
          </p>
        </div>

        {/* CAJA DE LOGIN MODIFICADA */}
        <div className="bg-white p-6 sm:p-8 shadow-2xl shadow-blue-900/10 rounded-xl border-t-4 border-cpce-blue w-full max-w-md mx-auto transition-all duration-500">
          
          {paso === 1 ? (
            <div className="animate-fade-in">
              <h3 className="text-xl font-bold mb-1 tracking-tight text-cpce-blue">Ingreso al Portal</h3>
              <p className="text-xs text-gray-500 mb-4">Utiliza tus credenciales institucionales.</p>
              
              {/* Mensajes de Error y Éxito */}
              {error && <div className="mb-4 p-2.5 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r-md">{error}</div>}
              {mensajeExito && <div className="mb-4 p-2.5 bg-green-50 border-l-4 border-green-500 text-green-700 text-xs rounded-r-md font-medium">{mensajeExito}</div>}
              
              <form onSubmit={handleManualLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Correo Electrónico</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none transition-all bg-slate-50" placeholder="usuario@cpcemza.org.ar" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contraseña</label>
                  <div className="relative">
                    <input 
                      type={verPassword ? "text" : "password"} 
                      required 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="w-full border border-gray-300 rounded-md pl-3 pr-10 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none transition-all bg-slate-50" 
                      placeholder="••••••••" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setVerPassword(!verPassword)} 
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {verPassword ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={cargando} className="mt-4 bg-cpce-blue text-white font-semibold py-2 px-4 w-full rounded-md text-xs hover:bg-cpce-dark transition-colors disabled:opacity-70 shadow-md cursor-pointer">
                  {cargando ? 'Verificando...' : 'Iniciar Sesión'}
                </button>
              </form>

              {/* EL BOTÓN DE GOOGLE RECUPERADO Y ESTILIZADO */}
              <div className="relative flex items-center justify-center mt-5 mb-4">
                <span className="absolute bg-white px-3 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">O ingreso directo</span>
                <div className="w-full h-px bg-gray-200"></div>
              </div>
              
              <button 
                type="button" 
                onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/login`} 
                className="bg-white text-gray-700 font-semibold py-2 px-4 w-full rounded-md text-xs border border-gray-300 hover:bg-slate-50 transition-colors flex justify-center items-center gap-3 shadow-sm cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar con Google Workspace
              </button>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="flex justify-center mb-2"><div className="w-10 h-10 bg-blue-50 text-cpce-blue rounded-full flex items-center justify-center"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div></div>
              <h3 className="text-lg font-bold mb-1 tracking-tight text-center text-gray-900">Actualiza tu Seguridad</h3>
              <p className="text-xs text-gray-500 mb-4 text-center">Has ingresado con una clave provisional. Por políticas de seguridad, debes crear una nueva contraseña.</p>
              
              {error && <div className="mb-4 p-2.5 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r-md">{error}</div>}
              
              <form onSubmit={handleCambioPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nueva Contraseña</label>
                  <div className="relative">
                    <input 
                      type={verNuevaPassword ? "text" : "password"} 
                      required 
                      value={nuevaPassword} 
                      onChange={(e) => setNuevaPassword(e.target.value)} 
                      className="w-full border border-gray-300 rounded-md pl-3 pr-10 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none transition-all bg-slate-50" 
                      placeholder="••••••••" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setVerNuevaPassword(!verNuevaPassword)} 
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {verNuevaPassword ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Confirmar Contraseña</label>
                  <div className="relative">
                    <input 
                      type={verConfirmarPassword ? "text" : "password"} 
                      required 
                      value={confirmarPassword} 
                      onChange={(e) => setConfirmarPassword(e.target.value)} 
                      className="w-full border border-gray-300 rounded-md pl-3 pr-10 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none transition-all bg-slate-50" 
                      placeholder="••••••••" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setVerConfirmarPassword(!verConfirmarPassword)} 
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {verConfirmarPassword ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={cargando} className="mt-4 bg-cpce-blue text-white font-semibold py-2 px-4 w-full rounded-md text-xs hover:bg-cpce-dark transition-colors disabled:opacity-70 shadow-md cursor-pointer">
                  {cargando ? 'Actualizando...' : 'Guardar contraseña'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}