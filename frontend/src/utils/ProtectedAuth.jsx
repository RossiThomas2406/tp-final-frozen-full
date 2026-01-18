import { Outlet, Navigate } from "react-router-dom";

const ProtectedAuth = () => {
    const userStr = localStorage.getItem('usuario');
    const user = userStr ? JSON.parse(userStr) : null;

    if (user && user.autenticado === false) {
        return <Outlet />;
    }

    if (user && user.autenticado === true) {
        return <Navigate to="/home" replace />;
    }

    // Si no hay usuario, redirigir al login
    return <Navigate to="/" replace />;
}

export default ProtectedAuth