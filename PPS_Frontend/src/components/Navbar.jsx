import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [usuario, setUsuario] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/users/me');
        setUsuario(res.data);
      } catch (error) {
        console.error("Error al cargar usuario en Sidebar:", error);
      }
    };
    fetchUser();
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('access_token'); 
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // === MOTOR DE RUTAS DINÁMICO SEGÚN EL ROL ===
  const obtenerEnlacesPorRol = () => {
    if (!usuario) return [];

    switch (usuario.rol) {
      case 'SUPERADMIN':
        return [
          { ruta: '/dashboard', etiqueta: 'Monitor Global', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
          { ruta: '/gestion', etiqueta: 'Instituciones', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
          { ruta: '/campanas', etiqueta: 'Banco de Correos', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
        ];
      case 'ADMIN_EMPRESA':
        return [
          { ruta: '/dashboard', etiqueta: 'Métricas Ejecutivas', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
          { ruta: '/gestion', etiqueta: 'Colaboradores', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
          { ruta: '/campanas', etiqueta: 'Asignar Campañas', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
        ];
      case 'EMPLEADO':
        return [
          { ruta: '/quiz', etiqueta: 'Mis Entrenamientos', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
        ];
      default:
        return [];
    }
  };

  const enlaces = obtenerEnlacesPorRol();

  return (
    <>
      {/* BOTÓN HAMBURGUESA MÓVIL (Visible solo en pantallas chicas) */}
      <div className="md:hidden bg-[#0A4F9F] text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <img src="/logo_cpce.png" alt="Logo CPCE" className="h-8 object-contain" />
        <button onClick={() => setMenuAbierto(!menuAbierto)} className="focus:outline-none">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuAbierto ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* SIDEBAR PRINCIPAL (Azul Institucional Continuo) */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-[#0A4F9F] text-white transition-transform duration-300 ease-in-out transform flex flex-col
        ${menuAbierto ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0
      `}>
        
        {/* LOGO SUPERIOR */}
        <div className="p-8 border-b border-[#084183] flex justify-center items-center h-32">
          <img src="/logo_cpce.png" alt="Logo CPCE" className="h-16 w-auto object-contain drop-shadow-md" />
        </div>

        {/* ÁREA DEL PERFIL (Resumido y Elegante) */}
        {usuario && (
          <div className="p-6 border-b border-[#084183] flex items-center gap-4 bg-[#084183]/30">
            <div className="h-12 w-12 rounded-full bg-white flex shrink-0 items-center justify-center text-[#0A4F9F] font-black text-xl shadow-inner">
              {usuario.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-white truncate">{usuario.nombre}</span>
              <span className="text-xs text-blue-200 uppercase tracking-widest font-semibold mt-1">
                 {usuario.rol === 'ADMIN_EMPRESA' ? 'Administrador' : usuario.rol === 'SUPERADMIN' ? 'SuperAdmin' : 'Colaborador'}
              </span>
            </div>
          </div>
        )}

        {/* ENLACES DE NAVEGACIÓN */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {enlaces.map((link) => (
            <Link
              key={link.ruta}
              to={link.ruta}
              onClick={() => setMenuAbierto(false)}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm transition-all duration-200 ${
                isActive(link.ruta)
                  ? "bg-white text-[#0A4F9F] shadow-md"
                  : "text-blue-100 hover:bg-[#084183] hover:text-white"
              }`}
            >
              <svg className={`w-5 h-5 shrink-0 ${isActive(link.ruta) ? 'text-[#0A4F9F]' : 'text-blue-200'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
              </svg>
              {link.etiqueta}
            </Link>
          ))}
        </div>

        {/* BOTÓN DE LOGOUT ABAJO */}
        <div className="p-4 border-t border-[#084183] mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-bold text-white bg-red-600/90 hover:bg-red-500 rounded-xl transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            CERRAR SESIÓN
          </button>
        </div>

      </div>

      {/* OVERLAY PARA MÓVILES (Fondo oscuro al abrir menú) */}
      {menuAbierto && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setMenuAbierto(false)}
        ></div>
      )}
    </>
  );
}