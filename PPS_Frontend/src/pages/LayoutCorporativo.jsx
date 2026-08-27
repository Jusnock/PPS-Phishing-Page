import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import logo_nuevo from '../assets/logo_nuevo.jpg';
import {
  LayoutDashboard,
  Users,
  Mail,
  GraduationCap,
  LogOut,
  Menu,
  X,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';

export default function LayoutCorporativo() {
  const location = useLocation();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Estados para el cambio de contraseña
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [verNuevaPassword, setVerNuevaPassword] = useState(false);
  const [verConfirmarPassword, setVerConfirmarPassword] = useState(false);

  useEffect(() => {
    api.get('/users/me')
      .then(res => {
        setUsuario(res.data);
        setCargando(false);
      })
      .catch(() => {
        handleLogout();
      });
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname.includes(path);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setErrorPassword('');

    if (nuevaPassword.length < 6) {
      return setErrorPassword('La contraseña debe tener al menos 6 caracteres.');
    }
    if (nuevaPassword !== confirmarPassword) {
      return setErrorPassword('Las contraseñas no coinciden.');
    }

    try {
      setGuardandoPassword(true);
      await api.put('/users/change-password', { nueva_password: nuevaPassword });
      setUsuario({ ...usuario, debe_cambiar_password: false });
      setGuardandoPassword(false);
    } catch (err) {
      setErrorPassword('Ocurrió un error al guardar. Revisa tu conexión.');
      setGuardandoPassword(false);
    }
  };

  if (cargando) {
    return (
      <div className="h-screen w-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cpce-blue"></div>
      </div>
    );
  }

  if (!usuario) return null;

  // MURO DE SEGURIDAD (Cambio Obligatorio de Contraseña)
  if (usuario.debe_cambiar_password) {
    return (
      <div className="h-screen w-screen bg-slate-900/90 backdrop-blur flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-md animate-fade-in relative overflow-hidden border border-slate-200">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-cpce-blue"></div>

          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-50 text-cpce-blue rounded-xl flex items-center justify-center border border-blue-100 shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-center text-slate-900 tracking-tight">Actualiza tu contraseña</h2>
          <p className="text-xs text-slate-500 text-center mt-1 mb-6">Por políticas institucionales, debes actualizar tu clave antes de acceder a la plataforma.</p>

          {errorPassword && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
              {errorPassword}
            </div>
          )}

          <form onSubmit={handleCambiarPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nueva Contraseña</label>
              <div className="relative">
                <input
                  type={verNuevaPassword ? "text" : "password"}
                  required
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg pl-3 pr-10 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none bg-slate-50"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setVerNuevaPassword(!verNuevaPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {verNuevaPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmar Contraseña</label>
              <div className="relative">
                <input
                  type={verConfirmarPassword ? "text" : "password"}
                  required
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg pl-3 pr-10 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none bg-slate-50"
                  placeholder="Repite tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setVerConfirmarPassword(!verConfirmarPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {verConfirmarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={guardandoPassword}
              className="w-full py-2.5 rounded-lg text-white font-semibold text-xs bg-cpce-blue hover:bg-cpce-dark transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
            >
              {guardandoPassword ? 'Guardando...' : 'Guardar y Continuar'}
            </button>
          </form>

          <button onClick={handleLogout} className="mt-5 w-full text-xs text-slate-400 hover:text-slate-700 transition-colors text-center cursor-pointer">
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  const esAdmin = usuario.rol === 'SUPERADMIN' || usuario.rol === 'ADMIN_EMPRESA';

  return (
    <div className="h-screen w-screen bg-slate-50 flex font-sans text-slate-900 overflow-hidden select-none">
      
      {/* Backdrop móvil */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR CORPORATIVO CPCE (Always fit to 100vh) */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-cpce-blue text-white flex flex-col h-screen max-h-screen transition-transform duration-200 ease-in-out shrink-0 shadow-xl z-40 md:static md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Cabecera blanca con logo oficial */}
        <div className="h-20 bg-white flex items-center justify-between px-4 border-b border-slate-200 shrink-0">
          <img 
            src={logo_nuevo} 
            alt="CPCE Mendoza" 
            className="h-12 w-auto max-w-[190px] object-contain" 
          />
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 md:hidden cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navegación central con scroll interno si fuera necesario */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto min-h-0">
          <div className="text-[10px] font-bold text-blue-200 uppercase tracking-widest px-3 mb-2">
            Capacitación
          </div>
          
          {esAdmin && (
            <>
              <Link
                to="/dashboard"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive('/dashboard') 
                    ? 'bg-white text-cpce-blue shadow-xs font-bold' 
                    : 'text-blue-100 hover:bg-cpce-dark hover:text-white'
                }`}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                <span>Dashboard</span>
              </Link>
              
              <Link
                to="/gestion"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive('/gestion') 
                    ? 'bg-white text-cpce-blue shadow-xs font-bold' 
                    : 'text-blue-100 hover:bg-cpce-dark hover:text-white'
                }`}
              >
                <Users className="h-4 w-4 shrink-0" />
                <span>Gestión</span>
              </Link>
            </>
          )}

          {esAdmin ? (
            <Link
              to="/campanas"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive('/campanas') 
                  ? 'bg-white text-cpce-blue shadow-xs font-bold' 
                  : 'text-blue-100 hover:bg-cpce-dark hover:text-white'
              }`}
            >
              <Mail className="h-4 w-4 shrink-0" />
              <span>Creador de Campañas</span>
            </Link>
          ) : (
            <Link
              to="/quiz"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive('/quiz') 
                  ? 'bg-white text-cpce-blue shadow-xs font-bold' 
                  : 'text-blue-100 hover:bg-cpce-dark hover:text-white'
              }`}
            >
              <GraduationCap className="h-4 w-4 shrink-0" />
              <span>Mis Entrenamientos</span>
            </Link>
          )}
        </nav>

        {/* PIE DE SIDEBAR: SIEMPRE VISIBLE SIN SCROLL */}
        <div className="p-3 border-t border-cpce-dark/80 shrink-0 bg-cpce-dark/60 space-y-2.5">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-full bg-white text-cpce-blue flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
              {usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-tight">{usuario.nombre}</p>
              <p className="text-[10px] text-blue-200 font-mono truncate">{usuario.rol}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-semibold text-blue-100 rounded-lg hover:bg-cpce-red hover:text-white transition-all cursor-pointer shadow-2xs"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 text-slate-600 hover:text-slate-900 md:hidden cursor-pointer rounded-md hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 capitalize tracking-tight">
              {location.pathname.replace('/', '') || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Conectado</span>
            </div>
            <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <span className="text-xs font-bold text-cpce-blue">
                {usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          </div>
        </header>

        {/* Contenido scrolleable independientemente */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-50">
          <div className="max-w-7xl w-full mx-auto pb-10">
            <Outlet />
          </div>
        </div>
      </main>
      
    </div>
  );
}
