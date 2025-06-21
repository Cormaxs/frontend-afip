import React, { useState, useEffect, useContext } from "react";
import { apiContext } from "../../context/api_context";

export function GetProductsCompany() {
  const { getProductsEmpresa: getProds } = useContext(apiContext);
  const [prods, setProds] = useState([]);
  const [load, setLoad] = useState(true);
  const [err, setErr] = useState(null);
  const [cName, setCName] = useState("");

  useEffect(() => {
    (async () => {
      setLoad(true); setErr(null);
      try {
        const uData = JSON.parse(localStorage.getItem("userData") || "{}");
        const eData = JSON.parse(localStorage.getItem("dataEmpresa") || "{}");
        const cId = uData.empresa || "";
        setCName(eData.nombreEmpresa || "Tu Empresa");
        if (!cId) throw new Error("ID de empresa no encontrado.");
        const data = await getProds(cId);
        if (!Array.isArray(data)) throw new Error("Respuesta inválida.");
        setProds(data);
      } catch (e) {
        console.error("Error:", e);
        setErr(e.message || "Error al cargar productos.");
      } finally { setLoad(false); }
    })();
  }, [getProds]);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {load ? (
        <div className="flex flex-col items-center justify-center h-screen bg-white shadow-md p-6 rounded-lg text-blue-600">
          <svg className="animate-spin h-8 w-8 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><p>Cargando productos...</p>
        </div>
      ) : err ? (
        <div className="flex items-center justify-center h-screen p-6 bg-red-100 text-red-700 shadow-md rounded-lg"><p className="font-semibold">Error: {err}</p></div>
      ) : (
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 text-center bg-blue-600 text-white"><h1 className="text-2xl font-bold">Productos de {cName}</h1></div>
          <div className="p-6">
            {prods.length === 0 ? (<p className="text-gray-600 text-center py-8">No hay productos.</p>) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {prods.map(p => (
                  <div key={p._id} className="border rounded-lg shadow-sm p-5">
                    <h2 className="text-xl font-bold mb-2">{p.producto}</h2>
                    <p className="text-sm text-gray-500 mb-2">Cód: <span className="font-semibold">{p.codigoInterno}</span></p>
                    <p className="text-gray-700">Desc: {p.descripcion}</p>
                    <p className="text-gray-700">Marca: {p.marca}</p>
                    <p className="text-gray-700">Stock: <span className="font-semibold">{p.stock_disponible}</span> unid.</p>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-lg font-bold text-blue-600">Precio: ${p.precioLista.toFixed(2)}</p>
                      <p className={`text-sm font-semibold ${p.activo ? "text-blue-500" : "text-red-500"}`}>Estado: {p.activo ? "Activo" : "Inactivo"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}