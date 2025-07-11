import React, { useState, useEffect, useContext, useCallback } from "react";
import { apiContext } from "../../context/api_context";

export default function GetPointsSales() {
  // --- ESTADO ---
  const { getPointsByCompany, userData, companyData } = useContext(apiContext);
  
  const [data, setData] = useState(null); 
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companyName, setCompanyName] = useState("");
  
  // --- ESTADO PARA LA BÚSQUEDA (ACTUALIZADO) ---
  const initialSearchParams = { nombre: '', provincia: '', numero: '' };
  const [searchParams, setSearchParams] = useState(initialSearchParams);

  // --- DATOS PARA EL FORMULARIO ---
  const provinciasArgentinas = ['Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'];


  // --- LÓGICA DE OBTENCIÓN DE DATOS ---
  const fetchPoints = useCallback(async (page, filters) => {
    if (!userData?.empresa) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      setCompanyName(companyData?.nombreEmpresa || "Tu Empresa");
      const limit = 10;
      const responseData = await getPointsByCompany(userData.empresa, page, limit, filters);

      if (responseData?.puntosDeVenta && responseData?.pagination) {
        setData(responseData);
      } else {
        setData({ puntosDeVenta: [], pagination: null });
        throw new Error("La respuesta de la API no tiene el formato esperado.");
      }
    } catch (err) {
      setError(err.message || "Ocurrió un error al cargar los puntos de venta.");
    } finally {
      setIsLoading(false);
    }
  }, [getPointsByCompany, userData, companyData]);

  useEffect(() => {
    if (userData?.empresa) {
      fetchPoints(currentPage, searchParams);
    }
  }, [currentPage, userData?.empresa]);

  // --- MANEJADORES DE BÚSQUEDA ---
  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPoints(1, searchParams);
  };

  const handleClearSearch = () => {
    setSearchParams(initialSearchParams);
    if (currentPage !== 1) {
        setCurrentPage(1);
    } else {
        fetchPoints(1, initialSearchParams);
    }
  };

  // --- FUNCIÓN AUXILIAR DE FORMATO DE FECHA ---
  const formatDateTime = (isoString) => {
    if (!isoString) return "N/A";
    try {
      return new Date(isoString).toLocaleString('es-AR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return "Fecha inválida";
    }
  };
  
  if (isLoading && !data) return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="text-center p-6">
        <p className="text-gray-700 text-lg animate-pulse">Cargando puntos de venta...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="p-6 bg-red-100 text-red-800 rounded-lg">
        <p className="font-semibold">Error:</p>
        <p>{error}</p>
      </div>
    </div>
  );

  const points = data?.puntosDeVenta || [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Puntos de Venta</h1>
          <p className="text-gray-600 mt-1">Empresa: {companyName}</p>
        </div>
        
        {/* --- FORMULARIO DE BÚSQUEDA (ACTUALIZADO) --- */}
        <div className="p-4 bg-white rounded-lg shadow-sm mb-6 border">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                {/* Buscar por Nombre */}
                <div>
                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre</label>
                    <input type="text" name="nombre" id="nombre" value={searchParams.nombre} onChange={handleSearchChange} className="mt-1 w-full p-2 border rounded-md" placeholder="Nombre del punto..." />
                </div>

                {/* Filtrar por Provincia */}
                <div>
                    <label htmlFor="provincia" className="block text-sm font-medium text-gray-700">Provincia</label>
                    <select name="provincia" id="provincia" value={searchParams.provincia} onChange={handleSearchChange} className="mt-1 w-full p-2 border rounded-md">
                        <option value="">Todas</option>
                        {provinciasArgentinas.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                
                {/* Buscar por Número */}
                <div>
                    <label htmlFor="numero" className="block text-sm font-medium text-gray-700">Número</label>
                    <input type="number" name="numero" id="numero" value={searchParams.numero} onChange={handleSearchChange} className="mt-1 w-full p-2 border rounded-md" placeholder="N° de punto..." />
                </div>

                {/* Botones */}
                <div className="flex gap-2">
                    <button type="submit" className="w-full px-4 py-2 bg-[var(--principal)] text-white rounded-md hover:bg-[var(--principal-shadow)]">Buscar</button>
                    <button type="button" onClick={handleClearSearch} className="w-full px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">Limpiar</button>
                </div>
            </form>
        </div>
        
        {isLoading && <p className="text-center text-[var(--principal)] my-4">Actualizando...</p>}

        {points.length === 0 && !isLoading ? (
          <p className="text-gray-600 text-center py-10">No se encontraron puntos de venta con los filtros aplicados.</p>
        ) : (
          <>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {points.map(point => (
                <li key={point._id} className="p-4 border bg-white rounded-lg shadow-md break-inside-avoid">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-lg font-semibold text-gray-900">{point.nombre}</h2>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${point.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {point.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><span className="font-medium">Número:</span> {point.numero}</p>
                    <p><span className="font-medium">Dirección:</span> {point.direccion ? `${point.direccion}, ${point.ciudad || ''}` : 'No especificada'}</p>
                    <p><span className="font-medium">Último Cbte.:</span> {formatDateTime(point.fechaUltimoCbte)}</p>
                  </div>
                </li>
              ))}
            </ul>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-8">
                <button 
                  onClick={() => setCurrentPage(prev => prev - 1)} 
                  disabled={!pagination.hasPrevPage}
                  className="px-4 py-2 text-sm font-medium border bg-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-700">
                  Página <span className="font-bold">{pagination.currentPage}</span> de <span className="font-bold">{pagination.totalPages}</span>
                </span>
                <button 
                  onClick={() => setCurrentPage(prev => prev + 1)} 
                  disabled={!pagination.hasNextPage}
                  className="px-4 py-2 text-sm font-medium border bg-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}