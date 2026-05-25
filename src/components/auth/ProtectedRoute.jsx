import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/auth/authContext.jsx';

const ProtectedRoute = () => {
    const { user, loading } = useAuth();

    // Mientras verifica la sesión, puedes mostrar un spinner
    if (loading) return <div>Cargando...</div>;

    // Si no hay usuario, redirige al login
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Si hay usuario, renderiza las rutas hijas
    return <Outlet />;
};

export default ProtectedRoute;