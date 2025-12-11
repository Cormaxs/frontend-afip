import React from 'react';

const METODOS_PAGO = ["Efectivo", "Tarjeta Débito", "Tarjeta Crédito", "Mercado Pago", "Transferencia"];

const PanelPago = ({ invoiceDetails, handleInvoiceDetailsChange }) => {
    return (
        <div>
            <h4 className="text-xl font-semibold mb-4 text-[var(--principal)]">Configuración de Pago</h4>
            <div>
                <label htmlFor="metodoPago" className="block text-gray-700 text-sm font-bold mb-2">Método Pago:</label>
                <select id="metodoPago" name="metodoPago" value={invoiceDetails.metodoPago} onChange={handleInvoiceDetailsChange} className="shadow border rounded w-full py-2 px-3 mb-4">
                    {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
            {invoiceDetails.metodoPago === "Efectivo" && (
                <div>
                    <label htmlFor="montoRecibido" className="block text-gray-700 text-sm font-bold mb-2">Monto Recibido:</label>
                    <input type="number" id="montoRecibido" name="montoRecibido" value={invoiceDetails.montoRecibido} onChange={handleInvoiceDetailsChange} min="0" step="0.01" className="shadow border rounded w-full py-2 px-3" />
                </div>
            )}
        </div>
    );
};

export default PanelPago;