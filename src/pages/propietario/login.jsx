import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiContext } from "../../context/api_context.jsx";

export function LoginPage() {
    const [user, setUser] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useContext(apiContext);
    const navigate = useNavigate();

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true); setError('');
        try { await login(user); navigate('/'); }
        catch (err) { setError(err.response?.data?.message || 'Error de conexión o credenciales inválidas.'); }
        finally { setLoading(false); }
    };

    const handleChange = e => setUser({ ...user, [e.target.id]: e.target.value });

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm text-center">
            <h1 className='text-2xl font-bold mb-6'>Es necesario tener una empresa / local registrado</h1>
                <h2 className="text-2xl font-bold mb-6">Iniciar Sesión</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" id="username" value={user.username} onChange={handleChange} disabled={loading}
                        placeholder="Usuario" className="block w-full border border-gray-300 rounded-md p-2" required />
                    <input type="password" id="password" value={user.password} onChange={handleChange} disabled={loading}
                        placeholder="Contraseña" className="block w-full border border-gray-300 rounded-md p-2" required />
                    <button type="submit" disabled={loading}
                        className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:opacity-50">
                        {loading ? 'Cargando...' : 'Entrar'}
                    </button>
                </form>
                {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
                <p className="mt-6 text-sm text-gray-600">
                    ¿No tienes cuenta? <Link to="/register" className="text-blue-500 hover:underline">Regístrate</Link>
                </p>
                <p className="mt-6 text-sm text-gray-600">
                    ¿No tienes Empresa? <Link to="/empresa-register" className="text-blue-500 hover:underline">Registrar empresa</Link>
                </p>
            </div>
        </div>
    );
}