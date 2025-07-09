import { apiContext } from "../../context/api_context";
import React, { useContext, useEffect, useState } from "react";

export default function CagargaMasiva_products() {
    const { companyData, cargaMasiva, getPointsByCompany } = useContext(apiContext);
    
    const [puntosDeVenta, setPuntosDeVenta] = useState([]);
    const [paginationInfo, setPaginationInfo] = useState(null);
    const [selectedPuntoVentaId, setSelectedPuntoVentaId] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const idEmpresa = companyData?._id;

    useEffect(() => {
        if (idEmpresa) {
            const fetchPuntosDeVenta = async () => {
                setLoading(true);
                setError(null);
                try {
                    const resultadoApi = await getPointsByCompany(idEmpresa, currentPage);
                    if (resultadoApi && Array.isArray(resultadoApi.puntosDeVenta) && resultadoApi.pagination) {
                        setPuntosDeVenta(resultadoApi.puntosDeVenta);
                        setPaginationInfo(resultadoApi.pagination);
                    } else {
                        setPuntosDeVenta([]);
                        setPaginationInfo(null);
                        console.warn("La estructura de la respuesta de la API no es la esperada.");
                    }
                } catch (err) {
                    console.error("Error al obtener los puntos de venta:", err);
                    setError("No se pudieron cargar los puntos de venta. Intente de nuevo.");
                } finally {
                    setLoading(false);
                }
            };
            fetchPuntosDeVenta();
        }
    }, [idEmpresa, currentPage, getPointsByCompany]);

    const handleNextPage = () => setCurrentPage(prevPage => prevPage + 1);
    const handlePrevPage = () => setCurrentPage(prevPage => prevPage - 1);
    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
        setSuccessMessage('');
    };
    const handlePuntoVentaChange = (event) => {
        setSelectedPuntoVentaId(event.target.value);
        setSuccessMessage('');
    };

    // --- FUNCIÓN CORREGIDA ---
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!selectedPuntoVentaId || !selectedFile) {
            setError("Por favor, seleccione un punto de venta y un archivo CSV.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage('');

        const formData = new FormData();
        formData.append('importar-db', selectedFile);

        try {
            // Llamamos a la función con los 3 argumentos que espera
            const response = await cargaMasiva(formData, idEmpresa, selectedPuntoVentaId); 
            
            setSuccessMessage("¡Archivo cargado exitosamente!");
            console.log("Respuesta del servidor:", response);
            
            setSelectedFile(null);
             if(event.target.querySelector('input[type="file"]')) {
                event.target.querySelector('input[type="file"]').value = "";
             }

        } catch (err) {
            console.error("Error en la carga masiva:", err);
            setError(err.message || "Ocurrió un error al cargar el archivo.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h2>Carga Masiva de Productos desde CSV compatible con tiendanube</h2>
            <form onSubmit={handleSubmit}>
                <fieldset style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px' }}>
                    <legend>Paso 1: Seleccione el Punto de Venta</legend>
                    {loading && <p>Cargando puntos de venta...</p>}
                    {!loading && puntosDeVenta.length > 0 && (
                        <>
                            <select id="puntoVenta" value={selectedPuntoVentaId} onChange={handlePuntoVentaChange} required style={{ width: '100%', padding: '8px', marginBottom: '10px' }}>
                                <option value="" disabled>-- Seleccionar un punto de venta --</option>
                                {puntosDeVenta.map((punto) => (
                                    <option key={punto._id} value={punto._id}>
                                        {punto.nombre} ({punto.ciudad})
                                    </option>
                                ))}
                            </select>
                            {paginationInfo && paginationInfo.totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                                    <button type="button" onClick={handlePrevPage} disabled={!paginationInfo.hasPrevPage}>Anterior</button>
                                    <span>Página {paginationInfo.currentPage} de {paginationInfo.totalPages}</span>
                                    <button type="button" onClick={handleNextPage} disabled={!paginationInfo.hasNextPage}>Siguiente</button>
                                </div>
                            )}
                        </>
                    )}
                    {!loading && puntosDeVenta.length === 0 && !error && (<p>No se encontraron puntos de venta para esta empresa.</p>)}
                </fieldset>

                {selectedPuntoVentaId && (
                    <fieldset style={{ border: '1px solid #ccc', padding: '15px' }}>
                        <legend>Paso 2: Subir Archivo</legend>
                        <label htmlFor="csvFile" style={{ display: 'block', marginBottom: '5px' }}>Seleccione el archivo <code>.csv</code> a importar:</label>
                        <input type="file" id="csvFile" name="importar-db" accept=".csv" onChange={handleFileChange} required style={{ width: '100%', padding: '8px' }}/>
                    </fieldset>
                )}
                {error && <p style={{ color: 'red', marginTop: '10px' }}>Error: {error}</p>}
                {successMessage && <p style={{ color: 'green', marginTop: '10px' }}>{successMessage}</p>}
                <button type="submit" disabled={!selectedPuntoVentaId || !selectedFile || loading} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer', backgroundColor: loading ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
                    {loading ? 'Cargando...' : 'Cargar Productos'}
                </button>
            </form>
        </div>
    );
}