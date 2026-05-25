import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth/authContext.jsx';
// Importamos la clase que creamos
import { FacturacionRequerimentos } from '../../utils/facturacionHelper.js'; 
import { TIPOS_COMPROBANTES } from './constants.js';

const TestFacturacion = () => {
    const { user, empresa } = useAuth();
    const [seleccion, setSeleccion] = useState(TIPOS_COMPROBANTES[0]);
    const [proximoNumero, setProximoNumero] = useState(null);
    const [loading, setLoading] = useState(false);

    const puntoVentaActivo = 1; // O empresa?.puntoVenta

    // 1. Lógica para obtener el número usando la CLASE
    useEffect(() => {
        const fetchNumeracion = async () => {
            if (!user?.idDbAfip || !seleccion.id) return;
            
            setLoading(true);
            setProximoNumero(null); // Reset para mostrar que está cargando

            try {
                const num = await FacturacionRequerimentos.obtenerProximoNumero({
                    idDbAfip: user.idDbAfip,
                    puntoVenta: puntoVentaActivo,
                    tipoComprobante: seleccion.id,
                    datosEmpresa: empresa
                });
                console.log("Número obtenido:", num);
                setProximoNumero(num);
            } catch (error) {
                console.error("Error al testear numeración:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNumeracion();
    }, [seleccion.id, user?.idDbAfip, empresa]);

    return (
        <div className="container" style={{ maxWidth: '600px', margin: '50px auto' }}>
            <div className="door-card" style={{ padding: '30px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', fontWeight: '600' }}>
                    Control de Numeración (Vía Class Service)
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    <div>
                        <label style={{ fontSize: '0.75rem', color: '#999', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            Tipo de Comprobante
                        </label>
                        <select 
                            className="input-field" 
                            style={{ width: '100%', marginTop: '5px', padding: '10px' }}
                            value={seleccion.id}
                            onChange={(e) => {
                                const tipo = TIPOS_COMPROBANTES.find(t => t.id === parseInt(e.target.value));
                                setSeleccion(tipo);
                            }}
                        >
                            {TIPOS_COMPROBANTES.map(t => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Visualización del Dato */}
                    <div style={{ 
                        padding: '20px', 
                        backgroundColor: '#f8f9fa', 
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        {loading ? (
                            <span style={{ color: '#3498db' }}> Sincronizando con ARCA...</span>
                        ) : (
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                                {FacturacionRequerimentos.formatearComprobante(puntoVentaActivo, proximoNumero || 0)}
                            </div>
                        )}
                        <small style={{ color: '#2ecc71', display: 'block', marginTop: '5px' }}>
                            {!loading && proximoNumero ? "● Número validado y listo" : ""}
                        </small>
                    </div>

                    <button 
                        className="btn btn-primary" 
                        disabled={loading || !proximoNumero}
                        style={{ 
                            width: '100%', 
                            padding: '12px', 
                            backgroundColor: loading ? '#ccc' : '#3498db',
                            border: 'none',
                            color: '#fff',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        {loading ? 'Consultando...' : `Emitir ${seleccion.label}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TestFacturacion;