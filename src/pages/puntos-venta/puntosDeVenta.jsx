import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom'; // <--- 1. Importar useNavigate
import { apiContext } from "../../context/api_context.jsx";
import Swal from 'sweetalert2';

// --- Componentes de UI Genéricos ---

// Un contenedor base para las tarjetas y secciones
const Card = ({ children, className = '' }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
        {children}
    </div>
);

// Botón principal con variantes de estilo
const Button = ({ children, onClick, type = 'button', variant = 'primary', disabled = false, className = '' }) => {
    const baseClasses = 'inline-flex items-center justify-center px-4 py-2 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';
    const variants = {
        primary: 'bg-[var(--principal)] text-white border-transparent hover:bg-[var(--principal-shadow)] disabled:bg-[var(--principal-activo)] focus:ring-[var(--principal)]',
        secondary: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50 focus:ring-[var(--principal)]',
        danger: 'bg-[var(--rojo-cerrar)] text-white border-transparent hover:bg-[var(--rojo-cerrar-hover)] disabled:bg-red-300 focus:ring-[var(--rojo-cerrar)]',
        ghost: 'bg-transparent text-gray-600 border-transparent hover:bg-gray-100 disabled:opacity-50 focus:ring-[var(--principal)]', // Nuevo estilo para el botón de regreso
    };
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={`${baseClasses} ${variants[variant]} ${className}`}>
            {children}
        </button>
    );
};

// Componente Input para formularios, integrado con react-hook-form
const Input = React.forwardRef(({ id, label, error, ...props }, ref) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input id={id} ref={ref} {...props} className={`block w-full rounded-md shadow-sm border-gray-300 focus:border-[var(--principal)] focus:ring-[var(--principal)] sm:text-sm ${error ? 'border-[var(--rojo-cerrar)] ring-[var(--rojo-cerrar)]' : ''}`} />
        {error && <span className="text-[var(--rojo-cerrar)] text-xs mt-1">{error.message}</span>}
    </div>
));

// --- Iconos Reutilizables ---
const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);
const SpinnerIcon = (props) => <Icon path="M12 3v1m0 16v1m8.4-15.4l-.7.7m-11.4 0l.7.7M21 12h-1M4 12H3m15.4 8.4l-.7-.7m-11.4 0l.7-.7" {...props} className={`animate-spin ${props.className || 'h-5 w-5'}`} />;
const PlusIcon = (props) => <Icon path="M12 4.5v15m7.5-7.5h-15" {...props} />;
const CloseIcon = (props) => <Icon path="M6 18L18 6M6 6l12 12" {...props} />;
const ShopIcon = (props) => <Icon path="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h2.64m-13.5 0L12 15.75M3.75 21L12 15.75m0 0l8.25 5.25M12 15.75V3" {...props} />;
const LocationIcon = (props) => <Icon path="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" {...props} />;
const CalendarIcon = (props) => <Icon path="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18" {...props} />;
const ArrowLeftIcon = (props) => <Icon path="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" {...props} />; // Ícono de flecha izquierda

// --- Componente Modal para Agregar Punto de Venta ---
// (Contenido omitido por brevedad, se mantiene el original)
const AddPointSaleModal = ({ isOpen, onClose, onPointAdded }) => {
    const { createPointSale, userData, companyData } = useContext(apiContext);
    const provinciasArgentinas = ['Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'];

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
        defaultValues: { activo: true }
    });

    useEffect(() => {
        if (isOpen) {
            reset({
                empresa: userData?.empresa || '',
                companyName: companyData?.nombreEmpresa || '',
                activo: true,
                numero: '', nombre: '', direccion: '', ciudad: '', provincia: '',
                codigoPostal: '', telefono: '', fechaUltimoCbte: ''
            });
        }
    }, [isOpen, userData, companyData, reset]);

    const onSubmit = async (data) => {
        try {
            const dataToSend = { ...data, fechaUltimoCbte: data.fechaUltimoCbte || null };
            delete dataToSend.companyName;
            await createPointSale(dataToSend);
            onPointAdded();
        } catch (e) {
            Swal.fire('Error', e.response?.data?.message || 'No se pudo registrar el punto de venta.', 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="flex justify-between items-center p-5 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800">Agregar Nuevo Punto de Venta</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"><CloseIcon className="w-5 h-5" /></button>
                </header>
                
                <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input id="numero" label="Número*" type="number" {...register("numero", { required: "El número es obligatorio.", valueAsNumber: true, min: { value: 1, message: "Debe ser mayor a 0." } })} error={errors.numero} placeholder="Ej: 4" />
                        <Input id="nombre" label="Nombre*" type="text" {...register("nombre", { required: "El nombre es obligatorio." })} error={errors.nombre} placeholder="Ej: Sucursal Centro" />
                        <div className="md:col-span-2">
                            <Input id="direccion" label="Dirección" type="text" {...register("direccion")} error={errors.direccion} placeholder="Av. Corrientes 1234" />
                        </div>
                        <div>
                            <label htmlFor="provincia" className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                            <select id="provincia" {...register("provincia")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--principal)] focus:ring-[var(--principal)] sm:text-sm">
                                <option value="">Seleccione una provincia</option>
                                {provinciasArgentinas.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <Input id="ciudad" label="Ciudad" type="text" {...register("ciudad")} error={errors.ciudad} placeholder="Ej: Rosario" />
                    </div>
                    <div className="flex items-center pt-2">
                        <input type="checkbox" id="activo" {...register("activo")} className="h-4 w-4 text-[var(--principal)] border-gray-300 rounded focus:ring-[var(--principal)]" />
                        <label htmlFor="activo" className="ml-3 block text-sm text-gray-900">Punto de venta activo</label>
                    </div>
                </form>

                <footer className="flex justify-end items-center p-4 bg-gray-50 border-t border-gray-200 mt-auto">
                    <Button onClick={onClose} variant="secondary">Cancelar</Button>
                    <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="ml-3">
                        {isSubmitting ? <SpinnerIcon className="-ml-1 mr-2" /> : null}
                        {isSubmitting ? 'Guardando...' : 'Guardar Punto de Venta'}
                    </Button>
                </footer>
            </div>
        </div>
    );
};
// --- Sub-componentes de la Página Principal ---
// (PointOfSaleCard, SkeletonCard, EmptyState omitidos por brevedad, se mantienen los originales)

const PointOfSaleCard = ({ point }) => {
    const formatDateTime = (isoString) => {
        if (!isoString) return "No disponible";
        return new Date(isoString).toLocaleString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

    return (
        <Card className="p-5 flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
            <div>
                <header className="flex justify-between items-start mb-2">
                    <h2 className="text-lg font-bold text-gray-800 pr-2">{point.nombre}</h2>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap ${point.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-[var(--rojo-cerrar)]"}`}>
                        {point.activo ? "ACTIVO" : "INACTIVO"}
                    </span>
                </header>
                <p className="text-sm text-gray-500 mb-4">Punto de Venta N°: <span className="font-semibold text-gray-700">{String(point.numero).padStart(4, '0')}</span></p>
            </div>
            <div className="text-sm text-gray-600 space-y-3 border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-start">
                    <LocationIcon className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                    <span className="flex-grow">{point.direccion ? `${point.direccion}, ${point.ciudad || ''}, ${point.provincia || ''}` : 'Dirección no especificada'}</span>
                </div>
                <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                    <span>Últ. Comprobante: <b className="font-medium text-gray-800">{formatDateTime(point.fechaUltimoCbte)}</b></span>
                </div>
            </div>
        </Card>
    );
};

const SkeletonCard = () => (
    <Card className="p-5 animate-pulse">
        <div className="flex justify-between items-start mb-3">
            <div className="h-6 bg-gray-200 rounded-md w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded-md w-1/3 mb-5"></div>
        <div className="space-y-3 border-t border-gray-200 pt-4 mt-4">
            <div className="flex items-start">
                <div className="h-5 w-5 bg-gray-200 rounded-full mr-2"></div>
                <div className="h-4 bg-gray-200 rounded-md w-full"></div>
            </div>
            <div className="flex items-center">
                <div className="h-5 w-5 bg-gray-200 rounded-full mr-2"></div>
                <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
            </div>
        </div>
    </Card>
);

const EmptyState = () => (
    <Card className="text-center py-16 px-6 col-span-1 md:col-span-2">
        <ShopIcon className="mx-auto w-16 h-16 text-gray-300" />
        <h3 className="mt-4 text-xl font-semibold text-gray-800">No se encontraron puntos de venta</h3>
        <p className="mt-2 text-base text-gray-500">Intenta ajustar los filtros o agregá tu primer punto de venta.</p>
    </Card>
);

// --- Componente Principal Unificado ---
export default function GestionPuntosDeVenta() {
    const { getPointsByCompany, userData, companyData } = useContext(apiContext);
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Estado para la paginación y búsqueda
    const [searchParams, setSearchParams] = useState({
        page: 1,
        limit: 10,
        sortBy: 'nombre',
        order: 'asc',
        nombre: '',
        provincia: '',
        numero: ''
    });

    const fetchPoints = useCallback(async () => {
        const idEmpresa = userData?.empresa || companyData?._id;
        if (!idEmpresa) {
            setError('No se pudo obtener el ID de la empresa.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await getPointsByCompany(idEmpresa, searchParams);
            setData(response.data);
        } catch (err) {
            console.error("Error al cargar puntos de venta:", err);
            setError('Error al cargar los puntos de venta.');
        } finally {
            setIsLoading(false);
        }
    }, [userData, companyData, getPointsByCompany, searchParams]);

    useEffect(() => {
        fetchPoints();
    }, [fetchPoints]);

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearchParams(prev => ({ ...prev, [name]: value, page: 1 })); // Resetear a la primera página en cada búsqueda
    };

    const handlePageChange = (newPage) => {
        setSearchParams(prev => ({ ...prev, page: newPage }));
    };

    const handleSortChange = (newSortBy) => {
        setSearchParams(prev => ({
            ...prev,
            sortBy: newSortBy,
            order: prev.sortBy === newSortBy && prev.order === 'asc' ? 'desc' : 'asc',
            page: 1
        }));
    };

    const handlePointAdded = () => {
        setIsAddModalOpen(false);
        fetchPoints(); // Recargar la lista después de agregar
        Swal.fire('¡Éxito!', 'Punto de venta agregado correctamente.', 'success');
    };

    const totalPages = data?.pagination?.totalPages || 1;
    const currentPage = data?.pagination?.currentPage || 1;
    const hasNextPage = data?.pagination?.hasNextPage || false;
    const hasPrevPage = data?.pagination?.hasPrevPage || false;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchParams, setSearchParams] = useState({ nombre: '', provincia: '', numero: '' });

    const fetchPoints = useCallback(async (page, filters) => {
        // ... (lógica de fetchPoints)
        if (!userData?.empresa) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            // Limpia los filtros vacíos antes de enviar
            const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
            const responseData = await getPointsByCompany(userData.empresa, page, 10, cleanFilters);
            setData(responseData);
        } catch (err) {
            setError(err.message || "Ocurrió un error al cargar los puntos de venta.");
        } finally {
            setIsLoading(false);
        }
    }, [getPointsByCompany, userData]);

    useEffect(() => {
        if (userData?.empresa) {
            fetchPoints(currentPage, searchParams);
        }
    }, [currentPage, userData?.empresa, fetchPoints]);

    const handleSearchChange = (e) => setSearchParams(prev => ({ ...prev, [e.target.name]: e.target.value }));
    
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchPoints(1, searchParams);
    };

    const handleClearSearch = () => {
        setSearchParams({ nombre: '', provincia: '', numero: '' });
        setCurrentPage(1);
        fetchPoints(1, {}); // Pasamos un objeto vacío para limpiar filtros en el backend
    };

    const handlePointAdded = () => {
        setIsModalOpen(false);
        Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Punto de venta registrado correctamente.',
            timer: 2000,
            showConfirmButton: false
        });
        handleClearSearch(); // Limpia filtros y recarga desde la página 1
    };
    
    // <--- 3. Handler para navegar a la ruta de ventas
    const handleGoBack = () => {
        navigate('/ventas-junto');
    };
    // ----------------------------------------------------

    if (error) {
        return <div className="p-8 text-center bg-red-100 text-[var(--rojo-cerrar-hover)] rounded-lg m-4 sm:m-8">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Puntos de Venta</h1>
                    <Button onClick={() => setIsAddModalOpen(true)} variant="primary">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Agregar Punto de Venta
                    </Button>
                </div>

                {/* Filtros de Búsqueda */}
                <Card className="p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Buscar Puntos de Venta</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            id="searchNombre"
                            label="Nombre"
                            type="text"
                            name="nombre"
                            value={searchParams.nombre}
                            onChange={handleSearchChange}
                            placeholder="Buscar por nombre"
                        />
                        <Input
                            id="searchProvincia"
                            label="Provincia"
                            type="text"
                            name="provincia"
                            value={searchParams.provincia}
                            onChange={handleSearchChange}
                            placeholder="Buscar por provincia"
                        />
                        <Input
                            id="searchNumero"
                            label="Número"
                            type="number"
                            name="numero"
                            value={searchParams.numero}
                            onChange={handleSearchChange}
                            placeholder="Buscar por número"
                        />
                    </div>
                </Card>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <strong className="font-bold">Error:</strong>
                        <span className="block sm:inline"> {error}</span>
                    </div>
                )}

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(searchParams.limit)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : data?.puntosDeVenta?.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {data.puntosDeVenta.map(point => (
                                <PointOfSaleCard key={point._id} point={point} />
                            ))}
                        </div>

                        {/* Paginación */}
                        <div className="flex justify-between items-center mt-8">
                            <Button onClick={() => handlePageChange(currentPage - 1)} disabled={!hasPrevPage} variant="secondary">
                                <ArrowLeftIcon className="w-4 h-4 mr-2" /> Anterior
                            </Button>
                            <span className="text-gray-700">Página {currentPage} de {totalPages}</span>
                            <Button onClick={() => handlePageChange(currentPage + 1)} disabled={!hasNextPage} variant="secondary">
                                Siguiente <ArrowLeftIcon className="w-4 h-4 ml-2 rotate-180" />
                            </Button>
                        </div>
                    </>
                ) : (
                    <EmptyState />
                )}
            </div>

            <AddPointSaleModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onPointAdded={handlePointAdded}
            />
        </div>
    );
}