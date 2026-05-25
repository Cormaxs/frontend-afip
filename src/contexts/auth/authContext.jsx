import { createContext, useContext, useState, useEffect } from 'react';
import { afipService } from '../../services/afip/afip-general';


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedEmpresa = localStorage.getItem('empresa');
    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedEmpresa) setEmpresa(JSON.parse(storedEmpresa));
    setLoading(false);
  }, []);

  const login = async (userData) => {
    // 1. Guardamos los datos del usuario primero
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));

    // 2. Si el usuario tiene el ID de la base de datos de AFIP, buscamos la empresa
    if (userData?.idDbAfip) {
      try {
        console.log("Buscando datos de empresa para:", userData.idDbAfip);
        
        // Llamada al service que mencionaste
        const response = await afipService.obtenerdatosEmpresa(userData.idDbAfip);
        console.log("datos de la empresa desde context _>", response)
        // Asumiendo que los datos vienen en response.data
        const empresaData = response.data.data;
        
        console.log("Datos de empresa obtenidos:",empresaData);
        if (empresaData) {
          setEmpresa(empresaData);
          localStorage.setItem('empresa', JSON.stringify(empresaData.empresa));
          console.log("✅ Datos de empresa cargados y guardados.");
        }
      } catch (error) {
        console.error("❌ Error al obtener datos de la empresa tras el login:", error);
        // Opcional: podrías limpiar el estado si es mandatorio tener empresa
      }
    } else {
      console.warn("⚠️ El usuario no tiene idDbAfip asociado.");
    }
  };

  const empresaAuth = (empresaData) => {
    const stringData = JSON.stringify(empresaData);
    // CRÍTICO: Solo actualizamos si los datos son realmente diferentes
    if (stringData !== localStorage.getItem('empresa')) {
      setEmpresa(empresaData);
      localStorage.setItem('empresa', stringData);
    }
  };

  const logout = () => {
    setUser(null);
    setEmpresa(null);
    localStorage.removeItem('user');
    localStorage.removeItem('empresa');
  };

  return (
    <AuthContext.Provider value={{ user, empresa, login, logout, empresaAuth, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);