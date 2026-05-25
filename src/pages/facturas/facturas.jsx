import React from 'react';
import FacturasForm from '../../components/facturas/facturasForm.jsx';

const CreateFacturas = () => {
    const handleInvoiceSubmit = async (data) => {
        try {
            console.log("Enviando a Facstock Backend:", data);
            // const response = await fetch('/api/facturacion/crear', {
            //     method: 'POST',
            //     body: JSON.stringify(data)
            // });
            alert("Solicitando CAE a ARCA...");
        } catch (error) {
            console.error("Error al facturar", error);
        }
    };

    return (
        <div className="page-container">
            <FacturasForm />
        </div>
    );
};

export default CreateFacturas;