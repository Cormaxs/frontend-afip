import React, { useContext, useState, useMemo, useEffect } from "react";
import { apiContext } from "../../context/api_context";
import Swal from 'sweetalert2';

export default function CerrarCaja() {
    // 1. CONTEXTO Y ESTADO
    // --------------------
    const { cerrarCaja, cajasActivas, userData } = useContext(apiContext);

    // Estado para saber qué caja está seleccionada del array
    const [selectedCajaId, setSelectedCajaId] = useState('');

    // Estado local para los campos del formulario
    const [montoFinal, setMontoFinal] = useState('');
    const [observaciones, setObservaciones] = useState('');

    // Estado para el feedback al usuario
    const [loading, setLoading] = useState(false);

    // 2. LÓGICA DERIVADA Y EFECTOS
    // ----------------------------

    // Obtenemos el objeto completo de la caja seleccionada.
    const selectedCaja = useMemo(() => {
        if (!selectedCajaId || !Array.isArray(cajasActivas)) return null;
        return cajasActivas.find(caja => caja._id === selectedCajaId);
    }, [selectedCajaId, cajasActivas]);

    // Usamos useMemo para calcular la diferencia
    const diferencia = useMemo(() => {
        if (!selectedCaja) return 0;
        const montoEsperadoEnCaja = selectedCaja.montoEsperadoEnCaja || 0;
        const montoFinalNum = parseFloat(montoFinal);
        if (isNaN(montoFinalNum)) return 0;
        return montoFinalNum - montoEsperadoEnCaja;
    }, [montoFinal, selectedCaja]);

    // Efecto para limpiar el formulario si el usuario cambia de caja
    useEffect(() => {
        setMontoFinal('');
        setObservaciones('');
    }, [selectedCajaId]);


    // 3. MANEJADOR DE ENVÍO
    // --------------------
    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (!selectedCaja) {
            Swal.fire('Error', 'Debes seleccionar una caja para cerrar.', 'error');
            return;
        }

        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: `Vas a cerrar la caja "${selectedCaja.nombreCaja}" del punto de venta "${selectedCaja.puntoDeVenta?.nombre || 'Desconocido'}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sí, cerrar caja'
        });

        if (!result.isConfirmed) {
            return;
        }

        setLoading(true);

        const payload = {
            montoFinalReal: parseFloat(montoFinal),
            observacionesCierre: observaciones,
            usuarioCierre: userData?._id 
        };

        try {
            await cerrarCaja(payload, selectedCaja._id);
            Swal.fire('¡Éxito!', 'Caja cerrada exitosamente.', 'success');
            setSelectedCajaId('');

        } catch (submitError) {
            Swal.fire('Error', submitError.message || "No se pudo cerrar la caja.", 'error');
        } finally {
            setLoading(false);
        }
    };

    // 4. RENDERIZADO CONDICIONAL
    // --------------------------
    if (!Array.isArray(cajasActivas) || cajasActivas.length === 0) {
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
            
            {/* --- Selector de Caja --- */}
            <div className="mb-6">
                <label htmlFor="cajaSelect" className="block text-sm font-bold text-gray-700 mb-2">
                    Selecciona la Caja a Cerrar
                </label>
                <select
                    id="cajaSelect"
                    value={selectedCajaId}
                    onChange={(e) => setSelectedCajaId(e.target.value)}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                    <option value="">-- Por favor, elige una opción --</option>
                    {cajasActivas.map(caja => (
                        // AQUÍ SE HIZO EL CAMBIO 1
                        <option key={caja._id} value={caja._id}>
                           {caja.nombreCaja} (P.V: {caja.puntoDeVenta?.nombre || 'N/A'})
                        </option>
                    ))}
                </select>
            </div>

            {/* --- Formulario de Cierre --- */}
            {selectedCaja && (
                <form onSubmit={handleSubmit} className="space-y-6 border-t pt-6">
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <h4 className="font-bold text-lg text-gray-700 mb-2">Detalles de la Caja Seleccionada</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            {/* AQUÍ SE HIZO EL CAMBIO 2 */}
                            <p><strong>Nombre Caja:</strong></p><p>{selectedCaja.nombreCaja}</p>
                            <p><strong>Punto de Venta:</strong></p><p>{selectedCaja.puntoDeVenta?.nombre}</p>
                            <p><strong>Monto Inicial:</strong></p><p>${selectedCaja.montoInicial?.toFixed(2)}</p>
                            <p><strong>Ventas en Efectivo:</strong></p><p>${selectedCaja.montoTotalVentasEfectivo?.toFixed(2) || '0.00'}</p>
                            <p className="font-bold"><strong>Monto Esperado:</strong></p><p className="font-bold">${selectedCaja.montoEsperadoEnCaja?.toFixed(2) || '0.00'}</p>
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
                            Diferencia de Caja: ${diferencia.toFixed(2)}
                        </h4>
                        <p className="text-xs text-gray-500">{diferencia < 0 ? "Faltante" : "Sobrante"}</p>
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
                        <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400">
                            {loading ? 'Cerrando...' : 'Confirmar y Cerrar Caja'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}