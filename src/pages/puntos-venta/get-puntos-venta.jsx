import React, { useState, useEffect, useContext } from "react";
import { apiContext } from "../../context/api_context";

export function GetPointsSales() {
  const { getPointsByCompany: gPBC } = useContext(apiContext);
  const [p, setP] = useState([]), [l, setL] = useState(true), [e, setE] = useState(null), [cN, setCN] = useState("");

  const fP = async () => {
    setL(true); setE(null);
    try {
      const u = JSON.parse(localStorage.getItem("userData") || "{}"), dE = JSON.parse(localStorage.getItem("dataEmpresa") || "{}");
      const cI = u.empresa || ''; setCN(dE.nombreEmpresa || "Tu Empresa");
      if (!cI) throw new Error("ID de empresa no encontrado.");
      const d = await gPBC(cI);
      if (Array.isArray(d)) setP(d); else throw new Error("Respuesta de API inválida.");
    } catch (err) { setE(err.message || "Error al cargar puntos de venta."); } finally { setL(false); }
  };
  useEffect(() => { fP(); }, [gPBC]);

  const fDT = iS => { try { return iS ? new Date(iS).toLocaleString('es-AR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "N/A"; } catch { return "Fecha inválida"; } };

  if (l) return (<div className="flex justify-center items-center h-screen bg-gray-50"><div className="flex flex-col items-center p-6 rounded-lg shadow-md bg-white"><svg className="animate-spin h-8 w-8 text-blue-600 mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><p className="text-gray-700">Cargando puntos de venta...</p></div></div>);
  if (e) return (<div className="flex justify-center items-center h-screen bg-gray-50"><div className="p-6 rounded-lg shadow-md bg-red-100 text-red-700"><p className="font-semibold mb-2">Error al cargar datos:</p><p>{e}</p></div></div>);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-teal-700 p-6 text-center"><h1 className="text-2xl font-bold text-white">Puntos de Venta de {cN}</h1></div>
        <div className="p-6">
          {p.length === 0 ? (<p className="text-gray-600 text-center py-8">No hay puntos de venta registrados.</p>) : (
            <ul className="space-y-4">
              {p.map(x => (
                <li key={x._id} className="p-4 border rounded-lg shadow-sm bg-white">
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">{x.nombre} (Punto #{x.numero})</h2>
                  <p className="text-gray-600"><span className="font-medium">Estado:</span> {x.activo ? "Activo" : "Inactivo"}</p>
                  <p className="text-gray-600"><span className="font-medium">Dirección:</span> {x.direccion}, {x.ciudad}, {x.provincia} (CP: {x.codigoPostal})</p>
                  <p className="text-gray-600"><span className="font-medium">Teléfono:</span> {x.telefono}</p>
                  <p className="text-gray-600"><span className="font-medium">Último Cbte. Autorizado:</span> {x.ultimoCbteAutorizado}</p>
                  <p className="text-gray-600"><span className="font-medium">Fecha Último Cbte.:</span> {fDT(x.fechaUltimoCbte)}</p>
                  <p className="text-gray-600 text-sm mt-2"><span className="font-medium">Creado:</span> {fDT(x.createdAt)}</p>
                  <p className="text-gray-600 text-sm"><span className="font-medium">Actualización:</span> {fDT(x.updatedAt)}</p>
                  <p className="text-gray-600 text-sm mt-2"><span className="font-medium">ID:</span> {x._id}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}