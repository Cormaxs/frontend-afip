import React, { useContext, useState, useMemo, useEffect, useCallback } from "react";
import { apiContext } from "../../context/api_context";
import Swal from 'sweetalert2';

export default function CerrarCaja() {
    // 1. CONTEXTO Y ESTADO
    const { cerrarCaja, get_caja_company, userData } = useContext(apiContext);

    const [cajasAbiertas, setCajasAbiertas] = useState([]);
    const [selectedCajaId, setSelectedCajaId] = useState('');
    const [montoFinal, setMontoFinal] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState(null);

    // 2. LÓGICA DE BÚSQUEDA DE DATOS
    const fetchCajasAbiertas = useCallback(async () => {
        if (!userData) {
            return;
        }

        setInitialLoading(true);
        setError(null);

        const companyId = userData.empresa;
        if (!companyId) {
            setError("No se pudo identificar la empresa para buscar cajas.");
            setInitialLoading(false);
            return;
        }
        
        try {
            const response = await get_caja_company(companyId, 1, { 
                estado: 'abierta', 
                limit: 500 
            });
            setCajasAbiertas(response.cajas || []);
        } catch (err) {
            console.error("Error al buscar las cajas abiertas:", err);
            setError("No se pudieron cargar las cajas activas. Por favor, recarga la página.");
        } finally {
            setInitialLoading(false);
        }
    }, [userData, get_caja_company]);

    useEffect(() => {
        fetchCajasAbiertas();
    }, [fetchCajasAbiertas]);


    // 3. LÓGICA DERIVADA Y OTROS EFECTOS
    const selectedCaja = useMemo(() => {
        if (!selectedCajaId) return null;
        return cajasAbiertas.find(caja => caja._id === selectedCajaId);
    }, [selectedCajaId, cajasAbiertas]);

    const diferencia = useMemo(() => {
        if (!selectedCaja) return 0;
        const montoEsperadoEnCaja = selectedCaja.montoEsperadoEnCaja || 0;
        const montoFinalNum = parseFloat(montoFinal);
        if (isNaN(montoFinalNum)) return 0;
        return montoFinalNum - montoEsperadoEnCaja;
    }, [montoFinal, selectedCaja]);

    useEffect(() => {
        setMontoFinal('');
        setObservaciones('');
    }, [selectedCajaId]);


    // 4. MANEJADOR DE ENVÍO
    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (!selectedCaja) {
            Swal.fire('Error', 'Debes seleccionar una caja para cerrar.', 'error');
            return;
        }

        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: `Vas a cerrar la caja "${selectedCaja.nombreCaja}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sí, cerrar caja'
        });

        if (!result.isConfirmed) return;

        setIsSubmitting(true);

        const payload = {
            montoFinalReal: parseFloat(montoFinal),
            observacionesCierre: observaciones,
            usuarioCierre: userData?._id 
        };

        try {
            await cerrarCaja(payload, selectedCaja._id);
            await Swal.fire('¡Éxito!', 'Caja cerrada exitosamente.', 'success');
            
            setSelectedCajaId('');
            fetchCajasAbiertas();

        } catch (submitError) {
            Swal.fire('Error', submitError.message || "No se pudo cerrar la caja.", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 5. RENDERIZADO
    if (initialLoading) {
        return <div className="max-w-2xl mx-auto p-6 text-center"><p className="text-gray-500">Buscando cajas abiertas...</p></div>;
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto p-6 text-center bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md mt-10">
                <h2 className="text-2xl font-bold mb-4">Error</h2><p>{error}</p>
            </div>
        );
    }
    
    if (cajasAbiertas.length === 0) {
        return (
            <div className="max-w-2xl mx-auto p-6 text-center bg-white rounded-lg shadow-md mt-10">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Cerrar Caja</h2>
                <p className="text-gray-500">No hay ninguna caja activa para cerrar en este momento.</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-xl border mt-10">
            <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Cerrar Caja</h2>
            
            <div className="mb-6">
                <label htmlFor="cajaSelect" className="block text-sm font-bold text-gray-700 mb-2">Selecciona la Caja a Cerrar</label>
                <select
                    id="cajaSelect"
                    value={selectedCajaId}
                    onChange={(e) => setSelectedCajaId(e.target.value)}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                    <option value="">-- Por favor, elige una opción --</option>
                    {cajasAbiertas.map(caja => (
                        <option key={caja._id} value={caja._id}>
                           {caja.nombreCaja} (P.V: {caja.puntoDeVenta?.nombre || 'N/A'})
                        </option>
                    ))}
                </select>
            </div>

            {selectedCaja && (
                <form onSubmit={handleSubmit} className="space-y-6 border-t pt-6">
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <h4 className="font-bold text-lg text-gray-700 mb-2">Detalles de la Caja Seleccionada</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                           <p><strong>Nombre Caja:</strong></p><p>{selectedCaja.nombreCaja}</p>
                           <p><strong>Punto de Venta:</strong></p><p>{selectedCaja.puntoDeVenta?.nombre || 'N/A'}</p>
                           <p><strong>Monto Inicial:</strong></p><p>${selectedCaja.montoInicial?.toLocaleString('es-AR', {minimumFractionDigits: 2})}</p>
                           <p><strong>Ventas en Efectivo:</strong></p><p>${selectedCaja.montoTotalVentasEfectivo?.toLocaleString('es-AR', {minimumFractionDigits: 2}) || '0,00'}</p>
                           <p className="font-bold"><strong>Monto Esperado:</strong></p><p className="font-bold">${selectedCaja.montoEsperadoEnCaja?.toLocaleString('es-AR', {minimumFractionDigits: 2}) || '0,00'}</p>
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="montoFinalReal" className="block text-sm font-bold text-gray-700 mb-2">Monto Final Contado (Dinero real en caja)</label>
                        <input
                            type="number"
                            id="montoFinalReal"
                            value={montoFinal}
                            onChange={(e) => setMontoFinal(e.target.value)}
                            required
                            min="0"
                            step="0.01"
                            className="text-lg shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="0.00"
                        />
                    </div>
                    
                    <div className="p-3 text-center rounded-lg border" style={{ backgroundColor: diferencia === 0 ? '#f0f0f0' : (diferencia < 0 ? '#fee2e2' : '#dcfce7') }}>
                        <h4 className="text-lg font-semibold" style={{ color: diferencia === 0 ? 'black' : (diferencia < 0 ? '#b91c1c' : '#166534') }}>
                            Diferencia de Caja: ${diferencia.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                        </h4>
                        <p className="text-xs text-gray-500">{diferencia < 0 ? "Faltante" : (diferencia > 0 ? "Sobrante" : "Exacto")}</p>
                    </div>

                    <div>
                        <label htmlFor="observacionesCierre" className="block text-sm font-bold text-gray-700 mb-2">Observaciones (Opcional)</label>
                        <textarea
                            id="observacionesCierre"
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            rows="3"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Ej: Hubo un error en un vuelto, se retiraron $500 para gastos, etc."
                        ></textarea>
                    </div>

                    <div>
                        <button type="submit" disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400">
                            {isSubmitting ? 'Cerrando...' : 'Confirmar y Cerrar Caja'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}