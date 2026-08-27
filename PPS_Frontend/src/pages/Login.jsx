import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import logo_nuevo from '../assets/logo_nuevo.jpg';
import { ShieldCheck, Lock, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';

export default function Login() {
  const [paso, setPaso] = useState(1);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [usuarioData, setUsuarioData] = useState(null);

  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [cargando, setCargando] = useState(false);
  const [verNuevaPassword, setVerNuevaPassword] = useState(false);
  const [verConfirmarPassword, setVerConfirmarPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

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
      setCargando(true);
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
      setError('Error al verificar perfil institucional.');
      setCargando(false);
    }
  };

  const redireccionarSegunRol = (rol) => {
    if (rol === 'EMPLEADO') navigate('/quiz', { replace: true });
    else navigate('/dashboard', { replace: true });
  };

  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    window.location.href = `${apiUrl}/login`;
  };

  // Acceso directo seguro para entorno de desarrollo local (SuperAdmin)
  const handleLocalDevLogin = () => {
    // Token de SuperAdmin generado para testing local
    const devToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sIjoiU1VQRVJBRE1JTiIsImV4cCI6MTc4NzkyOTU1Nn0.5746Zid5KJwGKlXSKJD1pDqObuvmfaxDJwuAWGfUNOE";
    localStorage.setItem("access_token", devToken);
    verificarPerfil(devToken);
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
      await api.put('/users/change-password', { nueva_password: nuevaPassword });
      setMensajeExito('¡Contraseña actualizada con éxito!');
      setCargando(false);
      setTimeout(() => {
        if (usuarioData) {
          redireccionarSegunRol(usuarioData.rol);
        }
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al actualizar contraseña.');
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 justify-between">
      
      {/* HEADER CPCE */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-6 sm:px-12 shadow-xs shrink-0">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src={logo_nuevo} 
              alt="CPCE Mendoza" 
              className="h-12 sm:h-14 object-contain" 
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Plataforma de Capacitación
          </div>
        </div>
      </header>

      {/* CONTENEDOR CENTRAL */}
      <main className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center flex-1 p-6 md:p-12">
        
        {/* COLUMNA IZQUIERDA: INFORMACIÓN INSTITUCIONAL */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 text-cpce-blue text-xs font-bold uppercase tracking-wider border border-blue-100">
            <ShieldCheck className="w-4 h-4 text-cpce-blue" />
            <span>Seguridad Institucional</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Plataforma de Concientización <span className="text-cpce-blue">& Phishing</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-md font-medium">
            Entrena y evalúa la capacidad de detección de ciberamenazas en un entorno controlado y seguro diseñado para el personal y profesionales matriculados.
          </p>

          <div className="pt-2 flex items-center gap-4 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Acceso federado
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Sin contraseñas locales
            </span>
          </div>
        </div>

        {/* COLUMNA DERECHA: TARJETA DE LOGIN GOOGLE */}
        <div className="bg-white p-7 sm:p-9 shadow-xl shadow-slate-200/60 rounded-2xl border border-slate-200/90 w-full max-w-md mx-auto transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-cpce-blue"></div>

          {paso === 1 ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900">Ingreso Institucional</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  El acceso está restringido a cuentas oficiales autenticadas mediante Google Workspace.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {mensajeExito && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{mensajeExito}</span>
                </div>
              )}

              {/* BOTÓN GOOGLE WORKSPACE */}
              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={cargando}
                  className="w-full py-3 px-4 bg-white text-slate-800 font-semibold text-xs sm:text-sm rounded-xl border border-slate-300 hover:border-cpce-blue hover:bg-slate-50/80 shadow-xs hover:shadow-md transition-all flex justify-center items-center gap-3 cursor-pointer group disabled:opacity-60"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Continuar con Google Workspace</span>
                </button>

                {/* BOTÓN RÁPIDO PARA DESARROLLO LOCAL */}
                {isLocalhost && (
                  <button
                    type="button"
                    onClick={handleLocalDevLogin}
                    disabled={cargando}
                    className="w-full py-2 px-3 bg-blue-50/70 hover:bg-blue-100/80 text-cpce-blue font-semibold text-xs rounded-xl border border-blue-200 transition-all flex justify-center items-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Entrar como SuperAdmin (Entorno Local)</span>
                  </button>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 text-center">
                <p className="text-[11px] text-slate-400 font-medium">
                  © {new Date().getFullYear()} Consejo Profesional de Ciencias Económicas de Mendoza
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-10 h-10 bg-blue-50 text-cpce-blue rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-center text-slate-900">Actualiza tu Seguridad</h3>
              <p className="text-xs text-slate-500 text-center font-medium">
                Por políticas institucionales, confirma una clave personal para tu cuenta.
              </p>

              {error && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleCambioPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nueva Contraseña</label>
                  <input
                    type={verNuevaPassword ? "text" : "password"}
                    required
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none bg-slate-50"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmar Contraseña</label>
                  <input
                    type={verConfirmarPassword ? "text" : "password"}
                    required
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none bg-slate-50"
                    placeholder="Repite la contraseña"
                  />
                </div>
                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full py-2.5 bg-cpce-blue hover:bg-cpce-dark text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                >
                  {cargando ? 'Guardando...' : 'Guardar y Continuar'}
                </button>
              </form>
            </div>
          )}

        </div>
      </main>

      {/* FOOTER SIMPLE */}
      <footer className="py-4 text-center text-xs text-slate-400 shrink-0">
        Plataforma PPS • Práctica Profesional Supervisada
      </footer>
    </div>
  );
}
