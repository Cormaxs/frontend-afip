import React, { useContext, useState, useMemo } from "react";
import { apiContext } from "../../context/api_context";

export default function CerrarCaja() {
    // 1. CONTEXTO Y ESTADO
    // --------------------
    const { cerrarCaja, cajasActivas } = useContext(apiContext);

    console.log(cajasActivas)
    // Estado local para los campos del formulario
    const [montoFinal, setMontoFinal] = useState(0);
    const [observaciones, setObservaciones] = useState('');

    // Estado para el feedback al usuario
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // 2. CÁLCULOS DERIVADOS
    // --------------------
    // Usamos useMemo para evitar recalcular en cada renderizado
    const diferencia = useMemo(() => {
        if (!cajasActivas) return 0;
        // Asumo que tu objeto `cajasActivas` tiene estas propiedades.
        // Si no, puedes añadir una llamada a la API para obtenerlas.
        const montoInicial = cajasActivas.montoInicial || 0;
        const ventasCalculadas = cajasActivas.montoTotalVentas || 0; // Asumo este nombre de campo
        
        const montoEsperado = montoInicial + ventasCalculadas;
        return parseFloat(montoFinal) - montoEsperado;
    }, [montoFinal, cajasActivas]);

    // 3. MANEJADOR DE ENVÍO
    // --------------------
    const handleSubmit = async (event) => {
        event.preventDefault();
        
        setLoading(true);
        setError(null);
        setSuccess(null);

        const payload = {
            montoFinalReal: parseFloat(montoFinal),
            observacionesCierre: observaciones,
            // El backend puede calcular el resto (fechaCierre, diferencia, etc.)
        };

        try {
            await cerrarCaja(payload, cajasActivas._id);
            setSuccess("¡Caja cerrada exitosamente!");
            // El contexto ya se encarga de limpiar `cajasActivas` y localStorage
        } catch (submitError) {
            setError(submitError.message || "No se pudo cerrar la caja.");
        } finally {
            setLoading(false);
        }
    };

    // 4. RENDERIZADO CONDICIONAL
    // --------------------------
    // Si no hay una caja activa, mostramos un mensaje.
    if (!cajasActivas) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>Cerrar Caja</h2>
                <p>No hay ninguna caja activa para cerrar en este momento.</p>
            </div>
        );
    }

    // Si hay una caja activa, mostramos el formulario.
    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
            <h2>Cerrar Caja</h2>
            <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                <h4>Detalles de la Sesión Activa</h4>
                <p><strong>ID de Sesión:</strong> {cajasActivas._id}</p>
                <p><strong>Monto Inicial:</strong> ${cajasActivas.montoInicial?.toFixed(2)}</p>
                <p><strong>Ventas del Sistema (Estimado):</strong> ${cajasActivas.montoTotalVentas?.toFixed(2) || '0.00'}</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label htmlFor="montoFinalReal" style={{ display: 'block', marginBottom: '5px' }}>Monto Final Contado ($)</label>
                    <input
                        type="number"
                        id="montoFinalReal"
                        value={montoFinal}
                        onChange={(e) => setMontoFinal(e.target.value)}
                        required
                        min="0"
                        step="0.01"
                        style={{ width: '100%', padding: '8px', fontSize: '1.2em' }}
                    />
                </div>
                
                <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '5px', textAlign: 'center' }}>
                    <h4>Diferencia de Caja: <span style={{ color: diferencia < 0 ? 'red' : 'green' }}>${diferencia.toFixed(2)}</span></h4>
                </div>

                <div>
                    <label htmlFor="observacionesCierre" style={{ display: 'block', marginBottom: '5px' }}>observacionesCierre (Opcional)</label>
                    <textarea
                        id="observacionesCierre"
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        rows="3"
                        style={{ width: '100%', padding: '8px' }}
                    ></textarea>
                </div>

                <div>
                    <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        {loading ? 'Cerrando...' : 'Confirmar y Cerrar Caja'}
                    </button>
                </div>

                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                {success && <p style={{ color: 'green', textAlign: 'center' }}>{success}</p>}
            </form>
        </div>
    );
}