import React, { useContext, useEffect, useState, useCallback } from "react";
import { apiContext } from "../../context/api_context";

// --- Componente Refactorizado ---
export default function CagargaMasiva_products() {
    const { companyData, cargaMasiva, getPointsByCompany } = useContext(apiContext);

    // 1. ESTADO SIMPLIFICADO
    const [status, setStatus] = useState('loading'); // loading, idle, loadingMore, submitting, success, error
    const [puntosDeVenta, setPuntosDeVenta] = useState([]);
    const [paginationInfo, setPaginationInfo] = useState(null);
    const [selectedPuntoVentaId, setSelectedPuntoVentaId] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [message, setMessage] = useState({ type: '', text: '' }); // Para errores y éxito

    const idEmpresa = companyData?._id;

    // --- LÓGICA DE DATOS ---
    const fetchPuntosDeVenta = useCallback(async (page) => {
        if (!idEmpresa) return;

        setStatus(page === 1 ? 'loading' : 'loadingMore');
        setMessage({ type: '', text: '' });
        
        try {
            const apiResult = await getPointsByCompany(idEmpresa, page);
            if (apiResult?.puntosDeVenta && apiResult?.pagination) {
                setPuntosDeVenta(prev => page === 1 ? apiResult.puntosDeVenta : [...prev, ...apiResult.puntosDeVenta]);
                setPaginationInfo(apiResult.pagination);
                setStatus('idle');
            } else {
                throw new Error("La respuesta de la API no tiene el formato esperado.");
            }
        } catch (err) {
            setStatus('error');
            setMessage({ type: 'error', text: "No se pudieron cargar los puntos de venta." });
        }
    }, [idEmpresa, getPointsByCompany]);

    useEffect(() => {
        if (idEmpresa) {
            setCurrentPage(1);
            setPuntosDeVenta([]);
            fetchPuntosDeVenta(1);
        }
    }, [idEmpresa]); // Solo se ejecuta si cambia la empresa

    useEffect(() => {
        if (currentPage > 1) {
            fetchPuntosDeVenta(currentPage);
        }
    }, [currentPage]); // Se ejecuta al hacer clic en "Mostrar más"

    // --- MANEJADORES DE EVENTOS ---
    const handleFileChange = (e) => setSelectedFile(e.target.files[0]);
    const handlePuntoVentaChange = (e) => setSelectedPuntoVentaId(e.target.value);
    const handleMostrarMas = () => paginationInfo?.hasNextPage && setCurrentPage(p => p + 1);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!selectedPuntoVentaId || !selectedFile) {
            setMessage({ type: 'error', text: "Por favor, seleccione un punto de venta y un archivo." });
            return;
        }

        setStatus('submitting');
        setMessage({ type: '', text: '' });
        
        const formData = new FormData();
        formData.append('importar-db', selectedFile);

        try {
            await cargaMasiva(formData, idEmpresa, selectedPuntoVentaId);
            setStatus('success');
            setMessage({ type: 'success', text: "¡Archivo cargado exitosamente!" });
            setSelectedFile(null);
            event.target.reset(); // Limpia el formulario
        } catch (err) {
            setStatus('error');
            setMessage({ type: 'error', text: err.message || "Ocurrió un error al cargar el archivo." });
        }
    };

    // 2. CLASES REUTILIZABLES DE TAILWIND
    const fieldsetClasses = "border border-gray-300 p-4 rounded-lg";
    const legendClasses = "text-sm font-semibold text-gray-800 px-2";
    const inputClasses = "w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition";
    const buttonPrimaryClasses = "w-full py-2 px-4 bg-[var(--principal)] text-white font-semibold rounded-md shadow-sm hover:bg-[var(--principal)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition";
    const buttonSecondaryClasses = "w-auto py-2 px-4 bg-white text-[var(--principal)] font-semibold border border-[var(--principal)] rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition";

    const isLoading = status === 'loading' || status === 'loadingMore' || status === 'submitting';
    
    // --- RENDERIZADO ---
    return (
        <div className="bg-gray-50 min-h-screen p-4 md:p-8 flex items-center justify-center">
            <div className="max-w-2xl w-full bg-white p-6 md:p-8 rounded-xl shadow-lg">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Carga Masiva de Productos</h2>
                    <p className="text-gray-600 mt-1">Sube tu archivo CSV compatible con Tiendanube.</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <fieldset className={fieldsetClasses}>
                        <legend className={legendClasses}>Paso 1: Punto de Venta</legend>
                        {status === 'loading' ? (
                            <p className="text-center text-gray-600 p-4">Cargando...</p>
                        ) : puntosDeVenta.length > 0 ? (
                            <div className="space-y-4">
                                <select id="puntoVenta" value={selectedPuntoVentaId} onChange={handlePuntoVentaChange} required className={inputClasses}>
                                    <option value="" disabled>-- Seleccionar un punto de venta --</option>
                                    {puntosDeVenta.map((punto) => (
                                        <option key={punto._id} value={punto._id}>
                                            {punto.nombre} ({punto.ciudad})
                                        </option>
                                    ))}
                                </select>
                                
                                {status === 'loadingMore' && <p className="text-center text-[var(--principal)]">Cargando más...</p>}
                                {paginationInfo?.hasNextPage && status !== 'loadingMore' && (
                                    <div className="text-center">
                                        <button type="button" onClick={handleMostrarMas} className={buttonSecondaryClasses}>
                                            Mostrar más
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 p-4">No se encontraron puntos de venta.</p>
                        )}
                    </fieldset>

                    {selectedPuntoVentaId && (
                        <fieldset className={fieldsetClasses}>
                            <legend className={legendClasses}>Paso 2: Subir Archivo</legend>
                            <label htmlFor="csvFile" className="sr-only">Subir archivo CSV</label>
                            <input type="file" id="csvFile" name="importar-db" accept=".csv" onChange={handleFileChange} required className={`${inputClasses} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-[var(--principal)] hover:file:bg-indigo-100`}/>
                        </fieldset>
                    )}
                    
                    {message.text && (
                        <p className={`text-center font-medium ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                            {message.text}
                        </p>
                    )}
                    
                    <button type="submit" disabled={!selectedPuntoVentaId || !selectedFile || isLoading} className={buttonPrimaryClasses}>
                        {status === 'submitting' ? 'Procesando...' : 'Cargar Productos'}
                    </button>
                </form>
            </div>
        </div>
    );
}