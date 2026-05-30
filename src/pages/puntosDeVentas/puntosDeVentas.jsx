import React, { useState, useEffect } from 'react';
import ModalGenerico from '../../components/modal/ModalGenerico.jsx';
import PuntoVentaForm from '../../components/puntoDeVenta/PuntoVentaForm.jsx';
import { useAuth } from '../../contexts/auth/authContext.jsx';
import Swal from 'sweetalert2';
import { puntosVentaService } from '../../services/puntosVenta/puntosVenta.js';
import { Edit3, Trash2 } from 'lucide-react';

const PuntosDeVentas = () => {
    const { user } = useAuth();
    const companyId = user?.empresa || user?.empresaId || user?.companyId;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPuntoVenta, setSelectedPuntoVenta] = useState(null);
    
    // Estados para la tabla
    const [puntos, setPuntos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState(null);

    const cargarPuntos = async (page = 1) => {
        const idEmpresa = companyId;
        if (!idEmpresa) {
            Swal.fire('Error', 'No se pudo cargar los puntos de venta: falta ID de empresa.', 'error');
            return;
        }

            setLoading(true);
        try {
            const response = await puntosVentaService.obtenerPuntosVenta(idEmpresa);
            const data = response.data || {};

            // Soportar varias respuestas posibles del backend:
            // - { puntosDeVenta: [...] }
            // - { data: { puntosDeVenta: [...] } }
            // - [...] directamente
            const puntosDeVenta = Array.isArray(data)
                ? data
                : data.puntosDeVenta ?? data.data?.puntosDeVenta ?? data.data ?? [];

            setPuntos(Array.isArray(puntosDeVenta) ? puntosDeVenta : []);

            const paginationData = data.pagination || data.data?.pagination || null;
            if (paginationData) {
                setPagination({
                    page: paginationData.currentPage || paginationData.page || 1,
                    pages: paginationData.totalPages || Math.ceil((paginationData.totalPuntosDeVenta || paginationData.total || 0) / (paginationData.limit || 10)),
                    total: paginationData.totalPuntosDeVenta || paginationData.total || 0
                });
            } else {
                setPagination(null);
            }
        } catch (error) {
            console.error('Error al cargar puntos de venta:', error);
            const message = error.response?.data?.message || error.message || 'No se pudo sincronizar la lista de puntos de venta';
            Swal.fire('Error', message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (companyId) {
            cargarPuntos();
        }
    }, [companyId]);

    // 2. Manejo de éxito en creación o actualización
    const handleSuccess = (nuevoPunto) => {
        setIsModalOpen(false);
        setSelectedPuntoVenta(null);
        Swal.fire({
            title: '¡Listo!',
            text: 'Punto de venta guardado correctamente',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
        cargarPuntos(); // Recargamos usando la lógica de la clase
    };

    const handleEditarPunto = (punto) => {
        setSelectedPuntoVenta(punto);
        setIsModalOpen(true);
    };

    const handleEliminarPunto = async (punto) => {
        if (!punto?._id) {
            Swal.fire('Error', 'No se pudo identificar el punto de venta para eliminar.', 'error');
            return;
        }

        const result = await Swal.fire({
            title: '¿Eliminar punto de venta?',
            text: `Se eliminará el punto de venta ${punto.nombre} (${String(punto.numero).padStart(4, '0')}).`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await puntosVentaService.eliminarPuntoVenta(punto._id);
                Swal.fire('Eliminado', 'El punto de venta fue eliminado correctamente.', 'success');
                cargarPuntos();
            } catch (error) {
                console.error('Error eliminando punto de venta:', error);
                Swal.fire('Error', error.response?.data?.message || 'No se pudo eliminar el punto de venta', 'error');
            }
        }
    };

    return (
        <div className="container-fluid" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ margin: 0, fontWeight: '700' }}>Gestión de Puntos de Ventas</h1>
                    <small style={{ color: '#666' }}>Bocas de expendio registradas para facturación electrónica</small>
                </div>
                
                <button 
                    className="btn btn-primary" 
                    onClick={() => {
                        setSelectedPuntoVenta(null);
                        setIsModalOpen(true);
                    }}
                    style={{ borderRadius: '8px' }}
                >
                    <i className="fas fa-plus"></i> Nuevo Punto de Venta
                </button>
            </div>

            <div style={{ width: '100%', marginTop: '20px' }}>
                {puntos.length > 0 ? (
                    <div className="table-container" style={{ border: '1px solid #eee' }}>
                        <table className="office-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Nro</th>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Nombre</th>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Localidad</th>
                                    <th style={{ textAlign: 'center', padding: '12px' }}>Estado</th>
                                    <th style={{ textAlign: 'center', padding: '12px' }}>Últ. Comprobante</th>
                                    <th style={{ textAlign: 'center', padding: '12px', width: '180px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {puntos.map((pv) => (
                                    <tr key={pv._id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '12px', fontWeight: '700' }}>{String(pv.numero).padStart(4, '0')}</td>
                                        <td style={{ padding: '12px' }}>{pv.nombre || '---'}</td>
                                        <td style={{ padding: '12px' }}>{pv.ciudad ? `${pv.ciudad}, ${pv.provincia}` : '---'}</td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <span style={{
                                                backgroundColor: pv.activo ? '#2ecc71' : '#e74c3c',
                                                color: '#fff',
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '0.85rem'
                                            }}>
                                                {pv.activo ? 'ACTIVO' : 'INACTIVO'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            {String(pv.ultimoCbteAutorizado || 0).padStart(8, '0')}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <button
                                                type="button"
                                                className="btn btn-sm"
                                                style={{
                                                    backgroundColor: '#28a4d5',
                                                    color: '#fff',
                                                    border: 'none',
                                                    padding: '6px 12px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    marginRight: '5px',
                                                    fontSize: '0.85rem'
                                                }}
                                                onClick={() => handleEditarPunto(pv)}
                                            >
                                                <Edit3 size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Editar
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm"
                                                style={{
                                                    backgroundColor: '#d9534f',
                                                    color: '#fff',
                                                    border: 'none',
                                                    padding: '6px 12px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem'
                                                }}
                                                onClick={() => handleEliminarPunto(pv)}
                                            >
                                                <Trash2 size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                        <p style={{ color: '#999', marginBottom: '10px' }}>No hay puntos de venta registrados aún.</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                setSelectedPuntoVenta(null);
                                setIsModalOpen(true);
                            }}
                        >
                            + Crear primer Punto de Venta
                        </button>
                    </div>
                )}
            </div>

            <ModalGenerico 
                isOpen={isModalOpen} 
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedPuntoVenta(null);
                }} 
                title={selectedPuntoVenta ? 'Editar Punto de Venta' : 'Configurar Nuevo Punto de Venta'}
                width="600px"
            >
                <PuntoVentaForm 
                    idEmpresa={companyId}
                    initialData={selectedPuntoVenta}
                    onSuccess={handleSuccess}
                    onCancel={() => {
                        setIsModalOpen(false);
                        setSelectedPuntoVenta(null);
                    }}
                />
            </ModalGenerico>
        </div>
    );
};

export default PuntosDeVentas;