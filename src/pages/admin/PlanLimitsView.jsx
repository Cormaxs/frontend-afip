import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Zap, TrendingUp } from 'lucide-react';
import { getCompanyPlanLimits } from '../../services/admin/admin.service.js';

export default function PlanLimitsView({ companyId, companyName }) {
    const [planData, setPlanData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadPlanData();
    }, [companyId]);

    const loadPlanData = async () => {
        try {
            setLoading(true);
            const data = await getCompanyPlanLimits(companyId);
            setPlanData(data.planLimits);
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
                    {renderLimitCard('Facturas/Mes', planData.limites.facturas)}
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
                <button className="plan-limits-upgrade-btn">Actualizar Plan</button>
            </div>
        </div>
    );
}
