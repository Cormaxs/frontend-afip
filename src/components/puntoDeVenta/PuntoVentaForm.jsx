import React, { useState, useEffect } from 'react';
import { puntosVentaService } from '../../services/puntosVenta/puntosVenta.js';
import Swal from 'sweetalert2';

const PuntoVentaForm = ({ idEmpresa, initialData, onSuccess, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        empresa: idEmpresa,
        numero: '',
        nombre: '',
        activo: true,
        ultimoCbteAutorizado: 0,
        fechaUltimoCbte: new Date().toISOString(),
        direccion: '',
        ciudad: '',
        provincia: '',
        codigoPostal: '',
        telefono: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                empresa: idEmpresa,
                numero: initialData.numero || '',
                nombre: initialData.nombre || '',
                activo: initialData.activo !== undefined ? initialData.activo : true,
                ultimoCbteAutorizado: initialData.ultimoCbteAutorizado || 0,
                fechaUltimoCbte: initialData.fechaUltimoCbte || new Date().toISOString(),
                direccion: initialData.direccion || '',
                ciudad: initialData.ciudad || '',
                provincia: initialData.provincia || '',
                codigoPostal: initialData.codigoPostal || '',
                telefono: initialData.telefono || ''
            });
        } else {
            setFormData({
                empresa: idEmpresa,
                numero: '',
                nombre: '',
                activo: true,
                ultimoCbteAutorizado: 0,
                fechaUltimoCbte: new Date().toISOString(),
                direccion: '',
                ciudad: '',
                provincia: '',
                codigoPostal: '',
                telefono: ''
            });
        }
    }, [idEmpresa, initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dataFinal = {
                ...formData,
                numero: parseInt(formData.numero, 10) || 0,
                ultimoCbteAutorizado: parseInt(formData.ultimoCbteAutorizado, 10) || 0
            };

            let res;
            if (initialData?._id) {
                res = await puntosVentaService.actualizarPuntoVenta(initialData._id, dataFinal);
            } else {
                res = await puntosVentaService.crearPuntoVenta(dataFinal);
            }

            const successMessage = initialData ? 'Punto de venta actualizado correctamente' : 'Punto de venta creado correctamente';
            Swal.fire('¡Éxito!', successMessage, 'success');
            if (onSuccess) onSuccess(res.data?.data || res.data);
        } catch (error) {
            console.error('Error creando/actualizando punto de venta:', error);
            Swal.fire('Error', error.response?.data?.message || 'No se pudo guardar el punto de venta', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-container">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                
                {/* Datos Fiscales */}
                <div style={{ gridColumn: 'span 1' }}>
                    <label className="label-f">Número de Punto de Venta</label>
                    <input 
                        type="number" 
                        name="numero" 
                        className="input-field" 
                        placeholder="Ej: 2" 
                        required 
                        value={formData.numero}
                        onChange={handleChange}
                    />
                </div>

                <div style={{ gridColumn: 'span 1' }}>
                    <label className="label-f">Nombre Fantasía / Sucursal</label>
                    <input 
                        type="text" 
                        name="nombre" 
                        className="input-field" 
                        placeholder="Ej: Sucursal Norte" 
                        required 
                        value={formData.nombre}
                        onChange={handleChange}
                    />
                </div>

                {/* Ubicación */}
                <div style={{ gridColumn: 'span 2' }}>
                    <label className="label-f">Dirección Comercial</label>
                    <input 
                        type="text" 
                        name="direccion" 
                        className="input-field" 
                        value={formData.direccion}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="label-f">Ciudad</label>
                    <input 
                        type="text" 
                        name="ciudad" 
                        className="input-field" 
                        value={formData.ciudad}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="label-f">Provincia</label>
                    <input 
                        type="text" 
                        name="provincia" 
                        className="input-field" 
                        value={formData.provincia}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="label-f">Código Postal</label>
                    <input 
                        type="text" 
                        name="codigoPostal" 
                        className="input-field" 
                        value={formData.codigoPostal}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="label-f">Teléfono</label>
                    <input 
                        type="text" 
                        name="telefono" 
                        className="input-field" 
                        value={formData.telefono}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ flex: 1 }}
                    disabled={loading}
                >
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Guardar Punto de Venta'}
                </button>
                {onCancel && (
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>
                        Cancelar
                    </button>
                )}
            </div>
        </form>
    );
};

export default PuntoVentaForm;