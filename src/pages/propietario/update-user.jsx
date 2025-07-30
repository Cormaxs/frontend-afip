import React, { useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiContext } from '../../context/api_context.jsx';
import Swal from 'sweetalert2';

// --- Icono de Spinner para el botón de carga ---
const SpinnerIcon = ({ className = "h-5 w-5" }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default function UpdateUser() {
    const { updateUser, userData } = useContext(apiContext);
    const [showPassword, setShowPassword] = useState(false); // ✨ Estado para controlar la visibilidad

    const { register, handleSubmit, formState: { errors, isSubmitting, isDirty }, watch, reset } = useForm({
        defaultValues: {
            nombre: '',
            apellido: '',
            password: '',
            confirmPassword: ''
        }
    });

    useEffect(() => {
        if (userData) {
            reset({
                nombre: userData.nombre || '',
                apellido: userData.apellido || '',
            });
        }
    }, [userData, reset]);

    const password = watch("password");

    const onSubmit = async (data) => {
        const dataToSend = { ...data };

        if (!dataToSend.password) {
            delete dataToSend.password;
        }
        
        delete dataToSend.confirmPassword;

        try {
            await updateUser(userData._id, dataToSend);
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: 'Tu perfil ha sido actualizado correctamente.',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Ocurrió un error al actualizar tu perfil.';
            Swal.fire({
                icon: 'error',
                title: '¡Error!',
                text: errorMessage,
            });
            console.error("Error al actualizar usuario:", err);
        }
    };

    if (!userData) {
        return <div className="text-center p-10">Cargando datos del usuario...</div>;
    }

    const commonInputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[var(--principal)] focus:border-[var(--principal)]";
    const disabledInputClasses = `${commonInputClasses} bg-gray-100 cursor-not-allowed`;
    const labelClasses = "block text-sm font-medium text-gray-700";

    return (
        <div className=" min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-3xl mx-auto">
                <div className=" p-8 rounded-xl border ">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Mi Perfil</h2>
                    
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        {/* --- SECCIÓN DATOS DE LA CUENTA (NO EDITABLES) --- */}
                        <fieldset>
                            <legend className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Datos de la Cuenta</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="username" className={labelClasses}>Nombre de Usuario</label>
                                    <input id="username" type="text" value={userData.username || ''} disabled className={disabledInputClasses} />
                                </div>
                                <div>
                                    <label htmlFor="email" className={labelClasses}>Email</label>
                                    <input id="email" type="email" value={userData.email || ''} disabled className={disabledInputClasses} />
                                </div>
                                <div>
                                    <label htmlFor="rol" className={labelClasses}>Rol Asignado</label>
                                    <input id="rol" type="text" value={userData.rol || ''} disabled className={disabledInputClasses} />
                                </div>
                            </div>
                        </fieldset>

                        {/* --- SECCIÓN DATOS PERSONALES (EDITABLES) --- */}
                        <fieldset>
                            <legend className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Datos Personales</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="nombre" className={labelClasses}>Nombre</label>
                                    <input id="nombre" type="text" {...register("nombre", { required: "Tu nombre es requerido." })} className={commonInputClasses} />
                                    {errors.nombre && <em className="text-red-500 text-xs mt-1">{errors.nombre.message}</em>}
                                </div>
                                <div>
                                    <label htmlFor="apellido" className={labelClasses}>Apellido</label>
                                    <input id="apellido" type="text" {...register("apellido", { required: "Tu apellido es requerido." })} className={commonInputClasses} />
                                    {errors.apellido && <em className="text-red-500 text-xs mt-1">{errors.apellido.message}</em>}
                                </div>
                            </div>
                        </fieldset>

                        {/* --- SECCIÓN CAMBIAR CONTRASEÑA (OPCIONAL) --- */}
                        <fieldset>
                             <legend className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Cambiar Contraseña (opcional)</legend>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* ✨ CAMPO MODIFICADO: Nueva Contraseña con ícono */}
                                <div>
                                    <label htmlFor="password" className={labelClasses}>Nueva Contraseña</label>
                                    <div className="relative">
                                        <input 
                                            id="password" 
                                            type={showPassword ? 'text' : 'password'} 
                                            {...register("password", { minLength: { value: 6, message: "Debe tener al menos 6 caracteres." } })} 
                                            className={commonInputClasses} 
                                            placeholder="Dejar en blanco para no cambiar" 
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowPassword(!showPassword)} 
                                            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                        >
                                            <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                                        </button>
                                    </div>
                                    {errors.password && <em className="text-red-500 text-xs mt-1">{errors.password.message}</em>}
                                </div>
                                {/* ✨ CAMPO MODIFICADO: Confirmar Contraseña con ícono */}
                                <div>
                                    <label htmlFor="confirmPassword" className={labelClasses}>Confirmar Nueva Contraseña</label>
                                    <div className="relative">
                                        <input 
                                            id="confirmPassword" 
                                            type={showPassword ? 'text' : 'password'} 
                                            {...register("confirmPassword", { validate: value => value === password || "Las contraseñas no coinciden." })} 
                                            className={commonInputClasses} 
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowPassword(!showPassword)} 
                                            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                        >
                                            <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                                        </button>
                                    </div>
                                    {errors.confirmPassword && <em className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</em>}
                                </div>
                             </div>
                        </fieldset>

                        {/* --- BOTÓN DE ENVÍO --- */}
                        <div className="flex justify-end pt-4">
                            <button 
                                type="submit" 
                                disabled={isSubmitting || !isDirty} 
                                className="inline-flex items-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--principal)] hover:bg-[var(--principal-shadow)] disabled:bg-indigo-300 disabled:cursor-not-allowed"
                            >
                                {isSubmitting && <SpinnerIcon className="h-5 w-5 -ml-1 mr-2"/>}
                                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}