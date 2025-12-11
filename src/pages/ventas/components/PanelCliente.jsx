import React from 'react';

const CONDICIONES_IVA = ["Consumidor Final", "Responsable Inscripto", "Monotributista", "Exento"];

const PanelCliente = ({ invoiceDetails, handleInvoiceDetailsChange }) => {
    return (
        <div>
            <h4 className="text-xl font-semibold mb-4 text-[var(--principal)]">Datos del Cliente</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="nombreCliente" className="block text-gray-700 text-sm font-bold mb-2">Nombre:</label>
                    <input type="text" id="nombreCliente" name="nombreCliente" value={invoiceDetails.nombreCliente} onChange={handleInvoiceDetailsChange} className="shadow border rounded w-full py-2 px-3" />
                </div>
                <div>
                    <label htmlFor="dniCuitCliente" className="block text-gray-700 text-sm font-bold mb-2">DNI/CUIT:</label>
                    <input type="text" id="dniCuitCliente" name="dniCuitCliente" value={invoiceDetails.dniCuitCliente} onChange={handleInvoiceDetailsChange} className="shadow border rounded w-full py-2 px-3" />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="condicionIVACliente" className="block text-gray-700 text-sm font-bold mb-2">Condición IVA:</label>
                    <select id="condicionIVACliente" name="condicionIVACliente" value={invoiceDetails.condicionIVACliente} onChange={handleInvoiceDetailsChange} className="shadow border rounded w-full py-2 px-3">
                        {CONDICIONES_IVA.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div> 
        </div>
    );
};

export default PanelCliente;