import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiContext } from "../../context/api_context.jsx";

export function RegisterPage() {
    const navigate = useNavigate();
    const { register } = useContext(apiContext);

    const initialEmpresa = (() => { try { const d = JSON.parse(localStorage.getItem('dataEmpresa')); return { id: d?._id || '', name: d?.nombreEmpresa || '' }; } catch (e) { console.error("Error parsing dataEmpresa:", e); return { id: '', name: '' }; } })();

    const [formData, setFormData] = useState({ username: '', password: '', email: '', nombre: '', apellido: '', rol: 'user', empresa: initialEmpresa.id, activo: true });
    const [displayedEmpresaName, setDisplayedEmpresaName] = useState(initialEmpresa.name);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({ msg: '', type: '' });

    const roles = [{ value: 'admin_principal', label: 'Administrador Principal' }, { value: 'admin', label: 'Administrador' }, { value: 'user', label: 'Usuario Regular' }, { value: 'reportes', label: 'Solo Reportes' }];

    useEffect(() => {
        const hS = () => { const curr = (() => { try { const d = JSON.parse(localStorage.getItem('dataEmpresa')); return { id: d?._id || '', name: d?.nombreEmpresa || '' }; } catch (e) { return { id: '', name: '' }; } })();
        if (curr.id && curr.id !== formData.empresa) setFormData(p => ({ ...p, empresa: curr.id }));
        if (curr.name !== displayedEmpresaName) setDisplayedEmpresaName(curr.name); };
        window.addEventListener('storage', hS); return () => window.removeEventListener('storage', hS);
    }, [formData.empresa, displayedEmpresaName]);

    const handleChange = e => { const { name, value, checked } = e.target;
        if (name === 'empresa') { if (initialEmpresa.id) return; setFormData(p => ({ ...p, empresa: value })); setDisplayedEmpresaName(value); }
        else if (name === 'activo') setFormData(p => ({ ...p, activo: checked }));
        else setFormData(p => ({ ...p, [name]: value }));
    };

    const handleSubmit = async e => {
        e.preventDefault(); setLoading(true); setFeedback({ msg: '', type: '' });
        try {
            if (!formData.password || formData.password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
            if (!formData.empresa) throw new Error('El ID de la empresa es obligatorio.');
            await register(formData); setFeedback({ msg: '¡Registro exitoso! Redirigiendo...', type: 'success' });
            setFormData({ username: '', password: '', email: '', nombre: '', apellido: '', rol: 'user', empresa: initialEmpresa.id, activo: true });
            if (!initialEmpresa.id) setDisplayedEmpresaName('');
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            console.error("Error during registration:", err);
            setFeedback({ msg: err.response?.data?.message || err.message || 'Error al registrar. Intenta de nuevo.', type: 'error' });
        } finally { setLoading(false); }
    };

    return ( // JSX starts here (counted from <div className="min-h-screen...)
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6">Crear Cuenta</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} ph="Tu nombre" disabled={loading} label="Nombre*" />
                        <Input id="apellido" name="apellido" value={formData.apellido} onChange={handleChange} ph="Tu apellido" disabled={loading} label="Apellido*" />
                    </div>
                    <Input id="username" name="username" value={formData.username} onChange={handleChange} ph="Crea tu nombre de usuario" disabled={loading} label="Nombre de Usuario*" />
                    <Input type="email" id="email" name="email" value={formData.email} onChange={handleChange} ph="tu@email.com" disabled={loading} label="Correo Electrónico*" />
                    <Input id="empresa" name="empresa" value={displayedEmpresaName} onChange={handleChange} ph="Nombre de la empresa o ID" disabled={loading || !!initialEmpresa.id} label="Nombre de Empresa*"
                        className={`${initialEmpresa.id ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
                    <div><label htmlFor="rol" className="block text-sm font-medium text-gray-700">Rol*</label>
                        <select id="rol" name="rol" value={formData.rol} onChange={handleChange} required disabled={loading} className="w-full px-3 py-2 border rounded-md">
                            {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
                    <Input type="password" id="password" name="password" value={formData.password} onChange={handleChange} ph="Crea una contraseña segura" disabled={loading} label="Contraseña* (mínimo 8 caracteres)" minLength="8" />
                    <div className="flex items-center">
                        <input type="checkbox" id="activo" name="activo" checked={formData.activo} onChange={handleChange} disabled={loading} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                        <label htmlFor="activo" className="ml-2 block text-sm text-gray-700">Usuario activo</label>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50">
                        {loading ? 'Registrando...' : 'Registrarse'}</button>
                </form>
                {feedback.msg && (<p className={`mt-4 text-center text-sm ${feedback.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{feedback.msg}</p>)}
                <p className="mt-6 text-center text-sm text-gray-600">¿Ya tienes cuenta? <Link to="/login" className="text-blue-500 hover:underline">Inicia sesión aquí</Link></p>
            </div>
        </div>
    );
}

// Componente auxiliar para Input (no cuenta en las líneas del componente principal)
const Input = ({ label, id, ph, type = 'text', ...props }) => (
    <div><label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <input id={id} type={type} placeholder={ph} {...props} className={"w-full px-3 py-2 border rounded-md " + (props.className || "")} required /></div>
);