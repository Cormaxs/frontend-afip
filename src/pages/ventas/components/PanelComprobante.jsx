import React from 'react';

const TIPO_COMPROBANTE = ["Ticket", "Factura A", "Factura B", "Factura C", "Recibo"];

const PanelComprobante = ({ invoiceDetails, handleInvoiceDetailsChange }) => {
    return (
        <div>
            <h4 className="text-xl font-semibold mb-4 text-[var(--principal)]">Detalles del Comprobante</h4>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="tipoComprobante" className="block text-gray-700 text-sm font-bold mb-2">Tipo:</label>
                    <select id="tipoComprobante" name="tipoComprobante" value={invoiceDetails.tipoComprobante} onChange={handleInvoiceDetailsChange} className="shadow border rounded w-full py-2 px-3">
                        {TIPO_COMPROBANTE.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="invoiceDateTime" className="block text-gray-700 text-sm font-bold mb-2">Fecha y Hora:</label>
                    <input type="datetime-local" id="invoiceDateTime" name="invoiceDateTime" value={invoiceDetails.invoiceDateTime} onChange={handleInvoiceDetailsChange} className="shadow border rounded w-full py-2 px-3" />
                </div>
                <div className="col-span-2">
                    <label htmlFor="observaciones" className="block text-gray-700 text-sm font-bold mb-2">Observaciones:</label>
                    <textarea id="observaciones" name="observaciones" value={invoiceDetails.observaciones} onChange={handleInvoiceDetailsChange} rows="2" className="shadow border rounded w-full py-2 px-3 resize-y" />
                </div>
            </div>
        </div>
    );
};

export default PanelComprobante;