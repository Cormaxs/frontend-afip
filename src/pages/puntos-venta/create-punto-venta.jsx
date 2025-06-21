import React, { useState, useEffect, useContext } from 'react';
import { apiContext } from "../../context/api_context";

export function AgregarPuntoVenta() {
  const { createPointSale: cPS } = useContext(apiContext);
  const [d, setD] = useState(() => {
    const u = JSON.parse(localStorage.getItem("userData") || "{}"), e = JSON.parse(localStorage.getItem("dataEmpresa") || "{}");
    return { empresa: u.empresa || '', cName: e.nombreEmpresa || '', numero: '', nombre: '', activo: true, ultimoCbteAutorizado: '', fechaUltimoCbte: '', direccion: '', ciudad: '', provincia: '', codigoPostal: '', telefono: '' };
  });
  const [l, setL] = useState(false), [m, setM] = useState(''), [err, setErr] = useState('');

  const provs = ['Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'];

  const hC = e => { const { name, value } = e.target; if (name === 'empresa') return; setD(p => ({ ...p, [name]: value })); };
  const hNC = e => setD(p => ({ ...p, [e.target.name]: e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0 }));
  const hChC = e => setD(p => ({ ...p, [e.target.name]: e.target.checked }));

  const hS = async e => {
    e.preventDefault(); setL(true); setM(''); setErr('');
    try {
      if (!d.empresa) throw new Error('ID de empresa no cargado.');
      if (!d.numero || isNaN(parseInt(d.numero, 10))) throw new Error('"Número de Punto" inválido.');
      if (!d.nombre) throw new Error('"Nombre" es obligatorio.');
      const sD = { ...d, numero: parseInt(d.numero, 10), ultimoCbteAutorizado: d.ultimoCbteAutorizado ? parseInt(d.ultimoCbteAutorizado, 10) : 0, fechaUltimoCbte: d.fechaUltimoCbte || null, cName: undefined }; // Remove cName before sending
      await cPS(sD); setM('Punto de venta registrado!');
      setD(p => ({ ...p, numero: '', nombre: '', activo: true, ultimoCbteAutorizado: '', fechaUltimoCbte: '', direccion: '', ciudad: '', provincia: '', codigoPostal: '', telefono: '' }));
      setTimeout(() => setM(''), 3000);
    } catch (e) { setErr(e.message || 'Error al registrar.'); setTimeout(() => setErr(''), 5000); } finally { setL(false); }
  };

  const fields = [
    { l: "Empresa (Owner)*", n: "empresa", ty: "text", v: d.cName, ro: true, ph: "Nombre (auto)" },
    { l: "Número de Punto*", n: "numero", ty: "number", v: d.numero, hC: hNC, req: true, min: "1", ph: "Número único" },
    { l: "Nombre*", n: "nombre", ty: "text", v: d.nombre, req: true, ph: "Ej: Casa Central" },
    { l: "Último Cbte. Autorizado", n: "ultimoCbteAutorizado", ty: "number", v: d.ultimoCbteAutorizado, hC: hNC, min: "0", ph: "Último comprobante" },
    { l: "Fecha Último Cbte.", n: "fechaUltimoCbte", ty: "datetime-local", v: d.fechaUltimoCbte },
    { l: "Dirección", n: "direccion", ty: "text", v: d.direccion, ph: "Dirección completa" },
    { l: "Ciudad", n: "ciudad", ty: "text", v: d.ciudad, ph: "Ciudad" },
    { l: "Provincia", n: "provincia", ty: "select", v: d.provincia, opts: provs, ph: "Seleccione" },
    { l: "Código Postal", n: "codigoPostal", ty: "text", v: d.codigoPostal, ph: "Ej: C1043AAW" },
    { l: "Teléfono", n: "telefono", ty: "tel", v: d.telefono, ph: "+541148765432" },
    { l: "Punto de venta activo", n: "activo", ty: "checkbox", v: d.activo }
  ];

  const rF = (f) => {
    const commonProps = { name: f.n, value: f.v, onChange: f.hC || hC, required: f.req, className: `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${f.ro ? 'bg-gray-100 cursor-not-allowed' : ''}` };
    if (f.ty === 'select') return (<select {...commonProps}>{f.ph && <option value="">{f.ph}</option>}{f.opts.map(o => <option key={o} value={o}>{o}</option>)}</select>);
    if (f.ty === 'checkbox') return (<div className="flex items-center pt-2"><input type="checkbox" id={f.n} checked={f.v} onChange={hChC} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" /><label htmlFor={f.n} className="ml-2 text-sm text-gray-700">{f.l}</label></div>);
    return (<input type={f.ty} {...commonProps} readOnly={f.ro} min={f.min} placeholder={f.ph} />);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 text-center bg-blue-600 text-white"><h1 className="text-2xl font-bold">Agregar Punto de Venta</h1></div>
        <form onSubmit={hS} className="p-6 grid md:grid-cols-2 gap-6">
          {fields.map((f, i) => (
            <div key={i} className={`form-group ${f.ty === 'checkbox' ? 'md:col-span-2' : ''}`}>
              {f.ty !== 'checkbox' && <label className="block text-sm font-medium text-gray-700 mb-1">{f.l}</label>}
              {rF(f)}
            </div>
          ))}
          <div className="md:col-span-2 pt-4">
            <button type="submit" disabled={l} className={`w-full py-3 px-4 rounded-lg font-medium text-white ${l ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} shadow-md`}>
              {l ? (<span className="flex items-center justify-center"><svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Guardando...</span>) : 'Guardar Punto de Venta'}
            </button>
          </div>
        </form>
        {m && (<div className="mx-6 mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">{m}</div>)}
        {err && (<div className="mx-6 mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{err}</div>)}
      </div>
    </div>
  );
}