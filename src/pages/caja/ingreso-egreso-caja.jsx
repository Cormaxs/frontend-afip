import React, { useContext, useState, useEffect } from "react";
import { apiContext } from "../../context/api_context";

export function IngresoEgreso() {
    // 1. CONTEXTO Y ESTADO
    // --------------------
    const { cajasActivas, ingreso_egreso } = useContext(apiContext);

    const [tipo, setTipo] = useState('ingreso');
    const [monto, setMonto] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Resetea el formulario si la caja activa cambia (ej. se cierra)
    useEffect(() => {
        setTipo('ingreso');
        setMonto('');
        setDescripcion('');
        setError(null);
        setSuccess(null);
    }, [cajasActivas]);

    // 2. MANEJADOR DE ENVÍO
    // --------------------
    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (!descripcion.trim() || parseFloat(monto) <= 0) {
            setError("El monto debe ser mayor que cero y la descripción es obligatoria.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        const payload = {
            tipo,
            monto: parseFloat(monto),
            descripcion,
        };
        
        

        try {
            await ingreso_egreso(payload, cajasActivas._id);
            setSuccess(`¡Movimiento de "${tipo}" registrado exitosamente!`);
            setMonto('');
            setDescripcion('');
        } catch (submitError) {
            setError(submitError.message || "No se pudo registrar el movimiento.");
        } finally {
            setLoading(false);
        }
    };

    // 3. RENDERIZADO
    // --------------
    if (!cajasActivas) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>Registrar Ingreso/Egreso</h2>
                <p>Necesitas tener una caja activa para registrar movimientos.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
            <h2>Registrar Ingreso/Egreso en Caja</h2>
            <p style={{textAlign: 'center', color: '#555'}}>Registrando movimiento para la caja del punto de venta: <strong>{cajasActivas.puntoDeVenta?.nombre || 'N/A'}</strong></p>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                <fieldset style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
                    <legend>Tipo de Movimiento</legend>
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                        <label><input type="radio" value="ingreso" checked={tipo === 'ingreso'} onChange={(e) => setTipo(e.target.value)} /> Ingreso</label>
                        <label><input type="radio" value="egreso" checked={tipo === 'egreso'} onChange={(e) => setTipo(e.target.value)} /> Egreso</label>
                    </div>
                </fieldset>

                <div>
                    <label htmlFor="monto" style={{ display: 'block', marginBottom: '5px' }}>Monto ($)</label>
                    <input type="number" id="monto" value={monto} onChange={(e) => setMonto(e.target.value)}
                        required min="0.01" step="0.01" style={{ width: '100%', padding: '8px' }} />
                </div>

                <div>
                    <label htmlFor="descripcion" style={{ display: 'block', marginBottom: '5px' }}>Descripción (Obligatorio)</label>
                    <textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                        required rows="3" style={{ width: '100%', padding: '8px' }}
                        placeholder="Ej: Pago a proveedor, retiro de efectivo, venta manual..."
                    ></textarea>
                </div>

                

                <div>
                    <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        {loading ? 'Registrando...' : 'Registrar Movimiento'}
                    </button>
                </div>

                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                {success && <p style={{ color: 'green', textAlign: 'center' }}>{success}</p>}
            </form>
        </div>
    );
}