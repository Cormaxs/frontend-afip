import React from 'react';
import { useAuth } from '../../contexts/auth/authContext.jsx';
import FacturaCreateForm from './FacturaCreateForm.jsx';
import './facturasForm.css';

const FacturasForm = () => {
    const { user, empresa } = useAuth();

    if (!user?.empresa) {
        return (
            <div className="factura-container text-center p-5">
                <p className="text-muted">No se encontró información de la empresa.</p>
            </div>
        );
    }

    return (
        <div className="factura-container">
            <FacturaCreateForm user={user} empresa={empresa} />
        </div>
    );
};

export default FacturasForm;