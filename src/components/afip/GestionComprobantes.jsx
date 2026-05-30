import React, { useState, useEffect, useCallback } from 'react';
import { afipService } from '../../services/afip/afip-general.js';
import { AFIP_TIPOS_COMPROBANTE } from '../../constants/afipConstants.js';
import Swal from 'sweetalert2';

const GestionComprobantes = ({ datosEmpresa }) => {
    const [comprobantes, setComprobantes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [checkingAfip, setCheckingAfip] = useState(null);

    const fetchComprobantes = useCallback(async () => {
        if (!datosEmpresa?._id || !datosEmpresa?.config?.puntoVenta || !datosEmpresa?.empresa?.cuit) return;

        setLoading(true);
        try {
            const resultados = [];

            for (const tipo of AFIP_TIPOS_COMPROBANTE) {
                const row = { ...tipo, ultimoLocal: null, ultimoAfip: null };

                try {
                    const resLocal = await afipService.ultComprobanteLocal({
                        userId: datosEmpresa._id,
                        puntoVenta: datosEmpresa.config.puntoVenta,
                        tipoComprobante: tipo.id
                    });
                    row.ultimoLocal = resLocal?.data?.data?.ultimoNumero ?? 0;
                } catch (err) {
                    console.error(`Error local tipo ${tipo.id}:`, err);
                    row.ultimoLocal = 'Error';
                }

                try {
                    const resAfip = await afipService.ultComprobanteAfip({
                        id: datosEmpresa._id,
                        cuit: datosEmpresa.empresa.cuit,
                        servicio: 'wsfe',
                        puntoVenta: datosEmpresa.config.puntoVenta,
                        tipoComprobante: tipo.id
                    });
                    row.ultimoAfip = resAfip?.data?.data?.CbteNro ?? 0;
                } catch (err) {
                    console.error(`Error AFIP tipo ${tipo.id}:`, err);
                    row.ultimoAfip = 'Error';
                }

                resultados.push(row);
            }

            setComprobantes(resultados);
        } catch (error) {
            console.error("Error general al cargar comprobantes:", error);
        } finally {
            setLoading(false);
        }
    }, [datosEmpresa]);

    useEffect(() => {
        fetchComprobantes();
    }, [fetchComprobantes]);

    const handleSincronizar = async () => {
        if (!datosEmpresa?._id || !datosEmpresa?.config?.puntoVenta || !datosEmpresa?.empresa?.cuit) return;

        setSyncing(true);
        try {
            const payload = {
                id: datosEmpresa._id,
                cuit: datosEmpresa.empresa.cuit,
                servicio: "wsfe",
                puntosVenta: [{
                    puntoVenta: datosEmpresa.config.puntoVenta,
                    name: "Manual Sync"
                }]
            };

            await afipService.sincronizarComprobantes(payload);
            
            Swal.fire({
                icon: 'success',
                title: 'Sincronizado',
                text: 'Los números se han actualizado con ARCA (ex AFIP)',
                timer: 1500,
                showConfirmButton: false
            });
            
            fetchComprobantes();
        } catch (error) {
            console.error("Error al sincronizar:", error);
            Swal.fire('Error', 'No se pudo sincronizar con AFIP', 'error');
        } finally {
            setSyncing(false);
        }
    };

    const handleConsultarAfip = async (comp) => {
        if (!datosEmpresa?._id || !datosEmpresa?.config?.puntoVenta || !datosEmpresa?.empresa?.cuit) return;

        setCheckingAfip(comp.id);
        try {
            const resAfip = await afipService.ultComprobanteAfip({
                id: datosEmpresa._id,
                cuit: datosEmpresa.empresa.cuit,
                servicio: 'wsfe',
                puntoVenta: datosEmpresa.config.puntoVenta,
                tipoComprobante: comp.id
            });
            const ultimoAfip = resAfip?.data?.data?.CbteNro ?? 0;
            setComprobantes((prev) => prev.map((row) => row.id === comp.id ? { ...row, ultimoAfip } : row));
        } catch (error) {
            console.error("Error al consultar AFIP:", error);
            setComprobantes((prev) => prev.map((row) => row.id === comp.id ? { ...row, ultimoAfip: 'Error' } : row));
            Swal.fire('Error', 'No se pudo consultar el último número en AFIP', 'error');
        } finally {
            setCheckingAfip(null);
        }
    };

    const handleEditarManual = async (comp) => {
        const { value: nuevoNumero } = await Swal.fire({
            title: `Editar Número de ${comp.desc}`,
            input: 'number',
            inputLabel: 'Último número emitido',
            inputValue: comp.ultimoLocal,
            showCancelButton: true,
            inputValidator: (value) => {
                if (value === '' || value === null || value === undefined || Number(value) < 0) {
                    return 'Debes ingresar un número válido';
                }
            }
        });

        if (nuevoNumero !== undefined) {
            try {
                await afipService.actualizarNumero({
                    userId: datosEmpresa._id,
                    puntoVenta: datosEmpresa.config.puntoVenta,
                    tipoComprobante: comp.id,
                    ultimoNumero: parseInt(nuevoNumero, 10)
                });
                
                Swal.fire('¡Actualizado!', '', 'success');
                fetchComprobantes();
            } catch (error) {
                console.error("Error al actualizar manualmente:", error);
                Swal.fire('Error', 'No se pudo actualizar el número', 'error');
            }
        }
    };

    const disabled = !datosEmpresa?._id || !datosEmpresa?.config?.puntoVenta || !datosEmpresa?.empresa?.cuit;
    const isNumericValue = (v) => typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v)));
    const toNumber = (v) => Number(v);

    return (
        <div className="door-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Numeración de Comprobantes</h3>
                    <div style={{ marginTop: '4px', color: '#6c757d', fontSize: '0.85rem' }}>
                        Punto de venta <b>{datosEmpresa.config.puntoVenta}</b> · DB local vs AFIP
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={fetchComprobantes}
                        disabled={loading || syncing || disabled}
                        style={{ fontSize: '0.8rem' }}
                    >
                        <i className={`fas fa-sync ${loading ? 'fa-spin' : ''}`}></i> Recargar
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSincronizar}
                        disabled={loading || syncing || disabled}
                        style={{ fontSize: '0.8rem' }}
                    >
                        <i className={`fas fa-cloud-download-alt ${syncing ? 'fa-spin' : ''}`}></i> Sincronizar (AFIP→DB)
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', color: '#495057', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                    <div>
                        <b>DB</b>: último número guardado localmente.
                    </div>
                    <div>
                        <b>AFIP</b>: último número informado por ARCA.
                    </div>
                    <div>
                        Si difieren, sincronizá para corregir la DB.
                    </div>
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                            <th style={{ padding: '10px' }}>Comprobante</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Último N° (DB)</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Último N° (AFIP)</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Estado</th>
                            <th style={{ padding: '10px', textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {comprobantes.map((comp, idx) => {
                            const hasBoth = isNumericValue(comp.ultimoLocal) && isNumericValue(comp.ultimoAfip);
                            const mismatch = hasBoth && toNumber(comp.ultimoLocal) !== toNumber(comp.ultimoAfip);
                            const statusLabel = !hasBoth ? 'N/A' : mismatch ? 'DIFIERE' : 'OK';
                            const statusBg = !hasBoth ? '#f1f3f5' : mismatch ? '#fff3bf' : '#d3f9d8';
                            const statusColor = !hasBoth ? '#495057' : mismatch ? '#8a6d3b' : '#2f9e44';
                            const zebraBg = idx % 2 === 0 ? '#ffffff' : '#f8f9fa';

                            return (
                            <tr key={comp.id} style={{ borderBottom: '1px solid #f9f9f9', backgroundColor: mismatch ? '#fff9db' : zebraBg }}>
                                <td style={{ padding: '10px' }}>{comp.desc}</td>
                                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                                    {comp.ultimoLocal}
                                </td>
                                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                                    {comp.ultimoAfip}
                                </td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                    <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '999px', backgroundColor: statusBg, color: statusColor, fontWeight: 700, fontSize: '0.75rem' }}>
                                        {statusLabel}
                                    </span>
                                </td>
                                <td style={{ padding: '10px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                        <button 
                                            className="btn btn-secondary" 
                                            onClick={() => handleEditarManual(comp)}
                                            disabled={loading || syncing || disabled}
                                            title="Editar manualmente"
                                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => handleConsultarAfip(comp)}
                                            disabled={loading || syncing || disabled || checkingAfip === comp.id}
                                            title="Consultar último número en AFIP"
                                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                        >
                                            <i className={`fas fa-search ${checkingAfip === comp.id ? 'fa-spin' : ''}`}></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
            
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff9e6', borderRadius: '8px', border: '1px solid #ffeeba' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#856404' }}>
                    <i className="fas fa-info-circle"></i> <b>Tip:</b> Si vas a empezar a facturar o cambiaste de sistema, primero sincronizá para evitar rechazos por numeración.
                </p>
            </div>
        </div>
    );
};

export default GestionComprobantes;
