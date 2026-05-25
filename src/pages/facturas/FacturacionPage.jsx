import React from 'react';
import BuscadorFacturas from '../../components/facturas/BuscadorFacturas.jsx'; // Ajusta la ruta a tu componente
//import './Facturacion.css'; // Si tenés estilos específicos de layout

const FacturacionPage = () => {
    return (
        <main className="main-content-wrapper p-4">
          
            {/* Renderizado del Buscador que armamos */}
            <section className="buscador-section">
                <BuscadorFacturas />
            </section>

            {/* Footer de ayuda opcional */}
          
        </main>
    );
};

export default FacturacionPage;