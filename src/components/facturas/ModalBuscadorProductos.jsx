import React, { useState, useEffect } from 'react';
import { ProductosService } from '../../services/inventario/productos.js';
import { useAuth } from '../../contexts/auth/authContext.jsx';
import GenericTable from '../../components/tables/GenericTable.jsx';
import ModalGenerico from '../../components/modal/ModalGenerico.jsx';

const ModalBuscadorProductos = ({ isOpen, onClose, onSelect, initialQuery = '' }) => {
    const { user } = useAuth();
    const [resultados, setResultados] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState(initialQuery);

    const handleSearch = async (page = 1, query = searchTerm) => {
        if (!user?.empresa) return;
        setLoading(true);
        try {
            const response = await ProductosService.buscadorgeneralProduct({
                empresa: user.empresa, q: query, page
            });
            setResultados(response.data.productos || []);
            setPagination(response.data.pagination);
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (isOpen) {
            setSearchTerm(initialQuery);
            handleSearch(1, initialQuery);
        }
    }, [isOpen, initialQuery]);

    return (
        <ModalGenerico isOpen={isOpen} onClose={onClose} title="Seleccionar Producto">
            <div className="p-3">
                <form onSubmit={(e) => { e.preventDefault(); handleSearch(1); }} className="d-flex gap-2 mb-3">
                    <input 
                        type="text" className="form-control" 
                        placeholder="Nombre, código o categoría..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" disabled={loading}>Buscar</button>
                </form>

                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <GenericTable 
                        data={resultados} 
                        type="productos" 
                        pagination={pagination} 
                        onPageChange={handleSearch} 
                        onRowClick={(prod) => {
                            onSelect(prod); // Pasamos el producto al formulario
                            onClose();      // Cerramos modal
                        }} 
                    />
                </div>
            </div>
        </ModalGenerico>
    );
};

export default ModalBuscadorProductos;