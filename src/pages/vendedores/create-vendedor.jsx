import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { apiContext } from "../../context/api_context";

// --- CONFIGURACIÓN ---
const ROLES_DISPONIBLES = [
    { value: 'admin_principal', label: 'Admin Principal' },
    { value: 'vendedor_activo', label: 'Vendedor Activo' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'gestor_contable', label: 'Gestor Contable' },
    { value: 'empleado_administrativo', label: 'Empleado Administrativo' },
    { value: 'solo_visualizacion', label: 'Solo Visualización' }
];
const ROLES_CON_PUNTOS_DE_VENTA = ['vendedor_activo', 'supervisor'];

export default function AddVendedores() {
    const { createVendedor, getPointsByCompany } = useContext(apiContext);

    // --- ESTADOS DEL COMPONENTE ---
    const [companyInfo, setCompanyInfo] = useState({ id: '', name: '' });
    const [availablePoints, setAvailablePoints] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [serverFeedback, setServerFeedback] = useState({ msg: '', type: '' });
    const [selectedPointId, setSelectedPointId] = useState('');

    // --- CONFIGURACIÓN DEL FORMULARIO (Igual que en LoginPage) ---
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

    const rolSeleccionado = watch('rol'); // Observamos el rol para validación condicional
    const puntosAsignadosActuales = watch('puntosVentaAsignados');

    // --- LÓGICA DE CARGA DE DATOS ---
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const userDataString = localStorage.getItem("userData");
                const dataEmpresaString = localStorage.getItem("dataEmpresa");
                const companyId = userDataString ? JSON.parse(userDataString).empresa : null;
                const companyName = dataEmpresaString ? JSON.parse(dataEmpresaString).nombreEmpresa : 'Empresa';

                if (!companyId) throw new Error("ID de empresa no encontrado.");
                
                setCompanyInfo({ id: companyId, name: companyName });
                setValue('empresa', companyId);

                const response = await getPointsByCompany(companyId, 1, 200);
                if (!response?.puntosDeVenta) {
                    throw new Error("La respuesta de la API para los puntos de venta es inválida.");
                }
                setAvailablePoints(response.puntosDeVenta);
            } catch (err) {
                console.error("Error al cargar datos:", err);
                setServerFeedback({ msg: err.message, type: 'error' });
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, [getPointsByCompany, setValue]);
    
    // --- LÓGICA PARA MANEJAR PUNTOS DE VENTA ---
    const handleAddPoint = () => {
        if (selectedPointId && !(puntosAsignadosActuales || []).includes(selectedPointId)) {
            setValue('puntosVentaAsignados', [...(puntosAsignadosActuales || []), selectedPointId], { shouldValidate: true });
            setSelectedPointId('');
        }
    };

    const handleRemovePoint = (idToRemove) => {
        setValue('puntosVentaAsignados', (puntosAsignadosActuales || []).filter(id => id !== idToRemove), { shouldValidate: true });
    };

    const pointsMap = useMemo(() => new Map(availablePoints.map(p => [p._id, p.nombre])), [availablePoints]);
    const getPointNameById = useCallback((id) => pointsMap.get(id) || `ID Desconocido`, [pointsMap]);

    const unassignedPoints = useMemo(() => 
        availablePoints.filter(p => !(puntosAsignadosActuales || []).includes(p._id)),
        [availablePoints, puntosAsignadosActuales]
    );

    // --- FUNCIÓN DE ENVÍO (Igual que en LoginPage, recibe 'data') ---
    const onSubmit = async (data) => {
        setServerFeedback({ msg: '', type: '' });
        
        // Si el rol no necesita puntos, se asegura de que el array vaya vacío
        if (!ROLES_CON_PUNTOS_DE_VENTA.includes(data.rol)) {
            data.puntosVentaAsignados = [];
        }

        try {
            await createVendedor(data);
            setServerFeedback({ msg: '¡Empleado registrado exitosamente!', type: 'success' });
            reset({
                // Resetear campos específicos manteniendo los que no cambian
                ...getValues(),
                username: '', password: '', email: '', nombre: '', apellido: '', telefono: '', dni: '', llegada: '', salida: '',
                puntosVentaAsignados: []
            });
            setTimeout(() => setServerFeedback({ msg: '', type: '' }), 4000);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Error desconocido.';
            setServerFeedback({ msg: errorMessage, type: 'error' });
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-[var(--principal-activo)] to-indigo-700 p-6 text-center">
                    <h1 className="text-2xl font-bold text-white tracking-wide">Agregar Nuevo Empleado</h1>
                </div>

                {/* handleSubmit envuelve a onSubmit para validar primero (Igual que en LoginPage) */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        {/* --- Columna Izquierda: Cuenta --- */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Información de Cuenta</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username*</label>
                                {/* 1. Se registra el campo con sus reglas de validación */}
                                <input {...register("username", { required: "El username es obligatorio." })} placeholder='Nombre de usuario' className="w-full input-style"/>
                                {/* 2. Se muestra el mensaje de error si existe (Mismo patrón que LoginPage) */}
                                {errors.username && <em className="error-msg text-red-500 ">{errors.username.message}</em>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password*</label>
                                <input type="password" {...register("password", { required: "La contraseña es obligatoria.", minLength: { value: 8, message: "Mínimo 8 caracteres." } })} placeholder='Contraseña ' className="w-full input-style"/>
                                {errors.password && <em className="error-msg text-red-500">{errors.password.message}</em>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                                <input type="email" {...register("email", { required: "El email es obligatorio.", pattern: { value: /^\S+@\S+$/i, message: "Email inválido." } })}placeholder='CorreoEjemplo@ejemplo' className="w-full input-style"/>
                                {errors.email && <em className="error-msg text-red-500">{errors.email.message}</em>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rol*</label>
                                <select {...register("rol")} className="w-full input-style">
                                    {ROLES_DISPONIBLES.map(rol => <option key={rol.value} value={rol.value}>{rol.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                                <input value={companyInfo.name} readOnly className="w-full input-style-read-only"/>
                            </div>
                        </div>
                        
                        {/* --- Columna Derecha: Personal --- */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Información Personal</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre*</label>
                                <input {...register("nombre", { required: "El nombre es obligatorio." })}placeholder='Nombre DNI' className="w-full input-style"/>
                                {errors.nombre && <em className="error-msg text-red-500">{errors.nombre.message}</em>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido*</label>
                                <input {...register("apellido", { required: "El apellido es obligatorio." })}placeholder='Apellido DNI' className="w-full input-style"/>
                                {errors.apellido && <em className="error-msg text-red-500">{errors.apellido.message}</em>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                                <input {...register("dni")}placeholder='Sin puntos' className="w-full input-style"/>
                            </div>
                           
                           {/* <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Hora Llegada</label><input type="time" {...register("llegada")} className="w-full input-style"/></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Hora Salida</label><input type="time" {...register("salida")} className="w-full input-style"/></div>
                            </div>
                             */}
                        </div>
                    </div>

                    {/* --- SECCIÓN DE PUNTOS DE VENTA CON VALIDACIÓN --- */}
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800">Asignar Puntos de Venta</h2>
                        {isLoading ? (<p className="text-gray-600 animate-pulse">Cargando puntos...</p>) : (
                            <>
                                <div className="flex items-center gap-2">
                                    <select 
                                        value={selectedPointId} 
                                        onChange={(e) => setSelectedPointId(e.target.value)} 
                                        disabled={isSubmitting} 
                                        className="flex-1 input-style"
                                    >
                                        <option value="">Seleccionar un punto...</option>
                                        {unassignedPoints.map(p => (
                                            <option key={p._id} value={p._id}>{p.nombre}</option>
                                        ))}
                                    </select>
                                    <button 
                                        type="button" 
                                        onClick={handleAddPoint} 
                                        disabled={!selectedPointId || isSubmitting} 
                                        className="px-5 py-2 rounded-lg font-semibold transition text-white bg-[var(--principal)] hover:bg-[var(--principal-activo)] disabled:bg-gray-300"
                                    >
                                        Agregar
                                    </button>
                                </div>
                                
                                {/* Campo oculto para registrar y validar el array de puntos de venta */}
                                <input type="hidden" {...register('puntosVentaAsignados', {
                                    validate: value => {
                                        // Validar solo si el rol está en la lista de roles que requieren puntos de venta
                                        if (ROLES_CON_PUNTOS_DE_VENTA.includes(rolSeleccionado) && (!value || value.length === 0)) {
                                            return "Debe asignar al menos un punto de venta para este rol.";
                                        }
                                        return true;
                                    }
                                })}/>
                                {/* Muestra el error de validación para los puntos de venta */}
                                {errors.puntosVentaAsignados && <em className="error-msg text-red-500">{errors.puntosVentaAsignados.message}</em>}
                                
                                {(puntosAsignadosActuales || []).length > 0 && (
                                    <div className="mt-2 space-y-2 pt-2">
                                        <h3 className="text-sm font-medium text-gray-700">Puntos asignados:</h3>
                                        <ul className="space-y-1">
                                            {(puntosAsignadosActuales || []).map(pointId => (
                                                <li key={pointId} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                                                    <span className="text-gray-800">{getPointNameById(pointId)}</span>
                                                    <button type="button" onClick={() => handleRemovePoint(pointId)} disabled={isSubmitting} className="text-red-500 hover:text-red-700 font-bold text-xl px-2">&times;</button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    
                    {/* --- BOTÓN DE ENVÍO Y MENSAJES --- */}
                    <div className="pt-4">
                        <button type="submit" disabled={isSubmitting || isLoading} className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors shadow-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400">
                            {isSubmitting || isLoading ? 'Guardando...' : 'Registrar Empleado'}
                        </button>
                        {serverFeedback.msg && (
                            <div className={`mt-4 p-3 rounded-lg text-sm text-center ${serverFeedback.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {serverFeedback.msg}
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

