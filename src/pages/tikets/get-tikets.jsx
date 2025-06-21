import { apiContext } from "../../context/api_context";
import { useContext, useEffect, useState } from "react";

export function VerTiketsCompany() {
  const { getTiketsContext: gTC } = useContext(apiContext);
  const [tks, setTks] = useState([]), [loading, setLoading] = useState(true), [err, setErr] = useState(null);

  useEffect(() => {
    const fT = async () => {
      setLoading(true); setErr(null); let cId = null;
      try {
        const dES = localStorage.getItem("dataEmpresa");
        if (dES) { const dE = JSON.parse(dES); if (dE?._id) cId = dE._id;
          else { console.error("dataEmpresa sin _id."); setErr("ID empresa no válido."); setLoading(false); return; }
        } else { setErr("No hay info empresa local. Inicie sesión."); setLoading(false); return; }
        if (cId) { console.log("Cargando tickets para ID:", cId); const fTks = await gTC(cId); setTks(fTks); }
      } catch (e) { console.error("Error al cargar tickets:", e); setErr(`Error: ${e.message || 'Desconocido'}.`);
      } finally { setLoading(false); }
    };
    fT();
  }, [gTC]);

  if (loading) return (<div className="flex justify-center items-center h-screen"><p className="text-xl text-gray-700">Cargando tickets...</p></div>);
  if (err) return (<div className="max-w-4xl mx-auto p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-xl mt-10"><p className="text-center font-bold">¡Error!</p><p className="text-center">{err}</p></div>);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-xl border border-gray-200">
      <h2 className="text-3xl font-bold mb-6 text-center text-blue-ui">Tickets de Empresa</h2>
      {tks.length > 0 ? (
        <div className="divide-y divide-gray-200"> {/* Use divide-y for line separation */}
          {tks.map(t => (
            <div key={t._id || t.ventaId} className="py-4 px-2 hover:bg-gray-50 transition-colors duration-200"> {/* Minimal padding, hover effect */}
              <p className="text-lg font-semibold text-gray-800">ID Venta: {t.ventaId || 'N/A'} <span className="float-right text-green-700">Total: ${t.totales?.totalPagar?.toFixed(2) || '0.00'}</span></p>
              <p className="text-sm text-gray-600">Fecha: {new Date(t.fechaHora).toLocaleString('es-AR') || 'N/A'} | Punto de Venta: {t.puntoDeVenta || 'N/A'}</p>
              <p className="text-sm text-gray-600">Cajero: {t.cajero || 'N/A'} | Comprobante: {t.tipoComprobante || 'N/A'} {t.numeroComprobante || ''}</p>
              {t.cliente && (t.cliente.nombre || t.cliente.dniCuit) && (<p className="text-sm text-gray-600">Cliente: {t.cliente.nombre || 'N/A'} ({t.cliente.dniCuit || 'N/A'})</p>)}
            </div>
          ))}
        </div>
      ) : (<p className="text-center text-gray-600">No se encontraron tickets.</p>)}
    </div>
  );
}