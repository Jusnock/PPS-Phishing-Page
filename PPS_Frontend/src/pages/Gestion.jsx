import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Building2,
  Users,
  UserPlus,
  Plus,
  Edit2,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
  Search,
  ShieldCheck,
  Mail,
  FolderTree,
  KeyRound
} from 'lucide-react';

export default function Gestion() {
  const [usuario, setUsuario] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [empleados, setEmpleados] = useState([]); 
  const [cargando, setCargando] = useState(true);
  const [mostrarConsolaLocal, setMostrarConsolaLocal] = useState(false);

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

  // --- Estados Super-Admin ---
  const [modalCrearEmpresa, setModalCrearEmpresa] = useState(false);
  const [formEmpresaNueva, setFormEmpresaNueva] = useState({ nombre: '', dominio_google: '' });
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [empresaActual, setEmpresaActual] = useState(null);
  const [formEmpresaEditar, setFormEmpresaEditar] = useState({ nombre: '', dominio_google: '' });
  
  const [modoAdmin, setModoAdmin] = useState('CREAR'); 
  const [adminActual, setAdminActual] = useState(null);
  const [formAdmin, setFormAdmin] = useState({ nombre: '', email: '', password: '' });

  // --- Estados Admin Local (Empresa) ---
  const [modalEmpleado, setModalEmpleado] = useState(false);
  const [modoEmpleado, setModoEmpleado] = useState('CREAR');
  const [empleadoActual, setEmpleadoActual] = useState(null);
  const [formEmpleado, setFormEmpleado] = useState({ nombre: '', email: '', password: '' });
  const [verAdminPassword, setVerAdminPassword] = useState(false);
  const [verEmpleadoPassword, setVerEmpleadoPassword] = useState(false);

  // --- Estados para Destinatarios (Targets) ---
  const [tabActual, setTabActual] = useState('EMPLEADOS');
  const [targets, setTargets] = useState([]);
  const [modalTarget, setModalTarget] = useState(false);
  const [formTarget, setFormTarget] = useState({ nombre: '', email: '', departamento: '' });
  const [busqueda, setBusqueda] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const resUser = await api.get('/users/me');
      setUsuario(resUser.data);

      if (resUser.data.rol === 'SUPERADMIN') {
        const [resEmpresas, resUsers, resTargets] = await Promise.all([
          api.get('/companies/'),
          api.get('/users/'),
          api.get('/targets/')
        ]);
        setEmpresas(resEmpresas.data);
        setEmpleados(resUsers.data); 
        setTargets(resTargets.data);
      } else if (resUser.data.rol === 'ADMIN_EMPRESA') {
        const [resUsers, resTargets] = await Promise.all([
          api.get('/users/'),
          api.get('/targets/')
        ]);
        const filtrados = resUsers.data.filter(u => u.company_id === resUser.data.company_id && u.rol !== 'SUPERADMIN');
        setEmpleados(filtrados);
        setTargets(resTargets.data);
      } else {
        navigate('/dashboard'); 
      }
      setCargando(false);
    } catch (err) {
      mostrarToast('Error crítico al cargar los datos.', 'error');
      setCargando(false);
    }
  };

  // ==========================================
  // LOGICA SUPER-ADMIN
  // ==========================================
  const handleCrearEmpresa = async (e) => {
    e.preventDefault();
    try {
      await api.post('/companies/', formEmpresaNueva);
      setFormEmpresaNueva({ nombre: '', dominio_google: '' });
      setModalCrearEmpresa(false);
      cargarDatos();
      mostrarToast('Institución creada correctamente');
    } catch (err) { mostrarToast(err.response?.data?.detail || 'Error al crear institución.', 'error'); }
  };

  const handleBorrarEmpresa = (id) => {
    pedirConfirmacion("¿Seguro que deseas eliminar esta institución y TODO su contenido permanentemente?", async () => {
      try {
        await api.delete(`/companies/${id}`);
        cargarDatos();
        mostrarToast('Institución eliminada');
      } catch (err) { mostrarToast('Error al eliminar.', 'error'); }
    });
  };

  const abrirModalGestion = (emp) => {
    setEmpresaActual(emp);
    setFormEmpresaEditar({ nombre: emp.nombre, dominio_google: emp.dominio_google });
    cancelarEdicionAdmin(); 
    setModalAbierto(true);
  };

  const cerrarModalGestion = () => {
    setModalAbierto(false);
    setEmpresaActual(null);
  };

  const handleEditarEmpresaModal = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/companies/${empresaActual.id}`, formEmpresaEditar);
      cargarDatos();
      mostrarToast('Datos de la institución actualizados');
    } catch (err) { mostrarToast('Error al actualizar la institución.', 'error'); }
  };

  const handleSubmitAdmin = async (e) => {
    e.preventDefault();
    try {
      if (modoAdmin === 'CREAR') {
        await api.post('/users/', { ...formAdmin, rol: 'ADMIN_EMPRESA', company_id: empresaActual.id });
        mostrarToast('Administrador registrado con éxito');
      } else {
        await api.put(`/users/${adminActual.id}`, { ...formAdmin, rol: 'ADMIN_EMPRESA' });
        mostrarToast('Acceso actualizado');
      }
      cancelarEdicionAdmin();
      cargarDatos(); 
    } catch (err) { mostrarToast(err.response?.data?.detail || 'Error al guardar el administrador.', 'error'); }
  };

  const handleBorrarAdmin = (id) => {
    pedirConfirmacion("¿Quitar a este administrador del sistema?", async () => {
      try {
        await api.delete(`/users/${id}`);
        cancelarEdicionAdmin();
        cargarDatos();
        mostrarToast('Administrador eliminado');
      } catch (err) { mostrarToast('Error al eliminar administrador.', 'error'); }
    });
  };

  const iniciarEdicionAdmin = (admin) => {
    setModoAdmin('EDITAR');
    setAdminActual(admin);
    setFormAdmin({ nombre: admin.nombre, email: admin.email, password: '' });
  };

  const cancelarEdicionAdmin = () => {
    setModoAdmin('CREAR');
    setAdminActual(null);
    setFormAdmin({ nombre: '', email: '', password: '' });
  };

  // ==========================================
  // LOGICA ADMIN EMPRESA 
  // ==========================================
  const abrirModalNuevoEmpleado = () => {
    setModoEmpleado('CREAR');
    setEmpleadoActual(null);
    setFormEmpleado({ nombre: '', email: '', password: '' });
    setModalEmpleado(true);
  };

  const iniciarEdicionEmpleado = (emp) => {
    setModoEmpleado('EDITAR');
    setEmpleadoActual(emp);
    setFormEmpleado({ nombre: emp.nombre, email: emp.email, password: '' }); 
    setModalEmpleado(true);
  };

  const cerrarModalEmpleado = () => {
    setModalEmpleado(false);
    setEmpleadoActual(null);
    setFormEmpleado({ nombre: '', email: '', password: '' });
  };

  const handleSubmitEmpleado = async (e) => {
    e.preventDefault();
    try {
      if (modoEmpleado === 'CREAR') {
        await api.post('/users/', { ...formEmpleado, rol: 'EMPLEADO' });
        mostrarToast('Empleado registrado exitosamente');
      } else {
        await api.put(`/users/${empleadoActual.id}`, { ...formEmpleado, rol: empleadoActual.rol });
        mostrarToast('Datos del empleado actualizados');
      }
      cerrarModalEmpleado();
      cargarDatos();
    } catch (err) { mostrarToast(err.response?.data?.detail || 'Error al guardar empleado.', 'error'); }
  };

  const handleBorrarEmpleado = (id) => {
    pedirConfirmacion("¿Dar de baja a este empleado permanentemente?", async () => {
      try {
        await api.delete(`/users/${id}`);
        cargarDatos();
        mostrarToast('Empleado dado de baja');
      } catch (err) { mostrarToast('Error al eliminar empleado.', 'error'); }
    });
  };

  // ==========================================
  // LOGICA DESTINATARIOS (TARGETS)
  // ==========================================
  const abrirModalNuevoTarget = () => {
    setFormTarget({ nombre: '', email: '', departamento: '' });
    setModalTarget(true);
  };

  const cerrarModalTarget = () => {
    setModalTarget(false);
    setFormTarget({ nombre: '', email: '', departamento: '' });
  };

  const handleSubmitTarget = async (e) => {
    e.preventDefault();
    try {
      await api.post('/targets/', formTarget);
      mostrarToast('Destinatario registrado correctamente');
      cerrarModalTarget();
      cargarDatos();
    } catch (err) {
      mostrarToast(err.response?.data?.detail || 'Error al guardar el destinatario.', 'error');
    }
  };

  const handleBorrarTarget = (id) => {
    pedirConfirmacion("¿Eliminar a este destinatario de la lista de simulación?", async () => {
      try {
        await api.delete(`/targets/${id}`);
        cargarDatos();
        mostrarToast('Destinatario eliminado');
      } catch (err) {
        mostrarToast('Error al eliminar destinatario.', 'error');
      }
    });
  };

  const handleImportarCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const lineas = text.split("\n");
        const listaTargets = [];

        let startIndex = 0;
        if (lineas[0].toLowerCase().includes("email") || lineas[0].toLowerCase().includes("correo")) {
          startIndex = 1;
        }

        for (let i = startIndex; i < lineas.length; i++) {
          const linea = lineas[i].trim();
          if (!linea) continue;

          const columnas = linea.split(",");
          if (columnas.length >= 2) {
            const nombre = columnas[0].replace(/["']/g, "").trim();
            const email = columnas[1].replace(/["']/g, "").trim();
            const departamento = columnas[2] ? columnas[2].replace(/["']/g, "").trim() : "General";

            if (email && email.includes("@")) {
              listaTargets.push({ nombre, email, departamento });
            }
          }
        }

        if (listaTargets.length === 0) {
          mostrarToast('No se encontraron registros válidos en el CSV.', 'error');
          return;
        }

        await api.post('/targets/bulk', listaTargets);
        mostrarToast(`Importados exitosamente ${listaTargets.length} destinatarios`);
        cargarDatos();
      } catch (err) {
        mostrarToast('Error al parsear o subir el CSV.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  if (cargando) {
    return (
      <div className="flex flex-col justify-center items-center h-80">
        <div className="animate-spin h-8 w-8 border-4 border-cpce-blue border-t-transparent rounded-full mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Cargando directorio institucional...</p>
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
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
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
              <h3 className="text-base font-bold text-slate-900 mb-1">Confirmar Operación</h3>
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

  const empleadosVisibles = (usuario?.rol === 'SUPERADMIN' && !mostrarConsolaLocal)
    ? empleados
    : empleados.filter(u => u.company_id === usuario?.company_id && u.rol !== 'SUPERADMIN');

  const targetsVisibles = (usuario?.rol === 'SUPERADMIN' && !mostrarConsolaLocal)
    ? targets
    : targets.filter(t => t.company_id === usuario?.company_id);

  // ==========================================
  // VISTA: SUPER-ADMIN
  // ==========================================
  if (usuario?.rol === 'SUPERADMIN' && !mostrarConsolaLocal) {
    const adminsDeEmpresaActual = empresaActual 
      ? empleados.filter(u => u.company_id === empresaActual.id && u.rol === 'ADMIN_EMPRESA')
      : [];

    return (
      <div className="space-y-6 animate-fade-in">
        {NotificacionesUI}
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b border-slate-200 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Directorio de Instituciones</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">Gestión global de instituciones adheridas y dominios Google Workspace autorizados.</p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {usuario?.company_id && (
              <button 
                onClick={() => {
                  setTabActual('EMPLEADOS');
                  setMostrarConsolaLocal(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-cpce-blue bg-white border border-cpce-blue rounded-lg hover:bg-blue-50/50 transition-all shadow-2xs cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Ver Consola Local</span>
              </button>
            )}
            <button 
              onClick={() => setModalCrearEmpresa(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-cpce-blue rounded-lg hover:bg-cpce-dark transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Institución</span>
            </button>
          </div>
        </div>

        {/* Tabla Ancho Completo */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3.5 px-4">Institución</th>
                  <th className="py-3.5 px-4">Dominio Federado</th>
                  <th className="py-3.5 px-4 text-center">ID Ref.</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {empresas.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-cpce-blue font-bold text-xs">
                          {emp.nombre.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-slate-900">{emp.nombre}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-cpce-blue border border-blue-200 font-mono">
                        @{emp.dominio_google}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">#{String(emp.id).padStart(3, '0')}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end items-center gap-2"> 
                        <button 
                          onClick={() => abrirModalGestion(emp)} 
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg text-cpce-blue bg-blue-50/50 hover:bg-cpce-blue hover:text-white border border-blue-200 transition-all cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Gestionar</span>
                        </button>
                        <button 
                          onClick={() => handleBorrarEmpresa(emp.id)} 
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg text-cpce-red hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {empresas.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-10 text-center text-slate-400 text-xs font-medium">No hay instituciones registradas en el sistema.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: NUEVA EMPRESA */}
        {modalCrearEmpresa && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-cpce-blue"></div>
              <div className="flex justify-between items-center p-5 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Alta de Institución</h2>
                <button onClick={() => setModalCrearEmpresa(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCrearEmpresa} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Comercial</label>
                  <input 
                    type="text" 
                    required 
                    value={formEmpresaNueva.nombre} 
                    onChange={e => setFormEmpresaNueva({...formEmpresaNueva, nombre: e.target.value})} 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none bg-slate-50" 
                    placeholder="Ej: Consejo Profesional Sede Este" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dominio Google Workspace</label>
                  <input 
                    type="text" 
                    required 
                    value={formEmpresaNueva.dominio_google} 
                    onChange={e => setFormEmpresaNueva({...formEmpresaNueva, dominio_google: e.target.value.toLowerCase()})} 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none bg-slate-50 font-mono" 
                    placeholder="cpcemza.org.ar" 
                  />
                </div>
                <div className="mt-6 flex gap-2.5 pt-2">
                  <button type="button" onClick={() => setModalCrearEmpresa(false)} className="flex-1 bg-white border border-slate-300 text-slate-700 font-semibold text-xs py-2 px-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 bg-cpce-blue text-white font-semibold text-xs py-2 px-3 rounded-lg hover:bg-cpce-dark transition-colors cursor-pointer shadow-xs">
                    Dar de Alta
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: GESTION DE EMPRESA EXISTENTE */}
        {modalAbierto && empresaActual && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex justify-center items-center p-4 md:p-8 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-cpce-blue"></div>
              
              <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50/50">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Gestión de Institución</h2>
                  <p className="text-xs text-cpce-blue font-bold mt-0.5">{empresaActual.nombre}</p>
                </div>
                <button onClick={cerrarModalGestion} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-200 transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 bg-white">
                
                {/* Modificar Empresa */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <Building2 className="w-4 h-4 text-cpce-blue" />
                    <span>Configuración General</span>
                  </div>
                  <form onSubmit={handleEditarEmpresaModal} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre Comercial</label>
                      <input type="text" required value={formEmpresaEditar.nombre} onChange={e => setFormEmpresaEditar({...formEmpresaEditar, nombre: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none bg-slate-50" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Dominio</label>
                      <input type="text" required value={formEmpresaEditar.dominio_google} onChange={e => setFormEmpresaEditar({...formEmpresaEditar, dominio_google: e.target.value.toLowerCase()})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none bg-slate-50 font-mono" />
                    </div>
                    <button type="submit" className="w-full mt-2 bg-cpce-blue text-white font-semibold text-xs py-2.5 px-4 rounded-lg hover:bg-cpce-dark shadow-xs transition-colors cursor-pointer">
                      Guardar Cambios
                    </button>
                  </form>
                </div>

                {/* Admins de la Empresa */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <KeyRound className="w-4 h-4 text-cpce-blue" />
                    <span>Administradores Delegados</span>
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl">
                    <ul className="divide-y divide-slate-100 text-xs">
                      {adminsDeEmpresaActual.map(admin => (
                        <li key={admin.id} className={`p-3 flex justify-between items-center hover:bg-slate-50 ${adminActual?.id === admin.id ? 'bg-blue-50/50' : ''}`}>
                          <div>
                            <p className="font-bold text-slate-900">{admin.nombre}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{admin.email}</p>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => iniciarEdicionAdmin(admin)} className="text-xs text-cpce-blue hover:underline font-semibold cursor-pointer">Editar</button>
                            <span className="text-slate-200">|</span>
                            <button type="button" onClick={() => handleBorrarAdmin(admin.id)} className="text-xs text-cpce-red hover:underline font-semibold cursor-pointer">Quitar</button>
                          </div>
                        </li>
                      ))}
                      {adminsDeEmpresaActual.length === 0 && (
                        <li className="p-4 text-center text-xs text-slate-400 italic">Sin administradores asignados.</li>
                      )}
                    </ul>
                  </div>

                  <form onSubmit={handleSubmitAdmin} className={`space-y-3 p-4 rounded-xl border transition-colors ${modoAdmin === 'EDITAR' ? 'border-cpce-blue bg-blue-50/20' : 'border-slate-200 bg-slate-50'}`}>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {modoAdmin === 'EDITAR' ? 'Modificar Acceso' : 'Otorgar Acceso Admin'}
                    </h4>
                    <input type="text" required value={formAdmin.nombre} onChange={e => setFormAdmin({...formAdmin, nombre: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-cpce-blue bg-white" placeholder="Nombre completo" />
                    <input type="email" required value={formAdmin.email} onChange={e => setFormAdmin({...formAdmin, email: e.target.value.toLowerCase()})} className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-cpce-blue bg-white font-mono" placeholder="admin@institucion.com" />
                    <div className="relative w-full">
                      <input 
                        type={verAdminPassword ? "text" : "password"} 
                        required={modoAdmin === 'CREAR'} 
                        value={formAdmin.password} 
                        onChange={e => setFormAdmin({...formAdmin, password: e.target.value})} 
                        className="w-full border border-slate-300 rounded-lg pl-3 pr-10 py-1.5 text-xs outline-none focus:ring-1 focus:ring-cpce-blue bg-white" 
                        placeholder={modoAdmin === 'EDITAR' ? "Nueva contraseña (opcional)" : "Contraseña temporal"} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setVerAdminPassword(!verAdminPassword)} 
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {verAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    
                    <div className="flex gap-2 pt-1">
                      <button type="submit" className="flex-1 text-white font-semibold text-xs py-2 px-3 rounded-lg bg-cpce-blue hover:bg-cpce-dark transition-colors cursor-pointer shadow-2xs">
                        {modoAdmin === 'EDITAR' ? 'Actualizar' : 'Registrar'}
                      </button>
                      {modoAdmin === 'EDITAR' && (
                        <button type="button" onClick={cancelarEdicionAdmin} className="bg-white border border-slate-300 text-slate-700 font-semibold text-xs py-2 px-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VISTA: ADMIN EMPRESA (EMPLEADOS Y DESTINATARIOS)
  // ==========================================
  return (
    <div className="space-y-6 animate-fade-in">
      {NotificacionesUI}

      {/* Tabs Principales para Admin Empresa */}
      <div className="pb-2 border-b border-slate-200">
        <div className="flex justify-between items-start flex-col sm:flex-row gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Consola de Gestión Institucional
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Administra las credenciales de acceso para las evaluaciones y la nómina de objetivos para simulacros SMTP.
            </p>
          </div>
          {usuario?.rol === 'SUPERADMIN' && (
            <button 
              onClick={() => setMostrarConsolaLocal(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-cpce-blue bg-white border border-cpce-blue rounded-lg hover:bg-blue-50/50 transition-colors shadow-2xs cursor-pointer shrink-0"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Volver a Vista Global</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setTabActual('EMPLEADOS')} 
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tabActual === 'EMPLEADOS' 
                ? 'bg-cpce-blue text-white shadow-xs' 
                : 'text-slate-600 hover:text-cpce-blue hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Personal del Quiz</span>
          </button>
          
          <button 
            onClick={() => setTabActual('DESTINATARIOS')} 
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tabActual === 'DESTINATARIOS' 
                ? 'bg-cpce-blue text-white shadow-xs' 
                : 'text-slate-600 hover:text-cpce-blue hover:bg-slate-100'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Destinatarios de Simulación</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* VISTA A: GESTIÓN DE EMPLEADOS (Quiz Interno) */}
      {/* ==================================================================== */}
      {tabActual === 'EMPLEADOS' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Cuentas de Acceso al Quiz</h2>
              <p className="text-xs text-slate-500 font-medium">Personal habilitado para ingresar a la plataforma y realizar evaluaciones.</p>
            </div>
            <button 
              onClick={abrirModalNuevoEmpleado}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-cpce-blue rounded-lg hover:bg-cpce-dark transition-all shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Nuevo Empleado</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-700">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3.5 px-4">Empleado</th>
                    <th className="py-3.5 px-4">Correo Institucional</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {empleadosVisibles.length === 0 ? (
                    <tr><td colSpan="3" className="py-10 text-center text-slate-400 text-xs font-medium">Aún no hay empleados registrados en tu organización.</td></tr>
                  ) : (
                    empleadosVisibles.map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-cpce-blue font-bold text-xs">
                            {emp.nombre.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-slate-900">{emp.nombre}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">{emp.email}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => iniciarEdicionEmpleado(emp)} 
                              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg text-cpce-blue bg-blue-50/50 hover:bg-cpce-blue hover:text-white border border-blue-200 transition-all cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Editar</span>
                            </button>
                            <button 
                              onClick={() => handleBorrarEmpleado(emp.id)} 
                              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg text-cpce-red hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Baja</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VISTA B: GESTIÓN DE DESTINATARIOS (Simulación Externa) */}
      {/* ==================================================================== */}
      {tabActual === 'DESTINATARIOS' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Objetivos de Simulación SMTP</h2>
              <p className="text-xs text-slate-500 font-medium">Colaboradores que recibirán los simulacros de phishing en sus casillas de correo.</p>
            </div>
            
            <div className="flex items-center gap-2.5 flex-wrap">
              <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all shadow-2xs cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Importar CSV</span>
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleImportarCSV} 
                  className="hidden" 
                />
              </label>
              
              <button 
                onClick={abrirModalNuevoTarget}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-cpce-blue rounded-lg hover:bg-cpce-dark transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Destinatario</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-700">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3.5 px-4">Nombre</th>
                    <th className="py-3.5 px-4">Correo Electrónico</th>
                    <th className="py-3.5 px-4">Área / Departamento</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {targetsVisibles.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-10 text-center text-slate-400 text-xs font-medium">
                        No hay destinatarios registrados. Importa un CSV (Nombre,Email,Departamento) o agrega uno individualmente.
                      </td>
                    </tr>
                  ) : (
                    targetsVisibles.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-cpce-blue font-bold text-xs">
                            {t.nombre.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-slate-900">{t.nombre}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">{t.email}</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-cpce-blue border border-blue-200 rounded-md">
                            {t.departamento || "General"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button 
                            onClick={() => handleBorrarTarget(t.id)} 
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg text-cpce-red hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Quitar</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ALTA / EDICIÓN DE EMPLEADO */}
      {modalEmpleado && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex justify-center items-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-cpce-blue"></div>
            
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {modoEmpleado === 'EDITAR' ? 'Modificar Empleado' : 'Alta de Empleado'}
              </h2>
              <button onClick={cerrarModalEmpleado} className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitEmpleado} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo</label>
                <input type="text" required value={formEmpleado.nombre} onChange={e => setFormEmpleado({...formEmpleado, nombre: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none bg-slate-50" placeholder="Ej: Juan Pérez" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Corporativo</label>
                <input type="email" required value={formEmpleado.email} onChange={e => setFormEmpleado({...formEmpleado, email: e.target.value.toLowerCase()})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none bg-slate-50 font-mono" placeholder="juan@institucion.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{modoEmpleado === 'EDITAR' ? 'Nueva Contraseña (Opcional)' : 'Contraseña Temporal'}</label>
                <div className="relative">
                  <input 
                    type={verEmpleadoPassword ? "text" : "password"} 
                    required={modoEmpleado === 'CREAR'} 
                    value={formEmpleado.password} 
                    onChange={e => setFormEmpleado({...formEmpleado, password: e.target.value})} 
                    className="w-full border border-slate-300 rounded-lg pl-3 pr-10 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none bg-slate-50" 
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setVerEmpleadoPassword(!verEmpleadoPassword)} 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {verEmpleadoPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="mt-6 flex gap-2.5 pt-2">
                <button type="button" onClick={cerrarModalEmpleado} className="flex-1 bg-white border border-slate-300 text-slate-700 font-semibold text-xs py-2 px-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 bg-cpce-blue text-white font-semibold text-xs py-2 px-3 rounded-lg hover:bg-cpce-dark transition-colors shadow-xs cursor-pointer">
                  {modoEmpleado === 'EDITAR' ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: ALTA DE DESTINATARIO (TARGET) */}
      {modalTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex justify-center items-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-cpce-blue"></div>
            
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Registrar Destinatario</h2>
              <button onClick={cerrarModalTarget} className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTarget} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo</label>
                <input type="text" required value={formTarget.nombre} onChange={e => setFormTarget({...formTarget, nombre: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none bg-slate-50" placeholder="Ej: Carlos Gómez" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                <input type="email" required value={formTarget.email} onChange={e => setFormTarget({...formTarget, email: e.target.value.toLowerCase()})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none bg-slate-50 font-mono" placeholder="carlos@institucion.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Departamento / Delegación</label>
                <input type="text" required value={formTarget.departamento} onChange={e => setFormTarget({...formTarget, departamento: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-cpce-blue outline-none bg-slate-50" placeholder="Ej: Contabilidad, Delegación San Rafael" />
              </div>
              
              <div className="mt-6 flex gap-2.5 pt-2">
                <button type="button" onClick={cerrarModalTarget} className="flex-1 bg-white border border-slate-300 text-slate-700 font-semibold text-xs py-2 px-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 bg-cpce-blue text-white font-semibold text-xs py-2 px-3 rounded-lg hover:bg-cpce-dark transition-colors shadow-xs cursor-pointer">
                  Guardar Destinatario
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
