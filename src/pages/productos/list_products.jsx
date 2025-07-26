import React, { useState, useEffect, useContext, useCallback } from "react";
import { apiContext } from "../../context/api_context";
import Swal from 'sweetalert2';

// --- COMPONENTES DE UI ---
const SpinnerIcon = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 text-gray-700">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg font-semibold">Cargando productos...</p>
    </div>
);

// --- COMPONENTE PRINCIPAL ---
export default function GetProductsCompany() {
    // --- CONTEXTO Y ESTADOS ---
    const { 
        getProductsEmpresa: getProds, 
        userData, 
        companyData, 
        getCategoryEmpresa, 
        getMarcaEmpresa, 
        getPointsByCompany,
        update_product 
    } = useContext(apiContext);

    const [data, setData] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [companyName, setCompanyName] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedMarca, setSelectedMarca] = useState("");
    const [selectedPuntoVenta, setSelectedPuntoVenta] = useState("");
    const [activeFilters, setActiveFilters] = useState({ product: "", category: "", marca: "", puntoVenta: "" });
    const [categories, setCategories] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [puntosDeVenta, setPuntosDeVenta] = useState([]);
    const [editableProduct, setEditableProduct] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // --- EFECTOS PARA CARGAR DATOS ---
    useEffect(() => {
        const loadPointsOfSale = async () => {
            if (userData?.empresa) {
                try {
                    const fetchedPuntosVenta = await getPointsByCompany(userData.empresa, 1, 500);
                    setPuntosDeVenta(fetchedPuntosVenta?.puntosDeVenta || []);
                } catch (e) {
                    console.error("Error al cargar puntos de venta:", e);
                    setError("No se pudieron cargar los puntos de venta.");
                }
            }
        };
        loadPointsOfSale();
    }, [userData?.empresa, getPointsByCompany]);

    useEffect(() => {
        const loadDynamicFilterOptions = async () => {
            if (userData?.empresa) {
                try {
                    const [fetchedCategories, fetchedMarcas] = await Promise.all([
                        getCategoryEmpresa(userData.empresa, selectedPuntoVenta),
                        getMarcaEmpresa(userData.empresa, selectedPuntoVenta),
                    ]);
                    setCategories(fetchedCategories || []);
                    setMarcas(fetchedMarcas || []);
                } catch (e) {
                    console.error("Error al cargar opciones de filtro dinámicas:", e);
                    setError("No se pudieron cargar las opciones de filtro.");
                }
            }
        };
        loadDynamicFilterOptions();
    }, [userData?.empresa, selectedPuntoVenta, getCategoryEmpresa, getMarcaEmpresa]);

    useEffect(() => {
        if (!isLoading) {
            setCurrentPage(1);
            setActiveFilters(prevFilters => ({
                ...prevFilters,
                category: selectedCategory,
                marca: selectedMarca,
                puntoVenta: selectedPuntoVenta,
            }));
        }
    }, [selectedCategory, selectedMarca, selectedPuntoVenta]);
    
    useEffect(() => {
        if (selectedProduct) {
            setEditableProduct({ ...selectedProduct });
        } else {
            setEditableProduct(null);
        }
    }, [selectedProduct]);

    useEffect(() => {
        if (!editableProduct) return;

        const costo = parseFloat(editableProduct.precioCosto) || 0;
        const markup = parseFloat(editableProduct.markupPorcentaje) || 0;
        const iva = parseFloat(editableProduct.alic_IVA) || 0;

        const precioConMarkup = costo * (1 + markup / 100);
        const precioFinal = precioConMarkup * (1 + iva / 100);

        if (precioFinal.toFixed(4) !== (editableProduct.precioLista || 0).toFixed(4)) {
            setEditableProduct(prev => ({
                ...prev,
                precioLista: parseFloat(precioFinal.toFixed(2)) 
            }));
        }
    
    }, [editableProduct?.precioCosto, editableProduct?.markupPorcentaje, editableProduct?.alic_IVA]);


    // --- FUNCIÓN PRINCIPAL PARA OBTENER PRODUCTOS ---
    const fetchProducts = useCallback(async () => {
        if (!userData?.empresa) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            setCompanyName(companyData?.nombreEmpresa || "Tu Empresa");
            const filters = {
                page: currentPage,
                limit: 10,
                ...activeFilters
            };
            const responseData = await getProds(userData.empresa, filters);
            if (!responseData?.products || !responseData?.pagination) {
                throw new Error("La respuesta de la API no tiene el formato esperado.");
            }
            setData(responseData);
        } catch (e) {
            setError(e.message || "Ocurrió un error inesperado.");
        } finally {
            setIsLoading(false);
        }
    }, [getProds, userData?.empresa, companyData?.nombreEmpresa, currentPage, activeFilters]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // --- MANEJADORES DE EVENTOS ---
    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        setActiveFilters(prevFilters => ({ ...prevFilters, product: searchTerm }));
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setSelectedCategory("");
        setSelectedMarca("");
        setSelectedPuntoVenta("");
        setCurrentPage(1);
        setActiveFilters({ product: "", category: "", marca: "", puntoVenta: "" });
    };
    
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === 'checkbox' ? checked : 
                           (type === 'number') ? parseFloat(value) || 0 : value;
        setEditableProduct(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        if (!editableProduct) return;
        setIsUpdating(true);
        try {
            await update_product(editableProduct._id, editableProduct);
            Swal.fire({
                icon: 'success',
                title: '¡Actualizado!',
                text: `El producto "${editableProduct.producto}" se ha guardado correctamente.`,
                timer: 2000,
                showConfirmButton: false
            });
            setSelectedProduct(null);
            fetchProducts();
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.message || 'No se pudo actualizar el producto. Inténtalo de nuevo.',
            });
        } finally {
            setIsUpdating(false);
        }
    };

    // --- RENDERIZADO ---
    if (isLoading && !data) return <LoadingSpinner />;
    if (error) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="p-6 text-center bg-red-50 text-red-700 border-l-4 border-red-500 rounded-lg shadow-md">
                <p className="font-bold text-lg">Ha ocurrido un error</p>
                <p>{error}</p>
            </div>
        </div>
    );

    return (
        <>
            <div className="bg-slate-100 min-h-screen">
                <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <header className="p-6 mb-8 text-center bg-indigo-600 text-white rounded-xl shadow-lg">
                        <h1 className="text-3xl font-bold">Productos de {companyName}</h1>
                        {data && (
                            <p className="mt-2 text-indigo-200">
                                Mostrando <span className="font-bold">{data.products.length}</span> de <span className="font-bold">{data.pagination.totalProducts}</span> productos en total.
                            </p>
                        )}
                    </header>
                    <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
                        <form onSubmit={handleSearch} >
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 items-end">
                                <div className="lg:col-span-2">
                                    <label htmlFor="search-product" className="block text-sm font-medium text-gray-700 mb-1">Buscar por nombre</label>
                                    <input type="text" id="search-product" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Ej: Gaseosa, Harina..." className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label htmlFor="search-category" className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                    <select id="search-category" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                                        <option value="">Todas</option>
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="search-marca" className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                                    <select id="search-marca" value={selectedMarca} onChange={(e) => setSelectedMarca(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                                        <option value="">Todas</option>
                                        {marcas.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="search-punto-venta" className="block text-sm font-medium text-gray-700 mb-1">Punto de Venta</label>
                                    <select id="search-punto-venta" value={selectedPuntoVenta} onChange={(e) => setSelectedPuntoVenta(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                                        <option value="">Todos</option>
                                        {puntosDeVenta.map(pv => <option key={pv._id} value={pv._id}>{pv.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="flex space-x-3">
                                    <button type="submit" className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                        Buscar
                                    </button>
                                    <button type="button" onClick={handleClearFilters} className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                        Limpiar
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        {isLoading && data ? <div className="text-center py-16"><SpinnerIcon/></div> : data?.products.length === 0 ? (
                            <div className="text-center py-16 px-6"><p className="text-gray-500 text-lg">No se encontraron productos para los filtros aplicados.</p></div>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {data?.products.map(p => (
                                    <li key={p._id} onClick={() => setSelectedProduct(p)} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors duration-150 cursor-pointer">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-md font-semibold text-indigo-700 truncate">{p.producto}</p>
                                            <p className="text-sm text-gray-500 truncate">{p.marca}</p>
                                        </div>
                                        <div className="hidden sm:flex items-center mx-4 text-center space-x-8">
                                            <div> <p className="text-xs text-gray-500">Stock</p> <p className="text-md font-medium text-gray-800">{p.stock_disponible}</p> </div>
                                            <div> <p className="text-xs text-gray-500">Precio</p> <p className="text-md font-bold text-gray-800">${p.precioLista.toFixed(2)}</p> </div>
                                        </div>
                                        <div className="flex-shrink-0 ml-4"> <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${p.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{p.activo ? "Activo" : "Inactivo"}</span> </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {data?.products.length > 0 && (
                            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                                <span className="text-sm text-gray-700">Página <span className="font-bold">{data.pagination.currentPage}</span> de <span className="font-bold">{data.pagination.totalPages}</span></span>
                                <div className="flex space-x-2">
                                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={!data.pagination.hasPrevPage} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
                                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={!data.pagination.hasNextPage} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MODAL DE EDICIÓN --- */}
            {selectedProduct && editableProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={() => setSelectedProduct(null)}>
                    <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                        
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-xl font-semibold text-gray-900">Editando: {selectedProduct.producto}</h3>
                            <button onClick={() => setSelectedProduct(null)} className="p-1 rounded-full text-gray-400 hover:bg-gray-200">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleUpdateSubmit} className="overflow-y-auto">
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                                
                                <div className="md:col-span-3">
                                    <label htmlFor="producto" className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
                                    <input type="text" name="producto" id="producto" value={editableProduct.producto || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                                </div>
                                <div className="md:col-span-3">
                                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción</label>
                                    <textarea name="descripcion" id="descripcion" value={editableProduct.descripcion || ''} onChange={handleInputChange} rows="2" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
                                </div>
                                
                                <div>
                                    <label htmlFor="categoria" className="block text-sm font-medium text-gray-700">Categoría</label>
                                    <input type="text" name="categoria" id="categoria" value={editableProduct.categoria || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                </div>
                                <div>
                                    <label htmlFor="marca" className="block text-sm font-medium text-gray-700">Marca</label>
                                    <input type="text" name="marca" id="marca" value={editableProduct.marca || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                </div>
                                 <div>
                                    <label htmlFor="unidadMedida" className="block text-sm font-medium text-gray-700">Unidad de Medida</label>
                                    <input type="text" name="unidadMedida" id="unidadMedida" value={editableProduct.unidadMedida || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                </div>

                                <div>
                                    <label htmlFor="codigoInterno" className="block text-sm font-medium text-gray-700">Código Interno</label>
                                    <input type="text" name="codigoInterno" id="codigoInterno" value={editableProduct.codigoInterno || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="codigoBarra" className="block text-sm font-medium text-gray-700">Código de Barras</label>
                                    <input type="text" name="codigoBarra" id="codigoBarra" value={editableProduct.codigoBarra || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                </div>
                                
                                <hr className="md:col-span-3 my-2"/>

                                <div>
                                    <label htmlFor="precioCosto" className="block text-sm font-medium text-gray-700">Precio Costo</label>
                                    <input type="number" name="precioCosto" id="precioCosto" value={editableProduct.precioCosto} onChange={handleInputChange} step="any" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                </div>
                                <div>
                                    <label htmlFor="markupPorcentaje" className="block text-sm font-medium text-gray-700">Markup (%)</label>
                                    <input type="number" name="markupPorcentaje" id="markupPorcentaje" value={editableProduct.markupPorcentaje} onChange={handleInputChange} step="any" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                </div>
                                <div>
                                    <label htmlFor="alic_IVA" className="block text-sm font-medium text-gray-700">IVA (%)</label>
                                    <input type="number" name="alic_IVA" id="alic_IVA" value={editableProduct.alic_IVA} onChange={handleInputChange} step="any" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                </div>
                                <div className="md:col-span-3">
                                    <label htmlFor="precioLista" className="block text-sm font-bold text-indigo-700">Precio Venta / Lista (Calculado)</label>
                                    <input 
                                        type="number" 
                                        name="precioLista" 
                                        id="precioLista" 
                                        value={editableProduct.precioLista.toFixed(2)} 
                                        readOnly
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm font-bold text-lg bg-gray-100 cursor-not-allowed" 
                                    />
                                </div>

                                <hr className="md:col-span-3 my-2"/>
                                
                                <div>
                                    <label htmlFor="stockMinimo" className="block text-sm font-medium text-gray-700">Stock Mínimo</label>
                                    <input type="number" name="stockMinimo" id="stockMinimo" value={editableProduct.stockMinimo} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                </div>
                                <div>
                                    <label htmlFor="stock_disponible" className="block text-sm font-medium text-gray-700">Stock Disponible</label>
                                    <input type="number" name="stock_disponible" id="stock_disponible" value={editableProduct.stock_disponible} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm font-bold" />
                                </div>
                                <div className="md:col-span-1">
                                    <label htmlFor="ubicacionAlmacen" className="block text-sm font-medium text-gray-700">Ubicación en Almacén</label>
                                    <input type="text" name="ubicacionAlmacen" id="ubicacionAlmacen" value={editableProduct.ubicacionAlmacen || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                </div>
                                
                                <div>
                                    <label htmlFor="peso_kg" className="block text-sm font-medium text-gray-700">Peso (kg)</label>
                                    <input type="number" name="peso_kg" id="peso_kg" value={editableProduct.peso_kg} onChange={handleInputChange} step="any" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                </div>
                                <div>
                                    <label htmlFor="alto_cm" className="block text-sm font-medium text-gray-700">Alto (cm)</label>
                                    <input type="number" name="alto_cm" id="alto_cm" value={editableProduct.alto_cm} onChange={handleInputChange} step="any" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                </div>
                                <div>
                                    <label htmlFor="ancho_cm" className="block text-sm font-medium text-gray-700">Ancho (cm)</label>
                                    <input type="number" name="ancho_cm" id="ancho_cm" value={editableProduct.ancho_cm} onChange={handleInputChange} step="any" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                </div>

                                <div className="md:col-span-3 flex items-center pt-4">
                                    <input id="activo" name="activo" type="checkbox" checked={editableProduct.activo || false} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                    <label htmlFor="activo" className="ml-2 block text-sm font-bold text-gray-900">Producto Activo</label>
                                </div>
                                
                                <div className="md:col-span-3 mt-4 p-3 bg-slate-50 rounded-lg border">
                                    <h4 className="text-sm font-bold text-gray-600 mb-2">Información del Sistema</h4>
                                    <div className="text-sm space-y-1 text-gray-800">
                                        <p><strong>Fecha Creación:</strong> <span className="font-mono">{new Date(editableProduct.createdAt).toLocaleString('es-AR')}</span></p>
                                        <p><strong>Última Actualización:</strong> <span className="font-mono">{new Date(editableProduct.updatedAt).toLocaleString('es-AR')}</span></p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex justify-end items-center p-4 bg-gray-50 border-t">
                                <button type="button" onClick={() => setSelectedProduct(null)} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isUpdating} className="ml-3 inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400">
                                    {isUpdating && <SpinnerIcon />}
                                    {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}