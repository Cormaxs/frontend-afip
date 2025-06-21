import React, { useState, useEffect, useContext } from 'react';
import { apiContext } from "../../context/api_context";

export function AgregarProducto() {
  const { createProduct: cP } = useContext(apiContext);
  const [d, setD] = useState(() => {
    const u = JSON.parse(localStorage.getItem("userData") || "{}"), e = JSON.parse(localStorage.getItem("dataEmpresa") || "{}");
    return {
      empresa: u.empresa || '', cName: e.nombreEmpresa || '', codigoInterno: '', producto: '', descripcion: '', marca: '', categoria: '', unidadMedida: '94',
      ancho_cm: '', alto_cm: '', profundidad_cm: '', peso_kg: '', precioCosto: '', precioLista: 0, alic_IVA: 21, markupPorcentaje: '',
      stock_disponible: '', stockMinimo: '', ubicacionAlmacen: '', activo: true
    };
  });
  const [l, setL] = useState(false), [m, setM] = useState(''), [err, setErr] = useState('');

  const cats = ['Servicios Web', 'Hosting', 'Dominios', 'Software', 'Hardware', 'Consultoría'];
  const ums = [{ v: '94', l: 'Unidad' }, { v: '7', l: 'Kg' }, { v: '1', l: 'Mtr' }, { v: '21', l: 'Hr' }];

  const hC = e => { const { name, value } = e.target; if (name === 'empresa') return; setD(p => ({ ...p, [name]: value })); };
  const hNC = e => setD(p => ({ ...p, [e.target.name]: parseFloat(e.target.value) || 0 }));
  const hChC = e => setD(p => ({ ...p, [e.target.name]: e.target.checked }));
  const cPL = () => ((parseFloat(d.precioCosto) || 0) * (1 + (parseFloat(d.markupPorcentaje) || 0) / 100)).toFixed(2);

  const hS = async e => {
    e.preventDefault(); setL(true); setM(''); setErr('');
    try {
      if (!d.codigoInterno || !d.producto || !d.empresa) throw new Error('Campos obligatorios faltantes.');
      const dataToSend = { ...d, precioLista: d.precioLista === 0 ? parseFloat(cPL()) : parseFloat(d.precioLista) };
      await cP(dataToSend); setM('Producto registrado!');
      setD(p => ({ ...p, codigoInterno: '', producto: '', descripcion: '', marca: '', categoria: '', ancho_cm: '', alto_cm: '', profundidad_cm: '', peso_kg: '', precioCosto: '', precioLista: 0, markupPorcentaje: '', stock_disponible: '', stockMinimo: '', ubicacionAlmacen: '' }));
    } catch (e) { setErr(e.response?.data?.message || e.message || 'Error al registrar.'); } finally { setL(false); }
  };

  const fields = [
    { t: "s", ti: "Información Básica" },
    { l: "Empresa (Owner)*", n: "empresa", ty: "text", v: d.cName, ro: true, ph: "Nombre de la empresa (auto)" },
    { l: "Código Interno*", n: "codigoInterno", ty: "text", v: d.codigoInterno, req: true, ph: "Ej: SERV-INST-WEB" },
    { l: "Producto/Servicio*", n: "producto", ty: "text", v: d.producto, req: true, ph: "Nombre del producto/servicio" },
    { l: "Descripción", n: "descripcion", ty: "textarea", v: d.descripcion, rows: "3", ph: "Descripción detallada" },
    { l: "Marca", n: "marca", ty: "text", v: d.marca, ph: "Marca o proveedor" },
    { l: "Categoría*", n: "categoria", ty: "select", v: d.categoria, opts: cats, req: true, ph: "Seleccione" },

    { t: "s", ti: "Detalles Técnicos" },
    { l: "Unidad Medida*", n: "unidadMedida", ty: "select", v: d.unidadMedida, opts: ums, ovk: "v", olk: "l" },
    { l: "Ancho (cm)", n: "ancho_cm", ty: "number", v: d.ancho_cm, min: "0", st: "0.1" },
    { l: "Alto (cm)", n: "alto_cm", ty: "number", v: d.alto_cm, min: "0", st: "0.1" },
    { l: "Prof. (cm)", n: "profundidad_cm", ty: "number", v: d.profundidad_cm, min: "0", st: "0.1" },
    { l: "Peso (kg)", n: "peso_kg", ty: "number", v: d.peso_kg, min: "0", st: "0.1" },

    { t: "s", ti: "Información Económica" },
    { l: "Precio Costo*", n: "precioCosto", ty: "number", v: d.precioCosto, req: true, min: "0", st: "0.01" },
    { l: "Markup %", n: "markupPorcentaje", ty: "number", v: d.markupPorcentaje, min: "0", st: "0.1" },
    { l: "Precio Lista", n: "precioLista", ty: "number", v: d.precioLista || cPL(), ro: true, bg: "bg-gray-50", min: "0", st: "0.01" },
    { l: "IVA %*", n: "alic_IVA", ty: "number", v: d.alic_IVA, req: true, min: "0", max: "100", st: "0.1" },

    { t: "s", ti: "Inventario", cs: 2 },
    { l: "Stock Disponible", n: "stock_disponible", ty: "number", v: d.stock_disponible, min: "0" },
    { l: "Stock Mínimo", n: "stockMinimo", ty: "number", v: d.stockMinimo, min: "0" },
    { l: "Ubicación Almacén", n: "ubicacionAlmacen", ty: "text", v: d.ubicacionAlmacen, ph: "Ej: Pasillo 2, Estante B" },
    { l: "Producto activo", n: "activo", ty: "checkbox", v: d.activo }
  ];

  const rF = (f) => {
    const cp = { name: f.n, value: f.v, onChange: f.ty === 'number' ? hNC : hC, required: f.req, className: `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${f.ro ? 'bg-gray-100 cursor-not-allowed' : ''} ${f.bg || ''}` };
    if (f.ty === 'select') return (<select {...cp}>{f.ph && <option value="">{f.ph}</option>}{f.opts.map(o => <option key={f.ovk ? o[f.ovk] : o} value={f.ovk ? o[f.ovk] : o}>{f.olk ? o[f.olk] : o}</option>)}</select>);
    if (f.ty === 'textarea') return (<textarea {...cp} rows={f.rows} placeholder={f.ph} />);
    if (f.ty === 'checkbox') return (<div className="flex items-center"><input type="checkbox" id={f.n} checked={f.v} onChange={hChC} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" /><label htmlFor={f.n} className="ml-2 block text-sm text-gray-700">{f.l}</label></div>);
    return (<input type={f.ty} {...cp} readOnly={f.ro} min={f.min} max={f.max} step={f.st} placeholder={f.ph} />);
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 text-center bg-blue-600 text-white"><h1 className="text-2xl font-bold">Agregar Producto/Servicio</h1></div>
        <form onSubmit={hS} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((f, i) => f.t === "s" ? (<h2 key={i} className={`text-lg font-semibold text-gray-700 border-b pb-2 ${f.cs ? 'md:col-span-2' : ''}`}>{f.ti}</h2>) : (
            <div key={i} className={`form-group ${f.n.match(/^(ancho_cm|alto_cm|profundidad_cm)$/) ? '' : (f.cs ? 'md:col-span-2' : '')}`}>
              {f.ty !== 'checkbox' && <label className="block text-sm font-medium text-gray-700 mb-1">{f.l}</label>}
              {rF(f)}
            </div>
          ))}
          <div className="md:col-span-2">
            <button type="submit" disabled={l} className={`w-full py-3 px-4 rounded-lg font-medium text-white ${l ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} shadow-md`}>
              {l ? (<span className="flex items-center justify-center"><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Guardando...</span>) : 'Guardar Producto'}
            </button>
          </div>
        </form>
        {m && (<div className="mx-6 mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">{m}</div>)}
        {err && (<div className="mx-6 mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{err}</div>)}
      </div>
    </div>
  );
}