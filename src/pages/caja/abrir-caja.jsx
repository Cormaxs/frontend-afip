import React, { useContext, useEffect, useState, useMemo } from "react";
import { apiContext } from "../../context/api_context";

export function AbrirCaja() {
    // 1. CONTEXTO Y ESTADO
    // --------------------
    // Asumo que tienes una función `abrirCajaApi` en tu contexto para esta acción.
    // Si se llama diferente, puedes cambiarla aquí.
    const { userData, companyData, getPointsByCompany, abrirCaja } = useContext(apiContext);

    // Estado para los datos del formulario
    const [selectedPuntoVenta, setSelectedPuntoVenta] = useState('');
    const [montoInicial, setMontoInicial] = useState(0);
    // Inicializa la fecha con el día de hoy en formato YYYY-MM-DD
    const [fechaApertura, setFechaApertura] = useState(() => new Date().toISOString().split('T')[0]);

    // Estado para la lista de puntos de venta y paginación
    const [puntosDeVenta, setPuntosDeVenta] = useState([]);
    const [paginationInfo, setPaginationInfo] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Estado para el feedback al usuario
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // IDs extraídos del contexto para mayor claridad
    const empresaId = useMemo(() => companyData?._id, [companyData]);
    const vendedorId = useMemo(() => userData?._id, [userData]);

    // 2. EFECTO PARA CARGAR LOS PUNTOS DE VENTA
    // -----------------------------------------
    // Se ejecuta cuando el ID de la empresa cambia o cuando se cambia de página
    useEffect(() => {
        if (empresaId) {
            const fetchPuntosDeVenta = async () => {
                setLoading(true);
                try {
                    const response = await getPointsByCompany(empresaId, currentPage);
                    if (response && response.puntosDeVenta) {
                        setPuntosDeVenta(response.puntosDeVenta);
                        setPaginationInfo(response.pagination);
                    }
                } catch (fetchError) {
                    setError("No se pudieron cargar los puntos de venta.");
                    console.error(fetchError);
                } finally {
                    setLoading(false);
                }
            };
            fetchPuntosDeVenta();
        }
    }, [empresaId, currentPage, getPointsByCompany]);


    // 3. MANEJADOR DE ENVÍO DEL FORMULARIO
    // ------------------------------------
    const handleSubmit = async (event) => {
        event.preventDefault();
        
        // Validación simple
        if (!selectedPuntoVenta) {
            setError("Por favor, seleccione un punto de venta.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        // Construcción del payload JSON como fue solicitado
        const payload = {
            empresa: empresaId,
            puntoDeVenta: selectedPuntoVenta,
            vendedorAsignado: vendedorId,
            montoInicial: parseFloat(montoInicial),
            fechaApertura: fechaApertura,
        };
        
        try {
            // Llamada a la función del contexto para abrir la caja
            const response = await abrirCaja(payload);
            console.log(response._id)
            setSuccess(`¡Caja abierta exitosamente! ID de Sesión: ${response._id}`);
            // Opcional: resetear el formulario
            setSelectedPuntoVenta('');
            setMontoInicial(0);
        } catch (submitError) {
            setError(submitError.message || "Ocurrió un error al abrir la caja.");
            console.error(submitError);
        } finally {
            setLoading(false);
        }
    };

    // 4. RENDERIZADO DEL COMPONENTE
    // -----------------------------
    return (
        <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
            <h2>Apertura de Caja</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {/* Selector de Punto de Venta */}
                <div>
                    <label htmlFor="puntoDeVenta" style={{ display: 'block', marginBottom: '5px' }}>Punto de Venta</label>
                    <select
                        id="puntoDeVenta"
                        value={selectedPuntoVenta}
                        onChange={(e) => setSelectedPuntoVenta(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    >
                        <option value="" disabled>-- Seleccione un punto de venta --</option>
                        {puntosDeVenta.map((punto) => (
                            <option key={punto._id} value={punto._id}>
                                {punto.nombre}
                            </option>
                        ))}
                    </select>
                    {/* Aquí puedes añadir los botones de paginación si es necesario */}
                </div>

                {/* Campo de Monto Inicial */}
                <div>
                    <label htmlFor="montoInicial" style={{ display: 'block', marginBottom: '5px' }}>Monto Inicial ($)</label>
                    <input
                        type="number"
                        id="montoInicial"
                        value={montoInicial}
                        onChange={(e) => setMontoInicial(e.target.value)}
                        min="0"
                        step="0.01"
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>

                {/* Campo de Fecha de Apertura */}
                <div>
                    <label htmlFor="fechaApertura" style={{ display: 'block', marginBottom: '5px' }}>Fecha de Apertura</label>
                    <input
                        type="date"
                        id="fechaApertura"
                        value={fechaApertura}
                        onChange={(e) => setFechaApertura(e.target.value)}
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                
                {/* Botón de envío y mensajes de estado */}
                <div>
                    <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        {loading ? 'Abriendo...' : 'Abrir Caja'}
                    </button>
                </div>

                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                {success && <p style={{ color: 'green', textAlign: 'center' }}>{success}</p>}
            </form>
        </div>
    );
}