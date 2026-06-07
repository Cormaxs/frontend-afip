import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Zap, TrendingUp, Edit3 } from 'lucide-react';
import { getCompanyPlanLimits, getAdminPlans, updateCompanyPlanAdmin } from '../../services/admin/admin.service.js';
import Swal from 'sweetalert2';

export default function PlanLimitsView({ companyId, companyName }) {
    const [planData, setPlanData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [availablePlans, setAvailablePlans] = useState([]);

    useEffect(() => {
        loadPlanData();
        loadAvailablePlans();
    }, [companyId]);

    const loadAvailablePlans = async () => {
        try {
            const plans = await getAdminPlans();
            setAvailablePlans(plans);
        } catch (err) {
            console.error('Error al cargar planes:', err);
        }
    };

    const handleUpdatePlan = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Actualizar Plan de Empresa',
            html:
                `<div style="text-align: left; display: flex; flex-direction: column; gap: 15px;">
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Seleccionar Plan</label>
                        <select id="swal-plan" class="swal2-select" style="width: 100%; margin: 0;">
                            ${availablePlans.map(p => `<option value="${p._id}" ${p.slug === planData?.slugPlan ? 'selected' : ''}>${p.nombre} ($${p.precio})</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Fecha de Vencimiento</label>
                        <input id="swal-vencimiento" type="date" class="swal2-input" style="width: 100%; margin: 0;" value="${planData?.fechaVencimiento ? new Date(planData.fechaVencimiento).toISOString().split('T')[0] : ''}">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Método de Pago</label>
                        <select id="swal-metodo" class="swal2-select" style="width: 100%; margin: 0;">
                            <option value="transferencia">Transferencia Bancaria</option>
                            <option value="efectivo">Efectivo</option>
                            <option value="mercadopago_manual">Mercado Pago (Manual)</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Monto Cobrado (ARS)</label>
                        <input id="swal-monto" type="number" class="swal2-input" style="width: 100%; margin: 0;" placeholder="0.00">
                    </div>
                </div>`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Actualizar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                return {
                    planId: document.getElementById('swal-plan').value,
                    fechaVencimiento: document.getElementById('swal-vencimiento').value,
                    metodoPago: document.getElementById('swal-metodo').value,
                    montoPago: parseFloat(document.getElementById('swal-monto').value) || 0
                }
            }
        });

        if (formValues) {
            try {
                setLoading(true);
                const response = await updateCompanyPlanAdmin(companyId, formValues);
                if (response.success) {
                    Swal.fire('Éxito', 'Plan actualizado correctamente', 'success');
                    loadPlanData();
                } else {
                    throw new Error(response.message || 'Error al actualizar');
                }
            } catch (err) {
                Swal.fire('Error', err.message || 'Error al procesar la solicitud', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const loadPlanData = async () => {
        try {
            setLoading(true);
            const response = await getCompanyPlanLimits(companyId);
            // El backend ahora devuelve { success: true, planLimits: { ... } }
            if (response && response.planLimits) {
                setPlanData(response.planLimits);
            } else if (response && !response.planLimits && response.nombrePlan) {
                // Fallback por si la estructura es directa (compatibilidad)
                setPlanData(response);
            } else {
                throw new Error('Estructura de respuesta inválida');
            }
            setError(null);
        } catch (err) {
            setError('Error al cargar información del plan');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="plan-limits-loading">
                <div className="spinner"></div>
                <p>Cargando información del plan...</p>
            </div>
        );
    }

    if (error || !planData) {
        return (
            <div className="plan-limits-error">
                <AlertCircle size={24} />
                <p>{error || 'No se pudo cargar el plan'}</p>
            </div>
        );
    }

    const getStatusColor = (porcentaje) => {
        if (porcentaje >= 90) return '#ef4444'; // Rojo
        if (porcentaje >= 70) return '#f59e0b'; // Naranja
        return '#10b981'; // Verde
    };

    const getLimitStatus = (item) => {
        if (item.esIlimitado) {
            return { status: 'Ilimitado', color: '#3b82f6', icon: '∞' };
        }
        if (item.usado >= item.limite) {
            return { status: 'LÍMITE ALCANZADO', color: '#ef4444', icon: '⚠️' };
        }
        if (item.porcentaje >= 90) {
            return { status: 'Crítico', color: '#ef4444', icon: '🔴' };
        }
        if (item.porcentaje >= 70) {
            return { status: 'Alto', color: '#f59e0b', icon: '🟠' };
        }
        return { status: 'Ok', color: '#10b981', icon: '✓' };
    };

    const renderLimitCard = (label, data) => {
        const status = getLimitStatus(data);
        const isCritical = data.usado >= data.limite;

        return (
            <div key={label} className={`plan-limit-card ${isCritical ? 'plan-limit-card--critical' : ''}`}>
                <div className="plan-limit-header">
                    <h4>{label}</h4>
                    <span className="plan-limit-status" style={{ backgroundColor: status.color }}>
                        {status.icon} {status.status}
                    </span>
                </div>

                <div className="plan-limit-progress">
                    <div className="plan-limit-progress-bar">
                        <div
                            className="plan-limit-progress-fill"
                            style={{
                                width: `${Math.min(data.porcentaje, 100)}%`,
                                backgroundColor: getStatusColor(data.porcentaje)
                            }}
                        ></div>
                    </div>
                    <div className="plan-limit-stats">
                        <span className="plan-limit-used">
                            {data.usado} / {data.esIlimitado ? '∞' : data.limite}
                        </span>
                        <span className="plan-limit-percent">{data.porcentaje}%</span>
                    </div>
                </div>

                {isCritical && (
                    <div className="plan-limit-warning">
                        <AlertCircle size={16} />
                        <span>Se ha alcanzado el límite de tu plan. Considera actualizar.</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="plan-limits-view">
            <div className="plan-limits-header">
                <div>
                    <h2>Plan: {planData.nombrePlan}</h2>
                    <p className="plan-limits-company">{companyName}</p>
                </div>
                <div className="plan-limits-status-badge">
                    {planData.esActivo ? (
                        <>
                            <CheckCircle size={24} color="#10b981" />
                            <span>Plan Activo</span>
                        </>
                    ) : (
                        <>
                            <AlertCircle size={24} color="#ef4444" />
                            <span>{planData.estadoPlan}</span>
                        </>
                    )}
                </div>
            </div>

            {!planData.esActivo && (
                <div className="plan-limits-alert">
                    <AlertCircle size={20} />
                    <div>
                        <h4>Plan Inactivo</h4>
                        <p>Este plan está {planData.estadoPlan}. No se pueden realizar operaciones nuevas.</p>
                    </div>
                </div>
            )}

            <div className="plan-limits-info">
                <div className="plan-limits-info-item">
                    <span className="label">Plan Iniciado:</span>
                    <span className="value">{new Date(planData.fechaInicio).toLocaleDateString('es-AR')}</span>
                </div>
                {planData.fechaVencimiento && (
                    <div className="plan-limits-info-item">
                        <span className="label">Vencimiento:</span>
                        <span className="value">{new Date(planData.fechaVencimiento).toLocaleDateString('es-AR')}</span>
                    </div>
                )}
            </div>

            <div className="plan-limits-grid">
                <div className="plan-limits-section">
                    <h3>
                        <TrendingUp size={20} />
                        Uso de Recursos
                    </h3>
                    {renderLimitCard('Productos', planData.limites.productos)}
                    {renderLimitCard('Usuarios', planData.limites.usuarios)}
                    {renderLimitCard('Facturas AFIP/Mes', planData.limites.facturas)}
                    {renderLimitCard('Tickets Internos/Mes', planData.limites.tickets)}
                    {renderLimitCard('Notas de Pedido/Mes', planData.limites.notasPedido)}
                    {renderLimitCard('Puntos de Venta', planData.limites.puntosVenta)}
                    {renderLimitCard('Cajas', planData.limites.cajas)}
                </div>

                <div className="plan-limits-features">
                    <h3>
                        <Zap size={20} />
                        Características
                    </h3>
                    <div className="plan-features-list">
                        <div className={`plan-feature ${planData.características.exportXlsx ? 'plan-feature--enabled' : 'plan-feature--disabled'}`}>
                            <span className="plan-feature-icon">
                                {planData.características.exportXlsx ? '✓' : '✗'}
                            </span>
                            <span>Exportar a Excel</span>
                        </div>
                        <div className={`plan-feature ${planData.características.soportePrioritario ? 'plan-feature--enabled' : 'plan-feature--disabled'}`}>
                            <span className="plan-feature-icon">
                                {planData.características.soportePrioritario ? '✓' : '✗'}
                            </span>
                            <span>Soporte Prioritario</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="plan-limits-footer">
                <button 
                    onClick={handleUpdatePlan}
                    className="plan-limits-upgrade-btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                >
                    <Edit3 size={18} />
                    Gestionar Plan y Pagos
                </button>
            </div>
        </div>
    );
}
