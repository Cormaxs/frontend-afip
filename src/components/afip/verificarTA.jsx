import React, { useState, useEffect } from 'react';
import { afipService } from '../../services/afip/afip-general.js';

const VerificarTA = ({ idDbAfip, cuit }) => {
    const [servicio, setServicio] = useState("wsfe");
    const [estado, setEstado] = useState({ loading: false, datos: null, error: null });

    const consultar = async (s) => {
        setEstado(prev => ({ ...prev, loading: true, error: null }));
        try {
            const res = await afipService.verificarTA({ id: idDbAfip, cuit, servicio: s });
            if (res.data?.success && res.data.data.success) {
                setEstado({ loading: false, datos: res.data.data.datos, error: null });
            } else {
                setEstado({ loading: false, datos: null, error: true });
            }
        } catch {
            setEstado({ loading: false, datos: null, error: true });
        }
    };

    useEffect(() => { if (idDbAfip && cuit) consultar(servicio); }, [servicio, idDbAfip, cuit]);

    const renderStatus = () => {
        if (estado.loading) return <span style={{ color: '#28a4d5' }}><i className="fas fa-spinner fa-spin"></i></span>;
        if (estado.error) return <span style={{ color: '#e74c3c' }}><i className="fas fa-exclamation-triangle"></i> Sin Acceso</span>;
        
        const mins = estado.datos?.minutosRestantes || 0;
        return (
            <span style={{ color: '#2ecc71', fontWeight: '500' }}>
                <i className="fas fa-check-circle"></i> Token valido expira en ({Math.floor(mins / 60)}h {mins % 60}m)
            </span>
        );
    };

    return (
        <div style={{ 
            padding: '12px 0', 
            borderTop: '1px solid #f0f0f0', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            fontSize: '0.8rem'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Selector Ultra-Minimalista */}
                <select 
                    value={servicio} 
                    onChange={(e) => setServicio(e.target.value)}
                    style={{ 
                        border: 'none', 
                        background: 'transparent', 
                        color: '#888', 
                        fontWeight: 'bold',
                        outline: 'none',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        fontSize: '0.7rem'
                    }}
                >
                    <option value="wsfe">Facturación</option>
                    <option value="ws_sr_padron_a5">Padrón</option>
                </select>

                <div style={{ width: '1px', height: '12px', backgroundColor: '#ddd' }}></div>

                {/* Estado dinámico */}
                <div style={{ fontSize: '0.75rem' }}>
                    {renderStatus()}
                </div>
            </div>

            <button 
                onClick={() => consultar(servicio)}
                style={{ border: 'none', background: 'none', color: '#ccc', cursor: 'pointer' }}
                title="Refrescar conexión"
            >
                <i className="fas fa-sync-alt" style={{ fontSize: '0.7rem' }}></i>
            </button>
        </div>
    );
};

export default VerificarTA;