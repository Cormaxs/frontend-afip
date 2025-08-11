import { apiContext } from "../../context/api_context";
import { useContext, useEffect, useState, useCallback, useMemo } from "react";
import axios from 'axios';

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
export default function VerFacturasCompany() {
    const apiContextValue = useContext(apiContext);

    if (!apiContextValue) {
        return <div>Error: Contexto de API no disponible.</div>;
    }

    // AHORA SE DESTRUCTURA 'getFacturasPdf' EN LUGAR DE 'getTiketsPdf'
    const { getFacturas, userData, getFacturasPdf } = apiContextValue;

    // --- Estados del Componente ---
    const [facturas, setFacturas] = useState([]);
    const [paginationInfo, setPaginationInfo] = useState({
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
        hasPrevPage: false,
        hasNextPage: false,
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(null);

    // --- Estados para la Búsqueda Manual ---
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearchTerm, setActiveSearchTerm] = useState('');

    // --- Lógica de Petición de Datos ---
    const fetchFacturas = useCallback(async (page, itemsLimit, searchQuery, signal) => {
        setIsLoading(true);
        setError(null);
        try {
            const companyId = JSON.parse(localStorage.getItem("dataEmpresa"))?._id;
            if (!companyId) throw new Error("ID de empresa no válido.");

            const options = {
                empresaId: companyId,
                page,
                pageSize: itemsLimit,
                search: searchQuery,
            };

            const response = await getFacturas(options, { signal });

            if (response && Array.isArray(response.data) && typeof response.total === 'number') {
                setFacturas(response.data);
                const newPaginationInfo = {
                    totalDocs: response.total,
                    page: response.page,
                    limit: response.pageSize,
                    totalPages: Math.ceil(response.total / response.pageSize),
                    hasPrevPage: response.page > 1,
                    hasNextPage: response.page < Math.ceil(response.total / response.pageSize),
                };
                setPaginationInfo(newPaginationInfo);
            } else {
                throw new Error("La respuesta de la API no tiene el formato esperado.");
            }
        } catch (e) {
            if (e.name !== 'AbortError' && !axios.isCancel(e)) {
                setError(e.message || 'Ocurrió un error desconocido.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [getFacturas]);

    // --- Efecto para Cargar Datos ---
    useEffect(() => {
        const controller = new AbortController();
        fetchFacturas(currentPage, limit, activeSearchTerm, controller.signal);
        return () => controller.abort();
    }, [currentPage, limit, activeSearchTerm, fetchFacturas]);

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

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        setActiveSearchTerm(searchTerm);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setActiveSearchTerm('');
        setCurrentPage(1);
    };
    
    // --- Lógica de descarga de PDF actualizada ---
    const handleDownloadPdf = async (factura) => {
       /* if(factura.tipoComprobante){
          
            const pdfFilename = `${factura.tipoComprobante.replace(' ', '_')}_${factura.numeroComprobanteCompleto}.pdf`;
            console.log("tipo de copmprovbante ->", pdfFilename)
        }*/
        const pdfFilename = `${factura.tipoComprobante.replace(' ','_')}_${factura.numeroComprobanteCompleto}`;
        console.log("nombre comprobvante -> ", pdfFilename, factura)
        setPdfLoading(factura._id);
        try {
            // Se llama a la nueva función
            await getFacturasPdf(userData._id, pdfFilename);
        } catch (error) {
            setError("Error al descargar el PDF: " + error.message);
        } finally {
            setPdfLoading(null);
        }
    };

    // --- Renderizado de Estados de Carga y Error ---
    if (isLoading && facturas.length === 0) return <div className="flex justify-center items-center h-screen"><p className="text-xl text-gray-700">Cargando facturas...</p></div>;
    if (error) return <div className="flex justify-center items-center h-screen text-red-500"><p className="text-xl">Error: {error}</p></div>;

    // --- Renderizado Principal del Componente ---
    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-lg border border-gray-200 my-10">
            <header>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center text-gray-800">Historial de Facturas</h2>

                <form onSubmit={handleSearchSubmit} className="mb-6 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            id="search-facturas"
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
                            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[var(--principal-shadow)] hover:bg-[var(--principal-shadow)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--principal)] disabled:opacity-50"
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
                {facturas.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                        {facturas.map(factura => (
                            <div key={factura._id} className="py-4 px-2 hover:bg-gray-50 transition-colors duration-200">
                                <div className="flex justify-between items-start gap-4">
                                    <p className="text-base sm:text-lg font-semibold text-gray-800">ID Venta: {factura._id || 'N/A'}</p>
                                    <p className="text-lg sm:text-xl font-bold text-green-700 whitespace-nowrap">${factura.importeTotal?.toFixed(2) || '0.00'}</p>
                                </div>
                                <div className="mt-1 text-xs sm:text-sm text-gray-600 space-y-1">
                                    <p>Fecha: {new Date(factura.fechaEmision).toLocaleString('es-AR')} | Pto. Venta: {factura.puntoDeVenta || 'N/A'}</p>
                                    <p>Comp: {factura.tipoComprobante || 'N/A'} {factura.numeroComprobanteCompleto || ''}</p>
                                    {factura.receptor && (factura.receptor.razonSocial || factura.receptor.cuit) && (
                                        <p>Cliente: {factura.receptor.razonSocial || 'N/A'} ({factura.receptor.cuit || 'N/A'})</p>
                                    )}
                                    <div>
                                        <button
                                            onClick={() => handleDownloadPdf(factura)}
                                            disabled={pdfLoading === factura._id}
                                            className="inline-flex items-center px-3 py-1 mt-2 text-sm font-medium text-[var(--principal-shadow)] bg-transparent border border-[var(--principal)] rounded-full hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--principal)] disabled:opacity-50 disabled:cursor-wait"
                                        >
                                            {pdfLoading === factura._id ? 'Cargando...' : <> <PdfIcon /> Ver PDF</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    !isLoading && <p className="text-center text-gray-500 py-10">No se encontraron facturas con los criterios actuales.</p>
                )}
            </main>

            {paginationInfo && paginationInfo.totalPages > 0 && (
                <footer className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600 order-2 md:order-1">
                        Mostrando {facturas.length} de {paginationInfo.totalDocs} facturas
                    </div>
                    <nav className="order-1 md:order-2" aria-label="Paginación de facturas">
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