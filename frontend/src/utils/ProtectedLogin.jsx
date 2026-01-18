import { Outlet, Navigate } from "react-router-dom";


const ProtectedLogin = () => {
    const userStr = localStorage.getItem('usuario');
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user) {
        return <Outlet />;
    }
    
    // Si existe usuario pero no está autenticado
    if (user && user.autenticado === false) {
        return <Navigate to="/autenticacionFacial" replace />;
    }
    
    // Si existe usuario y está autenticado
    return <Navigate to="/home" replace />;
}

export default ProtectedLogin