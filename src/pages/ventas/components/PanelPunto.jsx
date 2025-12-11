import React from 'react';

const PanelPunto = ({ puntoSeleccionado, setPuntoSeleccionado, puntosDeVenta, getCajaActiva }) => {
    return (
        <div>
            <h4 className="text-xl font-semibold mb-4 text-[var(--principal)]">Configuración de Sucursal y Caja</h4>
            <div className="mb-4">
                <label htmlFor="puntoVentaSelect" className="block text-gray-700 text-sm font-bold mb-2">Punto de Venta:</label>
                <select 
                    id="puntoVentaSelect" 
                    value={puntoSeleccionado} 
                    onChange={(e) => setPuntoSeleccionado(e.target.value)} 
                    disabled={puntosDeVenta.length === 0} 
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:ring-[var(--principal)] focus:border-[var(--principal)]"
                >
                    {puntosDeVenta.length > 0 ? (
                        <>
                            <option value="">-- Selecciona un punto --</option>
                            {puntosDeVenta.map((p) => <option key={p._id} value={p._id}>{p.nombre || `Punto ID: ${p._id}`}</option>)}
                        </>
                    ) : (
                        <option value="">No hay puntos de venta disponibles</option>
                    )}
                </select>
            </div>
            <p className="text-sm font-medium text-gray-600">
                Caja Activa: <strong className="text-[var(--principal)]">{getCajaActiva()}</strong>
            </p>
        </div>
    );
};

export default PanelPunto;