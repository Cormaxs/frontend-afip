import { apiContext } from "../../context/api_context";
import { useContext, useEffect, useState, useCallback, useMemo } from "react";

// --- Constantes y Helpers para Paginación ---
const DOTS = '...';
const range = (start, end) => Array.from({ length: end - start + 1 }, (_, idx) => idx + start);

// --- Iconos para botones ---
const ChevronLeftIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1 0 1.06L8.854 10l3.938 3.71a.75.75 0 1 1-1.06 1.06l-4.25-4.5a.75.75 0 0 1 0-1.06l4.25-4.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" /></svg>
);
const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 0-1.06L11.146 10 7.21 6.29a.75.75 0 1 1 1.06-1.06l4.25 4.5a.75.75 0 0 1 0 1.06l-4.25 4.5a.75.75 0 0 1-1.06 0Z" clipRule="evenodd" /></svg>
);
const PdfIcon = () => (
    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
);


// --- Componente Principal ---
export default function VerTiketsCompany() {
  const apiContextValue = useContext(apiContext);

  if (!apiContextValue) {
    // ... (código de error de contexto sin cambios)
  }

  const { getTiketsContext: fetchTicketsFromAPI, userData, getTiketsPdf } = apiContextValue;
  
  // --- Estados del Componente ---
  const [tickets, setTickets] = useState([]);
  const [paginationInfo, setPaginationInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(null); // Estado para saber qué PDF se está cargando

  // --- Lógica de Petición de Datos ---
  const fetchTickets = useCallback(async (page, itemsLimit, signal) => {
    // ... (lógica de fetchTickets sin cambios, pero corregimos la estructura de la respuesta)
    setIsLoading(true);
    setError(null);
    try {
      const dataEmpresaString = localStorage.getItem("dataEmpresa");
      if (!dataEmpresaString) throw new Error("Datos de empresa no encontrados.");
      
      const companyId = JSON.parse(dataEmpresaString)?._id;
      if (!companyId) throw new Error("ID de empresa no válido.");
      
      const response = await fetchTicketsFromAPI(companyId, page, itemsLimit, { signal });
      
      // Corregido para usar `response.pagination`
      if (response && Array.isArray(response.tickets) && response.pagination) {
        setTickets(response.tickets);
        setPaginationInfo({
          currentPage: response.pagination.currentPage || 1,
          hasNextPage: response.pagination.hasNextPage || false,
          hasPrevPage: response.pagination.hasPrevPage || false,
          totalPages: response.pagination.totalPages || 1,
          totalTickets: response.pagination.totalTickets || 0
        });
      } else {
        throw new Error("La respuesta de la API no tiene el formato esperado.");
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        setError(e.message || 'Ocurrió un error desconocido.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchTicketsFromAPI]);

  // --- Efecto para Cargar Datos ---
  useEffect(() => {
    const controller = new AbortController();
    fetchTickets(currentPage, limit, controller.signal);
    return () => controller.abort();
  }, [currentPage, limit, fetchTickets]);

  // --- Lógica de Paginación ---
  const paginationRange = useMemo(() => {
    // ... (lógica de paginationRange sin cambios)
    if (!paginationInfo || !paginationInfo.totalPages) return [];
    const { totalPages } = paginationInfo;
    const siblingCount = 1;
    const totalPageNumbers = siblingCount + 5;
    if (totalPageNumbers >= totalPages) return range(1, totalPages);
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;
    if (!shouldShowLeftDots && shouldShowRightDots) return [...range(1, 3 + 2 * siblingCount), DOTS, totalPages];
    if (shouldShowLeftDots && !shouldShowRightDots) return [1, DOTS, ...range(totalPages - (3 + 2 * siblingCount) + 1, totalPages)];
    if (shouldShowLeftDots && shouldShowRightDots) return [1, DOTS, ...range(leftSiblingIndex, rightSiblingIndex), DOTS, totalPages];
    return [];
  }, [currentPage, paginationInfo]);

  // --- Manejadores de Eventos ---
  const handlePageChange = (page) => {
    if (typeof page !== 'number' || page < 1 || page > (paginationInfo?.totalPages || 1) || page === currentPage || isLoading) {
      return;
    }
    setCurrentPage(page);
  };
  const handlePreviousPage = () => handlePageChange(currentPage - 1);
  const handleNextPage = () => handlePageChange(currentPage + 1);
  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setCurrentPage(1);
  };

  // --- MANEJADOR PARA DESCARGAR EL PDF ---
  const handleDownloadPdf = async (ticketId) => {
    
    setPdfLoading(ticketId); // Inicia la carga para este ticket específico
    try {
      const pdfBlob = await getTiketsPdf(userData._id, ticketId);
      if (pdfBlob) {
        const url = window.URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
        // Opcional: revocar la URL después de un tiempo para liberar memoria
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      } else {
        throw new Error("La API no devolvió un archivo PDF válido.");
      }
    } catch (error) {
     
    } finally {
      setPdfLoading(null); // Termina la carga
    }
  };


  // --- Renderizado de Estados de Carga y Error ---
  if (isLoading && tickets.length === 0) return <div className="flex justify-center items-center h-screen"><p className="text-xl text-gray-700">Cargando tickets...</p></div>;
  if (error) return <div className="max-w-4xl mx-auto p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-xl mt-10"><p className="text-center font-bold">¡Error!</p><p className="text-center">{error}</p></div>;

  // --- Renderizado Principal del Componente ---
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-lg border border-gray-200 my-10">
      <header>
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center text-gray-800">Historial de Tickets</h2>
        {isLoading && <p className="text-center text-blue-500 animate-pulse mb-4">Actualizando lista...</p>}
      </header>

      <main>
        {tickets.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {tickets.map(ticket => (
              <div key={ticket._id || ticket.ventaId} className="py-4 px-2 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex justify-between items-start gap-4">
                  <p className="text-base sm:text-lg font-semibold text-gray-800">ID Venta: {ticket.ventaId || 'N/A'}</p>
                  <p className="text-lg sm:text-xl font-bold text-green-700 whitespace-nowrap">${ticket.totales?.totalPagar?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="mt-1 text-xs sm:text-sm text-gray-600 space-y-1">
                  <p>Fecha: {new Date(ticket.fechaHora).toLocaleString('es-AR')} | Pto. Venta: {ticket.puntoDeVenta || 'N/A'}</p>
                  <p>Cajero: {ticket.cajero || 'N/A'} | Comp: {ticket.tipoComprobante || 'N/A'} {ticket.numeroComprobante || ''}</p>
                  {ticket.cliente && (ticket.cliente.nombre || ticket.cliente.dniCuit) && (
                    <p>Cliente: {ticket.cliente.nombre || 'N/A'} ({ticket.cliente.dniCuit || 'N/A'})</p>
                  )}
                  {/* BOTÓN DE PDF MEJORADO */}
                  <div>
                    <button
                      onClick={() => handleDownloadPdf(ticket.ventaId)}
                      disabled={pdfLoading === ticket.ventaId}
                      className="inline-flex items-center px-3 py-1 mt-2 text-sm font-medium text-blue-600 bg-transparent border border-blue-500 rounded-full hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-wait"
                    >
                      {pdfLoading === ticket.ventaId ? 'Cargando...' : <> <PdfIcon /> Ver PDF</>}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !isLoading && <p className="text-center text-gray-500 py-10">No se encontraron tickets para esta empresa.</p>
        )}
      </main>

      {/* --- CONTROLES DE PAGINACIÓN Y LÍMITE --- */}
      {paginationInfo && paginationInfo.totalPages > 0 && (
        <footer className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
            {/* ... (código del footer de paginación sin cambios) ... */}
            <div className="text-sm text-gray-600 order-2 md:order-1">
                Mostrando {tickets.length} de {paginationInfo.totalTickets} tickets
            </div>
            <nav className="order-1 md:order-2" aria-label="Paginación de tickets">
                <ul className="flex items-center gap-1">
                    <li><button onClick={handlePreviousPage} disabled={!paginationInfo.hasPrevPage || isLoading} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"><ChevronLeftIcon /></button></li>
                    {paginationRange.map((page, index) => (<li key={index}>{page === DOTS ? <span className="px-2 py-1">...</span> : <button onClick={() => handlePageChange(page)} disabled={isLoading} className={`w-9 h-9 rounded-md transition-colors ${currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>{page}</button>}</li>))}
                    <li><button onClick={handleNextPage} disabled={!paginationInfo.hasNextPage || isLoading} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"><ChevronRightIcon /></button></li>
                </ul>
            </nav>
            <div className="flex items-center gap-2 text-sm text-gray-600 order-3">
                <label htmlFor="limit-select">Mostrar:</label>
                <select id="limit-select" value={limit} onChange={handleLimitChange} disabled={isLoading} className="border border-gray-300 rounded-md px-2 py-1">
                    <option value="5">5</option><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option>
                </select>
            </div>
        </footer>
      )}
    </div>
  );
}