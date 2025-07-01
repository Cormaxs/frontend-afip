import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { apiContext } from "../../context/api_context.jsx";
import Swal from 'sweetalert2';

// --- Función Auxiliar para el Estado Inicial ---
const createInitialState = (userData, companyData) => ({
    empresa: userData?.empresa || '',
    cName: companyData?.nombreEmpresa || '', // Solo para UI
    puntoVenta: '',
    codigoInterno: '',
    codigoBarra: '',
    producto: '',
    descripcion: '',
    marca: '',
    categoria: '',
    unidadMedida: '94', // Default: Unidad
    ancho_cm: '',
    alto_cm: '',
    profundidad_cm: '',
    peso_kg: '',
    precioCosto: '',
    precioLista: '',
    alic_IVA: 21,
    markupPorcentaje: '',
    stock_disponible: '',
    stockMinimo: '',
    ubicacionAlmacen: '',
    activo: true,
});

// --- Función de Validación ---
const validateForm = (formData) => {
    if (!formData.producto || formData.producto.trim().length < 3) {
        return { isValid: false, message: 'El campo "Producto/Servicio" es obligatorio y debe tener al menos 3 caracteres.' };
    }
    if (!formData.precioCosto || parseFloat(formData.precioCosto) <= 0) {
        return { isValid: false, message: 'El campo "Precio Costo" es obligatorio y debe ser mayor que cero.' };
    }
    return { isValid: true, message: '' };
};

export function AgregarProducto() {
    // 1. LLAMADA A HOOKS EN EL NIVEL SUPERIOR
    const { createProduct, getPointsByCompany, userData, companyData } = useContext(apiContext);

    const [formData, setFormData] = useState(() => createInitialState(userData, companyData));
    const [puntosVenta, setPuntosVenta] = useState([]);
    const [customCategories, setCustomCategories] = useState(() => {
        try {
            const storedCats = localStorage.getItem('customProductCategories');
            return storedCats ? JSON.parse(storedCats) : [];
        } catch { return []; }
    });
    const [isLoading, setIsLoading] = useState(false);

    // 2. EFECTO PARA SINCRONIZAR CON EL CONTEXTO CUANDO CARGA
    useEffect(() => {
        if (userData?.empresa && companyData?.nombreEmpresa) {
            setFormData(prev => ({
                ...prev,
                empresa: userData.empresa,
                cName: companyData.nombreEmpresa,
            }));
        }
    }, [userData, companyData]);
    
    // --- VALORES MEMOIZADOS ---
    const allCategories = useMemo(() => {
        const defaultCategories = ['Servicios Web', 'Software', 'Hardware', 'Consultoría', 'Electrónica', 'Alimentos', 'Bebidas', 'Limpieza', 'Ropa', 'Sin Categoría'];
        return [...new Set([...defaultCategories, ...customCategories])].sort();
    }, [customCategories]);

    const precioListaCalculado = useMemo(() => {
        const costo = parseFloat(formData.precioCosto) || 0;
        const markup = parseFloat(formData.markupPorcentaje) || 0;
        if (costo === 0) return '0.00';
        return (costo * (1 + markup / 100)).toFixed(2);
    }, [formData.precioCosto, formData.markupPorcentaje]);

    // --- EFECTO para cargar Puntos de Venta ---
    useEffect(() => {
        const fetchAllPuntosVenta = async () => {
            if (!formData.empresa) return;
            try {
                const response = await getPointsByCompany(formData.empresa);
                if (response?.puntosDeVenta) {
                    setPuntosVenta(response.puntosDeVenta);
                }
            } catch (err) {
                console.error("Error al obtener los puntos de venta:", err);
                Swal.fire('Error', 'No se pudieron cargar los puntos de venta.', 'error');
            }
        };
        fetchAllPuntosVenta();
    }, [formData.empresa, getPointsByCompany]);

    // --- MANEJADORES ---
    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));

        if (name === 'categoria' && value && !allCategories.includes(value)) {
            setCustomCategories(prevCats => {
                const newCategories = [...new Set([...prevCats, value])];
                localStorage.setItem('customProductCategories', JSON.stringify(newCategories));
                return newCategories;
            });
        }
    }, [allCategories]);

    const prepareDataForApi = () => {
        const dataToSend = { ...formData };
        delete dataToSend.cName;

        const numericFields = ['ancho_cm', 'alto_cm', 'profundidad_cm', 'peso_kg', 'precioCosto', 'alic_IVA', 'markupPorcentaje', 'stock_disponible', 'stockMinimo'];
        numericFields.forEach(field => {
            const numValue = parseFloat(dataToSend[field]);
            dataToSend[field] = isNaN(numValue) ? 0 : numValue;
        });

        const barcodeValue = parseFloat(dataToSend.codigoBarra);
        dataToSend.codigoBarra = isNaN(barcodeValue) ? null : barcodeValue;
        
        dataToSend.puntoVenta = dataToSend.puntoVenta || null;
        dataToSend.precioLista = parseFloat(formData.precioLista) || parseFloat(precioListaCalculado);
        return dataToSend;
    };

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        const validationResult = validateForm(formData);
        if (!validationResult.isValid) {
            Swal.fire('Datos inválidos', validationResult.message, 'warning');
            return;
        }
        
        setIsLoading(true);
        try {
            const finalData = prepareDataForApi();
            await createProduct(finalData);
            Swal.fire('¡Éxito!', 'Producto registrado correctamente.', 'success');
            setFormData(createInitialState(userData, companyData)); // Resetea el form
        } catch (e) {
            const errorMsg = e.response?.data?.message || e.message || 'Error desconocido.';
            console.error("Error al registrar producto:", e);
            Swal.fire('¡Error!', errorMsg, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [formData, createProduct, precioListaCalculado, userData, companyData]);

    // --- RENDER ---
    const commonInputClasses = "mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";

    return (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 text-center bg-blue-600">
                    <h1 className="text-2xl font-bold text-white">Agregar Producto/Servicio</h1>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    <fieldset>
                        <legend className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-6">Información Básica</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="md:col-span-2">
                                <label htmlFor="cName" className={labelClasses}>Empresa (Owner)*</label>
                                <input type="text" id="cName" value={formData.cName} readOnly className={`${commonInputClasses} bg-gray-100 cursor-not-allowed dark:bg-gray-600`}/>
                            </div>
                            <div>
                                <label htmlFor="producto" className={labelClasses}>Producto/Servicio*</label>
                                <input type="text" id="producto" name="producto" value={formData.producto} onChange={handleChange} required minLength="3" className={commonInputClasses} />
                            </div>
                            <div>
                                <label htmlFor="marca" className={labelClasses}>Marca</label>
                                <input type="text" id="marca" name="marca" value={formData.marca} onChange={handleChange} minLength="2" className={commonInputClasses} />
                            </div>
                            <div>
                                <label htmlFor="categoria" className={labelClasses}>Categoría</label>
                                <input type="text" id="categoria" name="categoria" value={formData.categoria} onChange={handleChange} list="category-list" autoComplete="off" minLength="2" className={commonInputClasses}/>
                                <datalist id="category-list">{allCategories.map(cat => <option key={cat} value={cat} />)}</datalist>
                            </div>
                            <div>
                                <label htmlFor="puntoVenta" className={labelClasses}>Punto de Venta</label>
                                <select id="puntoVenta" name="puntoVenta" value={formData.puntoVenta} onChange={handleChange} className={commonInputClasses}>
                                    <option value="">Seleccione (opcional)</option>
                                    {puntosVenta.map(pv => <option key={pv._id} value={pv._id}>{pv.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="codigoInterno" className={labelClasses}>Código Interno</label>
                                <input type="text" id="codigoInterno" name="codigoInterno" value={formData.codigoInterno} onChange={handleChange} className={commonInputClasses} />
                            </div>
                            <div>
                                <label htmlFor="codigoBarra" className={labelClasses}>Código de Barras</label>
                                <input type="number" id="codigoBarra" name="codigoBarra" value={formData.codigoBarra} onChange={handleChange} className={commonInputClasses} />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="descripcion" className={labelClasses}>Descripción</label>
                                <textarea id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleChange} rows="3" maxLength="500" className={commonInputClasses}></textarea>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-6">Información Económica</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div>
                                <label htmlFor="precioCosto" className={labelClasses}>Precio Costo*</label>
                                <input type="number" id="precioCosto" name="precioCosto" value={formData.precioCosto} onChange={handleChange} required min="0" step="0.01" className={commonInputClasses} />
                            </div>
                            <div>
                                <label htmlFor="markupPorcentaje" className={labelClasses}>Markup %</label>
                                <input type="number" id="markupPorcentaje" name="markupPorcentaje" value={formData.markupPorcentaje} onChange={handleChange} min="0" step="0.1" className={commonInputClasses} />
                            </div>
                            <div>
                                <label htmlFor="alic_IVA" className={labelClasses}>IVA %*</label>
                                <input type="number" id="alic_IVA" name="alic_IVA" value={formData.alic_IVA} onChange={handleChange} required min="0" max="100" step="0.1" className={commonInputClasses} />
                            </div>
                            <div>
                                <label htmlFor="precioLista" className={labelClasses}>Precio Lista (calculado)</label>
                                <input type="number" id="precioLista" name="precioLista" value={formData.precioLista || precioListaCalculado} onChange={handleChange} min="0" step="0.01" className={commonInputClasses} />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-6">Inventario, Dimensiones y Peso</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div>
                                <label htmlFor="stock_disponible" className={labelClasses}>Stock Disponible*</label>
                                <input type="number" id="stock_disponible" name="stock_disponible" value={formData.stock_disponible} onChange={handleChange} required min="0" className={commonInputClasses}/>
                            </div>
                            <div>
                                <label htmlFor="stockMinimo" className={labelClasses}>Stock Mínimo</label>
                                <input type="number" id="stockMinimo" name="stockMinimo" value={formData.stockMinimo} onChange={handleChange} min="0" className={commonInputClasses}/>
                            </div>
                            <div>
                                <label htmlFor="ubicacionAlmacen" className={labelClasses}>Ubicación Almacén</label>
                                <input type="text" id="ubicacionAlmacen" name="ubicacionAlmacen" value={formData.ubicacionAlmacen} onChange={handleChange} className={commonInputClasses}/>
                            </div>
                            <div>
                                <label htmlFor="unidadMedida" className={labelClasses}>Unidad Medida</label>
                                <select id="unidadMedida" name="unidadMedida" value={formData.unidadMedida} onChange={handleChange} className={commonInputClasses}>
                                    <option value="94">Unidad</option>
                                    <option value="7">Kilogramo (Kg)</option>
                                    <option value="1">Metro (Mtr)</option>
                                    <option value="21">Hora (Hr)</option>
                                    <option value="31">Litro (Lt)</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="ancho_cm" className={labelClasses}>Ancho (cm)</label>
                                <input type="number" id="ancho_cm" name="ancho_cm" value={formData.ancho_cm} onChange={handleChange} min="0" step="0.01" className={commonInputClasses}/>
                            </div>
                            <div>
                                <label htmlFor="alto_cm" className={labelClasses}>Alto (cm)</label>
                                <input type="number" id="alto_cm" name="alto_cm" value={formData.alto_cm} onChange={handleChange} min="0" step="0.01" className={commonInputClasses}/>
                            </div>
                            <div>
                                <label htmlFor="profundidad_cm" className={labelClasses}>Profundidad (cm)</label>
                                <input type="number" id="profundidad_cm" name="profundidad_cm" value={formData.profundidad_cm} onChange={handleChange} min="0" step="0.01" className={commonInputClasses}/>
                            </div>
                            <div>
                                <label htmlFor="peso_kg" className={labelClasses}>Peso (kg)</label>
                                <input type="number" id="peso_kg" name="peso_kg" value={formData.peso_kg} onChange={handleChange} min="0" step="0.01" className={commonInputClasses}/>
                            </div>
                            <div className="md:col-span-2 flex items-center">
                                <input type="checkbox" id="activo" name="activo" checked={formData.activo} onChange={handleChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                <label htmlFor="activo" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Producto activo</label>
                            </div>
                        </div>
                    </fieldset>
                    
                    <div className="pt-5">
                        <div className="flex justify-end">
                            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed">
                                {isLoading ? 'Guardando...' : 'Guardar Producto'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}