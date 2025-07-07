import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { apiContext } from "../../context/api_context.jsx";

// Componente auxiliar para inputs. Puede estar en su propio archivo.
const Input = React.forwardRef(({ label, id, error, ...props }, ref) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <input
            id={id}
            ref={ref}
            {...props}
            className={`w-full px-3 py-2 border rounded-md ${props.className || ''} ${error ? 'border-red-500' : 'border-gray-300'}`}
        />
        {error && <em className="text-red-600 text-xs text-left block mt-1">{error}</em>}
    </div>
));

// Función auxiliar para obtener datos de la empresa desde localStorage
const getInitialEmpresa = () => {
    try {
        const data = localStorage.getItem('dataEmpresa');
        if (!data) return { id: '', name: '' };
        const parsedData = JSON.parse(data);
        return { id: parsedData?._id || '', name: parsedData?.nombreEmpresa || '' };
    } catch (e) {
        console.error("Error al leer dataEmpresa:", e);
        return { id: '', name: '' };
    }
};

export function RegisterPage() {
    const navigate = useNavigate();
    const { register: apiRegister } = useContext(apiContext); // Renombrado para evitar conflicto
    const [serverFeedback, setServerFeedback] = useState({ msg: '', type: '' });
    const [initialEmpresa] = useState(getInitialEmpresa);

    const roles = [
        { value: 'admin_principal', label: 'Administrador Principal' },
        { value: 'gestor_contable', label: 'Gestor Contable' },
        { value: 'empleado_administrativo', label: 'Empleado Administrativo' },
        { value: 'solo_visualizacion', label: 'Solo Visualización' },
        { value: 'vendedor_activo', label: 'Vendedor' }
    ];

    // 1. Obtenemos 'setError' del hook useForm
    const { 
        register, 
        handleSubmit, 
        formState: { errors, isSubmitting }, 
        reset, 
        setValue,
        setError 
    } = useForm({
        defaultValues: {
            username: '',
            password: '',
            email: '',
            nombre: '',
            apellido: '',
            rol: 'vendedor_activo',
            empresa: initialEmpresa.id,
            activo: true
        }
    });

    // Efecto para actualizar el ID de la empresa si cambia en otra pestaña
    useEffect(() => {
        const handleStorageChange = () => {
            const currentEmpresa = getInitialEmpresa();
            if (currentEmpresa.id) {
                setValue('empresa', currentEmpresa.id);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [setValue]);

    // Función de envío con la lógica para manejar errores del servidor
    const onSubmit = async (data) => {
        setServerFeedback({ msg: '', type: '' });
        try {
            await apiRegister(data);
            setServerFeedback({ msg: '¡Registro exitoso! Redirigiendo...', type: 'success' });
            reset();
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            const serverErrors = err.response?.data?.errors;

            if (serverErrors && Array.isArray(serverErrors)) {
                // Si el backend devuelve un array de errores, los asignamos a cada campo
                serverErrors.forEach(error => {
                    if (error.path) {
                        setError(error.path, { 
                            type: 'server', 
                            message: error.msg 
                        });
                    }
                });
            } else {
                // Si no, mostramos un mensaje de error general
                const errorMessage = err.response?.data?.message || err.response.data.error || 'Error al registrar. Intenta de nuevo.';
                setServerFeedback({ msg: errorMessage, type: 'error' });
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6">Crear Cuenta</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Nombre*"
                            id="nombre"
                            disabled={isSubmitting}
                            error={errors.nombre?.message}
                            {...register("nombre", { required: "El nombre es obligatorio." })}
                        />
                        <Input
                            label="Apellido*"
                            id="apellido"
                            disabled={isSubmitting}
                            error={errors.apellido?.message}
                            {...register("apellido", { required: "El apellido es obligatorio." })}
                        />
                    </div>

                    <Input
                        label="Nombre de Usuario*"
                        id="username"
                        disabled={isSubmitting}
                        error={errors.username?.message}
                        {...register("username", { required: "El nombre de usuario es obligatorio." })}
                    />
                    <Input
                        label="Correo Electrónico*"
                        id="email"
                        type="email"
                        disabled={isSubmitting}
                        error={errors.email?.message}
                        {...register("email", {
                            required: "El email es obligatorio.",
                            pattern: { value: /^\S+@\S+$/i, message: "El formato del email no es válido." }
                        })}
                    />

                    <Input
                        label="Nombre de Empresa*"
                        id="empresa"
                        readOnly
                        value={initialEmpresa.name || 'Debe crear una empresa primero'}
                        disabled
                        className="bg-gray-100 cursor-not-allowed"
                        error={errors.empresa?.message}
                        {...register("empresa", { required: "El ID de la empresa es obligatorio." })}
                    />

                    <div>
                        <label htmlFor="rol" className="block text-sm font-medium text-gray-700">Rol*</label>
                        <select id="rol" {...register("rol")} disabled={isSubmitting} className="w-full px-3 py-2 border rounded-md border-gray-300">
                            {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>

                    <Input
                        label="Contraseña* (mínimo 8 caracteres)"
                        id="password"
                        type="password"
                        disabled={isSubmitting}
                        error={errors.password?.message}
                        {...register("password", {
                            required: "La contraseña es obligatoria.",
                            minLength: { value: 8, message: "La contraseña debe tener al menos 8 caracteres." }
                        })}
                    />

                    <div className="flex items-center">
                        <input type="checkbox" id="activo" {...register("activo")} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                        <label htmlFor="activo" className="ml-2 block text-sm text-gray-700">Usuario activo</label>
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50">
                        {isSubmitting ? 'Registrando...' : 'Registrarse'}
                    </button>
                </form>

                {serverFeedback.msg && (
                    <p className={`mt-4 text-center text-sm ${serverFeedback.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                        {serverFeedback.msg}
                    </p>
                )}
                
                <p className="mt-6 text-center text-sm text-gray-600">
                    ¿Ya tienes cuenta? <Link to="/login" className="text-blue-500 hover:underline">Inicia sesión aquí</Link>
                </p>
                <p className="mt-4 text-center text-sm text-gray-600">
                    ¿No tienes Empresa? <Link to="/empresa-register" className="text-blue-500 hover:underline">Registrar empresa</Link>
                </p>
            </div>
        </div>
    );
}