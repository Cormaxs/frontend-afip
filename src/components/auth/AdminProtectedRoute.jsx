import { Navigate, Outlet } from 'react-router-dom';

const AdminProtectedRoute = () => {
    const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn');

    if (!isAdminLoggedIn) {
        return <Navigate to="/admin/login" replace />;
    }

    return <Outlet />;
};

export default AdminProtectedRoute;
