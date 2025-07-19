import React, { useState, useEffect, useContext, useCallback } from "react";
import { apiContext } from "../../context/api_context";

const PRODUCTS_PER_PAGE = 10;
const SpinnerIcon = () => ( <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> );

export default function GetProductsCompany() {
    // --- CONTEXTO Y ESTADOS (Sin cambios) ---
    const { getProductsEmpresa: getProds, userData, companyData, getCategoryEmpresa, getMarcaEmpresa, getPointsByCompany } = useContext(apiContext);
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

    // --- EFECTOS PARA CARGAR DATOS ---

    // 1. Carga Puntos de Venta (sin cambios)
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

    // 2. Carga Categorías y Marcas dinámicamente (sin cambios)
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

    // ✅ CAMBIO 1: Nuevo useEffect para aplicar filtros de menús desplegables al instante
    useEffect(() => {
        // No se ejecuta en la carga inicial, espera a que el usuario interactúe
        if (!isLoading) {
            setCurrentPage(1); // Resetea la página al cambiar un filtro
            setActiveFilters(prevFilters => ({
                ...prevFilters, // Mantiene el filtro de texto actual
                category: selectedCategory,
                marca: selectedMarca,
                puntoVenta: selectedPuntoVenta,
            }));
        }
    }, [selectedCategory, selectedMarca, selectedPuntoVenta]);


    // --- FUNCIÓN PARA OBTENER PRODUCTOS (Sin cambios) ---
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
                limit: PRODUCTS_PER_PAGE,
                category: activeFilters.category,
                product: activeFilters.product,
                marca: activeFilters.marca,
                puntoVenta: activeFilters.puntoVenta
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

    // --- EFECTO PARA EJECUTAR BÚSQUEDA (Sin cambios) ---
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);


    // ✅ CAMBIO 2: El botón "Buscar" ahora solo aplica el filtro de texto
    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        setActiveFilters(prevFilters => ({
            ...prevFilters, // Mantiene los filtros de los menús
            product: searchTerm,
        }));
    };

    // ✅ CAMBIO 3: Limpiar también resetea el filtro de texto activo
    const handleClearFilters = () => {
        if (searchTerm || selectedCategory || selectedMarca || selectedPuntoVenta) {
            setSearchTerm("");
            setSelectedCategory("");
            setSelectedMarca("");
            setSelectedPuntoVenta("");
            setCurrentPage(1);
            // También limpia el filtro `product` en activeFilters
            setActiveFilters({ product: "", category: "", marca: "", puntoVenta: "" });
        }
    };
    

    // --- RENDERIZADO (El resto del componente es igual) ---
    // ... tu JSX no necesita cambios ...
    if (isLoading && !data) return ( <div className="flex items-center justify-center min-h-screen bg-slate-50 text-gray-700"><SpinnerIcon /><p className="text-lg font-semibold">Cargando productos...</p></div> );
    if (error) return ( <div className="flex items-center justify-center min-h-screen bg-slate-50"><div className="p-6 text-center bg-red-50 text-red-700 border-l-4 border-red-500 rounded-lg shadow-md"><p className="font-bold text-lg">Ha ocurrido un error</p><p>{error}</p></div></div> );
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
                        {isLoading ? <div className="text-center py-16"><SpinnerIcon/></div> : data?.products.length === 0 ? (
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
            {selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 transition-opacity" onClick={() => setSelectedProduct(null)}>
                    <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-y-auto transform transition-all" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-900">{selectedProduct.producto}</h3>
                            <button onClick={() => setSelectedProduct(null)} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                {[
                                    { label: 'Descripción', value: selectedProduct.descripcion }, { label: 'Categoría', value: selectedProduct.categoria }, { label: 'Código Interno', value: selectedProduct.codigoInterno }, { label: 'Código de Barras', value: selectedProduct.codigoBarra }, { label: 'Precio Costo', value: `$${selectedProduct.precioCosto.toFixed(2)}` }, { label: 'Markup', value: `${selectedProduct.markupPorcentaje}%` }, { label: 'Alic. IVA', value: `${selectedProduct.alic_IVA}%` }, { label: 'Stock Mínimo', value: selectedProduct.stockMinimo }, { label: 'Ubicación', value: selectedProduct.ubicacionAlmacen }, { label: 'Unidad de Medida', value: selectedProduct.unidadMedida }, { label: 'Creado', value: new Date(selectedProduct.createdAt).toLocaleDateString() }, { label: 'Actualizado', value: new Date(selectedProduct.updatedAt).toLocaleDateString() },
                                ].map(item => (
                                    <div key={item.label} className="py-1">
                                        <dt className="text-gray-500">{item.label}</dt>
                                        <dd className="font-semibold text-gray-800">{item.value || 'N/A'}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}