import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Agrupamos las importaciones de react-router-dom
import { apiContext } from "../../context/api_context.jsx"; // ¡Ruta crucial! Asegúrate que sea correcta.

// Ya no necesitamos importar 'Login' directamente aquí porque lo obtendremos del contexto.
// import { Login } from "../../api/coneccion"; // <-- Puedes eliminar esta línea

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(''); // Mensaje de éxito
  const [error, setError] = useState('');     // Mensaje de error

  // Obtenemos la función 'login' del apiContext.
  // Es mejor desestructurarlo así: 'const { login } = useContext(apiContext);'
  // Si tu 'apiContext' provee más cosas, podrías obtenerlas aquí también.
  const { login } = useContext(apiContext);

  const navigate = useNavigate(); // Hook para la navegación programática

  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita el envío por defecto del formulario

    setLoading(true);
    setMessage(''); // Limpia mensajes de éxito anteriores
    setError('');   // Limpia mensajes de error anteriores

    try {
      // 1. Llamada a la función 'login' obtenida del contexto.
      // Esta función debería manejar la llamada a tu API y la lógica de guardar en localStorage.
      const response = await login({ username, password });
      console.log("Respuesta de login desde el Contexto:", response);

      // 2. Manejo de la respuesta exitosa.
      // Asumimos que la función `login` del Context ya guardó `userData` en localStorage.
      // Si `login` retorna el objeto `response` (ej. el objeto de usuario), puedes usarlo aquí.
      if (response) {
        setMessage('¡Inicio de sesión exitoso! Redirigiendo...');
        // Opcional: podrías usar el 'response' aquí para actualizar algún estado global
        // si no lo hiciste completamente en el Provider.

        // Redirige al dashboard o a la página principal después de un breve retraso
        setTimeout(() => {
          navigate('/'); // Redirige a la ruta principal o al dashboard
        }, 1500);
      } else {
        // Esto se ejecuta si 'login' no lanzó un error pero tampoco devolvió una respuesta exitosa.
        // Podría indicar que el 'login' del Context necesita lanzar un error más explícito
        // o devolver `null` para un fallo.
        setError('Inicio de sesión fallido. Credenciales incorrectas o error del servidor desconocido.');
      }

    } catch (err) {
      // 3. Manejo de errores.
      // Los errores lanzados desde la función `login` en tu `api_context.jsx`
      // serán capturados aquí.
      console.error("Error durante el inicio de sesión:", err);

      // Puedes refinar el mensaje de error basándote en la estructura del error
      // Por ejemplo, si tu API devuelve errores con una propiedad 'message' o 'status'
      if (err.message === 'Credenciales inválidas') { // Mensaje de error específico de tu Provider
        setError('Credenciales inválidas. Por favor, verifica tu nombre de usuario y contraseña.');
      } else if (err.message === 'No se pudo obtener datos del usuario después del login.') {
        setError('No se pudo completar el inicio de sesión. Intenta de nuevo.');
      }
      // Si usas Axios y el error tiene una propiedad 'response' (ej. err.response.status)
      else if (err.response && err.response.status === 401) {
          setError('Credenciales inválidas. Por favor, verifica tu nombre de usuario y contraseña.');
      } else if (err.response && err.response.data && err.response.data.message) {
          setError(`Error del servidor: ${err.response.data.message}`);
      } else {
          setError('Error de conexión o inesperado. Asegúrate de que el servidor esté funcionando.');
      }
      setMessage(''); // Limpia cualquier mensaje de éxito
    } finally {
      setLoading(false); // Siempre desactiva el estado de carga al finalizar
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
              disabled={loading} // Deshabilita campos mientras carga
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
              disabled={loading} // Deshabilita campos mientras carga
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