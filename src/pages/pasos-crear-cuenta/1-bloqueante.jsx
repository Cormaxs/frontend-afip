import React, {useEffect} from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';

export function Bloqueante() {
    const navigate = useNavigate(); // Inicializa el hook useNavigate
    useEffect(() => {
        navigate('/dashboard', { replace: true });
    }, [navigate]); // Añade 'navigate' como dependencia del useEffect

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
    return <Navigate to="/elegir" replace />; // 'replace' evita que la página privada quede en el historial
  }

  // Si el usuario está autenticado, renderiza las rutas hijas
  // `children` es la prop que contiene el elemento (o elementos)
  // que se pasaron como hijos al componente PrivateRoute
  return children ? children : <Outlet />;
};

