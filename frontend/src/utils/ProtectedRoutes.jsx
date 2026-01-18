import { Outlet, Navigate } from "react-router-dom";


const ProtectedRoutes = () => {
    const userStr = localStorage.getItem('usuario');
    const user = userStr ? JSON.parse(userStr) : null;

    if (user && user.autenticado === true) {
        return <Outlet />;
    }
    
    // Si no está autenticado pero existe usuario
    if (user && user.autenticado === false) {
        return <Navigate to="/autenticacionFacial" replace />;
    }
    
    // Si no hay usuario
    return <Navigate to="/" replace />;
}

export default ProtectedRoutes