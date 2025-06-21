import React, { useContext, useState, useEffect, useMemo } from "react";
import { apiContext } from "../../context/api_context";

export function CreateTikets() {
  const { createTiketContext: cTC, getPointsByCompany: gPBC } = useContext(apiContext);
  const [eId, setEId] = useState(null), [uId, setUId] = useState(null);
  const [msg, setMsg] = useState(''), [err, setErr] = useState('');
  const [items, setItems] = useState([]);
  const [nI, setNI] = useState({ codigo: "", descripcion: "", cantidad: 1, precioUnitario: 0.00 });
  const [fI, setFI] = useState({ puntoDeVenta: "", tipoComprobante: "Ticket", metodoPago: "Efectivo", montoRecibido: 0.00, nombreCliente: "", dniCuitCliente: "", condicionIVACliente: "Consumidor Final", observaciones: "" });
  const [pDV, setPDV] = useState([]);
  const [fHT, setFHT] = useState('');

  useEffect(() => {
    const lD = async () => {
      let hE = false;
      const eDS = localStorage.getItem("dataEmpresa") || "{}", uDS = localStorage.getItem("userData") || "{}";
      try { const e = JSON.parse(eDS); if (e?._id) setEId(e._id); else { setErr("ID empresa no válido."); hE = true; } } catch { setErr("Error empresa local."); hE = true; }
      try { const u = JSON.parse(uDS); if (u?._id) setUId(u._id); else { setErr(p => p ? `${p} | ID usuario no válido.` : "ID usuario no válido."); hE = true; } } catch { setErr(p => p ? `${p} | Error usuario local.` : "Error usuario local."); hE = true; }
      const n = new Date(); setFHT(`${n.getFullYear()}-${(n.getMonth() + 1).toString().padStart(2, '0')}-${n.getDate().toString().padStart(2, '0')}T${n.getHours().toString().padStart(2, '0')}:${n.getMinutes().toString().padStart(2, '0')}`);
      if (!hE && eId) {
        try { const p = await gPBC(eId); if (p?.length) { setPDV(p); setFI(v => ({ ...v, puntoDeVenta: p[0].nombre })); } else { setPDV([]); setFI(v => ({ ...v, puntoDeVenta: "" })); setErr(p => p ? `${p} | No hay puntos de venta.` : "No hay puntos de venta."); } }
        catch { setErr(p => p ? `${p} | Error cargando puntos de venta.` : "Error cargando puntos de venta."); setPDV([]); setFI(v => ({ ...v, puntoDeVenta: "" })); }
      }
      if (hE) setMsg('');
    };
    lD();
  }, [eId, gPBC]);

  const { subtotal: s, totalPagar: tP, cambio: c } = useMemo(() => {
    const cS = items.reduce((a, i) => a + i.totalItem, 0);
    const cTP = cS;
    const cC = fI.metodoPago === 'Efectivo' && fI.montoRecibido > cTP ? fI.montoRecibido - cTP : 0;
    return { subtotal: cS, totalPagar: cTP, cambio: cC };
  }, [items, fI.montoRecibido, fI.metodoPago]);

  const hFIC = e => { const { name, value } = e.target; setFI(p => ({ ...p, [name]: name === "montoRecibido" ? parseFloat(value) || 0 : value })); };
  const hNIC = e => { const { name, value } = e.target; setNI(p => ({ ...p, [name]: (name === "cantidad" || name === "precioUnitario") ? parseFloat(value) || 0 : value })); };
  const hAI = () => {
    if (!nI.descripcion.trim() || nI.cantidad <= 0) { alert("Completa descripción y cantidad > 0."); return; }
    setItems(p => [...p, { ...nI, totalItem: nI.cantidad * nI.precioUnitario }]);
    setNI({ codigo: "", descripcion: "", cantidad: 1, precioUnitario: 0.00 });
  };
  const hRI = iR => setItems(p => p.filter((_, i) => i !== iR));

  const hS = async e => {
    e.preventDefault(); setMsg(''); setErr('');
    if (!eId) { setErr("Error: ID empresa no disponible."); return; }
    if (!uId) { setErr("Error: ID usuario no disponible."); return; }
    if (!items.length) { setErr("Error: Agrega al menos un ítem."); return; }
    if (!fI.puntoDeVenta) { setErr("Error: Selecciona punto de venta."); return; }
    if (fI.metodoPago === 'Efectivo' && fI.montoRecibido < tP) { setErr(`Error: Monto recibido ($${fI.montoRecibido.toFixed(2)}) menor al total ($${tP.toFixed(2)}).`); return; }

    const sDT = new Date(fHT).toLocaleString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const sVI = `VK${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${(crypto.randomUUID ? crypto.randomUUID().slice(-8) : Math.floor(Math.random() * 100000000).toString().padStart(8, '0'))}`;
    const sNC = `0001-${Math.floor(Math.random() * 9000) + 1000}`;
    const tD = { ventaId: sVI, fechaHora: sDT, puntoDeVenta: fI.puntoDeVenta, tipoComprobante: fI.tipoComprobante, numeroComprobante: sNC, items: items, totales: { subtotal: s, descuento: 0.00, totalPagar: tP }, pago: { metodo: fI.metodoPago, montoRecibido: fI.montoRecibido, cambio: c }, cliente: (fI.nombreCliente || fI.dniCuitCliente) ? { nombre: fI.nombreCliente, dniCuit: fI.dniCuitCliente, condicionIVA: fI.condicionIVACliente } : undefined, observaciones: fI.observaciones, cajero: "Cajero Test", sucursal: "Sucursal Principal", idUsuario: uId, idEmpresa: eId };

    try {
      const r = await cTC(tD); setMsg(`Ticket creado. ID: ${r.databaseRecordId}, Venta: ${r.ventaId}`);
      setItems([]); setNI({ codigo: "", descripcion: "", cantidad: 1, precioUnitario: 0.00 });
      setFI(p => ({ ...p, montoRecibido: 0.00, nombreCliente: "", dniCuitCliente: "", condicionIVACliente: "Consumidor Final", observaciones: "" }));
      const n = new Date(); setFHT(`${n.getFullYear()}-${(n.getMonth() + 1).toString().padStart(2, '0')}-${n.getDate().toString().padStart(2, '0')}T${n.getHours().toString().padStart(2, '0')}:${n.getMinutes().toString().padStart(2, '0')}`);
    } catch (er) { setErr(`Error al crear ticket: ${er.message || 'Error desconocido'}.`); }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-xl border border-gray-200">
      <h2 className="text-3xl font-bold mb-6 text-center text-blue-ui">Crear Ticket</h2>
      <div className="mb-4 text-center text-lg"><p className="text-gray-700">ID Empresa: <strong className="text-blue-ui-dark">{eId || 'Cargando...'}</strong></p><p className="text-gray-700">ID Usuario: <strong className="text-blue-ui-dark">{uId || 'Cargando...'}</strong></p></div>
      {msg && (<div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert"><strong className="font-bold">¡Éxito! </strong><span>{msg}</span></div>)}
      {err && (<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert"><strong className="font-bold">¡Error! </strong><span>{err}</span></div>)}
      <form onSubmit={hS}>
        <hr className="my-6 border-t border-gray-300" /><h3 className="text-2xl font-semibold mb-4 text-blue-ui">Detalles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div><label htmlFor="pDV" className="block text-gray-700 text-sm font-bold mb-2">Punto Venta:</label><select id="pDV" name="puntoDeVenta" value={fI.puntoDeVenta} onChange={hFIC} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" disabled={pDV.length === 0}>{pDV.length === 0 ? (<option value="">Cargando puntos...</option>) : (pDV.map(p => (<option key={p._id} value={p.nombre}>{p.nombre}</option>)))}</select>{pDV.length === 0 && !err && (<p className="text-sm text-gray-500 mt-1">Asegure puntos de venta.</p>)}</div>
          <div><label htmlFor="tC" className="block text-gray-700 text-sm font-bold mb-2">Tipo Comprobante:</label><input type="text" id="tC" name="tipoComprobante" value={fI.tipoComprobante} onChange={hFIC} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/></div>
          <div><label htmlFor="fHT" className="block text-gray-700 text-sm font-bold mb-2">Fecha y Hora:</label><input type="datetime-local" id="fHT" name="fechaHoraTicket" value={fHT} onChange={e => setFHT(e.target.value)} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/></div>
        </div>

        <hr className="my-6 border-t border-gray-300" /><h3 className="text-2xl font-semibold mb-4 text-blue-ui">Agregar Ítem</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 items-end">
          <div><label htmlFor="c" className="block text-gray-700 text-sm font-bold mb-2">Código:</label><input type="text" id="c" name="codigo" value={nI.codigo} onChange={hNIC} className="shadow border rounded w-full py-2 px-3 text-gray-700"/></div>
          <div className="md:col-span-2 lg:col-span-1"><label htmlFor="d" className="block text-gray-700 text-sm font-bold mb-2">Descripción:*</label><input type="text" id="d" name="descripcion" value={nI.descripcion} onChange={hNIC} className="shadow border rounded w-full py-2 px-3 text-gray-700"/></div>
          <div><label htmlFor="q" className="block text-gray-700 text-sm font-bold mb-2">Cantidad:*</label><input type="number" id="q" name="cantidad" value={nI.cantidad} onChange={hNIC} min="1" className="shadow border rounded w-full py-2 px-3 text-gray-700"/></div>
          <div><label htmlFor="pU" className="block text-gray-700 text-sm font-bold mb-2">Precio Unitario:</label><input type="number" id="pU" name="precioUnitario" value={nI.precioUnitario} onChange={hNIC} min="0.00" step="0.01" className="shadow border rounded w-full py-2 px-3 text-gray-700"/></div>
          <button type="button" onClick={hAI} className="bg-blue-700 hover:bg-blue-700-dark text-white font-bold py-2 px-4 rounded">Agregar</button>
        </div>

        <h3 className="text-2xl font-semibold mb-4 text-blue-ui">Ítems:</h3>
        {items.length === 0 ? (<p className="text-center text-gray-600 mb-6">No hay ítems. Agregue productos.</p>) : (
          <ul className="space-y-4 mb-6">
            {items.map((x, i) => (<li key={i} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg shadow-sm bg-gray-500"><div><p className="text-lg font-medium text-gray-800"><strong>{x.descripcion || '[Sin Descripción]'}</strong> ({x.codigo || '[Sin Código]'})</p><p className="text-gray-600">Cantidad: {x.cantidad} x ${x.precioUnitario.toFixed(2)} = <strong className="text-blue-ui">${x.totalItem.toFixed(2)}</strong></p></div><button type="button" onClick={() => hRI(i)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm">Eliminar</button></li>))}
          </ul>
        )}
        <hr className="my-6 border-t border-gray-300" />

        <h3 className="text-2xl font-semibold mb-4 text-blue-ui">Totales:</h3>
        <div className="text-lg mb-6"><p className="text-gray-700">Subtotal: <strong className="text-blue-ui">${s.toFixed(2)}</strong></p><p className="text-gray-700">Descuento: <strong className="text-blue-ui">${0.00.toFixed(2)}</strong></p><p className="text-2xl font-bold text-blue-ui-dark mt-2">Total a Pagar: ${tP.toFixed(2)}</p></div>
        <hr className="my-6 border-t border-gray-300" />

        <h3 className="text-2xl font-semibold mb-4 text-blue-ui">Pago:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div><label htmlFor="mP" className="block text-gray-700 text-sm font-bold mb-2">Método Pago:</label><select id="mP" name="metodoPago" value={fI.metodoPago} onChange={hFIC} className="shadow border rounded w-full py-2 px-3 text-gray-700"><option value="Efectivo">Efectivo</option><option value="Tarjeta Débito">Débito</option><option value="Tarjeta Crédito">Crédito</option><option value="Mercado Pago">Mercado Pago</option></select></div>
          {fI.metodoPago === "Efectivo" && (<div><label htmlFor="mR" className="block text-gray-700 text-sm font-bold mb-2">Monto Recibido:</label><input type="number" id="mR" name="montoRecibido" value={fI.montoRecibido} onChange={hFIC} min="0" step="0.01" className="shadow border rounded w-full py-2 px-3 text-gray-700"/></div>)}
        </div>
        <p className="text-lg text-gray-700 mb-6">Cambio: <strong className="text-blue-ui">${c.toFixed(2)}</strong></p>
        <hr className="my-6 border-t border-gray-300" />

        <h3 className="text-2xl font-semibold mb-4 text-blue-ui">Cliente (Opcional):</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div><label htmlFor="nC" className="block text-gray-700 text-sm font-bold mb-2">Nombre:</label><input type="text" id="nC" name="nombreCliente" value={fI.nombreCliente} onChange={hFIC} className="shadow border rounded w-full py-2 px-3 text-gray-700"/></div>
          <div><label htmlFor="dC" className="block text-gray-700 text-sm font-bold mb-2">DNI/CUIT:</label><input type="text" id="dC" name="dniCuitCliente" value={fI.dniCuitCliente} onChange={hFIC} className="shadow border rounded w-full py-2 px-3 text-gray-700"/></div>
          <div className="md:col-span-2"><label htmlFor="cIVAC" className="block text-gray-700 text-sm font-bold mb-2">Condición IVA:</label><select id="cIVAC" name="condicionIVACliente" value={fI.condicionIVACliente} onChange={hFIC} className="shadow border rounded w-full py-2 px-3 text-gray-700"><option value="Consumidor Final">Final</option><option value="Responsable Inscripto">Inscripto</option><option value="Monotributista">Monotributista</option><option value="Exento">Exento</option></select></div>
        </div>

        <div className="mb-6"><label htmlFor="obs" className="block text-gray-700 text-sm font-bold mb-2">Observaciones:</label><textarea id="obs" name="observaciones" value={fI.observaciones} onChange={hFIC} rows="3" className="shadow border rounded w-full py-2 px-3 text-gray-700 resize-y"/></div>
        <button type="submit" disabled={!eId || !uId || !items.length || !pDV.length || !fI.puntoDeVenta} className={`w-full py-3 px-6 rounded-lg text-white text-xl font-bold transition duration-300 ease-in-out ${(!eId || !uId || !items.length || !pDV.length || !fI.puntoDeVenta) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-700-dark'}`}>Crear Ticket</button>
      </form>
    </div>
  );
}