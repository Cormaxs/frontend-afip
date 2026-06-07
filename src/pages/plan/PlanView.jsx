import React, { useState, useEffect } from 'react';
import { getPlanStatusApi, subscribeToPlanApi, payOnceToPlanApi } from '../../api/coneccion.jsx';
import { CreditCard, Package, Users, FileText, CheckCircle, AlertCircle, Clock, ExternalLink, RefreshCw, Hand, MessageCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import '../../pages/auth/entrada.css';
import '../../components/tables/tablas.css';

const PlanView = () => {
    const [planData, setPlanData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubscribing, setIsSubscribing] = useState(null); // id del plan suscribiendo
    const [error, setError] = useState(null);
    const [showPricing, setShowPricing] = useState(false);

    const fetchPlanStatus = async () => {
        try {
            setLoading(true);
            const userData = JSON.parse(localStorage.getItem('userData')) || JSON.parse(localStorage.getItem('user'));
            const companyData = JSON.parse(localStorage.getItem('dataEmpresa'));
            const empresaId = userData?.empresa || companyData?._id;

            if (!empresaId) {
                throw new Error("No se encontró el ID de la empresa.");
            }

            const data = await getPlanStatusApi(empresaId);
            setPlanData(data);
        } catch (err) {
            console.error("Error al obtener el plan:", err);
            setError(err.message || "Error al cargar la información del plan.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlanStatus();
    }, []);

    const handleSubscribe = async (planId) => {
        const userData = JSON.parse(localStorage.getItem('userData')) || JSON.parse(localStorage.getItem('user'));
        const companyData = JSON.parse(localStorage.getItem('dataEmpresa'));
        const empresaId = userData?.empresa || companyData?._id;
        const defaultEmail = userData?.email || companyData?.emailContacto || '';

        if (!empresaId) {
            Swal.fire('Error', 'No se pudo identificar la empresa', 'error');
            return;
        }

        // 1. Pedir confirmación del email (Mercado Pago lo requiere para suscripciones)
        const { value: email } = await Swal.fire({
            title: 'Confirmar Email de Suscripción',
            text: 'Mercado Pago requiere un email válido para gestionar tu suscripción.',
            input: 'email',
            inputLabel: 'Tu correo electrónico',
            inputValue: defaultEmail,
            showCancelButton: true,
            confirmButtonText: 'Continuar',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => {
                if (!value) {
                    return '¡El correo es obligatorio!';
                }
            }
        });

        if (!email) return; // El usuario canceló

        // 2. Elegir modo de pago: Automático o Manual
        const { value: paymentMode } = await Swal.fire({
            title: 'Elige tu forma de pago',
            text: '¿Cómo prefieres pagar tu plan?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Continuar',
            cancelButtonText: 'Cancelar',
            input: 'radio',
            inputOptions: {
                'automatic': 'Automático (Suscripción mensual - Requiere tarjeta habilitada para débito automático)',
                'manual': 'Manual (Pago único por 30 días - QR, Efectivo, Tarjeta)'
            },
            footer: '<div style="font-size: 0.8em; color: #666;">Nota: Algunas tarjetas (como Naranja o locales) pueden rechazar suscripciones automáticas por seguridad. Si falla, usa el modo <b>Manual</b>.</div>',
            inputValidator: (value) => {
                if (!value) {
                    return 'Debes elegir una opción para continuar';
                }
            }
        });

        if (!paymentMode) return;

        try {
            setIsSubscribing(planId);
            
            let response;
            if (paymentMode === 'automatic') {
                response = await subscribeToPlanApi(empresaId, planId, email);
            } else {
                response = await payOnceToPlanApi(empresaId, planId, email);
            }

            if (response.success) {
                if (response.isFree) {
                    Swal.fire('¡Éxito!', 'Tu plan ha sido actualizado al plan Free.', 'success');
                    fetchPlanStatus(); // Recargar datos
                    return;
                }

                if (response.init_point) {
                    Swal.fire({
                        title: '¡Ya casi está!',
                        text: 'Te redirigiremos a Mercado Pago para completar tu suscripción.',
                        icon: 'info',
                        showCancelButton: true,
                        confirmButtonText: 'Ir a pagar',
                        cancelButtonText: 'Cancelar'
                    }).then((result) => {
                    if (result.isConfirmed) {
                        // Usar window.location.href en lugar de window.open para evitar bloqueos de popups y problemas de CSP
                        window.location.href = response.init_point;
                    }
                });
                } else {
                    throw new Error('No se pudo obtener el link de pago');
                }
            } else {
                throw new Error(response.message || 'Error al iniciar suscripción');
            }
        } catch (err) {
            console.error("Error al suscribirse:", err);
            Swal.fire('Error', err.response?.data?.message || 'Error al procesar la suscripción', 'error');
        } finally {
            setIsSubscribing(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#28a4d5]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 m-6">
                <AlertCircle size={24} />
                <p>{error}</p>
            </div>
        );
    }

    if (!planData) return null;

    const { plan, consumo, pagos, empresa, planesDisponibles } = planData;

    console.log("DEBUG PLAN DATA:", { plan, consumo, empresa });

    const calculatePercentage = (current, limit) => {
        const cur = Number(current) || 0;
        const lim = Number(limit) || 0;
        if (!lim || lim === 999999 || lim === 0) return 0;
        return Math.min(Math.round((cur / lim) * 100), 100);
    };

    const getStatusColor = (percentage) => {
        if (percentage >= 90) return '#ef4444'; // Red-500
        if (percentage >= 70) return '#f59e0b'; // Amber-500
        return '#3b82f6'; // Blue-500
    };

    const getStatusBg = (percentage) => {
        if (percentage >= 90) return '#fef2f2'; // Red-50
        if (percentage >= 70) return '#fffbeb'; // Amber-50
        return '#eff6ff'; // Blue-50
    };

    const UsageCard = ({ title, icon: Icon, current, limit, unit, subtitle }) => {
        const cur = Number(current) || 0;
        const lim = Number(limit) || 0;
        const percentage = calculatePercentage(cur, lim);
        const isUnlimited = lim === 999999;
        const color = getStatusColor(percentage);
        const bg = getStatusBg(percentage);

        return (
            <div className="door-card" style={{ 
                textAlign: 'left', 
                width: '100%', 
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                border: percentage >= 90 ? `1px solid ${color}` : '1px solid #e5e7eb',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                borderRadius: '8px',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div style={{ 
                            backgroundColor: bg, 
                            color: color, 
                            padding: '10px', 
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Icon size={22} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: '#1f2937' }}>{title}</h3>
                            {subtitle && <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>{subtitle}</p>}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '4px' }}>
                    <div className="flex justify-between items-end mb-2">
                        <span style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                            {cur.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                            de {isUnlimited ? '∞' : lim.toLocaleString()} {unit}
                        </span>
                    </div>

                    {!isUnlimited && (
                        <div style={{ width: '100%', backgroundColor: '#f3f4f6', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                            <div 
                                style={{ 
                                    height: '100%', 
                                    borderRadius: '10px', 
                                    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)', 
                                    width: `${percentage}%`,
                                    backgroundColor: color,
                                    boxShadow: `0 0 10px ${color}40`
                                }} 
                            ></div>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center" style={{ marginTop: 'auto' }}>
                    <p style={{ fontSize: '11px', color: percentage >= 90 ? color : '#6b7280', fontWeight: '600', margin: 0 }}>
                        {isUnlimited ? 'Uso ilimitado' : `${percentage}% utilizado`}
                    </p>
                    {percentage >= 90 && !isUnlimited && (
                        <span style={{ 
                            fontSize: '10px', 
                            backgroundColor: '#fee2e2', 
                            color: '#b91c1c', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            fontWeight: '700'
                        }}>
                            CRÍTICO
                        </span>
                    )}
                </div>
            </div>
        );
    };

    const PricingTable = () => (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-6">
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ border: 'none', fontSize: '28px', marginBottom: '10px' }}>Planes Disponibles</h1>
                <p style={{ color: '#6c757d' }}>Elige el plan que mejor se adapte al crecimiento de tu negocio.</p>
            </div>
            <div className="door-grid">
                {planesDisponibles?.map((p) => {
                    const isCurrent = p.slug === empresa?.planActual;
                    return (
                        <div key={p._id} className="door-card" style={{ 
                            position: 'relative', 
                            padding: '30px 20px',
                            border: isCurrent ? '2px solid #28a4d5' : '1px solid #ced4da',
                            boxShadow: isCurrent ? '0 4px 12px rgba(40, 164, 213, 0.15)' : '0 2px 5px rgba(0,0,0,0.05)'
                        }}>
                            {isCurrent && (
                                <div style={{ 
                                    position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                                    backgroundColor: '#28a4d5', color: 'white', padding: '2px 12px',
                                    borderRadius: '20px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase'
                                }}>
                                    Tu Plan Actual
                                </div>
                            )}
                            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '15px', color: '#28a4d5' }}>{p.nombre}</h3>
                            <div style={{ marginBottom: '25px' }}>
                                <span style={{ fontSize: '32px', fontWeight: '800', color: '#495057' }}>${p.precio?.toLocaleString()}</span>
                                <span style={{ color: '#6c757d', fontSize: '14px' }}>/{p.periodo || 'mes'}</span>
                            </div>
                            <div className="divider"></div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0 30px', textAlign: 'left' }}>
                                {[
                                    { label: p.productosLimite >= 999999 ? 'Productos ilimitados' : `${p.productosLimite} Productos`, icon: Package },
                                    { label: p.facturasMensualesLimite >= 999999 ? 'Facturas AFIP ilimitadas' : `${p.facturasMensualesLimite} Facturas AFIP/mes`, icon: FileText },
                                    { label: p.ticketsMensualesLimite >= 999999 ? 'Tickets ilimitados' : `${p.ticketsMensualesLimite} Tickets/mes`, icon: FileText },
                                    { label: p.notasPedidoMensualesLimite >= 999999 ? 'Pedidos ilimitados' : `${p.notasPedidoMensualesLimite} Pedidos/mes`, icon: FileText },
                                    { label: `${p.usuariosLimite} Usuarios`, icon: Users },
                                    { label: `${p.puntosVentaLimite} Puntos de Venta`, icon: CheckCircle },
                                    ...(p.exportXlsx ? [{ label: 'Exportación Excel', icon: CheckCircle }] : [])
                                ].map((item, idx) => (
                                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', fontSize: '13px', color: '#495057' }}>
                                        <item.icon size={14} style={{ color: '#28a4d5', flexShrink: 0 }} />
                                        <span>{item.label}</span>
                                    </li>
                                ))}
                            </ul>
                            <button 
                                onClick={() => handleSubscribe(p._id)}
                                disabled={isCurrent || isSubscribing === p._id}
                                className={`btn ${isCurrent ? 'btn-outline' : 'btn-primary'}`}
                                style={{ 
                                    width: '100%', 
                                    margin: 0, 
                                    opacity: (isCurrent || (isSubscribing && isSubscribing !== p._id)) ? 0.7 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                {isSubscribing === p._id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : isCurrent ? (
                                    'Plan Actual'
                                ) : (
                                    <>
                                        Seleccionar Plan
                                        <ExternalLink size={14} />
                                    </>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <button 
                    onClick={() => setShowPricing(false)}
                    className="btn btn-outline"
                    style={{ border: 'none', background: 'transparent' }}
                >
                    Volver a mi resumen de consumo
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
            {showPricing ? (
                <PricingTable />
            ) : (
                <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #dee2e6', paddingBottom: '15px' }}>
                            <div>
                                <h1 style={{ border: 'none', margin: 0, padding: 0 }}>Mi Plan y Consumo</h1>
                                <p style={{ color: '#6c757d', fontSize: '14px', marginTop: '5px' }}>Controla los recursos de <strong>{empresa?.nombre || 'tu empresa'}</strong> y gestiona tu suscripción.</p>
                            </div>
                            <div className="door-card" style={{ width: 'auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '15px', margin: 0 }}>
                                <div style={{ backgroundColor: '#f0f7ff', color: '#28a4d5', padding: '10px', borderRadius: '3px' }}>
                                    <CreditCard size={24} />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <p style={{ fontSize: '10px', fontWeight: '800', color: '#999', margin: 0, textTransform: 'uppercase' }}>Suscripción</p>
                                    <p style={{ fontSize: '16px', fontWeight: '700', color: '#495057', margin: 0 }}>{plan?.nombre || plan?.slug || 'Plan'}</p>
                                </div>
                                <div style={{ marginLeft: '10px', paddingLeft: '15px', borderLeft: '1px solid #eee' }}>
                                    <span style={{ 
                                        fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '2px',
                                        backgroundColor: (empresa?.estadoPlan === 'activo' || !empresa?.estadoPlan) ? '#e6f4ea' : '#fff3cd',
                                        color: (empresa?.estadoPlan === 'activo' || !empresa?.estadoPlan) ? '#1e7e34' : '#856404',
                                        border: `1px solid ${(empresa?.estadoPlan === 'activo' || !empresa?.estadoPlan) ? '#c3e6cb' : '#ffeeba'}`
                                    }}>
                                        {(empresa?.estadoPlan || 'activo').toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                            gap: '20px',
                            marginBottom: '40px'
                        }}>
                            <UsageCard 
                                title="Facturas AFIP" 
                                icon={FileText} 
                                current={consumo?.facturasAfipMes} 
                                limit={plan?.facturasMensualesLimite || plan?.facturasMenu} 
                                unit="u."
                                subtitle="Comprobantes fiscales electrónicos"
                            />
                            <UsageCard 
                                title="Tickets Internos" 
                                icon={FileText} 
                                current={consumo?.ticketsMes} 
                                limit={plan?.ticketsMensualesLimite} 
                                unit="u."
                                subtitle="Comprobantes de venta internos"
                            />
                            <UsageCard 
                                title="Notas de Pedido" 
                                icon={FileText} 
                                current={consumo?.notasPedidoMes} 
                                limit={plan?.notasPedidoMensualesLimite} 
                                unit="u."
                                subtitle="Presupuestos y pedidos"
                            />
                            <UsageCard 
                                title="Productos" 
                                icon={Package} 
                                current={consumo?.productos} 
                                limit={plan?.productosLimite} 
                                unit="u."
                                subtitle="Capacidad total de inventario"
                            />
                            <UsageCard 
                                title="Usuarios" 
                                icon={Users} 
                                current={consumo?.usuarios} 
                                limit={plan?.usuariosLimite} 
                                unit="u."
                                subtitle="Cuentas de acceso permitidas"
                            />
                            <UsageCard 
                                title="PDV" 
                                icon={CheckCircle} 
                                current={consumo?.puntosVenta} 
                                limit={plan?.puntosVentaLimite} 
                                unit="u."
                                subtitle="Puntos de venta habilitados"
                            />
                            <UsageCard 
                                title="Cajas" 
                                icon={Clock} 
                                current={consumo?.cajas} 
                                limit={plan?.cajasLimite} 
                                unit="u."
                                subtitle="Cajas registradoras activas"
                            />
                        </div>

                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr',
                            gap: '24px'
                        }} className="desktop-grid-layout">
                            <style>{`
                                @media (min-width: 1024px) {
                                    .desktop-grid-layout {
                                        grid-template-columns: 2fr 1fr !important;
                                        display: grid !important;
                                    }
                                }
                                .usage-grid {
                                    display: grid;
                                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                                    gap: 20px;
                                    margin-bottom: 40px;
                                }
                            `}</style>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div className="door-card" style={{ width: '100%', textAlign: 'left', padding: '24px', borderRadius: '12px' }}>
                                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <CreditCard size={20} style={{ color: '#3b82f6' }} /> Historial de Pagos
                                    </h2>
                                    
                                    {pagos && pagos.length > 0 ? (
                                        <div className="table-container" style={{ overflowX: 'auto' }}>
                                            <table className="office-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: 'transparent' }}>
                                                        <th style={{ padding: '12px', color: '#6b7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Fecha</th>
                                                        <th style={{ padding: '12px', color: '#6b7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Plan</th>
                                                        <th style={{ padding: '12px', color: '#6b7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Monto</th>
                                                        <th style={{ padding: '12px', color: '#6b7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {pagos.map((pago) => (
                                                        <tr key={pago._id} style={{ backgroundColor: '#fff', transition: 'background-color 0.2s' }}>
                                                            <td style={{ padding: '16px 12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f3f4f6' }}>{new Date(pago.fechaPago).toLocaleDateString()}</td>
                                                            <td style={{ padding: '16px 12px', fontSize: '14px', fontWeight: '600', color: '#111827', borderBottom: '1px solid #f3f4f6' }}>{pago.plan?.nombre || 'Suscripción'}</td>
                                                            <td style={{ padding: '16px 12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f3f4f6' }}>${pago.monto.toLocaleString()} {pago.moneda}</td>
                                                            <td style={{ padding: '16px 12px', borderBottom: '1px solid #f3f4f6' }}>
                                                                <span style={{ 
                                                                    fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px',
                                                                    backgroundColor: pago.estado === 'completado' ? '#def7ec' : '#fef3c7',
                                                                    color: pago.estado === 'completado' ? '#03543f' : '#92400e',
                                                                    textTransform: 'uppercase'
                                                                }}>
                                                                    {pago.estado}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af', backgroundColor: '#f9fafb', borderRadius: '12px', border: '2px dashed #e5e7eb' }}>
                                            <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>No hay historial de pagos disponible.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="door-card" style={{ 
                                    width: '100%', 
                                    textAlign: 'left', 
                                    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', 
                                    color: 'white', 
                                    border: 'none',
                                    padding: '24px',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                }}>
                                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '12px', marginBottom: '16px' }}>Vencimiento</h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                        <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '8px' }}>
                                            <Clock size={20} />
                                        </div>
                                        <span style={{ fontSize: '14px', fontWeight: '500' }}>
                                            {empresa?.fechaPlanFinalizacion 
                                                ? `Vence el ${new Date(empresa.fechaPlanFinalizacion).toLocaleDateString()}` 
                                                : 'Renovación mensual automática'}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => setShowPricing(true)}
                                        className="btn"
                                        style={{ 
                                            backgroundColor: 'white', 
                                            color: '#2563eb', 
                                            width: '100%', 
                                            margin: 0,
                                            fontWeight: '700',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            marginBottom: '10px'
                                        }}
                                    >
                                        Cambiar Plan
                                    </button>

                                    {/* Link de pago manual para el próximo mes */}
                                    <button 
                                        onClick={() => handleSubscribe(plan?._id)}
                                        className="btn"
                                        style={{ 
                                            backgroundColor: 'rgba(255,255,255,0.15)', 
                                            color: 'white', 
                                            width: '100%', 
                                            margin: 0,
                                            fontWeight: '600',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            border: '1px solid rgba(255,255,255,0.3)',
                                            marginBottom: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <CreditCard size={18} />
                                        Pagar Próximo Mes
                                    </button>

                                    {/* Link de WhatsApp para enviar comprobante */}
                                    <a 
                                        href={`https://wa.me/543834901162?text=Hola!%20Envío%20comprobante%20de%20pago%20de%20mi%20plan%20en%20FacStock.%20Empresa:%20${encodeURIComponent(empresa?.nombre || 'No especificada')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn"
                                        style={{ 
                                            backgroundColor: '#25d366', 
                                            color: 'white', 
                                            width: '100%', 
                                            margin: 0,
                                            fontWeight: '600',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        <MessageCircle size={18} />
                                        Enviar Comprobante
                                    </a>
                                </div>

                                <div className="door-card" style={{ width: '100%', textAlign: 'left', padding: '24px', borderRadius: '12px' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>Beneficios Activos</h3>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <li style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#4b5563' }}>
                                            <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                                            <span>Soporte {plan?.soportePrioritario ? 'Prioritario 24/7' : 'Estándar'}</span>
                                        </li>
                                        <li style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#4b5563' }}>
                                            <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                                            <span>{plan?.exportXlsx ? 'Exportación Excel habilitada' : 'Sin exportación Excel'}</span>
                                        </li>
                                        <li style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#4b5563' }}>
                                            <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                                            <span>Integración AFIP Directa</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default PlanView;
