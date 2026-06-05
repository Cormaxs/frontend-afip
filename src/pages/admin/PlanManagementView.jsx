import React, { useState, useEffect } from 'react';
import { getAdminPlans, createAdminPlan, updateAdminPlan, deleteAdminPlan } from '../../services/admin/admin.service.js';
import { Plus, Edit2, Trash2, Check, X, Package, Users, FileText, CreditCard, ShieldCheck } from 'lucide-react';
import Swal from 'sweetalert2';

const PlanManagementView = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsCurrentEditing] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        slug: '',
        productosLimite: 0,
        usuariosLimite: 0,
        facturasMensualesLimite: 0,
        ticketsMensualesLimite: 0,
        notasPedidoMensualesLimite: 0,
        puntosVentaLimite: 1,
        cajasLimite: 1,
        exportXlsx: false,
        soportePrioritario: false,
        precio: 0,
        periodo: 'mes',
        descripcion: '',
        activo: true
    });

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            setLoading(true);
            const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:3010").replace(/\/$/, "");
            console.log(`--- [FRONTEND] Cargando planes desde: ${apiBase}/api/v1/admin/plans ---`);
            
            const data = await getAdminPlans();
            console.log('--- [FRONTEND] Datos recibidos:', data);
            
            let plansArray = [];
            if (Array.isArray(data)) {
                plansArray = data;
            } else if (data && typeof data === 'object' && Array.isArray(data.plans)) {
                plansArray = data.plans;
            } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
                plansArray = data.data;
            }

            console.log('--- [FRONTEND] Cantidad de planes finales:', plansArray.length);
            setPlans(plansArray);
        } catch (error) {
            console.error('--- [FRONTEND] Error al cargar planes:', error);
            const errorMsg = error.response?.data?.message || error.message;
            Swal.fire('Error de Conexión', `No se pudo conectar al backend en ${import.meta.env.VITE_API_URL || 'Producción'}. Detalle: ${errorMsg}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (plan) => {
        setIsCurrentEditing(plan._id);
        setFormData({ ...plan });
    };

    const handleCancel = () => {
        setIsCurrentEditing(null);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            nombre: '',
            slug: '',
            productosLimite: 0,
            usuariosLimite: 0,
            facturasMensualesLimite: 0,
            ticketsMensualesLimite: 0,
            notasPedidoMensualesLimite: 0,
            puntosVentaLimite: 1,
            cajasLimite: 1,
            exportXlsx: false,
            soportePrioritario: false,
            precio: 0,
            periodo: 'mes',
            descripcion: '',
            activo: true
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing && isEditing !== 'new') {
                await updateAdminPlan(isEditing, formData);
                Swal.fire('¡Actualizado!', 'El plan ha sido modificado con éxito', 'success');
            } else {
                await createAdminPlan(formData);
                Swal.fire('¡Creado!', 'Nuevo plan registrado', 'success');
            }
            setIsCurrentEditing(null);
            resetForm();
            loadPlans();
        } catch (error) {
            console.error('Error al guardar plan:', error);
            Swal.fire('Error', 'Ocurrió un problema al guardar los cambios', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteAdminPlan(id);
                Swal.fire('Eliminado', 'El plan ha sido borrado', 'success');
                loadPlans();
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar el plan', 'error');
            }
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
        }));
    };

    if (loading) return <div className="p-8 text-center">Cargando gestión de planes...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center border-bottom pb-4">
                <h2 className="text-2xl font-bold text-[#28a4d5] flex items-center gap-2">
                    <ShieldCheck /> Gestión de Suscripciones
                </h2>
                {!isEditing && (
                    <button onClick={() => setIsCurrentEditing('new')} className="btn btn-primary flex items-center gap-2">
                        <Plus size={18} /> Nuevo Plan
                    </button>
                )}
            </div>

            {(isEditing || isEditing === 'new') && (
                <div className="door-card" style={{ width: '100%', textAlign: 'left', animation: 'slideDown 0.3s ease-out' }}>
                    <h3 className="text-lg font-bold mb-6 text-[#495057]">
                        {isEditing === 'new' ? 'Crear Nuevo Plan' : `Editando Plan: ${formData.nombre}`}
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="option">
                            <label>Nombre del Plan</label>
                            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className="input-field" placeholder="Ej: Premium" />
                        </div>
                        <div className="option">
                            <label>Slug (ID único)</label>
                            <input type="text" name="slug" value={formData.slug} onChange={handleChange} required className="input-field" placeholder="ej: premium-anual" disabled={isEditing !== 'new'} />
                        </div>
                        <div className="option">
                            <label>Precio</label>
                            <input type="number" name="precio" value={formData.precio} onChange={handleChange} required className="input-field" />
                        </div>

                        <div className="divider md:col-span-3"></div>

                        <div className="option">
                            <label className="flex items-center gap-2"><Package size={16}/> Límite Productos</label>
                            <input type="number" name="productosLimite" value={formData.productosLimite} onChange={handleChange} className="input-field" />
                            <small className="text-gray-400">999999 = Ilimitado</small>
                        </div>
                        <div className="option">
                            <label className="flex items-center gap-2"><FileText size={16}/> Facturas AFIP/mes</label>
                            <input type="number" name="facturasMensualesLimite" value={formData.facturasMensualesLimite} onChange={handleChange} className="input-field" />
                        </div>
                        <div className="option">
                            <label className="flex items-center gap-2"><FileText size={16}/> Tickets/mes</label>
                            <input type="number" name="ticketsMensualesLimite" value={formData.ticketsMensualesLimite} onChange={handleChange} className="input-field" />
                        </div>
                        <div className="option">
                            <label className="flex items-center gap-2"><FileText size={16}/> Pedidos/mes</label>
                            <input type="number" name="notasPedidoMensualesLimite" value={formData.notasPedidoMensualesLimite} onChange={handleChange} className="input-field" />
                        </div>
                        <div className="option">
                            <label className="flex items-center gap-2"><Users size={16}/> Límite Usuarios</label>
                            <input type="number" name="usuariosLimite" value={formData.usuariosLimite} onChange={handleChange} className="input-field" />
                        </div>

                        <div className="option">
                            <label>Puntos de Venta</label>
                            <input type="number" name="puntosVentaLimite" value={formData.puntosVentaLimite} onChange={handleChange} className="input-field" />
                        </div>
                        <div className="option">
                            <label>Límite Cajas</label>
                            <input type="number" name="cajasLimite" value={formData.cajasLimite} onChange={handleChange} className="input-field" />
                        </div>
                        <div className="option">
                            <label>Periodo</label>
                            <select name="periodo" value={formData.periodo} onChange={handleChange} className="input-field">
                                <option value="mes">Mensual</option>
                                <option value="año">Anual</option>
                                <option value="unico">Pago Único</option>
                            </select>
                        </div>

                        <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded">
                            <label className="checkbox-label">
                                <input type="checkbox" name="exportXlsx" checked={formData.exportXlsx} onChange={handleChange} />
                                Exportar Excel
                            </label>
                            <label className="checkbox-label">
                                <input type="checkbox" name="soportePrioritario" checked={formData.soportePrioritario} onChange={handleChange} />
                                Soporte Prioritario
                            </label>
                            <label className="checkbox-label">
                                <input type="checkbox" name="activo" checked={formData.activo} onChange={handleChange} />
                                Plan Activo
                            </label>
                        </div>

                        <div className="md:col-span-3 flex gap-3 justify-end mt-4">
                            <button type="button" onClick={handleCancel} className="btn btn-reg" style={{ margin: 0 }}>Cancelar</button>
                            <button type="submit" className="btn btn-primary" style={{ margin: 0 }}>
                                {isEditing === 'new' ? 'Crear Plan' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-container">
                <table className="office-table">
                    <thead>
                        <tr>
                            <th>Nombre / Slug</th>
                            <th>Precio</th>
                            <th>Límites (Prod/Fact/User)</th>
                            <th>Features</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(plans) && plans.length > 0 ? (
                            plans.map(p => (
                                <tr key={p._id}>
                                    <td>
                                        <div className="font-bold text-[#28a4d5]">{p.nombre}</div>
                                        <div className="text-[10px] text-gray-400 uppercase">{p.slug}</div>
                                    </td>
                                    <td className="font-bold">${p.precio?.toLocaleString()} <small className="text-gray-400">/{p.periodo}</small></td>
                                    <td>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="badge" style={{ backgroundColor: '#f0f7ff', color: '#28a4d5', border: '1px solid #cce5ff' }} title="Productos">{p.productosLimite === 999999 ? '∞' : p.productosLimite} P</span>
                                            <span className="badge" style={{ backgroundColor: '#fdfcfe', color: '#6f42c1', border: '1px solid #e2d9f3' }} title="Facturas AFIP">{p.facturasMensualesLimite === 999999 ? '∞' : p.facturasMensualesLimite} F</span>
                                            <span className="badge" style={{ backgroundColor: '#fff5f5', color: '#e03131', border: '1px solid #ffa8a8' }} title="Tickets">{p.ticketsMensualesLimite === 999999 ? '∞' : p.ticketsMensualesLimite} T</span>
                                            <span className="badge" style={{ backgroundColor: '#fff9db', color: '#f08c00', border: '1px solid #ffe066' }} title="Notas de Pedido">{p.notasPedidoMensualesLimite === 999999 ? '∞' : p.notasPedidoMensualesLimite} NP</span>
                                            <span className="badge" style={{ backgroundColor: '#f0fff4', color: '#28a745', border: '1px solid #c3e6cb' }} title="Usuarios">{p.usuariosLimite} U</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex gap-2 opacity-70">
                                            {p.exportXlsx && <Package size={14} title="Excel" />}
                                            {p.soportePrioritario && <ShieldCheck size={14} title="Soporte" />}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${p.activo ? 'bg-success' : 'bg-danger'}`} style={{ backgroundColor: p.activo ? '#28a745' : '#dc3545', color: 'white', borderRadius: '2px' }}>
                                            {p.activo ? 'ACTIVO' : 'INACTIVO'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(p)} className="btn btn-outline p-1" style={{ border: 'none', background: 'transparent', minWidth: 'auto' }}>
                                                <Edit2 size={16} className="text-[#28a4d5]" />
                                            </button>
                                            <button onClick={() => handleDelete(p._id)} className="btn btn-outline p-1" style={{ border: 'none', background: 'transparent', minWidth: 'auto' }}>
                                                <Trash2 size={16} className="text-[#dc3545]" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-500">
                                    No se encontraron planes disponibles.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PlanManagementView;
