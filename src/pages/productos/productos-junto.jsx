import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { apiContext } from "../../context/api_context.jsx";
import Swal from 'sweetalert2';

// --- Iconos y Spinners (Reutilizables) ---
const SpinnerIcon = ({ className = "h-5 w-5" }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const IVA_OPTIONS = [
    { label: 'IVA General (27%)', value: 27 },
    { label: 'IVA Reducido I (21%)', value: 21 },
    { label: 'IVA Reducido II (10.5%)', value: 10.5 },
    { label: 'IVA Superreducido (2.5%)', value: 2.5 },
    { label: 'Exento (0%)', value: 0 },
];

// ###################################################################################
// --- MODAL PARA AGREGAR PRODUCTO (sin cambios) ---
// ###################################################################################
const AddProductModal = ({ isOpen, onClose, onProductAdded, filterOptions }) => {
    const { createProduct, getPointsByCompany, userData, companyData } = useContext(apiContext);
    const createInitialState = useCallback(() => ({ empresa: userData?.empresa || '', cName: companyData?.nombreEmpresa || '', puntoVenta: '', codigoInterno: '', codigoBarra: '', producto: '', descripcion: '', marca: '', categoria: '', unidadMedida: '94', ancho_cm: '', alto_cm: '', profundidad_cm: '', peso_kg: '', precioCosto: '', precioLista: '', alic_IVA: 21, markupPorcentaje: '', stock_disponible: '', stockMinimo: '', ubicacionAlmacen: '', activo: true, }), [userData, companyData]);
    const [formData, setFormData] = useState(createInitialState);
    const [puntosVenta, setPuntosVenta] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        if (isOpen) {
            const fetchPoints = async () => {
                if (!userData?.empresa) return;
                try {
                    const response = await getPointsByCompany(userData.empresa, 1, 100);
                    setPuntosVenta(response?.puntosDeVenta || []);
                } catch (err) {
                    console.error("Error al obtener puntos de venta en modal:", err);
                }
            };
            fetchPoints();
            setFormData(createInitialState());
        }
    }, [isOpen, userData?.empresa, getPointsByCompany, createInitialState]);
    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }, []);
    const precioListaCalculado = useMemo(() => {
        const costo = parseFloat(formData.precioCosto) || 0;
        const markup = parseFloat(formData.markupPorcentaje) || 0;
        return costo * (1 + markup / 100);
    }, [formData.precioCosto, formData.markupPorcentaje]);
    useEffect(() => {
        if (formData.precioCosto && !isNaN(parseFloat(formData.precioCosto))) {
            setFormData(prev => ({ ...prev, precioLista: precioListaCalculado.toFixed(2) }));
        }
    }, [precioListaCalculado, formData.precioCosto]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.producto || formData.producto.trim().length < 3) {
            Swal.fire('Datos inválidos', 'El nombre del producto es obligatorio (mínimo 3 caracteres).', 'warning');
            return;
        }
        if (!formData.precioCosto || parseFloat(formData.precioCosto) <= 0) {
            Swal.fire('Datos inválidos', 'El precio de costo es obligatorio y debe ser mayor a 0.', 'warning');
            return;
        }
        setIsLoading(true);
        try {
            const dataToSend = { ...formData };
            delete dataToSend.cName;
            const numericFields = ['ancho_cm', 'alto_cm', 'profundidad_cm', 'peso_kg', 'precioCosto', 'alic_IVA', 'markupPorcentaje', 'stock_disponible', 'stockMinimo'];
            numericFields.forEach(field => {
                const numValue = parseFloat(dataToSend[field]);
                dataToSend[field] = isNaN(numValue) ? 0 : numValue;
            });
            dataToSend.codigoBarra = dataToSend.codigoBarra ? parseFloat(dataToSend.codigoBarra) : null;
            dataToSend.puntoVenta = dataToSend.puntoVenta || null;
            dataToSend.precioLista = parseFloat(dataToSend.precioLista) || 0;
            await createProduct(dataToSend);
            Swal.fire('¡Éxito!', 'Producto registrado correctamente.', 'success');
            onProductAdded();
        } catch (e) {
            const errorMsg = e.response?.data?.message || 'Ocurrió un error al registrar el producto.';
            Swal.fire('¡Error!', errorMsg, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    if (!isOpen) return null;
    const commonInputClasses = "mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[var(--principal-activo)] focus:border-[var(--principal-activo)]";
    const labelClasses = "block text-sm font-medium text-gray-700";
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-900">Agregar Nuevo Producto/Servicio</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200"><CloseIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-8">
                    <fieldset>
                        <legend className="text-lg font-semibold text-gray-800 border-b pb-2 mb-6">Datos Obligatorios</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="md:col-span-2">
                                <label htmlFor="cName" className={labelClasses}>Empresa (Owner)*</label>
                                <input type="text" id="cName" value={formData.cName} readOnly className={`${commonInputClasses} bg-gray-100 cursor-not-allowed`} />
                            </div>
                            <div>
                                <label htmlFor="producto" className={labelClasses}>Producto/Servicio*</label>
                                <input type="text" id="producto" name="producto" value={formData.producto} onChange={handleChange} required minLength="3" className={commonInputClasses} />
                            </div>
                            <div>
                                <label htmlFor="precioCosto" className={labelClasses}>Precio Costo*</label>
                                <input type="number" id="precioCosto" name="precioCosto" value={formData.precioCosto} onChange={handleChange} required min="0" step="0.01" className={commonInputClasses} />
                            </div>
                            <div>
                                <label htmlFor="stock_disponible" className={labelClasses}>Stock Disponible*</label>
                                <input type="number" id="stock_disponible" name="stock_disponible" value={formData.stock_disponible} onChange={handleChange} required min="0" className={commonInputClasses} />
                            </div>
                            <div>
                                <label htmlFor="alic_IVA" className={labelClasses}>Alícuota de IVA*</label>
                                <select id="alic_IVA" name="alic_IVA" value={formData.alic_IVA} onChange={handleChange} required className={commonInputClasses}>
                                    {IVA_OPTIONS.map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="puntoVenta" className={labelClasses}>Asociar a Punto de Venta</label>
                                <select id="puntoVenta" name="puntoVenta" value={formData.puntoVenta} onChange={handleChange} className={commonInputClasses}>
                                    <option value="">General (ninguno)</option>
                                    {puntosVenta.map(pv => <option key={pv._id} value={pv._id}>{pv.nombre}</option>)}
                                </select>
                            </div>
                        </div>
                    </fieldset>
                    <fieldset>
                        <legend className="text-lg font-semibold text-gray-800 border-b pb-2 mb-6">Datos Opcionales y de Inventario</legend>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                            <div>
                                <label htmlFor="marca" className={labelClasses}>Marca</label>
                                <input list="marcas-list" type="text" id="marca" name="marca" value={formData.marca} onChange={handleChange} className={commonInputClasses} />
                                <datalist id="marcas-list">{filterOptions.marcas.map(m => <option key={m} value={m} />)}</datalist>
                            </div>
                            <div>
                                <label htmlFor="categoria" className={labelClasses}>Categoría</label>
                                <input list="categorias-list" type="text" id="categoria" name="categoria" value={formData.categoria} onChange={handleChange} className={commonInputClasses} />
                                <datalist id="categorias-list">{filterOptions.categories.map(cat => <option key={cat} value={cat} />)}</datalist>
                            </div>
                            <div className="md:col-span-3">
                                <label htmlFor="descripcion" className={labelClasses}>Descripción</label>
                                <textarea id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleChange} rows="2" className={commonInputClasses}></textarea>
                            </div>
                            <div>
                                <label htmlFor="codigoInterno" className={labelClasses}>Código Interno</label>
                                <input type="text" id="codigoInterno" name="codigoInterno" value={formData.codigoInterno} onChange={handleChange} className={commonInputClasses} />
                            </div>
                            <div>
                                <label htmlFor="codigoBarra" className={labelClasses}>Código de Barras</label>
                                <input type="number" id="codigoBarra" name="codigoBarra" value={formData.codigoBarra} onChange={handleChange} className={commonInputClasses} />
                            </div>
                            <div>
                                <label htmlFor="markupPorcentaje" className={labelClasses}>Markup %</label>
                                <input type="number" id="markupPorcentaje" name="markupPorcentaje" value={formData.markupPorcentaje} onChange={handleChange} min="0" step="0.1" className={commonInputClasses} />
                            </div>
                            <div>
                                <label htmlFor="precioLista" className={labelClasses}>Precio Lista (calculado)</label>
                                <input type="number" id="precioLista" name="precioLista" value={formData.precioLista || ''} onChange={handleChange} min="0" step="0.01" className={commonInputClasses} />
                            </div>
                            <div>
                                <label htmlFor="stockMinimo" className={labelClasses}>Stock Mínimo</label>
                                <input type="number" id="stockMinimo" name="stockMinimo" value={formData.stockMinimo} onChange={handleChange} min="0" className={commonInputClasses} />
                            </div>
                            <div>
                                <label htmlFor="ubicacionAlmacen" className={labelClasses}>Ubicación Almacén</label>
                                <input type="text" id="ubicacionAlmacen" name="ubicacionAlmacen" value={formData.ubicacionAlmacen} onChange={handleChange} className={commonInputClasses} />
                            </div>
                            <div>
                                <label htmlFor="unidadMedida" className={labelClasses}>Unidad Medida</label>
                                <select id="unidadMedida" name="unidadMedida" value={formData.unidadMedida} onChange={handleChange} className={commonInputClasses}>
                                    <option value="94">Unidad</option><option value="7">Kilogramo (Kg)</option><option value="1">Metro (Mtr)</option><option value="21">Hora (Hr)</option><option value="31">Litro (Lt)</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="ancho_cm" className={labelClasses}>Ancho (cm)</label>
                                <input type="number" id="ancho_cm" name="ancho_cm" value={formData.ancho_cm} onChange={handleChange} min="0" step="0.01" className={commonInputClasses} />
                            </div>
                            <div>
                                <label htmlFor="alto_cm" className={labelClasses}>Alto (cm)</label>
                                <input type="number" id="alto_cm" name="alto_cm" value={formData.alto_cm} onChange={handleChange} min="0" step="0.01" className={commonInputClasses} />
                            </div>
                            <div>
                                <label htmlFor="profundidad_cm" className={labelClasses}>Profundidad (cm)</label>
                                <input type="number" id="profundidad_cm" name="profundidad_cm" value={formData.profundidad_cm} onChange={handleChange} min="0" step="0.01" className={commonInputClasses} />
                            </div>
                            <div>
                                <label htmlFor="peso_kg" className={labelClasses}>Peso (kg)</label>
                                <input type="number" id="peso_kg" name="peso_kg" value={formData.peso_kg} onChange={handleChange} min="0" step="0.01" className={commonInputClasses} />
                            </div>
                            <div className="md:col-span-3 flex items-center">
                                <input type="checkbox" id="activo" name="activo" checked={formData.activo} onChange={handleChange} className="h-4 w-4 text-[var(--principal)] focus:ring-[var(--principal-activo)] border-gray-300 rounded" />
                                <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">Producto activo</label>
                            </div>
                        </div>
                    </fieldset>
                </form>
                <div className="flex justify-end items-center p-4 bg-gray-50 border-t mt-auto">
                    <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancelar</button>
                    <button onClick={handleSubmit} disabled={isLoading} className="ml-3 inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--principal)] hover:bg-[var(--principal-shadow)] disabled:bg-indigo-400">
                        {isLoading && <SpinnerIcon className="h-5 w-5 -ml-1 mr-2" />}
                        {isLoading ? 'Guardando...' : 'Guardar Producto'}
                    </button>
                </div>
            </div>
        </div>
    );
};
// ###################################################################################
// --- MODAL PARA CARGA MASIVA (sin cambios) ---
// ###################################################################################
const BulkUploadModal = ({ isOpen, onClose, onSuccess }) => {
    const { companyData, cargaMasiva, getPointsByCompany } = useContext(apiContext);
    const [status, setStatus] = useState('idle');
    const [puntosDeVenta, setPuntosDeVenta] = useState([]);
    const [selectedPuntoVentaId, setSelectedPuntoVentaId] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const idEmpresa = companyData?._id;
    useEffect(() => {
        if (isOpen && idEmpresa) {
            const fetchPuntosDeVenta = async () => {
                setStatus('loading');
                try {
                    const apiResult = await getPointsByCompany(idEmpresa, 1, 500);
                    setPuntosDeVenta(apiResult?.puntosDeVenta || []);
                    setStatus('idle');
                } catch (err) {
                    setStatus('error');
                    setMessage({ type: 'error', text: "No se pudieron cargar los puntos de venta." });
                }
            };
            fetchPuntosDeVenta();
            setSelectedFile(null);
            setSelectedPuntoVentaId('');
            setMessage({ type: '', text: '' });
        }
    }, [isOpen, idEmpresa, getPointsByCompany]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPuntoVentaId || !selectedFile) {
            setMessage({ type: 'error', text: "Por favor, seleccione un punto de venta y un archivo." });
            return;
        }
        setStatus('submitting');
        setMessage({ type: '', text: '' });
        const formData = new FormData();
        formData.append('importar-db', selectedFile);
        try {
            await cargaMasiva(formData, idEmpresa, selectedPuntoVentaId);
            setMessage({ type: 'success', text: "¡Archivo cargado y procesado exitosamente!" });
            setStatus('success');
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (err) {
            setStatus('error');
            setMessage({ type: 'error', text: err.message || "Ocurrió un error al cargar el archivo." });
        }
    };
    if (!isOpen) return null;
    const isLoading = status === 'loading' || status === 'submitting';
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-900">Carga Masiva de Productos</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200"><CloseIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <fieldset className="border border-gray-300 p-4 rounded-lg">
                        <legend className="text-sm font-semibold px-2">Paso 1: Punto de Venta</legend>
                        {status === 'loading' ? <p>Cargando...</p> :
                            <select value={selectedPuntoVentaId} onChange={(e) => setSelectedPuntoVentaId(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md">
                                <option value="" disabled>-- Seleccionar --</option>
                                {puntosDeVenta.map(pv => <option key={pv._id} value={pv._id}>{pv.nombre}</option>)}
                            </select>
                        }
                    </fieldset>
                    {selectedPuntoVentaId && (<fieldset className="border border-gray-300 p-4 rounded-lg">
                        <legend className="text-sm font-semibold px-2">Paso 2: Subir Archivo CSV</legend>
                        <input type="file" name="importar-db" accept=".csv" onChange={(e) => setSelectedFile(e.target.files[0])} required className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-[var(--principal-shadow)] hover:file:bg-indigo-100" />
                    </fieldset>)}
                    {message.text && (<p className={`text-center font-medium ${message.type === 'error' ? 'text-[var(--rojo-cerrar)]' : 'text-green-600'}`}>{message.text}</p>)}
                </form>
                <div className="flex justify-end items-center p-4 bg-gray-50 border-t">
                    <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancelar</button>
                    <button onClick={handleSubmit} disabled={!selectedPuntoVentaId || !selectedFile || isLoading} className="ml-3 inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--principal)] hover:bg-[var(--principal-shadow)] disabled:bg-indigo-400">
                        {isLoading && <SpinnerIcon className="h-5 w-5 -ml-1 mr-2" />}
                        {status === 'submitting' ? 'Procesando...' : 'Cargar Productos'}
                    </button>
                </div>
            </div>
        </div>
    );
};
// ###################################################################################
// --- NUEVO MODAL PARA CREAR/EDITAR MARCAS ---
// ###################################################################################
const ManageMarcaModal = ({ isOpen, onClose, onMarcaUpdated, filterOptions }) => {
    const { companyData, updateOrCreateMarcas, deleteMarca } = useContext(apiContext); // ✅ Añadido deleteMarca
    const [selectedMarca, setSelectedMarca] = useState('');
    const [newMarcaName, setNewMarcaName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        if (isOpen) {
            setSelectedMarca('');
            setNewMarcaName('');
        }
    }, [isOpen]);
    const handleSelectChange = (e) => {
        const marcaSeleccionada = e.target.value;
        setSelectedMarca(marcaSeleccionada);
        setNewMarcaName(marcaSeleccionada);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newMarcaName.trim()) {
            Swal.fire('Error', 'El nuevo nombre de la marca es obligatorio.', 'error');
            return;
        }
        setIsLoading(true);
        try {
            const dataToSend = {
                nombreNuevo: newMarcaName,
                idEmpresa: companyData?._id,
                nombreAntiguo: selectedMarca || undefined,
            };
            const result = await updateOrCreateMarcas(dataToSend);
            Swal.fire('Éxito', result.message, 'success');
            onMarcaUpdated();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.error || 'Ocurrió un error al procesar la marca.', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    // ✅ NUEVA FUNCIÓN PARA ELIMINAR MARCAS
    const handleDeleteMarca = async () => {
        if (!selectedMarca) {
            Swal.fire('Error', 'Por favor, selecciona una marca para eliminar.', 'error');
            return;
        }
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: `¡Esta acción eliminará la marca "${selectedMarca}" y la desvinculará de todos los productos!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, ¡eliminar!',
            cancelButtonText: 'Cancelar'
        });
        if (result.isConfirmed) {
            setIsLoading(true);
            try {
                const response = await deleteMarca(selectedMarca, companyData?._id);
                Swal.fire('¡Eliminada!', response.message, 'success');
                onMarcaUpdated(); // Recarga la lista de marcas
            } catch (err) {
                Swal.fire('Error', err.response?.data?.error || 'No se pudo eliminar la marca.', 'error');
            } finally {
                setIsLoading(false);
            }
        }
    };
    if (!isOpen) return null;
    const modalTitle = selectedMarca ? `Editando marca: ${selectedMarca}` : 'Crear Nueva Marca';
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-900">{modalTitle}</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200"><CloseIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Seleccionar marca a editar, eliminar o crear</label>
                            <select value={selectedMarca} onChange={handleSelectChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                                <option value="">-- Crear nueva --</option>
                                {filterOptions.marcas.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre nuevo*</label>
                            <input type="text" value={newMarcaName} onChange={(e) => setNewMarcaName(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" placeholder="Escribe el nombre aquí" />
                        </div>
                    </div>
                    <div className="flex justify-between items-center gap-3 mt-6">
                        {/* ✅ BOTÓN DE ELIMINAR */}
                        {selectedMarca && (
                            <button type="button" onClick={handleDeleteMarca} disabled={isLoading} className="text-sm font-medium text-white bg-[var(--rojo-cerrar)] hover:opacity-90 disabled:opacity-50 py-2 px-4 rounded-md">
                                {isLoading ? '...' : 'Eliminar'}
                            </button>
                        )}
                        <div className="flex justify-end gap-3 w-full">
                            <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancelar</button>
                            <button type="submit" disabled={isLoading} className="inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--principal)] hover:bg-[var(--principal-shadow)] disabled:bg-indigo-400">
                                {isLoading && <SpinnerIcon className="h-5 w-5 -ml-1 mr-2" />}
                                {selectedMarca ? 'Guardar Cambios' : 'Crear Marca'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ###################################################################################
// --- MODAL PARA CREAR/EDITAR CATEGORIAS ---
// ###################################################################################
const ManageCategoriaModal = ({ isOpen, onClose, onCategoriaUpdated, filterOptions }) => {
    const { companyData, updateOrCreateCategorias, deleteCategoria } = useContext(apiContext); // ✅ Añadido deleteCategoria
    const [selectedCategoria, setSelectedCategoria] = useState('');
    const [newCategoriaName, setNewCategoriaName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        if (isOpen) {
            setSelectedCategoria('');
            setNewCategoriaName('');
        }
    }, [isOpen]);
    const handleSelectChange = (e) => {
        const categoriaSeleccionada = e.target.value;
        setSelectedCategoria(categoriaSeleccionada);
        setNewCategoriaName(categoriaSeleccionada);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newCategoriaName.trim()) {
            Swal.fire('Error', 'El nuevo nombre de la categoría es obligatorio.', 'error');
            return;
        }
        setIsLoading(true);
        try {
            const dataToSend = {
                nombreNuevo: newCategoriaName,
                idEmpresa: companyData?._id,
                nombreAntiguo: selectedCategoria || undefined,
            };
            const result = await updateOrCreateCategorias(dataToSend);
            Swal.fire('Éxito', result.message, 'success');
            onCategoriaUpdated();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.error || 'Ocurrió un error al procesar la categoría.', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    // ✅ NUEVA FUNCIÓN PARA ELIMINAR CATEGORÍAS
    const handleDeleteCategoria = async () => {
        if (!selectedCategoria) {
            Swal.fire('Error', 'Por favor, selecciona una categoría para eliminar.', 'error');
            return;
        }
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: `¡Esta acción eliminará la categoría "${selectedCategoria}" y la desvinculará de todos los productos!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, ¡eliminar!',
            cancelButtonText: 'Cancelar'
        });
        if (result.isConfirmed) {
            setIsLoading(true);
            try {
                const response = await deleteCategoria(selectedCategoria, companyData?._id);
                Swal.fire('¡Eliminada!', response.message, 'success');
                onCategoriaUpdated(); // Recarga la lista de categorías
            } catch (err) {
                Swal.fire('Error', err.response?.data?.error || 'No se pudo eliminar la categoría.', 'error');
            } finally {
                setIsLoading(false);
            }
        }
    };
    if (!isOpen) return null;
    const modalTitle = selectedCategoria ? `Editando categoría: ${selectedCategoria}` : 'Crear Nueva Categoría';
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-900">{modalTitle}</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200"><CloseIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Seleccionar categoría a editar, eliminar o crear</label>
                            <select value={selectedCategoria} onChange={handleSelectChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                                <option value="">-- Crear nueva --</option>
                                {filterOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre nuevo*</label>
                            <input type="text" value={newCategoriaName} onChange={(e) => setNewCategoriaName(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" placeholder="Escribe el nombre aquí" />
                        </div>
                    </div>
                    <div className="flex justify-between items-center gap-3 mt-6">
                        {/* ✅ BOTÓN DE ELIMINAR */}
                        {selectedCategoria && (
                            <button type="button" onClick={handleDeleteCategoria} disabled={isLoading} className="text-sm font-medium text-white bg-[var(--rojo-cerrar)] hover:opacity-90 disabled:opacity-50 py-2 px-4 rounded-md">
                                {isLoading ? '...' : 'Eliminar'}
                            </button>
                        )}
                        <div className="flex justify-end gap-3 w-full">
                            <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancelar</button>
                            <button type="submit" disabled={isLoading} className="inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--principal)] hover:bg-[var(--principal-shadow)] disabled:bg-indigo-400">
                                {isLoading && <SpinnerIcon className="h-5 w-5 -ml-1 mr-2" />}
                                {selectedCategoria ? 'Guardar Cambios' : 'Crear Categoría'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ###################################################################################
// --- COMPONENTE PRINCIPAL (refactorizado) ---
// ###################################################################################
export default function GestionProductos() {
    const { 
        getProductsEmpresa, userData, companyData, getCategoryEmpresa, getMarcaEmpresa, getPointsByCompany, update_product, deleted_product
    } = useContext(apiContext);
    const [data, setData] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ product: "", category: "", marca: "", puntoVenta: "" });
    const [filterOptions, setFilterOptions] = useState({ categories: [], marcas: [], puntosDeVenta: [] });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isManageMarcaModalOpen, setIsManageMarcaModalOpen] = useState(false);
    const [isManageCategoriaModalOpen, setIsManageCategoriaModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [editableProduct, setEditableProduct] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const fetchProducts = useCallback(async (page = 1) => {
        if (!userData?.empresa) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ""));
            const apiFilters = { page, limit: 10, ...cleanFilters };
            const responseData = await getProductsEmpresa(userData.empresa, apiFilters);
            setData(responseData);
        } catch (e) {
            setError(e.message || "Ocurrió un error inesperado.");
        } finally {
            setIsLoading(false);
        }
    }, [userData?.empresa, getProductsEmpresa, filters]);
    const loadFilterOptions = useCallback(async () => {
        if (userData?.empresa) {
            try {
                const [cats, marcs, points] = await Promise.all([
                    getCategoryEmpresa(userData.empresa, filters.puntoVenta),
                    getMarcaEmpresa(userData.empresa, filters.puntoVenta),
                    getPointsByCompany(userData.empresa, 1, 500)
                ]);
                setFilterOptions({ categories: cats || [], marcas: marcs || [], puntosDeVenta: points?.puntosDeVenta || [] });
            } catch (e) {
                console.error("Error al cargar opciones de filtro:", e);
            }
        }
    }, [userData?.empresa, filters.puntoVenta, getCategoryEmpresa, getMarcaEmpresa, getPointsByCompany]);
    useEffect(() => {
        fetchProducts(currentPage);
    }, [currentPage, fetchProducts]);
    useEffect(() => {
        loadFilterOptions();
    }, [loadFilterOptions]);
    useEffect(() => {
        if (selectedProduct) {
            setEditableProduct({ ...selectedProduct });
        } else {
            setEditableProduct(null);
        }
    }, [selectedProduct]);
    const calculatedEditPrice = useMemo(() => {
        if (!editableProduct) return 0;
        const costo = parseFloat(editableProduct.precioCosto) || 0;
        const markup = parseFloat(editableProduct.markupPorcentaje) || 0;
        return costo * (1 + markup / 100);
    }, [editableProduct?.precioCosto, editableProduct?.markupPorcentaje]);
    useEffect(() => {
        if (editableProduct && editableProduct.precioCosto && !isNaN(parseFloat(editableProduct.precioCosto))) {
            setEditableProduct(prev => {
                if (parseFloat(prev.precioLista) !== calculatedEditPrice) {
                    return { ...prev, precioLista: calculatedEditPrice.toFixed(2) };
                }
                return prev;
            });
        }
    }, [calculatedEditPrice, editableProduct?.precioCosto]);
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };
    const handleApplyFilters = () => {
        setCurrentPage(1);
        fetchProducts(1);
    };
    const handleClearFilters = () => {
        setFilters({ product: "", category: "", marca: "", puntoVenta: "" });
        setCurrentPage(1);
    };
    const handleEditInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === 'checkbox' ? checked : value;
        setEditableProduct(prev => ({ ...prev, [name]: finalValue }));
    };
    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        if (!editableProduct) return;
        setIsUpdating(true);
        try {
            const dataToUpdate = { ...editableProduct, precioLista: parseFloat(editableProduct.precioLista) || 0, };
            await update_product(editableProduct._id, dataToUpdate);
            Swal.fire('¡Actualizado!', 'El producto se ha guardado correctamente.', 'success');
            setSelectedProduct(null);
            await fetchProducts(currentPage);
            await loadFilterOptions();
        } catch (err) {
            Swal.fire('Error', err.message || 'No se pudo actualizar el producto.', 'error');
        } finally {
            setIsUpdating(false);
        }
    };
    const handleDeleteProduct = async (productId) => {
        if (!productId) return;
        const result = await Swal.fire({
            title: '¿Estás seguro?', text: "¡Esta acción eliminará el producto permanentemente!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Sí, ¡eliminar!', cancelButtonText: 'Cancelar'
        });
        if (result.isConfirmed) {
            setIsUpdating(true);
            try {
                await deleted_product(productId);
                Swal.fire('¡Eliminado!', 'El producto ha sido eliminado.', 'success');
                setSelectedProduct(null);
                await fetchProducts(1);
                await loadFilterOptions();
            } catch (err) {
                Swal.fire('Error', err.response?.data?.message || 'No se pudo eliminar el producto.', 'error');
            } finally {
                setIsUpdating(false);
            }
        }
    };
    if (isLoading && !data) return <div className="text-center p-10"><SpinnerIcon className="h-8 w-8 mx-auto" /> <p>Cargando productos...</p></div>;
    if (error) return <div className="text-center p-10 bg-red-100 text-[var(--rojo-cerrar)]">{error}</div>;
    const commonInputClassesModal = "mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[var(--principal-activo)] focus:border-[var(--principal-activo)]";
    const labelClassesModal = "block text-sm font-medium text-gray-700";
    return (
        <>
            <div className="bg-slate-100 min-h-screen">
                <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <header className="p-6 mb-6 text-center bg-[var(--principal)] text-white rounded-xl shadow-lg">
                        <h1 className="text-3xl font-bold">Gestión de Productos de {companyData?.nombreEmpresa}</h1>
                        {data && <p className="mt-2 text-indigo-200">Mostrando {data.products.length} de {data.pagination.totalProducts} productos.</p>}
                    </header>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-6">
                        <button onClick={() => setIsAddModalOpen(true)} className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[var(--principal)] hover:bg-[var(--principal-shadow)]">
                            + Agregar Producto
                        </button>
                        <button onClick={() => setIsBulkModalOpen(true)} className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                            Carga Masiva (CSV)
                        </button>
                        <button onClick={() => setIsManageMarcaModalOpen(true)} className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                            Gestionar Marcas
                        </button>
                        <button onClick={() => setIsManageCategoriaModalOpen(true)} className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                            Gestionar Categorías
                        </button>
                    </div>
                    {/* --- FILTROS --- */}
                    <div className="mb-8 p-4 bg-white rounded-lg shadow-md">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                            <div className="lg:col-span-2">
                                <label htmlFor="product-filter" className="text-sm font-medium">Buscar por nombre</label>
                                <input type="text" name="product" id="product-filter" value={filters.product} onChange={handleFilterChange} placeholder="Ej: Gaseosa..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                            </div>
                            <div>
                                <label htmlFor="category-filter" className="text-sm font-medium">Categoría</label>
                                <input list="filter-categorias-list" type="text" name="category" id="category-filter" value={filters.category} onChange={handleFilterChange} placeholder="Escriba o seleccione..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                <datalist id="filter-categorias-list">{filterOptions.categories.map(cat => <option key={cat} value={cat} />)}</datalist>
                            </div>
                            <div>
                                <label htmlFor="marca-filter" className="text-sm font-medium">Marca</label>
                                <input list="filter-marcas-list" type="text" name="marca" id="marca-filter" value={filters.marca} onChange={handleFilterChange} placeholder="Escriba o seleccione..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                <datalist id="filter-marcas-list">{filterOptions.marcas.map(m => <option key={m} value={m} />)}</datalist>
                            </div>
                            <div>
                                <label htmlFor="puntoVenta-filter" className="text-sm font-medium">Punto de Venta</label>
                                <select name="puntoVenta" id="puntoVenta-filter" value={filters.puntoVenta} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                    <option value="">Todos</option>
                                    {filterOptions.puntosDeVenta.map(pv => <option key={pv._id} value={pv._id}>{pv.nombre}</option>)}
                                </select>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={handleApplyFilters} className="w-full bg-[var(--principal)] text-white py-2 px-4 rounded-md">Buscar</button>
                                <button onClick={handleClearFilters} className="w-full bg-white text-gray-700 py-2 px-4 border rounded-md">Limpiar</button>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        {isLoading && !data ? <div className="text-center p-10"><SpinnerIcon className="h-8 w-8 mx-auto" /></div> : null}
                        {!isLoading && data?.products.length === 0 ? (<p className="text-center py-16 text-gray-500">No se encontraron productos con los filtros aplicados.</p>) : (
                            <ul className="divide-y divide-gray-200">
                                {data?.products.map(p => (
                                    <li key={p._id} onClick={() => setSelectedProduct(p)} className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-md font-semibold text-[var(--principal-shadow)] truncate">{p.producto}</p>
                                            <p className="text-sm text-gray-500 truncate">{p.marca || 'Sin marca'} | Cat: {p.categoria || 'N/A'}</p>
                                        </div>
                                        <div className="hidden sm:flex items-center text-center space-x-8 mx-4">
                                            <div><p className="text-xs text-gray-500">Stock</p><p className="font-medium">{p.stock_disponible}</p></div>
                                            <div><p className="text-xs text-gray-500">Precio</p><p className="font-bold">${p.precioLista.toFixed(2)}</p></div>
                                        </div>
                                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${p.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-[var(--rojo-cerrar-hover)]"}`}>{p.activo ? "Activo" : "Inactivo"}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {data?.pagination.totalPages > 1 && (<div className="flex items-center justify-between px-4 py-3 bg-white border-t">
                            <span className="text-sm">Página {data.pagination.currentPage} de {data.pagination.totalPages}</span>
                            <div>
                                <button onClick={() => setCurrentPage(p => p - 1)} disabled={!data.pagination.hasPrevPage} className="px-4 py-2 border rounded-md text-sm disabled:opacity-50">Anterior</button>
                                <button onClick={() => setCurrentPage(p => p + 1)} disabled={!data.pagination.hasNextPage} className="ml-2 px-4 py-2 border rounded-md text-sm disabled:opacity-50">Siguiente</button>
                            </div>
                        </div>)}
                    </div>
                </div>
            </div>
            <AddProductModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onProductAdded={() => { setIsAddModalOpen(false); fetchProducts(1); loadFilterOptions(); }} filterOptions={filterOptions} />
            <BulkUploadModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} onSuccess={() => { setIsBulkModalOpen(false); fetchProducts(1); loadFilterOptions(); }} />
            <ManageMarcaModal isOpen={isManageMarcaModalOpen} onClose={() => setIsManageMarcaModalOpen(false)} onMarcaUpdated={() => { setIsManageMarcaModalOpen(false); loadFilterOptions(); }} filterOptions={filterOptions} />
            <ManageCategoriaModal isOpen={isManageCategoriaModalOpen} onClose={() => setIsManageCategoriaModalOpen(false)} onCategoriaUpdated={() => { setIsManageCategoriaModalOpen(false); loadFilterOptions(); }} filterOptions={filterOptions} />
            {selectedProduct && editableProduct && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={() => setSelectedProduct(null)}>
                <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center p-4 border-b">
                        <h3 className="text-xl font-semibold text-gray-900">Editando: {selectedProduct.producto}</h3>
                        <button onClick={() => setSelectedProduct(null)} className="p-1 rounded-full text-gray-400 hover:bg-gray-200"><CloseIcon /></button>
                    </div>
                    <form onSubmit={handleUpdateSubmit} className="overflow-y-auto p-6 space-y-8">
                        <fieldset>
                            <legend className="text-lg font-semibold text-gray-800 border-b pb-2 mb-6">Datos Principales</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div className="md:col-span-2">
                                    <label htmlFor="edit-producto" className={labelClassesModal}>Producto/Servicio*</label>
                                    <input type="text" id="edit-producto" name="producto" value={editableProduct.producto || ''} onChange={handleEditInputChange} required minLength="3" className={commonInputClassesModal} />
                                </div>
                                <div>
                                    <label htmlFor="edit-precioCosto" className={labelClassesModal}>Precio Costo*</label>
                                    <input type="number" id="edit-precioCosto" name="precioCosto" value={editableProduct.precioCosto || ''} onChange={handleEditInputChange} required min="0" step="any" className={commonInputClassesModal} />
                                </div>
                                <div>
                                    <label htmlFor="edit-markupPorcentaje" className={labelClassesModal}>Markup %</label>
                                    <input type="number" id="edit-markupPorcentaje" name="markupPorcentaje" value={editableProduct.markupPorcentaje || ''} onChange={handleEditInputChange} min="0" step="any" className={commonInputClassesModal} />
                                </div>
                                <div>
                                    <label htmlFor="edit-alic_IVA" className={labelClassesModal}>Alícuota de IVA*</label>
                                    <select id="edit-alic_IVA" name="alic_IVA" value={editableProduct.alic_IVA} onChange={handleEditInputChange} required className={commonInputClassesModal}>
                                        {IVA_OPTIONS.map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="edit-precioLista" className={labelClassesModal}>Precio Lista (calculado)</label>
                                    <input type="number" id="edit-precioLista" name="precioLista" value={editableProduct.precioLista || ''} onChange={handleEditInputChange} className={commonInputClassesModal} />
                                </div>
                                <div>
                                    <label htmlFor="edit-stock_disponible" className={labelClassesModal}>Stock Disponible*</label>
                                    <input type="number" id="edit-stock_disponible" name="stock_disponible" value={editableProduct.stock_disponible || ''} onChange={handleEditInputChange} required min="0" className={commonInputClassesModal} />
                                </div>
                            </div>
                        </fieldset>
                        <fieldset>
                            <legend className="text-lg font-semibold text-gray-800 border-b pb-2 mb-6">Datos Adicionales y de Inventario</legend>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                                <div>
                                    <label htmlFor="edit-marca" className={labelClassesModal}>Marca</label>
                                    <input list="edit-marcas-list" type="text" id="edit-marca" name="marca" value={editableProduct.marca || ''} onChange={handleEditInputChange} className={commonInputClassesModal} />
                                    <datalist id="edit-marcas-list">{filterOptions.marcas.map(m => <option key={m} value={m} />)}</datalist>
                                </div>
                                <div>
                                    <label htmlFor="edit-categoria" className={labelClassesModal}>Categoría</label>
                                    <input list="edit-categorias-list" type="text" id="edit-categoria" name="categoria" value={editableProduct.categoria || ''} onChange={handleEditInputChange} className={commonInputClassesModal} />
                                    <datalist id="edit-categorias-list">{filterOptions.categories.map(cat => <option key={cat} value={cat} />)}</datalist>
                                </div>
                                <div className="md:col-span-3">
                                    <label htmlFor="edit-descripcion" className={labelClassesModal}>Descripción</label>
                                    <textarea id="edit-descripcion" name="descripcion" value={editableProduct.descripcion || ''} onChange={handleEditInputChange} rows="2" className={commonInputClassesModal}></textarea>
                                </div>
                                <div>
                                    <label htmlFor="edit-codigoInterno" className={labelClassesModal}>Código Interno</label>
                                    <input type="text" id="edit-codigoInterno" name="codigoInterno" value={editableProduct.codigoInterno || ''} onChange={handleEditInputChange} className={commonInputClassesModal} />
                                </div>
                                <div>
                                    <label htmlFor="edit-codigoBarra" className={labelClassesModal}>Código de Barras</label>
                                    <input type="number" id="edit-codigoBarra" name="codigoBarra" value={editableProduct.codigoBarra || ''} onChange={handleEditInputChange} className={commonInputClassesModal} />
                                </div>
                                <div>
                                    <label htmlFor="edit-stockMinimo" className={labelClassesModal}>Stock Mínimo</label>
                                    <input type="number" id="edit-stockMinimo" name="stockMinimo" value={editableProduct.stockMinimo || ''} onChange={handleEditInputChange} min="0" className={commonInputClassesModal} />
                                </div>
                                <div>
                                    <label htmlFor="edit-ubicacionAlmacen" className={labelClassesModal}>Ubicación Almacén</label>
                                    <input type="text" id="edit-ubicacionAlmacen" name="ubicacionAlmacen" value={editableProduct.ubicacionAlmacen || ''} onChange={handleEditInputChange} className={commonInputClassesModal} />
                                </div>
                                <div className="md:col-span-2 flex items-center pt-2">
                                    <input type="checkbox" id="edit-activo" name="activo" checked={!!editableProduct.activo} onChange={handleEditInputChange} className="h-4 w-4 rounded border-gray-300 text-[var(--principal)]" />
                                    <label htmlFor="edit-activo" className="ml-2 block text-sm font-bold">Producto Activo</label>
                                </div>
                            </div>
                        </fieldset>
                    </form>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 bg-gray-50 border-t mt-auto">
                        <button type="button" onClick={() => handleDeleteProduct(editableProduct._id)} disabled={isUpdating} className="w-full sm:w-auto order-last sm:order-first inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-[var(--rojo-cerrar)] hover:opacity-90 disabled:bg-red-300">
                            {isUpdating ? '...' : 'Eliminar Producto'}
                        </button>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                            <button type="button" onClick={() => setSelectedProduct(null)} className="w-full sm:w-auto py-2 px-4 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button onClick={handleUpdateSubmit} disabled={isUpdating} className="w-full sm:w-auto inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--principal)] hover:bg-[var(--principal-shadow)] disabled:bg-indigo-400">
                                {isUpdating && <SpinnerIcon className="h-5 w-5 -ml-1 mr-2" />}
                                {isUpdating ? 'Procesando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>)}
        </>
    );
}

// ... (Resto de los componentes y exportaciones)