import React from 'react';
import {
    AFIP_DOC_TIPOS,
    AFIP_ALICUOTAS_IVA,
    CONDICIONES_IVA_RECEPTOR,
    AFIP_CONCEPTOS,
    AFIP_MONEDAS,
    AFIP_FORMAS_PAGO,
    AFIP_TIPOS_COMPROBANTE
} from '../../constants/afipConstants.js';
import ModalBuscadorProductos from './ModalBuscadorProductos.jsx';
import { useFacturaLogic } from './useFacturaLogic';
import { FacturacionRequerimentos } from '../../utils/facturacionHelper.js';
import './facturasForm.css';

const FacturaCreateForm = ({ user, empresa }) => {
    const {
        loadingConfig,
        puntosVenta,
        pvSeleccionado,
        setPvSeleccionado,
        tipoCbte,
        setTipoCbte,
        proximoNumero,
        isModalOpen,
        setIsModalOpen,
        register,
        handleSubmit,
        fields,
        append,
        remove,
        watchedItems,
        condicionIVA,
        docTipo,
        allowedCondiciones,
        allowedDocTipos,
        esTipoA,
        validation,
        totales,
        onSelectProducto,
        isSubmitting,
        fieldsLength,
        serverErrors,
        serverWarnings
    } = useFacturaLogic({ user, empresa });

    if (loadingConfig) {
        return (
            <div className="factura-container text-center p-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-3 text-muted">Sincronizando con ARCA...</p>
            </div>
        );
    }

    return (
        <div className="factura-container">
            <form onSubmit={handleSubmit}>
                {/* CABECERA: Punto de Venta y Tipo Comprobante */}
                <div className="section-card mb-4">
                    <h6 className="section-title">Configuración del Comprobante</h6>
                    <div className="form-row">
                        <div className="form-field" style={{ flex: '2' }}>
                            <label>Punto de Venta</label>
                            <select
                                className="form-select-cian"
                                value={pvSeleccionado?._id || ''}
                                onChange={(e) => setPvSeleccionado(puntosVenta.find(p => p._id === e.target.value))}
                            >
                                {puntosVenta.map(pv => (
                                    <option key={pv._id} value={pv._id}>
                                        {String(pv.numero).padStart(5, '0')} - {pv.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field" style={{ flex: '1.5' }}>
                            <label>Tipo de Comprobante</label>
                            <select
                                className="form-select-cian"
                                value={tipoCbte}
                                onChange={(e) => setTipoCbte(Number(e.target.value))}
                            >
                                {AFIP_TIPOS_COMPROBANTE.map(t => (
                                    <option key={t.id} value={t.id}>{t.desc}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field" style={{ flex: '1' }}>
                            <label>Numeración a Emitir</label>
                            <div className="p-2 rounded bg-light border-start border-primary border-4" style={{ marginTop: '4px' }}>
                                <span className="h5 mb-0 text-dark fw-bold">
                                    {proximoNumero
                                        ? FacturacionRequerimentos.formatearComprobante(pvSeleccionado?.numero, proximoNumero)
                                        : "Cargando..."}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {!validation.isValid && (
                    <div className="alert alert-danger mb-3 d-flex align-items-center">
                        <i className="fas fa-exclamation-circle me-2"></i>
                        <span>{validation.msg}</span>
                    </div>
                )}

                {serverWarnings.length > 0 && (
                    <div className="alert alert-warning mb-3">
                        <strong>Advertencias:</strong>
                        <ul className="mb-0 mt-2">
                            {serverWarnings.map((warning, index) => (
                                <li key={index}>{warning}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {serverErrors.length > 0 && (
                    <div className="alert alert-danger mb-3">
                        <strong>Errores al facturar:</strong>
                        <ul className="mb-0 mt-2">
                            {serverErrors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Detalles del Comprobante */}
                <div className="section-card">
                    <h6 className="section-title">Detalles del Comprobante</h6>
                    <div className="form-row">
                        <div className="form-field" style={{ minWidth: '150px' }}>
                            <label>Concepto</label>
                            <select {...register("concepto")} className="form-select-cian">
                                {AFIP_CONCEPTOS.map(c => (
                                    <option key={c.id} value={c.id}>{c.desc}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field" style={{ width: '120px' }}>
                            <label>Moneda</label>
                            <select {...register("moneda")} className="form-select-cian">
                                {AFIP_MONEDAS.map(m => (
                                    <option key={m.id} value={m.id}>{m.desc}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field" style={{ minWidth: '160px' }}>
                            <label>Forma de Pago</label>
                            <select {...register("formaPago")} className="form-select-cian">
                                {AFIP_FORMAS_PAGO.map(fp => (
                                    <option key={fp.id} value={fp.id}>{fp.desc}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Datos del Receptor */}
                <div className={`section-card ${!validation.isValid ? 'border-danger' : ''}`}>
                    <h6 className="section-title">Datos del Receptor</h6>
                    <div className="form-row">
                        <div className="form-field" style={{ width: '130px' }}>
                            <label>Tipo Doc.</label>
                            <select {...register("docTipo")} className="form-select-cian">
                                {AFIP_DOC_TIPOS.filter(d => allowedDocTipos.includes(d.id)).map(d => (
                                    <option key={d.id} value={d.id}>{d.desc}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field" style={{ flex: '1 1 200px' }}>
                            <label>Número Documento</label>
                            <input {...register("docNro", { required: true })} className="form-control-cian" placeholder="CUIT / DNI" />
                        </div>
                        <div className="form-field" style={{ flex: '1 1 200px' }}>
                            <label>Condición IVA</label>
                            <select {...register("condicionIVAReceptor")} className="form-select-cian">
                                {CONDICIONES_IVA_RECEPTOR.filter(c => allowedCondiciones.includes(c.id)).map(c => (
                                    <option key={c.id} value={c.id}>{c.desc}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Detalle de Items */}
                <div className="section-card">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="section-title mb-0">Detalle de Comprobante</h6>
                        <button type="button" className="btn-cian-outline" onClick={() => setIsModalOpen(true)}>
                            🔍 Buscar Producto
                        </button>
                    </div>

                    <div className="table-responsive">
                        <table className="table-items">
                            <thead>
                                <tr>
                                    <th>Descripción</th>
                                    <th width="80" className="text-center">Cant.</th>
                                    <th width="180">Precio Unit. {esTipoA ? '(Neto)' : '(Final)'}</th>
                                    <th width="130">Alícuota IVA</th>
                                    <th width="130" className="text-end">Subtotal (c/IVA)</th>
                                    <th width="40"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {fields.map((field, index) => {
                                    const item = watchedItems[index];
                                    const alicuotaId = item?.alicuotaIVA;
                                    const porcentajeIva = AFIP_ALICUOTAS_IVA.find(a => a.id === Number(alicuotaId))?.value || 0;
                                    const subtotalFila = esTipoA
                                        ? (item?.cantidad || 0) * (item?.precioUnitario || 0) * (1 + porcentajeIva)
                                        : (item?.cantidad || 0) * (item?.precioUnitario || 0);
                                    return (
                                        <tr key={field.id}>
                                            <td>
                                                <input {...register(`items.${index}.descripcion`, { required: true })} className="input-table" />
                                            </td>
                                            <td>
                                                <input type="number" {...register(`items.${index}.cantidad`)} className="input-table text-center" />
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <span className="text-muted me-1">$</span>
                                                    <input type="number" step="0.01" {...register(`items.${index}.precioUnitario`)} className="input-table text-end" />
                                                </div>
                                            </td>
                                            <td>
                                                <select {...register(`items.${index}.alicuotaIVA`)} className="form-select-cian border-0 bg-transparent">
                                                    {AFIP_ALICUOTAS_IVA.map(a => <option key={a.id} value={a.id}>{a.desc}</option>)}
                                                </select>
                                            </td>
                                            <td className="text-end fw-bold">
                                                ${subtotalFila.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td>
                                                <button type="button" onClick={() => remove(index)} className="btn text-danger p-0">
                                                    <i className="fas fa-times">X</i>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {fieldsLength === 0 && (
                        <div className="text-center py-4 text-muted bg-light mt-2 rounded">
                            No hay ítems cargados.
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => append({ descripcion: '', cantidad: 1, precioUnitario: 0, alicuotaIVA: 5 })}
                        className="btn btn-link btn-sm text-decoration-none mt-2"
                    >
                        + Agregar fila manual
                    </button>
                </div>

                {/* Totales y botón de envío */}
                <div className="row justify-content-end mt-4">
                    <div className="col-md-5 col-lg-4">
                        <div className="totales-box">
                            <div className="total-row">
                                <span>Subtotal Neto:</span>
                                <span>${totales.neto.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="total-row">
                                <span>IVA Total:</span>
                                <span>${totales.ivaTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="total-row total-main">
                                <span>TOTAL:</span>
                                <span>${totales.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <button
                                type="submit"
                                className="btn-cian-primary w-100 mt-4 py-2"
                                disabled={isSubmitting || !proximoNumero || fieldsLength === 0 || !validation.isValid}
                            >
                                {isSubmitting ? 'SOLICITANDO CAE...' : 'EMITIR COMPROBANTE'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            <ModalBuscadorProductos
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={onSelectProducto}
            />
        </div>
    );
};

export default FacturaCreateForm;