import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form'; // 1. Importar el hook principal
import { apiContext } from '../../context/api_context.jsx';

export function LoginPage() {
    const { login } = useContext(apiContext);
    const navigate = useNavigate();
    const [serverError, setServerError] = useState('');

    // 2. Configurar useForm. Obtenemos funciones clave.
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    // - register: para conectar los inputs.
    // - handleSubmit: para envolver nuestra función de envío.
    // - formState: nos da el estado del formulario (errores, estado de carga, etc.)

    // 3. Nuestra función de envío. Recibe la 'data' del formulario ya validada.
    const onSubmit = async (data) => {
        setServerError('');
        try {
            const respuesta = await login(data);
           // console.log("Respuesta del login:", respuesta);
            navigate('/');
        } catch (err) {
            //console.log("el error es -as ",err.response?.data?.error)
            const errorMessage =  err.response?.data?.error || err.response?.data?.errors[0]?.msg || 'Error de conexión o credenciales inválidas.';
            setServerError(errorMessage);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm text-center">
                <h1 className='text-xl font-bold mb-4'>Es necesario tener una empresa / local registrado</h1>
                <h2 className="text-2xl font-bold mb-6">Iniciar Sesión</h2>

                {/* handleSubmit se encarga de la validación antes de llamar a nuestro 'onSubmit' */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-left text-sm font-medium text-gray-700">Nombre de usuario</label>
                        {/* 4. Conectamos el input usando 'register' y añadimos reglas de validación simples */}
                        <input
                            id="username"
                            type="text"
                            placeholder="Usuario"
                            className="block w-full border border-gray-300 rounded-md p-2 mt-1"
                            disabled={isSubmitting}
                            {...register("username", { required: "El nombre de usuario es requerido." })}
                        />
                        {/* 5. Mostramos el error si existe para este campo */}
                        {errors.username && <em className="text-red-500 text-xs text-left block mt-1">{errors.username.message}</em>}
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-left text-sm font-medium text-gray-700">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Contraseña"
                            className="block w-full border border-gray-300 rounded-md p-2 mt-1"
                            disabled={isSubmitting}
                            {...register("password", {
                                required: "La contraseña es requerida.",
                                minLength: { value: 8, message: "La contraseña debe tener al menos 8 caracteres." }
                            })}
                        />
                        {errors.password && <em className="text-red-500 text-xs text-left block mt-1">{errors.password.message}</em>}
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:opacity-50">
                        {isSubmitting ? 'Cargando...' : 'Entrar'}
                    </button>
                </form>

                {serverError && <p className="mt-4 text-red-500 text-sm">{serverError}</p>}
                
                <div className='mt-6 space-y-2'>
                    <p className="text-sm text-gray-600">
                        ¿No tienes cuenta? <Link to="/register" className="text-blue-500 hover:underline">Regístrate</Link>
                    </p>
                    <p className="text-sm text-gray-600">
                        ¿No tienes Empresa? <Link to="/empresa-register" className="text-blue-500 hover:underline">Registrar empresa</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}