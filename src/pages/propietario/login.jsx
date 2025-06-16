import { Login } from "../../api/coneccion"; // Asegúrate de que esta ruta sea correcta
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Para redireccionar después del login
import { Link } from 'react-router-dom';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(''); // Mensaje de éxito (ej. "¡Inicio de sesión exitoso!")
  const [error, setError] = useState('');     // Mensaje de error (ej. "Credenciales inválidas")

  const navigate = useNavigate(); // Hook para la navegación programática

  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita el envío por defecto del formulario

    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Simula una pequeña demora para ver el estado de carga
      // await new Promise(resolve => setTimeout(resolve, 1000)); 

      const response = await Login({ username, password }); // Asume que Login devuelve datos del usuario o un token
      console.log("Respuesta de login:", response);
      
      // Aquí, asume que 'Login' retorna un token o información que indica éxito
      // DEBES IMPLEMENTAR EL ALMACENAMIENTO DEL TOKEN (ej. localStorage) Y REDIRECCIÓN
      if (response /*&& response.token*/) { // Ejemplo: si la respuesta incluye un token
        localStorage.setItem('userData', JSON.stringify(response)/*response.token*/); // Almacena el token
        setMessage('¡Inicio de sesión exitoso! Redirigiendo...');
        setError(''); // Limpia cualquier error previo
        
        // Redirige al dashboard o a la página principal después de un breve retraso
        setTimeout(() => {
          navigate('/'); // Redirige a la ruta principal o al dashboard
        }, 1500); 
      } else {
        // Si la API no devuelve un token o una señal clara de éxito
        setError('Inicio de sesión fallido. Credenciales incorrectas o error del servidor.');
        setMessage('');
      }

    } catch (err) {
      console.error("Error durante el inicio de sesión:", err);
      // Puedes refinar el mensaje de error basándote en 'err.response' si usas Axios
      if (err.response && err.response.status === 401) {
        setError('Credenciales inválidas. Por favor, verifica tu nombre de usuario y contraseña.');
      } else if (err.response) {
        setError(`Error del servidor: ${err.response.data.message || 'Intenta de nuevo más tarde.'}`);
      } else {
        setError('Error de conexión. Asegúrate de que el servidor esté funcionando.');
      }
      setMessage(''); // Limpia cualquier mensaje de éxito
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Iniciar Sesión</h2>

        <form onSubmit={handleSubmit}>
          {/* Campo de Nombre de Usuario */}
          <div className="mb-6">
            <label htmlFor="username" className="block text-gray-700 text-sm font-semibold mb-2">
              Nombre de Usuario:
            </label>
            <input
              type="text"
              id="username"
              className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu nombre de usuario"
              required
            />
          </div>

          {/* Campo de Contraseña */}
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">
              Contraseña:
            </label>
            <input
              type="password"
              id="password"
              className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
            />
          </div>

          {/* Botón de Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Mensajes de feedback al usuario */}
        {message && (
          <p className="mt-4 text-center text-green-600 font-medium">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 text-center text-red-600 font-medium">
            {error}
          </p>
        )}

        {/* Enlace para registrarse */}
        <p className="text-center text-gray-600 text-sm mt-6">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-bold text-blue-600 hover:text-blue-800">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}