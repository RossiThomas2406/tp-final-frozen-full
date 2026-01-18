import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Navbar.module.css';
import logo from '../../img/logo.png'; // Asegúrate de que la ruta sea correcta

function Navbar() {
  // Obtener datos del usuario desde localStorage
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Hook de navegación para redirección programática
  const navigate = useNavigate();
  
  // Estado para controlar la visibilidad del menú desplegable de usuario
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // Referencias para cerrar menús al hacer clic fuera
  const userMenuRef = useRef(null);

  // Función para cargar datos del usuario desde localStorage
  const loadUserData = () => {
    const usuarioData = localStorage.getItem('usuario');
    if (usuarioData) {
      const parsedData = JSON.parse(usuarioData);
      setUser({
        name: `${parsedData.nombre} ${parsedData.apellido}`,
        initials: parsedData.iniciales,
        role: parsedData.rol || parsedData.role || 'Usuario' // Asegurar compatibilidad con diferentes nombres de propiedad
      });
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  // Cargar datos del usuario desde localStorage al montar el componente
  useEffect(() => {
    loadUserData();

    // Escuchar evento personalizado para actualizar cuando el usuario inicie sesión
    const handleUserLoggedIn = () => {
      loadUserData();
    };

    window.addEventListener('userLoggedIn', handleUserLoggedIn);
    
    // También escuchar cambios en el localStorage (por si cambia en otra pestaña)
    window.addEventListener('storage', loadUserData);

    return () => {
      window.removeEventListener('userLoggedIn', handleUserLoggedIn);
      window.removeEventListener('storage', loadUserData);
    };
  }, []);

  // Función para alternar el menú de usuario
  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // Función de navegación unificada
  const handleNavigation = (path) => {
    navigate(path);
    // Cerrar menús si están abiertos
    setIsUserMenuOpen(false);
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    // Eliminar datos del usuario del localStorage
    localStorage.removeItem('usuario');
    // Actualizar estado
    setUser(null);
    setIsLoggedIn(false);
    // Redirigir al login
    navigate('/');
    setIsUserMenuOpen(false);
  };

  // Efecto para cerrar menús al hacer clic fuera de ellos
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Cerrar menú de usuario si se hace clic fuera de él
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Si no hay usuario logueado, mostrar solo el logo
  if (!isLoggedIn) {
    return (
      <nav className={styles.navbar}>
        <div className={styles.container}>
          <div 
            className={styles.logoSection}
            onClick={() => navigate('/')}
            style={{cursor: 'pointer', margin: '0 auto'}}
          >
            <div className={styles.logo}><img src={logo} alt="logo" /></div>
            <span className={styles.logoText}>Frozen</span>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        
        {/* Logo de la empresa - Ahora usa navegación programática */}
        <div 
          className={styles.logoSection}
          onClick={() => handleNavigation('/')}
          style={{cursor: 'pointer'}}
        >
          <div className={styles.logo}><img src={logo} alt="logo" /></div>
          <span className={styles.logoText}>Frozen</span>
        </div>

        {/* Información del usuario con menú desplegable */}
        <div 
          className={`${styles.userSection} ${isUserMenuOpen ? styles.userSectionActive : ''}`} 
          onClick={toggleUserMenu}
          ref={userMenuRef}
        >
          <div className={styles.userAvatar}>
            {user.initials}
          </div>
          <div className={styles.userInfoContainer}>
            <span className={styles.userName}>
              {user.name}
            </span>
            <span className={styles.userRole}>
              {user.role}
            </span>
          </div>

          {/* Menú desplegable de usuario */}
          {isUserMenuOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.userInfo}>
                <div className={styles.userInfoAvatar}>{user.initials}</div>
                <div className={styles.userInfoDetails}>
                  <div className={styles.userInfoName}>{user.name}</div>
                  <div className={styles.userInfoRole}>{user.role}</div>
                  {user.email && (
                    <div className={styles.userInfoEmail}>{user.email}</div>
                  )}
                </div>
              </div>
              <div className={styles.menuDivider}></div>
              <button 
                className={styles.menuItem}
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;