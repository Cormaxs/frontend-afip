import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiContext } from "../../context/api_context.jsx";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useContext(apiContext);

  // --- Logic to get company data from localStorage ---
  // Safely parse data from localStorage.
  // Use a temporary variable to hold the parsed object, default to null.
  let initialEmpresaData = null;
  try {
    const storedData = localStorage.getItem('dataEmpresa');
    if (storedData) {
      initialEmpresaData = JSON.parse(storedData);
    }
  } catch (error) {
    console.error("Error parsing 'dataEmpresa' from localStorage:", error);
    // You might want to handle this error state in the UI if needed
  }

  // Extract ID and Name, safely defaulting to empty strings if data isn't found
  const initialEmpresaId = initialEmpresaData?._id || '';
  const initialEmpresaName = initialEmpresaData?.nombreEmpresa || '';

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    nombre: '',
    apellido: '',
    rol: 'user',
    // Always store the ID in formData.empresa, as this is what the backend expects.
    empresa: initialEmpresaId, 
    activo: true
  });

  // State specifically for what's displayed in the "Company Name" input field.
  // This will show the name, while formData.empresa holds the ID.
  const [displayedEmpresaName, setDisplayedEmpresaName] = useState(initialEmpresaName);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const rolesDisponibles = [
    { value: 'admin_principal', label: 'Administrador Principal' },
    { value: 'admin', label: 'Administrador' },
    { value: 'user', label: 'Usuario Regular' },
    { value: 'reportes', label: 'Solo Reportes' }
  ];

  // Effect to listen for localStorage changes (e.g., if company is registered elsewhere)
  useEffect(() => {
    const handleStorageChange = () => {
      let currentEmpresaData = null;
      try {
        const storedData = localStorage.getItem('dataEmpresa');
        if (storedData) {
          currentEmpresaData = JSON.parse(storedData);
        }
      } catch (error) {
        console.error("Error re-parsing 'dataEmpresa' from localStorage in useEffect:", error);
      }

      const currentEmpresaId = currentEmpresaData?._id || '';
      const currentEmpresaName = currentEmpresaData?.nombreEmpresa || '';

      // Update formData.empresa if the ID from localStorage has changed
      if (currentEmpresaId && currentEmpresaId !== formData.empresa) {
        setFormData(prev => ({
          ...prev,
          empresa: currentEmpresaId
        }));
      }
      // Always update the displayed name if it changes in localStorage
      if (currentEmpresaName !== displayedEmpresaName) {
        setDisplayedEmpresaName(currentEmpresaName);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [formData.empresa, displayedEmpresaName]); // Dependencies for re-running the effect

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Special handling for the 'empresa' field
    if (name === 'empresa') {
      // If a company ID is pre-filled from localStorage, prevent user from changing it.
      if (initialEmpresaId) { 
        return; 
      }
      // If no company ID is pre-filled, allow user to type and assume they are typing the ID.
      // Update both the value that will be sent (formData.empresa)
      // and the value that is displayed (displayedEmpresaName).
      setFormData(prev => ({
        ...prev,
        empresa: value // This is the ID that will be sent
      }));
      setDisplayedEmpresaName(value); // This is what the user sees
    } else {
      // For all other fields, update formData directly.
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCheckboxChange = (e) => {
    setFormData(prev => ({
      ...prev,
      activo: e.target.checked
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage('');
    setError('');

    try {
      if (!formData.password || formData.password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres.');
      }

      // Ensure the 'empresa' field (which holds the ID) is not empty
      if (!formData.empresa) {
        throw new Error('El ID de la empresa es obligatorio.');
      }

      const response = await register(formData); // formData.empresa correctly contains the ID

      console.log("Successful registration response from Context:", response);

      setMessage('¡Registro exitoso! Ahora puedes iniciar sesión.');
      // Reset form data after successful registration
      setFormData({
        username: '',
        password: '',
        email: '',
        nombre: '',
        apellido: '',
        rol: 'user',
        empresa: initialEmpresaId, // Keep the pre-filled ID, or empty string
        activo: true
      });
      // Also reset the displayed name if it wasn't pre-filled
      if (!initialEmpresaId) {
        setDisplayedEmpresaName('');
      }

      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (err) {
      console.error("Error during registration:", err);
      // More robust error message handling
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Error al registrar. Por favor, intenta de nuevo.');
      }
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-center">
          <h2 className="text-2xl font-bold text-white">Crear Cuenta</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* First row: Name and Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                Nombre*
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                placeholder="Tu nombre"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="apellido" className="block text-sm font-medium text-gray-700">
                Apellido*
              </label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                placeholder="Tu apellido"
                disabled={loading}
              />
            </div>
          </div>

          {/* Individual fields */}
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Nombre de Usuario*
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="Crea tu nombre de usuario"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo Electrónico*
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="tu@email.com"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="empresa" className="block text-sm font-medium text-gray-700">
              Nombre de Empresa*
            </label>
            <input
              type="text"
              id="empresa"
              name="empresa"
              // Use displayedEmpresaName to show the name to the user
              value={displayedEmpresaName} 
              onChange={handleChange}
              required
              // Disable the field if a company ID was pre-filled from localStorage
              disabled={loading || !!initialEmpresaId} // Use initialEmpresaId here
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition ${initialEmpresaId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="Nombre de la empresa o ID" // Updated placeholder for clarity
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="rol" className="block text-sm font-medium text-gray-700">
              Rol*
            </label>
            <select
              id="rol"
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              disabled={loading}
            >
              {rolesDisponibles.map(rol => (
                <option key={rol.value} value={rol.value}>{rol.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña* (mínimo 8 caracteres)
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="8"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="Crea una contraseña segura"
              disabled={loading}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="activo"
              name="activo"
              checked={formData.activo}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="activo" className="ml-2 block text-sm text-gray-700">
              Usuario activo
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-lg font-medium text-white ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} transition-colors shadow-md mt-4`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Registrando...
              </span>
            ) : 'Registrarse'}
          </button>
        </form>

        {/* User feedback messages */}
        {message && (
          <div className="mx-6 mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="px-6 pb-6 text-center">
          <p className="text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}