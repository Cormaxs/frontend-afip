import React, { useState, useEffect, useContext } from "react";
import { apiContext } from "../../context/api_context";

// Ya no se importa nada de @heroicons/react

export default function GetProductsCompany() {
  // --- STATE MANAGEMENT ---
  const { getProductsEmpresa: getProds, userData, companyData, getPointsByCompany } = useContext(apiContext);
  
  const [data, setData] = useState(null); 
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
      
        
        
        setCompanyName(companyData.nombreEmpresa || "Tu Empresa");
        if (!userData.empresa) throw new Error("ID de empresa no encontrado.");
        
        const responseData = await getProds(userData.empresa, currentPage);

        if (!responseData?.products || !responseData?.pagination) {
          throw new Error("La respuesta de la API no tiene el formato esperado.");
        }
        setData(responseData);
      } catch (e) {
        setError(e.message || "Ocurrió un error inesperado.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [getProds, currentPage]);
  
  // --- RENDER LOGIC ---
  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 text-blue-600">
      <p className="text-lg">Cargando productos...</p>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-6 text-center bg-red-100 text-red-700 rounded-lg shadow">
        <p className="font-semibold">Error: {error}</p>
      </div>
    </div>
  );

  return (
    <>
      <div className="p-4 bg-gray-50 sm:p-6 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="p-6 mb-4 text-center bg-blue-600 text-white rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold">Productos de {companyName}</h1>
            {data && (
               <p className="mt-1 text-blue-200">
                  Mostrando {data.products.length} de {data.pagination.totalProducts} productos
               </p>
            )}
          </div>

          {data?.products.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-lg shadow"><p className="text-gray-500">No se encontraron productos.</p></div>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {data?.products.map(p => (
                  <div 
                    key={p._id} 
                    onClick={() => setSelectedProduct(p)}
                    className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border hover:bg-gray-50 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{p.producto}</p>
                      <p className="text-xs text-gray-500 truncate">{p.marca}</p>
                    </div>
                    <div className="hidden sm:block mx-4 text-center">
                      <p className="text-xs text-gray-500">Stock</p>
                      <p className="text-sm font-semibold">{p.stock_disponible}</p>
                    </div>
                    <div className="mx-4 text-center">
                      <p className="text-xs text-gray-500">Precio</p>
                      <p className="text-sm font-bold text-blue-600">${p.precioLista.toFixed(2)}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${p.activo ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}`}>
                        {p.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between px-4 py-3 mt-6 bg-white rounded-lg shadow-md">
                <span className="text-sm text-gray-700">Página <span className="font-bold">{data.pagination.currentPage}</span> de <span className="font-bold">{data.pagination.totalPages}</span></span>
                <div className="flex space-x-2">
                  <button onClick={() => setCurrentPage(p => p - 1)} disabled={!data.pagination.hasPrevPage} className="px-4 py-2 text-sm font-medium border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">Anterior</button>
                  <button onClick={() => setCurrentPage(p => p + 1)} disabled={!data.pagination.hasNextPage} className="px-4 py-2 text-sm font-medium border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">Siguiente</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* --- MODAL PARA VER DETALLES --- */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={() => setSelectedProduct(null)}>
          <div className="relative w-full max-w-2xl max-h-[90vh] p-6 bg-white rounded-lg shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            
            {/* Botón de cierre con SVG en línea */}
            <button 
              onClick={() => setSelectedProduct(null)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{selectedProduct.producto}</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm border-t pt-4">
              {[
                { label: 'Descripción', value: selectedProduct.descripcion }, { label: 'Categoría', value: selectedProduct.categoria },
                { label: 'Código Interno', value: selectedProduct.codigoInterno }, { label: 'Código de Barras', value: selectedProduct.codigoBarra },
                { label: 'Precio Costo', value: `$${selectedProduct.precioCosto.toFixed(2)}` }, { label: 'Markup', value: `${selectedProduct.markupPorcentaje}%` },
                { label: 'Alic. IVA', value: `${selectedProduct.alic_IVA}%` }, { label: 'Stock Mínimo', value: selectedProduct.stockMinimo },
                { label: 'Ubicación', value: selectedProduct.ubicacionAlmacen }, { label: 'Unidad de Medida', value: selectedProduct.unidadMedida },
                { label: 'Creado', value: new Date(selectedProduct.createdAt).toLocaleDateString() }, { label: 'Actualizado', value: new Date(selectedProduct.updatedAt).toLocaleDateString() },
              ].map(item => (<div key={item.label}><p className="text-gray-500">{item.label}</p><p className="font-semibold text-gray-800">{item.value}</p></div>))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}