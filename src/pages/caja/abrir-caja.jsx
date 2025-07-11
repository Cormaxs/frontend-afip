import React, { useContext, useEffect, useState, useMemo } from "react";
import { apiContext } from "../../context/api_context";

// --- Ícono de Spinner para el botón de envío ---
const SpinnerIcon = () => (
    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default function AbrirCaja() {
    // --- CONTEXTO Y DATOS ESENCIALES ---
    const { userData, companyData, getPointsByCompany, abrirCaja } = useContext(apiContext);
    const empresaId = useMemo(() => companyData?._id, [companyData]);
    const vendedorId = useMemo(() => userData?._id, [userData]);

    // --- ESTADO DEL FORMULARIO ---
    const [selectedPuntoVenta, setSelectedPuntoVenta] = useState('');
    const [nombreCaja, setNombreCaja] = useState(''); // <-- 1. NUEVO ESTADO
    const [montoInicial, setMontoInicial] = useState('');
    const [fechaApertura, setFechaApertura] = useState(() => new Date().toISOString().split('T')[0]);
    const [puntosDeVenta, setPuntosDeVenta] = useState([]);

    // --- ESTADO DE LA UI (CARGA Y MENSAJES) ---
    const [isFetching, setIsFetching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // --- EFECTO PARA CARGAR PUNTOS DE VENTA ---
    useEffect(() => {
        if (empresaId) {
            const fetchPuntosDeVenta = async () => {
                setIsFetching(true);
                try {
                    const response = await getPointsByCompany(empresaId, 1, 500);
                    if (response && response.puntosDeVenta) {
                        setPuntosDeVenta(response.puntosDeVenta);
                    }
                } catch (fetchError) {
                    setError("No se pudieron cargar los puntos de venta.");
                    console.error(fetchError);
                } finally {
                    setIsFetching(false);
                }
            };
            fetchPuntosDeVenta();
        }
    }, [empresaId, getPointsByCompany]);

    // --- MANEJADOR DE ENVÍO DEL FORMULARIO ---
    const handleSubmit = async (event) => {
        event.preventDefault();
        
        // --- 3. VALIDACIÓN ---
        if (!selectedPuntoVenta) {
            setError("Por favor, seleccione un punto de venta.");
            return;
        }
        if (!nombreCaja.trim()) {
            setError("Por favor, ingrese un nombre para la caja.");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        // --- 4. ACTUALIZACIÓN DEL PAYLOAD ---
        const payload = {
            empresa: empresaId,
            puntoDeVenta: selectedPuntoVenta,
            nombreCaja: nombreCaja.trim(), // <-- Se añade el nombre de la caja
            vendedorAsignado: vendedorId,
            montoInicial: parseFloat(montoInicial) || 0,
            fechaApertura: fechaApertura,
        };
        
        try {
            const response = await abrirCaja(payload);
            setSuccess(`¡Caja abierta exitosamente! ID de Sesión: ${response._id}`);
            
            // --- 5. RESETEO DEL FORMULARIO ---
            setSelectedPuntoVenta('');
            setNombreCaja(''); // <-- Se limpia el nuevo campo
            setMontoInicial('');

        } catch (submitError) {
            setError(submitError.message || "Ocurrió un error al abrir la caja.");
            console.error(submitError);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-slate-100 min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
                
                <div className="text-center mb-4">
                    <h2 className="text-3xl font-bold text-gray-800">Apertura de Caja</h2>
                    <p className="text-sm text-gray-500 mt-2">
                        {userData?.username} en <span className="font-semibold">{companyData?.nombreEmpresa}</span>
                    </p>
                </div>
                
                <hr className="my-6"/>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* --- Selector de Punto de Venta --- */}
                    <div>
                        <label htmlFor="puntoDeVenta" className="block text-sm font-medium text-gray-700">Punto de Venta</label>
                        <select
                            id="puntoDeVenta"
                            value={selectedPuntoVenta}
                            onChange={(e) => setSelectedPuntoVenta(e.target.value)}
                            required
                            disabled={isFetching}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                        >
                            <option value="" disabled>
                                {isFetching ? "Cargando..." : "-- Seleccione un punto --"}
                            </option>
                            {puntosDeVenta.map((punto) => (
                                <option key={punto._id} value={punto._id}>
                                    {punto.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* --- 2. NUEVO CAMPO EN EL FORMULARIO --- */}
                    <div>
                        <label htmlFor="nombreCaja" className="block text-sm font-medium text-gray-700">Nombre de la Caja</label>
                        <input
                            type="text"
                            id="nombreCaja"
                            value={nombreCaja}
                            onChange={(e) => setNombreCaja(e.target.value)}
                            placeholder="Ej: Caja Mañana, Mostrador Principal"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    {/* --- Campo de Monto Inicial --- */}
                    <div>
                        <label htmlFor="montoInicial" className="block text-sm font-medium text-gray-700">Monto Inicial ($)</label>
                        <input
                            type="number"
                            id="montoInicial"
                            value={montoInicial}
                            onChange={(e) => setMontoInicial(e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="any"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    {/* --- Campo de Fecha de Apertura --- */}
                    <div>
                        <label htmlFor="fechaApertura" className="block text-sm font-medium text-gray-700">Fecha de Apertura</label>
                        <input
                            type="date"
                            id="fechaApertura"
                            value={fechaApertura}
                            onChange={(e) => setFechaApertura(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                    
                    {/* --- Mensajes de Error y Éxito --- */}
                    <div className="space-y-4">
                        {error && (
                             <div className="bg-red-50 p-3 rounded-lg flex items-center justify-between">
                                 <p className="text-sm text-red-700">{error}</p>
                                 <button onClick={() => setError(null)} className="text-red-900 opacity-70 hover:opacity-100">&times;</button>
                             </div>
                        )}
                        {success && (
                             <div className="bg-green-50 p-3 rounded-lg flex items-center justify-between">
                                 <p className="text-sm text-green-700 break-all">{success}</p>
                                 <button onClick={() => setSuccess(null)} className="text-green-900 opacity-70 hover:opacity-100">&times;</button>
                             </div>
                        )}
                    </div>

                    {/* --- Botón de Envío --- */}
                    <div>
                        <button 
                            type="submit" 
                            disabled={isSubmitting || isFetching} 
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? <><SpinnerIcon /> Abriendo...</> : 'Abrir Caja'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}