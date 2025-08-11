import React, { useContext, useState, useEffect, useCallback, useReducer, useRef } from "react";

import { apiContext } from '../../context/api_context.jsx';

import Swal from 'sweetalert2';



// --- CONSTANTES Y LÓGICA DE NEGOCIO ---

const TIPOS_COMPROBANTE = [

    { valor: "Factura A", codigo: "001", letra: "A" },

    { valor: "Factura B", codigo: "006", letra: "B" },

    { valor: "Factura C", codigo: "011", letra: "C" },

    { valor: "Nota de Pedido X", codigo: "099", letra: "X", noFiscal: true }

];



const CONDICIONES_IVA = {

    RESPONSABLE_INSCRIPTO: "Responsable Inscripto",

    MONOTRIBUTISTA: "Monotributista",

    EXENTO: "Exento",

    CONSUMIDOR_FINAL: "Consumidor Final",

    NO_RESPONSABLE: "No Responsable"

};



const CONDICIONES_IVA_AFIP = {

    "Responsable Inscripto": { DocTipo: 80, Id: 1 },

    "Monotributista": { DocTipo: 99, Id: 4 },

    "Exento": { DocTipo: 99, Id: 5 },

    "Consumidor Final": { DocTipo: 99, Id: 5 },

    "No Responsable": { DocTipo: 99, Id: 6 },

};



const ivaAlicuotasAFIP = {

    0: 3,

    10.5: 4,

    21: 5,

    27: 6,

    5: 8,

    2.5: 9

};



const METODOS_PAGO = ["Efectivo", "Tarjeta de Crédito", "Tarjeta de Débito", "Transferencia Bancaria"];



const getOpcionesIvaReceptor = (letraComprobante) => {

    switch (letraComprobante) {

        case 'A': return [CONDICIONES_IVA.RESPONSABLE_INSCRIPTO];

        case 'B': return [CONDICIONES_IVA.CONSUMIDOR_FINAL, CONDICIONES_IVA.MONOTRIBUTISTA, CONDICIONES_IVA.EXENTO, CONDICIONES_IVA.NO_RESPONSABLE];

        default: return Object.values(CONDICIONES_IVA);

    }

};



// --- SUB-COMPONENTE: MODAL DE BÚSQUEDA DE PRODUCTOS (OPTIMIZADO) ---

const ProductSearchModal = React.memo(({ onProductSelect, onClose, puntoVentaId }) => {

    const { getProductsEmpresa, getCategoryEmpresa, getMarcaEmpresa, userData } = useContext(apiContext);

    const [productsData, setProductsData] = useState({ products: [], pagination: {} });

    const [currentPage, setCurrentPage] = useState(1);

    const [isLoading, setIsLoading] = useState(true);

    const [filterState, setFilterState] = useState({ searchTerm: "", selectedCategory: "", selectedMarca: "" });

    const [categories, setCategories] = useState([]);

    const [marcas, setMarcas] = useState([]);

    const debounceRef = useRef(null);



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

                const response = await getProductsEmpresa(userData.empresa, {

                    page: currentPage,

                    limit: 10,

                    product: filterState.searchTerm,

                    category: filterState.selectedCategory,

                    marca: filterState.selectedMarca,

                    puntoVenta: puntoVentaId

                });

                setProductsData(response || { products: [], pagination: {} });

            } catch (error) {

                console.error("Error buscando productos en el modal:", error);

            } finally {

                setIsLoading(false);

            }

        };



        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {

            fetchProducts();

        }, 300);



        return () => clearTimeout(debounceRef.current);

    }, [userData?.empresa, currentPage, filterState, getProductsEmpresa, puntoVentaId]);



    const handleFilterChange = (e) => {

        const { name, value } = e.target;

        setCurrentPage(1);

        setFilterState(prev => ({ ...prev, [name]: value }));

    };



    const handleSelectProduct = (product) => {

        onProductSelect(product);

    };



    return (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>

            <div className="relative w-full max-w-3xl max-h-[90vh] p-6 bg-white rounded-lg shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>

                <h3 className="text-2xl font-bold mb-4 text-gray-800">Buscar Producto</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">

                    <input

                        type="text"

                        name="searchTerm"

                        value={filterState.searchTerm}

                        onChange={handleFilterChange}

                        placeholder="Nombre producto..."

                        className="sm:col-span-3 border rounded-md p-2 shadow-sm"

                        autoFocus

                    />

                    <select

                        name="selectedCategory"

                        value={filterState.selectedCategory}

                        onChange={handleFilterChange}

                        className="border rounded-md p-2 bg-white shadow-sm"

                    >

                        <option value="">Todas las Categorías</option>

                        {categories.map(c => <option key={c} value={c}>{c}</option>)}

                    </select>

                    <select

                        name="selectedMarca"

                        value={filterState.selectedMarca}

                        onChange={handleFilterChange}

                        className="border rounded-md p-2 bg-white shadow-sm"

                    >

                        <option value="">Todas las Marcas</option>

                        {marcas.map(m => <option key={m} value={m}>{m}</option>)}

                    </select>

                </div>

                <div className="overflow-y-auto flex-grow space-y-2 border-t pt-4">

                    {isLoading ? <p className="text-center text-gray-500">Cargando...</p> :

                        productsData.products.length === 0 ? <p className="text-center text-gray-500">No se encontraron productos.</p> :

                            productsData.products.map(p => (

                                <div key={p._id} onClick={() => handleSelectProduct(p)} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-100 cursor-pointer">

                                    <div>

                                        <p className="font-bold text-gray-900">{p.producto}</p>

                                        <p className="text-sm text-gray-500">{p.marca || 'Sin marca'}</p>

                                    </div>

                                    <p className="font-bold text-lg text-slate-700">${p.precioLista?.toFixed(2) || '0.00'}</p>

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

});



// --- REDUCER PARA GESTIÓN DE ESTADO ---

const initialState = {

    facturaData: {

        emisor: {},

        receptor: { razonSocial: "", cuit: "", condicionIVA: CONDICIONES_IVA.CONSUMIDOR_FINAL, domicilio: "", localidad: "", provincia: "" },

        comprobante: { tipo: "Factura B", codigoTipo: "006", letra: "B", fecha: "" },

        items: [],

        pagos: { formaPago: "Transferencia Bancaria", monto: 0 },

        totales: { subtotal: 0, iva: 0, total: 0, importeNetoNoGravado: 0, importeExento: 0, importeOtrosTributos: 0, ivaDetalladoAFIP: [] },

        observaciones: ""

    },

    tributos: []

};



const facturaReducer = (state, action) => {

    switch (action.type) {

        case 'SET_INITIAL_DATA':

            return {

                ...state,

                facturaData: {

                    ...state.facturaData,

                    emisor: action.payload.emisor,

                },

            };

        case 'UPDATE_FIELD':

            return {

                ...state,

                facturaData: {

                    ...state.facturaData,

                    [action.payload.section]: {

                        ...state.facturaData[action.payload.section],

                        [action.payload.name]: action.payload.value

                    }

                }

            };

        case 'SET_COMPROBANTE_DATA':

            return {

                ...state,

                facturaData: {

                    ...state.facturaData,

                    comprobante: {

                        ...state.facturaData.comprobante,

                        tipo: action.payload.tipo,

                        codigoTipo: action.payload.codigoTipo,

                        letra: action.payload.letra

                    },

                    receptor: {

                        ...state.facturaData.receptor,

                        condicionIVA: action.payload.nuevaCondicionIVA

                    }

                }

            };

        case 'ADD_ITEM': {

            const nuevoItem = action.payload;

            const itemsCopy = [...state.facturaData.items];

            const existingItemIndex = itemsCopy.findIndex(item => item._id === nuevoItem._id);

            if (existingItemIndex > -1) {

                itemsCopy[existingItemIndex].cantidad += 1;

            } else {

                itemsCopy.push(nuevoItem);

            }

            return {

                ...state,

                facturaData: { ...state.facturaData, items: itemsCopy }

            };

        }

        case 'UPDATE_ITEM_QUANTITY': {

            const itemsCopy = [...state.facturaData.items];

            itemsCopy[action.payload.index].cantidad = action.payload.cantidad;

            return {

                ...state,

                facturaData: { ...state.facturaData, items: itemsCopy }

            };

        }

        case 'REMOVE_ITEM': {

            const itemsCopy = [...state.facturaData.items];

            itemsCopy.splice(action.payload.index, 1);

            return {

                ...state,

                facturaData: { ...state.facturaData, items: itemsCopy }

            };

        }

        case 'SET_TOTALS':

            return {

                ...state,

                facturaData: { ...state.facturaData, totales: action.payload }

            };

        case 'UPDATE_OBSERVACIONES':

            return {

                ...state,

                facturaData: { ...state.facturaData, observaciones: action.payload }

            };

        case 'UPDATE_PAGOS':

            return {

                ...state,

                facturaData: { ...state.facturaData, pagos: action.payload }

            };

        case 'ADD_TRIBUTO':

            return {

                ...state,

                tributos: [...state.tributos, action.payload]

            };

        case 'REMOVE_TRIBUTO':

            return {

                ...state,

                tributos: state.tributos.filter((_, index) => index !== action.payload)

            };

        default:

            return state;

    }

};



// --- COMPONENTE PRINCIPAL UNIFICADO Y OPTIMIZADO ---

export default function GenerarComprobantes() {

    const { companyData, userData, getPointsByCompany, generateFacturas } = useContext(apiContext);

    const [state, dispatch] = useReducer(facturaReducer, initialState);

    const tributoDescRef = useRef(null);

    const tributoImpRef = useRef(null);

    const tributoAlicRef = useRef(null);



    const [puntosDeVenta, setPuntosDeVenta] = useState([]);

    const [puntoSeleccionado, setPuntoSeleccionado] = useState('');

    const [opcionesIVAReceptor, setOpcionesIVAReceptor] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const [loading, setLoading] = useState(true);

    const [errorMessage, setErrorMessage] = useState('');



    useEffect(() => {

        const initialize = async () => {

            if (!companyData?._id || !userData?._id) {

                setErrorMessage("No se pudo cargar la información de la empresa o del usuario.");

                setLoading(false);

                return;

            }

            try {

                const response = await getPointsByCompany(companyData._id, 1, 500);

                setPuntosDeVenta(response?.puntosDeVenta || []);



                const emisorData = {

                    razonSocial: companyData.nombreEmpresa || 'N/A',

                    cuit: companyData.cuit || '',

                    domicilio: companyData.domicilio?.direccion || '',

                    localidad: companyData.domicilio?.localidad || '',

                    provincia: companyData.domicilio?.provincia || '',

                    condicionIVA: companyData.condicionIVA || CONDICIONES_IVA.RESPONSABLE_INSCRIPTO,

                    iibb: companyData.iibb || '',

                    fechaInicioActividades: companyData.fechaInicioActividades || '',

                    actividadAFIP: companyData.actividadAFIP || '',

                    telefono: companyData.telefono || ''

                };



                const now = new Date();

                const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;



                dispatch({ type: 'SET_INITIAL_DATA', payload: { emisor: emisorData } });

                dispatch({ type: 'UPDATE_FIELD', payload: { section: 'comprobante', name: 'fecha', value: formattedDate } });



                setOpcionesIVAReceptor(getOpcionesIvaReceptor('B'));

                setLoading(false);

            } catch (err) {

                setErrorMessage("Error al cargar datos iniciales: " + err.message);

                setLoading(false);

            }

        };

        initialize();

    }, [companyData, userData, getPointsByCompany]);



    const calcularTotales = useCallback(() => {

        let subtotalNeto = 0, ivaTotal = 0, importeOtrosTributos = 0, importeNetoNoGravado = 0, importeExento = 0;

        const ivaDetalladoAFIP = {};

        const { items, comprobante } = state.facturaData;



        items.forEach(item => {

            const precioItem = item.cantidad * item.precioUnitario;

            let baseImponible, montoIva;



            if (comprobante.letra === 'A') {

                baseImponible = precioItem;

                montoIva = baseImponible * (item.alicuotaIVA / 100);

            } else {

                montoIva = precioItem - (precioItem / (1 + item.alicuotaIVA / 100));

                baseImponible = precioItem - montoIva;

            }



            subtotalNeto += baseImponible;

            ivaTotal += montoIva;



            const ivaId = ivaAlicuotasAFIP[item.alicuotaIVA] || 3;

            if (!ivaDetalladoAFIP[ivaId]) {

                ivaDetalladoAFIP[ivaId] = { Id: ivaId, BaseImp: 0, Importe: 0 };

            }

            ivaDetalladoAFIP[ivaId].BaseImp += baseImponible;

            ivaDetalladoAFIP[ivaId].Importe += montoIva;

        });



        state.tributos.forEach(t => {

            importeOtrosTributos += t.Importe;

        });



        const total = subtotalNeto + ivaTotal + importeOtrosTributos + importeNetoNoGravado + importeExento;



        dispatch({

            type: 'SET_TOTALS',

            payload: {

                subtotal: subtotalNeto,

                iva: ivaTotal,

                total: total,

                importeNetoNoGravado,

                importeExento,

                importeOtrosTributos,

                ivaDetalladoAFIP: Object.values(ivaDetalladoAFIP).map(ivaItem => ({

                    ...ivaItem,

                    BaseImp: parseFloat(ivaItem.BaseImp.toFixed(2)),

                    Importe: parseFloat(ivaItem.Importe.toFixed(2))

                }))

            }

        });

    }, [state.facturaData.items, state.facturaData.comprobante.letra, state.tributos]);



    useEffect(() => {

        calcularTotales();

    }, [state.facturaData.items, state.facturaData.comprobante.letra, state.tributos, calcularTotales]);



    const handleStateChange = (section, name, value) => {

        dispatch({ type: 'UPDATE_FIELD', payload: { section, name, value } });

    };



    const handleTipoComprobanteChange = (e) => {

        const tipo = TIPOS_COMPROBANTE.find(t => t.codigo === e.target.value);

        if (tipo) {

            const nuevasOpcionesIVA = getOpcionesIvaReceptor(tipo.letra);

            const nuevaCondicionIVA = nuevasOpcionesIVA[0];

            dispatch({

                type: 'SET_COMPROBANTE_DATA',

                payload: {

                    tipo: tipo.valor,

                    codigoTipo: tipo.codigo,

                    letra: tipo.letra,

                    nuevaCondicionIVA

                }

            });

            setOpcionesIVAReceptor(nuevasOpcionesIVA);

        }

    };



    const handleProductSelect = useCallback((product) => {

        const nuevoItem = {

            _id: product._id,

            codigo: product.codigoBarra || 'S/C',

            descripcion: product.producto,

            cantidad: 1,

            precioUnitario: parseFloat(product.precioLista) || 0,

            alicuotaIVA: parseFloat(product.iva) || 21,

            unidadMedida: "94", // Valor por defecto

            descuento: 0.00

        };

        dispatch({ type: 'ADD_ITEM', payload: nuevoItem });

        setIsModalOpen(false);

    }, []);



    const handleQuantityChange = (index, cantidad) => {

        const cant = parseInt(cantidad, 10);

        if (!isNaN(cant) && cant >= 1) {

            dispatch({ type: 'UPDATE_ITEM_QUANTITY', payload: { index, cantidad: cant } });

        }

    };



    const handleRemoveItem = (index) => {

        Swal.fire({

            title: '¿Estás seguro?',

            text: "Quitarás este producto del comprobante.",

            icon: 'warning',

            showCancelButton: true,

            confirmButtonColor: '#d33',

            cancelButtonText: 'Cancelar',

            confirmButtonText: 'Sí, eliminar'

        }).then((result) => {

            if (result.isConfirmed) {

                dispatch({ type: 'REMOVE_ITEM', payload: { index } });

            }

        });

    };



    const handleAddTributo = () => {

        const descripcion = tributoDescRef.current.value;

        const importe = parseFloat(tributoImpRef.current.value);

        const alicuota = parseFloat(tributoAlicRef.current.value) || 0;

        if (descripcion && !isNaN(importe) && importe > 0) {

            const baseImp = state.facturaData.totales.subtotal;

            dispatch({ type: 'ADD_TRIBUTO', payload: { Id: 99, Desc: descripcion, BaseImp: parseFloat(baseImp.toFixed(2)), Alic: alicuota, Importe: parseFloat(importe.toFixed(2)) } });

            tributoDescRef.current.value = '';

            tributoImpRef.current.value = '';

            tributoAlicRef.current.value = '';

        } else {

            Swal.fire('Atención', 'Por favor, ingrese una descripción, alícuota e importe válido para el tributo.', 'warning');

        }

    };



    const handleRemoveTributo = (index) => {

        dispatch({ type: 'REMOVE_TRIBUTO', payload: index });

    };



    const handleClearForm = () => {

        Swal.fire({

            title: '¿Limpiar Comprobante?',

            text: "Se borrarán todos los datos del formulario.",

            icon: 'warning',

            showCancelButton: true,

            confirmButtonText: 'Sí, limpiar'

        }).then((result) => {

            if (result.isConfirmed) {

                const now = new Date();

                const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;



                dispatch({ type: 'SET_INITIAL_DATA', payload: { emisor: state.facturaData.emisor } });

                dispatch({ type: 'UPDATE_FIELD', payload: { section: 'comprobante', name: 'fecha', value: formattedDate } });

                dispatch({ type: 'UPDATE_FIELD', payload: { section: 'receptor', name: 'razonSocial', value: "" } });

                dispatch({ type: 'UPDATE_FIELD', payload: { section: 'receptor', name: 'cuit', value: "" } });

                dispatch({ type: 'UPDATE_FIELD', payload: { section: 'receptor', name: 'domicilio', value: "" } });

                dispatch({ type: 'UPDATE_FIELD', payload: { section: 'receptor', name: 'condicionIVA', value: getOpcionesIvaReceptor('B')[0] } });

                dispatch({ type: 'UPDATE_OBSERVACIONES', payload: "" });

                dispatch({ type: 'UPDATE_PAGOS', payload: { formaPago: "Transferencia Bancaria", monto: 0 } });

            }

        });

    };



    const handlePagoChange = (e) => {

        const { name, value } = e.target;

        dispatch({ type: 'UPDATE_PAGOS', payload: { ...state.facturaData.pagos, [name]: value } });

    };



    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!puntoSeleccionado) {

            Swal.fire('Atención', "Debes seleccionar un punto de venta.", 'warning');

            return;

        }

        if (state.facturaData.items.length === 0) {

            Swal.fire('Atención', "El comprobante no tiene productos.", 'warning');

            return;

        }



        setLoading(true);

        try {

            const puntoVentaObj = puntosDeVenta.find(p => p._id === puntoSeleccionado);

            const docData = CONDICIONES_IVA_AFIP[state.facturaData.receptor.condicionIVA];



            const payloadFinal = {

                id: userData._id,

                afipRequestData: {

                    Auth: { Token: "", Sign: "", Cuit: state.facturaData.emisor.cuit.replace(/-/g, '') },

                    FeCAEReq: {

                        FeCabReq: { CantReg: 1, PtoVta: puntoVentaObj?.numero || 1, CbteTipo: parseInt(state.facturaData.comprobante.codigoTipo) },

                        FeDetReq: [{

                            Concepto: 1,

                            DocTipo: docData.DocTipo,

                            DocNro: state.facturaData.receptor.cuit.replace(/-/g, '') || "0",

                            CbteDesde: 1,

                            CbteHasta: 1,

                            CbteFch: state.facturaData.comprobante.fecha.replace(/-/g, ''),

                            ImpTotal: parseFloat(state.facturaData.totales.total.toFixed(2)),

                            ImpTotConc: 0,

                            ImpNeto: parseFloat(state.facturaData.totales.subtotal.toFixed(2)),

                            ImpOpEx: parseFloat(state.facturaData.totales.importeExento.toFixed(2)),

                            ImpTrib: parseFloat(state.facturaData.totales.importeOtrosTributos.toFixed(2)),

                            ImpIVA: parseFloat(state.facturaData.totales.iva.toFixed(2)),

                            FchServDesde: "",

                            FchServHasta: "",

                            FchVtoPago: "",

                            MonId: "PES",

                            MonCotiz: 1,

                            CondicionIVAReceptorId: docData.Id,

                            Tributos: state.tributos,

                            Iva: state.facturaData.totales.ivaDetalladoAFIP

                        }]

                    }

                },

                facturaData: {

                    emisor: {

                        ...state.facturaData.emisor,

                        iibb: companyData.iibb,

                        fechaInicioActividades: companyData.fechaInicioActividades,

                        actividadAFIP: companyData.actividadAFIP,

                        telefono: companyData.telefono,

                        puntoVentaSucursal: puntoVentaObj?.nombre

                    },

                    receptor: state.facturaData.receptor,

                    comprobante: {

                        ...state.facturaData.comprobante,

                        puntoVenta: puntoVentaObj?.numero,

                        numero: null,

                        cae: null,

                        fechaVtoCae: null,

                        leyendaAFIP: null,

                        qrImage: null,

                    },

                    items: state.facturaData.items,

                    pagos: state.facturaData.pagos,

                    totales: {

                        ...state.facturaData.totales,

                        leyendaIVA: "IVA DETALLADO"

                    },

                    observaciones: state.facturaData.observaciones

                },

                idEmpresa: companyData._id,

                puntoVenta: puntoSeleccionado,

            };



            const tipoComprobanteSeleccionado = TIPOS_COMPROBANTE.find(t => t.codigo === state.facturaData.comprobante.codigoTipo);

            if (tipoComprobanteSeleccionado?.noFiscal) {

                delete payloadFinal.afipRequestData;

                delete payloadFinal.facturaData.comprobante.cae;

                delete payloadFinal.facturaData.comprobante.fechaVtoCae;

                delete payloadFinal.facturaData.comprobante.leyendaAFIP;

                delete payloadFinal.facturaData.comprobante.qrImage;

            }



            // AHORA SE ESPERA UN ARCHIVO BINARIO, NO UN JSON

            const response = await generateFacturas(payloadFinal);



            // Crear un Blob a partir de la respuesta del servidor

            const blob = new Blob([response], { type: 'application/pdf' });



            // Crear una URL de objeto para el Blob

            const url = window.URL.createObjectURL(blob);



            // Abrir la URL en una nueva pestaña del navegador

            window.open(url, '_blank');



            // Liberar la URL del objeto después de un breve tiempo para evitar fugas de memoria

            setTimeout(() => window.URL.revokeObjectURL(url), 100);



            Swal.fire('¡Éxito!', 'El comprobante ha sido generado y abierto en una nueva pestaña.', 'success').then(() => {

                handleClearForm();

            });



        } catch (err) {

            console.error("Error al generar el comprobante:", err);

            let errorMessage = "Ocurrió un error inesperado al generar el comprobante.";



            // Intentar leer el error si el servidor lo envió como texto

            // Esto es importante si el servidor responde con un mensaje de error sin ser un JSON.

            if (err.message && !err.response) {

                errorMessage = err.message;

            }



            // Si el error es de tipo Axios y es un error 400/500, intentamos leer el JSON

            // Esto es un placeholder, debes adaptar esto a cómo tu API maneja los errores.

            if (err.response && err.response.data) {

                try {

                    const errorData = JSON.parse(new TextDecoder().decode(err.response.data));

                    errorMessage = errorData.message || errorMessage;

                } catch (e) {

                    // Si no es un JSON, usamos el mensaje por defecto

                }

            }



            Swal.fire('Error', errorMessage, 'error');



        } finally {

            setLoading(false);

        }

    };



    if (loading && !state.facturaData.emisor.razonSocial) return <div className="text-center p-10">Cargando...</div>;

    if (errorMessage) return <div className="text-center p-10 text-red-500">{errorMessage}</div>;



    const esFacturaA = state.facturaData.comprobante.letra === 'A';



    return (

        <>

            <div className="p-4 bg-gray-100 min-h-screen font-sans">

                <div className="max-w-6xl mx-auto bg-white shadow-2xl rounded-lg">

                    <header className="bg-slate-800 text-white p-5 rounded-t-lg">

                        <h1 className="text-2xl font-bold">Generación de Comprobantes</h1>

                    </header>

                    <form onSubmit={handleSubmit} className="p-6 space-y-8">

                        {/* SECCIÓN DE CONFIGURACIÓN INICIAL */}

                        <fieldset className="border p-4 rounded-lg shadow-md bg-slate-50">

                            <legend className="font-semibold text-lg px-2 text-slate-700">1. Configuración Inicial</legend>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Punto de Venta*</label>

                                    <select value={puntoSeleccionado} onChange={e => setPuntoSeleccionado(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3">

                                        <option value="">-- Seleccionar --</option>

                                        {puntosDeVenta.map(p => <option key={p._id} value={p._id}>{p.nombre} (Nº {p.numero})</option>)}

                                    </select>

                                </div>

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Tipo de Comprobante*</label>

                                    <select value={state.facturaData.comprobante.codigoTipo} onChange={handleTipoComprobanteChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3">

                                        {TIPOS_COMPROBANTE.map(t => <option key={t.codigo} value={t.codigo}>{t.valor}</option>)}

                                    </select>

                                </div>

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Fecha del Comprobante*</label>

                                    <input type="date" value={state.facturaData.comprobante.fecha} onChange={e => handleStateChange('comprobante', 'fecha', e.target.value)} required className="mt-1 w-full border-gray-300 rounded-md shadow-sm py-2 px-3" />

                                </div>

                            </div>

                        </fieldset>



                        {/* SECCIONES DE DATOS DEL EMISOR Y RECEPTOR */}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            <fieldset className="border p-4 rounded-lg shadow-md">

                                <legend className="font-semibold text-lg px-2 text-slate-700">2. Datos del Emisor</legend>

                                <div className="space-y-3">

                                    <div><label className="block text-sm font-medium">Razón Social</label><input type="text" value={state.facturaData.emisor.razonSocial} disabled className="mt-1 w-full bg-gray-200 border-gray-300 rounded-md" /></div>

                                    <div><label className="block text-sm font-medium">CUIT</label><input type="text" value={state.facturaData.emisor.cuit} disabled className="mt-1 w-full bg-gray-200 border-gray-300 rounded-md" /></div>

                                    <div><label className="block text-sm font-medium">Condición IVA</label><input type="text" value={state.facturaData.emisor.condicionIVA} disabled className="mt-1 w-full bg-gray-200 border-gray-300 rounded-md" /></div>

                                    <div><label className="block text-sm font-medium">Domicilio</label><input type="text" value={state.facturaData.emisor.domicilio} disabled className="mt-1 w-full bg-gray-200 border-gray-300 rounded-md" /></div>

                                </div>

                            </fieldset>

                            <fieldset className="border p-4 rounded-lg shadow-md">

                                <legend className="font-semibold text-lg px-2 text-slate-700">3. Datos del Receptor</legend>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <div className="md:col-span-2"><label className="block text-sm font-medium">Razón Social*</label><input type="text" value={state.facturaData.receptor.razonSocial} onChange={e => handleStateChange('receptor', 'razonSocial', e.target.value)} required className="mt-1 w-full border-gray-300 rounded-md" /></div>

                                    <div><label className="block text-sm font-medium">CUIT/DNI*</label><input type="text" value={state.facturaData.receptor.cuit} onChange={e => handleStateChange('receptor', 'cuit', e.target.value)} required className="mt-1 w-full border-gray-300 rounded-md" /></div>

                                    <div>

                                        <label className="block text-sm font-medium">Condición IVA*</label>

                                        <select value={state.facturaData.receptor.condicionIVA} onChange={e => handleStateChange('receptor', 'condicionIVA', e.target.value)} required disabled={esFacturaA} className={`mt-1 w-full border-gray-300 rounded-md ${esFacturaA ? 'bg-gray-200' : ''}`}>

                                            {opcionesIVAReceptor.map(cond => <option key={cond} value={cond}>{cond}</option>)}

                                        </select>

                                    </div>

                                    <div className="md:col-span-2"><label className="block text-sm font-medium">Domicilio</label><input type="text" value={state.facturaData.receptor.domicilio} onChange={e => handleStateChange('receptor', 'domicilio', e.target.value)} className="mt-1 w-full border-gray-300 rounded-md" /></div>

                                    <div><label className="block text-sm font-medium">Localidad</label><input type="text" value={state.facturaData.receptor.localidad} onChange={e => handleStateChange('receptor', 'localidad', e.target.value)} className="mt-1 w-full border-gray-300 rounded-md" /></div>

                                    <div><label className="block text-sm font-medium">Provincia</label><input type="text" value={state.facturaData.receptor.provincia} onChange={e => handleStateChange('receptor', 'provincia', e.target.value)} className="mt-1 w-full border-gray-300 rounded-md" /></div>

                                </div>

                            </fieldset>

                        </div>



                        {/* SECCIÓN DE ÍTEMS */}

                        <fieldset className="border p-4 rounded-lg shadow-md bg-slate-50">

                            <legend className="font-semibold text-lg px-2 text-slate-700">4. Ítems del Comprobante</legend>

                            <div className="flex justify-end mb-4">

                                <button type="button" onClick={() => setIsModalOpen(true)} disabled={!puntoSeleccionado} className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-semibold shadow-md disabled:bg-gray-400">Buscar y Agregar Producto</button>

                            </div>

                            <div className="overflow-x-auto">

                                <table className="min-w-full">

                                    <thead className="bg-gray-200"><tr><th className="p-2 text-left">Descripción</th><th className="p-2 text-center">Cant.</th><th className="p-2 text-right">P. Unitario</th><th className="p-2 text-right">Subtotal</th><th className="p-2"></th></tr></thead>

                                    <tbody>

                                        {state.facturaData.items.length === 0 ? (<tr><td colSpan="5" className="text-center p-4">No hay productos agregados.</td></tr>) :

                                            state.facturaData.items.map((item, index) => (

                                                <tr key={item._id + '-' + index} className="border-b">

                                                    <td className="p-2">{item.descripcion}</td>

                                                    <td className="p-2 text-center"><input type="number" value={item.cantidad} onChange={e => handleQuantityChange(index, e.target.value)} className="w-20 p-1 border rounded text-center" /></td>

                                                    <td className="p-2 text-right">${item.precioUnitario.toFixed(2)}</td>

                                                    <td className="p-2 text-right font-semibold">${(item.precioUnitario * item.cantidad).toFixed(2)}</td>

                                                    <td className="p-2 text-center"><button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 font-bold">X</button></td>

                                                </tr>

                                            ))}

                                    </tbody>

                                </table>

                            </div>

                        </fieldset>



                        {/* SECCIÓN DE TRIBUTOS ADICIONALES */}

                        <fieldset className="border p-4 rounded-lg shadow-md bg-slate-50">

                            <legend className="font-semibold text-lg px-2 text-slate-700">5. Tributos Adicionales</legend>

                            <div className="flex space-x-2 mb-4">

                                <input type="text" name="tributoDesc" ref={tributoDescRef} placeholder="Descripción del Tributo" className="flex-1 p-2 border rounded-md" />

                                <input type="number" name="tributoAlic" ref={tributoAlicRef} step="0.01" placeholder="Alícuota %" className="w-24 p-2 border rounded-md" />

                                <input type="number" name="tributoImp" ref={tributoImpRef} step="0.01" placeholder="Importe" className="w-24 p-2 border rounded-md" />

                                <button type="button" onClick={handleAddTributo} className="bg-slate-600 text-white p-2 rounded-md hover:bg-slate-700">Agregar</button>

                            </div>

                            <div className="overflow-x-auto">

                                <table className="min-w-full">

                                    <thead className="bg-gray-200"><tr><th className="p-2 text-left">Descripción</th><th className="p-2 text-right">Alícuota</th><th className="p-2 text-right">Importe</th><th className="p-2"></th></tr></thead>

                                    <tbody>

                                        {state.tributos.length === 0 ? (<tr><td colSpan="4" className="text-center p-4">No hay tributos agregados.</td></tr>) :

                                            state.tributos.map((tributo, index) => (

                                                <tr key={index} className="border-b">

                                                    <td className="p-2">{tributo.Desc}</td>

                                                    <td className="p-2 text-right">{tributo.Alic.toFixed(2)}%</td>

                                                    <td className="p-2 text-right">${tributo.Importe.toFixed(2)}</td>

                                                    <td className="p-2 text-center"><button type="button" onClick={() => handleRemoveTributo(index)} className="text-red-500 hover:text-red-700 font-bold">X</button></td>

                                                </tr>

                                            ))}

                                    </tbody>

                                </table>

                            </div>

                        </fieldset>



                        {/* SECCIÓN DE FORMAS DE PAGO */}

                        <fieldset className="border p-4 rounded-lg shadow-md bg-slate-50">

                            <legend className="font-semibold text-lg px-2 text-slate-700">6. Formas de Pago</legend>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div>

                                    <label htmlFor="formaPago" className="block text-sm font-medium text-gray-700">Método de Pago</label>

                                    <select name="formaPago" value={state.facturaData.pagos.formaPago} onChange={handlePagoChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3">

                                        {METODOS_PAGO.map(metodo => (

                                            <option key={metodo} value={metodo}>{metodo}</option>

                                        ))}

                                    </select>

                                </div>

                                {state.facturaData.pagos.formaPago === "Efectivo" && (

                                    <div>

                                        <label htmlFor="montoPago" className="block text-sm font-medium text-gray-700">Monto Recibido</label>

                                        <input type="number" name="monto" value={state.facturaData.pagos.monto} onChange={handlePagoChange} step="0.01" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3" />

                                    </div>

                                )}

                            </div>

                        </fieldset>



                        {/* SECCIÓN DE TOTALES Y BOTÓN DE ENVÍO */}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                            <div className="border p-4 rounded-lg bg-slate-800 text-white shadow-md">

                                <h3 className="font-semibold text-lg mb-3">Totales</h3>

                                <div className="space-y-2 text-lg">

                                    <div className="flex justify-between"><span className="font-medium">Subtotal Neto:</span><span>${state.facturaData.totales.subtotal.toFixed(2)}</span></div>

                                    <div className="flex justify-between"><span className="font-medium">IVA:</span><span>${state.facturaData.totales.iva.toFixed(2)}</span></div>

                                    <div className="flex justify-between"><span className="font-medium">Otros Tributos:</span><span>${state.facturaData.totales.importeOtrosTributos.toFixed(2)}</span></div>

                                    <div className="flex justify-between border-t border-slate-500 pt-2 mt-2"><span className="font-bold text-2xl">TOTAL:</span><span className="font-bold text-2xl">${state.facturaData.totales.total.toFixed(2)}</span></div>

                                    {state.facturaData.pagos.formaPago === "Efectivo" && (

                                        <div className="flex justify-between border-t border-slate-500 pt-2 mt-2"><span className="font-bold text-lg">Cambio:</span><span className="font-bold text-lg">${(state.facturaData.pagos.monto - state.facturaData.totales.total).toFixed(2)}</span></div>

                                    )}

                                </div>

                            </div>

                            <div className="flex flex-col justify-end h-full pt-4">

                                <div className="mb-4">

                                    <label className="block text-sm font-medium text-gray-700">Observaciones</label>

                                    <textarea value={state.facturaData.observaciones} onChange={e => dispatch({ type: 'UPDATE_OBSERVACIONES', payload: e.target.value })} className="mt-1 w-full border-gray-300 rounded-md shadow-sm py-2 px-3" rows="3"></textarea>

                                </div>

                                <button type="submit" disabled={loading || !puntoSeleccionado || state.facturaData.items.length === 0} className="w-full py-3 px-8 bg-green-600 text-white font-bold text-lg rounded-md shadow-lg hover:bg-green-700 disabled:opacity-50 transition-transform transform hover:scale-105">

                                    {loading ? 'Procesando...' : 'Emitir Comprobante'}

                                </button>

                                <button type="button" onClick={handleClearForm} disabled={loading} className="w-full mt-2 py-3 px-8 bg-red-600 text-white font-bold text-lg rounded-md shadow-lg hover:bg-red-700 disabled:opacity-50">

                                    Limpiar Formulario

                                </button>

                            </div>

                        </div>

                    </form>

                </div>

            </div>

            {isModalOpen && <ProductSearchModal onProductSelect={handleProductSelect} onClose={() => setIsModalOpen(false)} puntoVentaId={puntoSeleccionado} />}

        </>

    );

} 