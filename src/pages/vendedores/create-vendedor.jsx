import React, { useState, useEffect, useContext, useCallback } from 'react';
import { apiContext } from "../../context/api_context";

export function AddVendedores() {
  const { createVendedor, getPointsByCompany } = useContext(apiContext);
  const [vData, setVData] = useState({
    username: '', password: '', email: '', empresa: '', rol: 'vendedor_activo',
    puntosVentaAsignados: [], nombre: '', apellido: '', telefono: '', dni: '', llegada: '', salida: ''
  });
  const [empName, setEmpName] = useState('');
  const [pvSel, setPVSel] = useState('');
  const [pvDisp, setPVDisp] = useState([]);
  const [loading, setLoading] = useState(false), [msg, setMsg] = useState(''), [error, setError] = useState('');

  const getPVNameById = useCallback((id) => pvDisp.find(pv => pv._id === id)?.nombre || `ID Desconocido: ${id}`, [pvDisp]);

  useEffect(() => {
    const loadCompAndPoints = async () => {
      let currentEmpId = '', currentEmpName = '';
      try {
        const uDS = localStorage.getItem("userData"); if (uDS) currentEmpId = JSON.parse(uDS).empresa || '';
        const dES = localStorage.getItem("dataEmpresa"); if (dES) currentEmpName = JSON.parse(dES).nombreEmpresa || '';
      } catch (e) { console.error("Error localStorage:", e); setError("Error al cargar datos empresa."); return; }

      setVData(prev => ({ ...prev, empresa: currentEmpId })); setEmpName(currentEmpName);
      if (!currentEmpId) { setError("No se encontró ID de empresa."); return; }
      try {
        setLoading(true); const points = await getPointsByCompany(currentEmpId);
        if (Array.isArray(points)) { setPVDisp(points); setError(''); }
        else { console.error("API no devolvió array de PV:", points); setError("Lista PV inválida."); }
      } catch (err) { console.error("Error cargar PV:", err); setError(err.message || "No se pudieron cargar los puntos de venta.");
      } finally { setLoading(false); }
    };
    loadCompAndPoints();
  }, [getPointsByCompany]);

  const rolesVendedor = [{ value: 'vendedor_activo', label: 'Activo' }, { value: 'vendedor_inactivo', label: 'Inactivo' }, { value: 'supervisor', label: 'Supervisor' }];
  const hC = (e) => { const { name, value } = e.target; if (name !== 'empresa') setVData(prev => ({ ...prev, [name]: value })); };
  const hPVAdd = () => {
    if (pvSel && pvDisp.some(pv => pv._id === pvSel) && !vData.puntosVentaAsignados.includes(pvSel)) {
      setVData(prev => ({ ...prev, puntosVentaAsignados: [...prev.puntosVentaAsignados, pvSel] }));
      setPVSel('');
    }
  };
  const hPVRemove = (id) => setVData(prev => ({ ...prev, puntosVentaAsignados: prev.puntosVentaAsignados.filter(p => p !== id) }));

  const hSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setMsg(''); setError('');
    try {
      if (!vData.username || !vData.password || !vData.email) throw new Error('Username, password y email obligatorios.');
      if (vData.password.length < 8) throw new Error('Contraseña debe tener al menos 8 caracteres.');
      if (!vData.empresa) throw new Error('ID empresa no cargado. Recargue.');
      const dataToSend = { ...vData, puntosVentaAsignados: vData.puntosVentaAsignados.filter(Boolean) };
      const res = await createVendedor(dataToSend);
      if (res?.data?.creado) { setMsg(res.data.message || 'Vendedor registrado exitosamente!'); setVData(p => ({ ...p, username: '', password: '', email: '', puntosVentaAsignados: [], nombre: '', apellido: '', telefono: '', dni: '', llegada: '', salida: '' })); setPVSel(''); setTimeout(() => setMsg(''), 3000); }
      else { setError(res?.data?.message || 'Error al registrar vendedor: Operación no exitosa.'); setTimeout(() => setError(''), 5000); }
    } catch (err) { console.error("Error al enviar:", err); setError(err.message || 'Error al registrar vendedor. Intente de nuevo.'); setTimeout(() => setError(''), 5000);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center"><h1 className="text-2xl font-bold text-white">Agregar Nuevo Vendedor</h1></div>
        <form onSubmit={hSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Información de Cuenta</h2>
              <div className="form-group"><label className="block text-sm font-medium text-gray-700 mb-1">Username*</label><input type="text" name="username" value={vData.username} onChange={hC} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" placeholder="Nombre de usuario"/></div>
              <div className="form-group"><label className="block text-sm font-medium text-gray-700 mb-1">Password* (min 8 chars)</label><input type="password" name="password" value={vData.password} onChange={hC} required minLength="8" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" placeholder="Contraseña segura"/></div>
              <div className="form-group"><label className="block text-sm font-medium text-gray-700 mb-1">Email*</label><input type="email" name="email" value={vData.email} onChange={hC} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" placeholder="email@empresa.com"/></div>
              <div className="form-group"><label className="block text-sm font-medium text-gray-700 mb-1">Rol*</label><select name="rol" value={vData.rol} onChange={hC} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition">{rolesVendedor.map(rol => (<option key={rol.value} value={rol.value}>{rol.label}</option>))}</select></div>
              <div className="form-group"><label className="block text-sm font-medium text-gray-700 mb-1">Empresa (Owner)*</label><input type="text" name="empresa" value={empName} readOnly className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-100 cursor-not-allowed"/></div>
            </div>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Información Personal</h2>
              <div className="form-group"><label className="block text-sm font-medium text-gray-700 mb-1">Nombre*</label><input type="text" name="nombre" value={vData.nombre} onChange={hC} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" placeholder="Nombre del vendedor"/></div>
              <div className="form-group"><label className="block text-sm font-medium text-gray-700 mb-1">Apellido*</label><input type="text" name="apellido" value={vData.apellido} onChange={hC} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" placeholder="Apellido del vendedor"/></div>
              <div className="form-group"><label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label><input type="tel" name="telefono" value={vData.telefono} onChange={hC} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" placeholder="+5491155551234"/></div>
              <div className="form-group"><label className="block text-sm font-medium text-gray-700 mb-1">DNI</label><input type="text" name="dni" value={vData.dni} onChange={hC} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" placeholder="30123456"/></div>
              <div className="form-group"><label className="block text-sm font-medium text-gray-700 mb-1">Hora Llegada</label><input type="time" name="llegada" value={vData.llegada} onChange={hC} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"/></div>
              <div className="form-group"><label className="block text-sm font-medium text-gray-700 mb-1">Hora Salida</label><input type="time" name="salida" value={vData.salida} onChange={hC} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"/></div>
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Asignar Puntos de Venta</h2>
            {loading && !error ? (<p className="text-gray-600 flex items-center"><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Cargando puntos...</p>)
            : error && !msg ? (<p className="text-red-600 text-sm">{error}</p>) : (<div className="flex gap-2">
                <select value={pvSel} onChange={(e) => setPVSel(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"><option value="">Seleccionar Punto</option>{pvDisp.map(p => (<option key={p._id} value={p._id}>{p.nombre}</option>))}</select>
                <button type="button" onClick={hPVAdd} disabled={!pvSel} className={`px-4 py-2 rounded-lg transition ${!pvSel ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>Agregar</button>
            </div>)}
            {vData.puntosVentaAsignados.length > 0 && (
              <div className="mt-2 space-y-2"><h3 className="text-sm font-medium text-gray-700">Puntos asignados:</h3>
                <ul className="space-y-1">{vData.puntosVentaAsignados.map(pId => (<li key={pId} className="flex justify-between items-center bg-gray-50 p-2 rounded"><span>{getPVNameById(pId)}</span><button type="button" onClick={() => hPVRemove(pId)} className="text-red-500 hover:text-red-700">×</button></li>))}</ul>
              </div>)}
          </div>
          <div className="pt-4"><button type="submit" disabled={loading} className={`w-full py-3 px-4 rounded-lg font-medium text-white ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} transition-colors shadow-md`}>{loading ? (<span className="flex items-center justify-center"><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Guardando...</span>) : 'Registrar Vendedor'}</button></div>
        </form>
        {msg && (<div className="mx-6 mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">{msg}</div>)}
        {error && (<div className="mx-6 mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>)}
      </div>
    </div>
  );
}