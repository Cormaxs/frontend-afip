import React, {useEffect} from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';

export function Bloqueante() {
    const navigate = useNavigate(); // Inicializa el hook useNavigate

    // Opción 1: Redirección inmediata al montar el componente
    // Esta es la forma más común si quieres que el componente Bloqueante
    // siempre redirija a algún lado.
    useEffect(() => {
        // Redirige al usuario a la ruta '/tu-ruta-destino'
        // El { replace: true } es opcional pero recomendado para no dejar la página
        // en el historial de navegación, impidiendo que el usuario vuelva a ella con el botón "atrás".
        navigate('/dashboard', { replace: true });

        // Si necesitas una redirección con un pequeño retraso (por ejemplo, para mostrar un mensaje antes)
        // const timer = setTimeout(() => {
        //     navigate('/tu-ruta-destino', { replace: true });
        // }, 2000); // Redirige después de 2 segundos
        // return () => clearTimeout(timer); // Limpia el timer si el componente se desmonta
    }, [navigate]); // Añade 'navigate' como dependencia del useEffect

    // Opción 2: Redirección basada en alguna condición o evento
    // Por ejemplo, si un usuario cumple una condición específica.
    const handleClick = () => {
        // Alguna lógica aquí...
        navigate('/dashboard');
    };

    return (
        <>
            {/* Si el componente es solo para redirigir, puedes dejarlo vacío o mostrar un mensaje breve */}
            <p>Redirigiendo...</p>
            {/* Puedes tener elementos interactivos que disparen la redirección */}
            <button onClick={handleClick}>Ir a otra página</button>
        </>
    );
}



export const PrivateRoute = ({ isAuthenticated, children }) => {
  // Si el usuario no está autenticado, redirige a la página de login
  console.log("autenticado -> ",isAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />; // 'replace' evita que la página privada quede en el historial
  }

  // Si el usuario está autenticado, renderiza las rutas hijas
  // `children` es la prop que contiene el elemento (o elementos)
  // que se pasaron como hijos al componente PrivateRoute
  return children ? children : <Outlet />;
};

