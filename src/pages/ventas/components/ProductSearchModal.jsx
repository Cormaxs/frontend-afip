// src/components/modals/ProductSearchModal.jsx (Ajuste crítico)

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { apiContext } from '../../../context/api_context';
import Swal from 'sweetalert2';

/**
 * Modal para buscar productos por diferentes criterios y seleccionarlos.
 */
const ProductSearchModal = ({ onProductSelect, onClose, puntoVentaId }) => {
    const { getProductsEmpresa, getCategoryEmpresa, getMarcaEmpresa, userData } = useContext(apiContext);
    const [productsData, setProductsData] = useState({ products: [], pagination: {} });
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedMarca, setSelectedMarca] = useState("");
    const [activeFilters, setActiveFilters] = useState({ product: "", category: "", marca: "" });
    const [categories, setCategories] = useState([]);
    const [marcas, setMarcas] = useState([]);

    useEffect(() => {
        const loadOptions = async () => {
            if (userData?.empresa && puntoVentaId) {
                try {
                    const [cats, marcs] = await Promise.all([
                        getCategoryEmpresa(userData.empresa, puntoVentaId),
                        getMarcaEmpresa(userData.empresa, puntoVentaId)
                    ]);
                    setCategories(cats || []);
                    setMarcas(marcs || []);
                } catch (e) { console.error("Error cargando opciones de filtro del modal:", e); }
            }
        };
        loadOptions();
    }, [userData?.empresa, puntoVentaId, getCategoryEmpresa, getMarcaEmpresa]);

    useEffect(() => {
        const fetchProducts = async () => {
            if (!userData?.empresa || !puntoVentaId) return;
            setIsLoading(true);
            try {
                const response = await getProductsEmpresa(
                    userData.empresa,
                    {
                        page: currentPage,
                        limit: 10,
                        category: activeFilters.category,
                        product: activeFilters.product,
                        marca: activeFilters.marca,
                        puntoVenta: puntoVentaId
                    }
                );
                setProductsData(response || { products: [], pagination: {} });
            } catch (error) {
                console.error("Error buscando productos en el modal:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, [userData?.empresa, currentPage, activeFilters, getProductsEmpresa, puntoVentaId]);

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        setActiveFilters({ product: searchTerm, category: selectedCategory, marca: selectedMarca });
    };

    const handleSelectProduct = (product) => {
        onProductSelect(product);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
            <div className="relative w-full max-w-3xl max-h-[90vh] p-6 bg-white rounded-lg shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">Buscar Producto</h3>
                <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 items-end">
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Nombre producto..." className="sm:col-span-3 border rounded-md p-2 shadow-sm" />
                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="border rounded-md p-2 bg-white shadow-sm"><option value="">Todas las Categorías</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    <select value={selectedMarca} onChange={e => setSelectedMarca(e.target.value)} className="border rounded-md p-2 bg-white shadow-sm"><option value="">Todas las Marcas</option>{marcas.map(m => <option key={m} value={m}>{m}</option>)}</select>
                    <button type="submit" className="bg-[var(--principal)] text-white rounded-md p-2 font-semibold hover:bg-[var(--principal)] shadow-sm">Buscar</button>
                </form>
                <div className="overflow-y-auto flex-grow space-y-2 border-t pt-4">
                    {isLoading ? <p className="text-center text-gray-500">Cargando...</p> :
                        productsData.products.length === 0 ? <p className="text-center text-gray-500">No se encontraron productos.</p> :
                        productsData.products.map(p => (
                            <div key={p._id} onClick={() => handleSelectProduct(p)} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-100 cursor-pointer">
                                <div>
                                    <p className="font-bold text-gray-900">{p.producto}</p>
                                    <p className="text-sm text-gray-500">{p.marca}</p>
                                </div>
                                <p className="font-bold text-lg text-[var(--principal)]">${p.precioLista.toFixed(2)}</p>
                            </div>
                        ))}
                </div>
                <div className="flex justify-between items-center mt-4 border-t pt-4">
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={!productsData.pagination.hasPrevPage || isLoading} className="py-2 px-4 border rounded-md disabled:opacity-50 font-semibold">Anterior</button>
                    <span>Página {productsData.pagination.currentPage || '-'} de {productsData.pagination.totalPages || '-'}</span>
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={!productsData.pagination.hasNextPage || isLoading} className="py-2 px-4 border rounded-md disabled:opacity-50 font-semibold">Siguiente</button>
                </div>
            </div>
        </div>
    );
};


export default ProductSearchModal;