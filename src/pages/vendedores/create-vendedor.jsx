import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { apiContext } from "../../context/api_context";

// --- CONFIGURACIÓN DE ROLES CENTRALIZADA ---
const ROLES_DISPONIBLES = [
    { value: 'admin_principal', label: 'Admin Principal' },
    { value: 'vendedor_activo', label: 'Vendedor Activo' },
    { value: 'gestor_contable', label: 'Gestor Contable' },
    { value: 'empleado_administrativo', label: 'Empleado Administrativo' },
    { value: 'solo_visualizacion', label: 'Solo Visualización' }
];
const ROLES_CON_PUNTOS_DE_VENTA = ['vendedor_activo', 'supervisor'];


export default function AddVendedores() {
    const { createVendedor, getPointsByCompany } = useContext(apiContext);

    // --- ESTADOS NO RELACIONADOS AL FORMULARIO ---
    const [companyInfo, setCompanyInfo] = useState({ id: '', name: '' });
    const [availablePoints, setAvailablePoints] = useState([]);
    const [selectedPointId, setSelectedPointId] = useState('');
    const [loadingInitialData, setLoadingInitialData] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Cargando datos iniciales...');
    const [serverFeedback, setServerFeedback] = useState({ msg: '', type: '' });

    // --- CONFIGURACIÓN DE REACT-HOOK-FORM ---
    const { 
        register, handleSubmit, watch, setValue, getValues, reset,
        formState: { errors, isSubmitting }
    } = useForm({
        defaultValues: {
            username: '', password: '', email: '', empresa: '', rol: 'empleado_administrativo',
            puntosVentaAsignados: [], nombre: '', apellido: '', telefono: '', dni: '', 
            llegada: '', salida: ''
        }
    });

    const rolActual = watch('rol');
    const puntosAsignadosActuales = watch('puntosVentaAsignados');

    // --- LÓGICA DE CARGA INICIAL (CON PAGINACIÓN) ---
    useEffect(() => {
        const loadInitialData = async () => {
            setLoadingInitialData(true);
            setServerFeedback({ msg: '', type: '' });
            try {
                const userDataString = localStorage.getItem("userData");
                const dataEmpresaString = localStorage.getItem("dataEmpresa");
                const companyId = userDataString ? JSON.parse(userDataString).empresa : null;
                const companyName = dataEmpresaString ? JSON.parse(dataEmpresaString).nombreEmpresa : 'Empresa sin nombre';

                if (!companyId) throw new Error("ID de empresa no encontrado. Inicie sesión de nuevo.");

                setCompanyInfo({ id: companyId, name: companyName });
                setValue('empresa', companyId);

                setLoadingMessage('Consultando puntos de venta...');
                const initialResponse = await getPointsByCompany(companyId, 1, 100);
                
                if (!initialResponse?.puntosDeVenta || !initialResponse?.pagination) {
                    throw new Error("La respuesta de la API para los puntos de venta es inválida.");
                }

                let allPoints = initialResponse.puntosDeVenta;
                const { totalPages } = initialResponse.pagination;

                if (totalPages > 1) {
                    setLoadingMessage(`Cargando ${totalPages} páginas de puntos de venta...`);
                    const pagePromises = [];
                    for (let page = 2; page <= totalPages; page++) {
                        pagePromises.push(getPointsByCompany(companyId, page, 100));
                    }
                    const subsequentPages = await Promise.all(pagePromises);
                    subsequentPages.forEach(response => {
                        if (response?.puntosDeVenta) {
                            allPoints = [...allPoints, ...response.puntosDeVenta];
                        }
                    });
                }
                
                setAvailablePoints(allPoints);

            } catch (err) {
                console.error("Error al cargar datos iniciales:", err);
                setServerFeedback({ msg: err.message, type: 'error' });
            } finally {
                setLoadingInitialData(false);
                setLoadingMessage('');
            }
        };
        loadInitialData();
    }, [getPointsByCompany, setValue]);
    
    // --- LÓGICA PARA MANEJAR PUNTOS DE VENTA ---
    const handleAddPoint = () => {
        if (selectedPointId && !getValues('puntosVentaAsignados').includes(selectedPointId)) {
            setValue('puntosVentaAsignados', [...getValues('puntosVentaAsignados'), selectedPointId], { shouldValidate: true });
            setSelectedPointId('');
        }
    };

    const handleRemovePoint = (idToRemove) => {
        setValue('puntosVentaAsignados', getValues('puntosVentaAsignados').filter(id => id !== idToRemove), { shouldValidate: true });
    };

    const getPointNameById = useCallback((id) => {
        return availablePoints.find(pv => pv._id === id)?.nombre || `ID Desconocido`;
    }, [availablePoints]);

    // --- FUNCIÓN DE ENVÍO ---
    const onSubmit = async (data) => {
        setServerFeedback({ msg: '', type: '' });
        try {
            await createVendedor(data);
            setServerFeedback({ msg: '¡Empleado registrado exitosamente!', type: 'success' });
            reset();
            setTimeout(() => setServerFeedback({ msg: '', type: '' }), 4000);
        } catch (err) {
            console.error("Error al registrar empleado:", err);
            const errorMessage = err.response?.data?.message || err.message || 'Error desconocido.';
            setServerFeedback({ msg: errorMessage, type: 'error' });
        }
    };
    
    const unassignedPoints = availablePoints.filter(
        pv => !puntosAsignadosActuales.includes(pv._id)
    );

    useEffect(() => {
        if (ROLES_CON_PUNTOS_DE_VENTA.includes(rolActual)) {
            register('puntosVentaAsignados', { 
                validate: value => value.length > 0 || "Debe asignar al menos un punto de venta para este rol."
            });
        }
    }, [rolActual, register]);

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center">
                    <h1 className="text-2xl font-bold text-white tracking-wide">Agregar Nuevo Empleado</h1>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        {/* Columna Izquierda: Cuenta */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Información de Cuenta</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username*</label>
                                <input type="text" {...register("username", { required: "El username es obligatorio." })} disabled={isSubmitting} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"/>
                                {errors.username && <em className="text-red-500 text-xs mt-1">{errors.username.message}</em>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password* (mín. 8 caracteres)</label>
                                <input type="password" {...register("password", { required: "La contraseña es obligatoria.", minLength: { value: 8, message: "Mínimo 8 caracteres." } })} disabled={isSubmitting} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"/>
                                {errors.password && <em className="text-red-500 text-xs mt-1">{errors.password.message}</em>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                                <input type="email" {...register("email", { required: "El email es obligatorio.", pattern: { value: /^\S+@\S+$/i, message: "Email inválido." } })} disabled={isSubmitting} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"/>
                                {errors.email && <em className="text-red-500 text-xs mt-1">{errors.email.message}</em>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rol*</label>
                                <select {...register("rol")} disabled={isSubmitting} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition">
                                    {ROLES_DISPONIBLES.map(rol => <option key={rol.value} value={rol.value}>{rol.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                                <input type="text" value={companyInfo.name} readOnly className="w-full px-4 py-2 border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"/>
                            </div>
                        </div>
                        
                        {/* Columna Derecha: Personal */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Información Personal</h2>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre*</label>
                                <input type="text" {...register("nombre", { required: "El nombre es obligatorio." })} disabled={isSubmitting} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"/>
                                {errors.nombre && <em className="text-red-500 text-xs mt-1">{errors.nombre.message}</em>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido*</label>
                                <input type="text" {...register("apellido", { required: "El apellido es obligatorio." })} disabled={isSubmitting} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"/>
                                {errors.apellido && <em className="text-red-500 text-xs mt-1">{errors.apellido.message}</em>}
                            </div>
                             <div><label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label><input type="tel" {...register("telefono")} disabled={isSubmitting} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"/></div>
                             <div><label className="block text-sm font-medium text-gray-700 mb-1">DNI</label><input type="text" {...register("dni")} disabled={isSubmitting} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"/></div>
                             <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Hora Llegada</label><input type="time" {...register("llegada")} disabled={isSubmitting} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"/></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Hora Salida</label><input type="time" {...register("salida")} disabled={isSubmitting} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"/></div>
                             </div>
                        </div>
                    </div>

                    {/* --- SECCIÓN DINÁMICA DE PUNTOS DE VENTA --- */}
                    {ROLES_CON_PUNTOS_DE_VENTA.includes(rolActual) && (
                        <div className="space-y-4 pt-4 border-t border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800">Asignar Puntos de Venta</h2>
                            {loadingInitialData ? (<p className="text-gray-600 animate-pulse">{loadingMessage}</p>) : serverFeedback.type === 'error' && availablePoints.length === 0 ? (<p className="text-red-600">{serverFeedback.msg}</p>) : (
                                <div className="flex items-center gap-2">
                                    <select 
                                        value={selectedPointId} 
                                        onChange={(e) => setSelectedPointId(e.target.value)} 
                                        disabled={isSubmitting} 
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                                    >
                                        <option value="">Seleccionar un punto de venta...</option>
                                        {unassignedPoints.map(p => (
                                            <option key={p._id} value={p._id}>{p.nombre}</option>
                                        ))}
                                    </select>
                                    <button 
                                        type="button" 
                                        onClick={handleAddPoint} 
                                        disabled={!selectedPointId || isSubmitting} 
                                        className="px-5 py-2 rounded-lg font-semibold transition text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    >
                                        Agregar
                                    </button>
                                </div>
                            )}
                            
                            {errors.puntosVentaAsignados && <em className="text-red-500 text-xs mt-1">{errors.puntosVentaAsignados.message}</em>}
                            
                            {puntosAsignadosActuales.length > 0 && (
                                <div className="mt-2 space-y-2 pt-2">
                                    <h3 className="text-sm font-medium text-gray-700">Puntos asignados:</h3>
                                    <ul className="space-y-1">{puntosAsignadosActuales.map(pointId => (
                                        <li key={pointId} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                                            <span className="text-gray-800">{getPointNameById(pointId)}</span>
                                            <button type="button" onClick={() => handleRemovePoint(pointId)} disabled={isSubmitting} className="text-red-500 hover:text-red-700 font-bold text-xl px-2">&times;</button>
                                        </li>))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* --- BOTÓN DE ENVÍO Y MENSAJES --- */}
                    <div className="pt-4">
                        <button type="submit" disabled={isSubmitting || loadingInitialData} className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors shadow-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-wait">
                            {isSubmitting || loadingInitialData ? 'Guardando...' : 'Registrar Empleado'}
                        </button>
                        {serverFeedback.msg && (
                            <div className={`mt-4 p-3 rounded-lg text-sm text-center ${serverFeedback.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-green-100 text-green-800 border border-green-200'}`}>
                                {serverFeedback.msg}
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}