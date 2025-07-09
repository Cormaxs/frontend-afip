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

  // --- LÓGICA DE OBTENCIÓN DE DATOS ---
  const fetchPoints = useCallback(async () => {
    if (!userData?.empresa) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setCompanyName(companyData?.nombreEmpresa || "Tu Empresa");
      const responseData = await getPointsByCompany(userData.empresa, currentPage);
      if (responseData?.puntosDeVenta && responseData?.pagination) {
        setData(responseData);
      } else {
        throw new Error("La respuesta de la API no tiene el formato de paginación esperado.");
      }
    } catch (err) {
      setError(err.message || "Ocurrió un error al cargar los puntos de venta.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, getPointsByCompany, userData, companyData]);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

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

  // --- RENDERIZADO DE ESTADOS DE CARGA Y ERROR ---
  if (isLoading) return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="text-center p-6">
        <p className="text-gray-700">Cargando puntos de venta...</p>
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

  // --- RENDERIZADO PRINCIPAL ---
  const points = data?.puntosDeVenta || [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Puntos de Venta</h1>
          <p className="text-gray-600 mt-1">Empresa: {companyName}</p>
        </div>
        
        {points.length === 0 && !isLoading ? (
          <p className="text-gray-600 text-center py-10">No hay puntos de venta registrados.</p>
        ) : (
          <>
            {/* Contenedor con Columnas Múltiples */}
            <ul className="columns-1 md:columns-2 gap-4 space-y-4">
              {points.map(point => (
                // La clase 'break-inside-avoid' es clave para que las tarjetas no se corten
                <li key={point._id} className="p-4 border bg-white rounded-lg break-inside-avoid">
                  <div className="flex justify-between items-start mb-2">
                      <h2 className="text-lg font-semibold text-gray-900">{point.nombre}</h2>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${point.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {point.activo ? "Activo" : "Inactivo"}
                      </span>
                  </div>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><span className="font-medium">Número:</span> {point.numero}</p>
                    <p><span className="font-medium">Dirección:</span> {point.direccion}, {point.ciudad}</p>
                    <p><span className="font-medium">Último Cbte.:</span> {point.ultimoCbteAutorizado || 'N/A'} ({formatDateTime(point.fechaUltimoCbte)})</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Controles de Paginación */}
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