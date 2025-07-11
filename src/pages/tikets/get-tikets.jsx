import { apiContext } from "../../context/api_context";
import { useContext, useEffect, useState, useCallback, useMemo } from "react";

// --- Constantes y Helpers para Paginación ---
const DOTS = '...';
const range = (start, end) => Array.from({ length: end - start + 1 }, (_, idx) => idx + start);

// --- Iconos ---
const ChevronLeftIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1 0 1.06L8.854 10l3.938 3.71a.75.75 0 1 1-1.06 1.06l-4.25-4.5a.75.75 0 0 1 0-1.06l4.25-4.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" /></svg>
);
const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 0-1.06L11.146 10 7.21 6.29a.75.75 0 1 1 1.06-1.06l4.25 4.5a.75.75 0 0 1 0 1.06l-4.25 4.5a.75.75 0 0 1-1.06 0Z" clipRule="evenodd" /></svg>
);
const PdfIcon = () => (
    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
);
const SearchIcon = (props) => (
    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" {...props}><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg>
);


// --- Componente Principal ---
export default function VerTiketsCompany() {
  const apiContextValue = useContext(apiContext);

  if (!apiContextValue) {
    return <div>Error: Contexto de API no disponible.</div>;
  }

  const { getTiketsContext: fetchTicketsFromAPI, userData, getTiketsPdf } = apiContextValue;
  
  // --- Estados del Componente ---
  const [tickets, setTickets] = useState([]);
  const [paginationInfo, setPaginationInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(null);

  // --- Estados para la Búsqueda Manual ---
  const [searchTerm, setSearchTerm] = useState(''); // El valor del input en tiempo real
  const [activeSearchTerm, setActiveSearchTerm] = useState(''); // El valor que se envía a la API

  // --- Lógica de Petición de Datos (MODIFICADA para incluir la búsqueda) ---
  const fetchTickets = useCallback(async (page, itemsLimit, searchQuery, signal) => {
    setIsLoading(true);
    setError(null);
    try {
      const companyId = JSON.parse(localStorage.getItem("dataEmpresa"))?._id;
      if (!companyId) throw new Error("ID de empresa no válido.");
      
      const response = await fetchTicketsFromAPI(companyId, page, itemsLimit, searchQuery, { signal });
      
      if (response && Array.isArray(response.tickets) && response.pagination) {
        setTickets(response.tickets);
        setPaginationInfo(response.pagination);
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

  // --- Efecto para Cargar Datos (MODIFICADO para depender de la búsqueda activa) ---
  useEffect(() => {
    const controller = new AbortController();
    // La primera vez, se llama con activeSearchTerm vacío, trayendo todo.
    // Después, se llama solo cuando se activa una nueva búsqueda.
    fetchTickets(currentPage, limit, activeSearchTerm, controller.signal);
    return () => controller.abort();
  }, [currentPage, limit, activeSearchTerm, fetchTickets]);

  // --- Lógica de Paginación ---
  const paginationRange = useMemo(() => {
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
    if (typeof page !== 'number' || page < 1 || page > (paginationInfo?.totalPages || 1) || page === currentPage || isLoading) return;
    setCurrentPage(page);
  };
  const handlePreviousPage = () => handlePageChange(currentPage - 1);
  const handleNextPage = () => handlePageChange(currentPage + 1);
  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setCurrentPage(1);
  };
  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  // Manejador para el envío del formulario de búsqueda
  const handleSearchSubmit = (e) => {
    e.preventDefault(); // Evita que la página se recargue
    setCurrentPage(1);
    setActiveSearchTerm(searchTerm); // Activa la búsqueda
  };

  // Manejador para limpiar la búsqueda
  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setCurrentPage(1);
  };

  const handleDownloadPdf = async (ticketId) => {
    setPdfLoading(ticketId);
    try {
      const pdfBlob = await getTiketsPdf(userData._id, ticketId);
      if (pdfBlob) {
        const url = window.URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      } else {
        throw new Error("La API no devolvió un archivo PDF válido.");
      }
    } catch (error) {
       setError("Error al descargar el PDF: " + error.message);
    } finally {
      setPdfLoading(null);
    }
  };

  // --- Renderizado de Estados de Carga y Error ---
  if (isLoading && tickets.length === 0) return <div className="flex justify-center items-center h-screen"><p className="text-xl text-gray-700">Cargando tickets...</p></div>;

  // --- Renderizado Principal del Componente ---
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-lg border border-gray-200 my-10">
      <header>
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center text-gray-800">Historial de Tickets</h2>
        
        {/* --- Formulario de Búsqueda Manual --- */}
        <form onSubmit={handleSearchSubmit} className="mb-6 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
          <div className="relative flex-grow">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <SearchIcon />
             </div>
             <input
               type="text"
               id="search-tickets"
               value={searchTerm}
               onChange={handleSearchChange}
               className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[var(--principal)] focus:border-[var(--principal)] sm:text-sm"
               placeholder="Buscar por ID, comprobante, cajero, cliente..."
             />
          </div>
          <div className="flex gap-2">
             <button
               type="submit"
               disabled={isLoading}
               className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[var(--principal-shadow)] hover:bg-[(var(--principal-shadow)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--principal)] disabled:opacity-50"
             >
               Buscar
             </button>
             {activeSearchTerm && (
               <button
                 type="button"
                 onClick={handleClearSearch}
                 disabled={isLoading}
                 className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
               >
                 Limpiar
               </button>
             )}
          </div>
        </form>
        
        {isLoading && <p className="text-center text-[var(--principal)] animate-pulse mb-4">Actualizando lista...</p>}
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
                  <div>
                    <button
                      onClick={() => handleDownloadPdf(ticket.ventaId)}
                      disabled={pdfLoading === ticket.ventaId}
                      className="inline-flex items-center px-3 py-1 mt-2 text-sm font-medium text-[var(--principal-shadow)] bg-transparent border border-[var(--principal)] rounded-full hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--principal)] disabled:opacity-50 disabled:cursor-wait"
                    >
                      {pdfLoading === ticket.ventaId ? 'Cargando...' : <> <PdfIcon /> Ver PDF</>}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
           !isLoading && <p className="text-center text-gray-500 py-10">No se encontraron tickets con los criterios actuales.</p>
        )}
      </main>

      {paginationInfo && paginationInfo.totalPages > 0 && (
        <footer className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 order-2 md:order-1">
                Mostrando {tickets.length} de {paginationInfo.totalTickets} tickets
            </div>
            <nav className="order-1 md:order-2" aria-label="Paginación de tickets">
                <ul className="flex items-center gap-1">
                    <li><button onClick={handlePreviousPage} disabled={!paginationInfo.hasPrevPage || isLoading} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"><ChevronLeftIcon /></button></li>
                    {paginationRange.map((page, index) => (<li key={index}>{page === DOTS ? <span className="px-2 py-1">...</span> : <button onClick={() => handlePageChange(page)} disabled={isLoading} className={`w-9 h-9 rounded-md transition-colors ${currentPage === page ? 'bg-[var(--principal-shadow)] text-white' : 'hover:bg-gray-100'}`}>{page}</button>}</li>))}
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