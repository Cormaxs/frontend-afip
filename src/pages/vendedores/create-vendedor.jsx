import React, { useState, useEffect, useContext, useCallback } from 'react';
import { apiContext } from "../../context/api_context";

// --- CONFIGURACIÓN DE ROLES CENTRALIZADA ---
// Fuente única de verdad para todos los roles disponibles en el formulario.
const ROLES_DISPONIBLES = [
  { value: 'empleado_administrativo', label: 'Empleado Administrativo' },
  { value: 'vendedor_activo', label: 'Vendedor Activo' },
  { value: 'vendedor_inactivo', label: 'Vendedor Inactivo' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'gerente', label: 'Gerente' }
];

// Define qué roles necesitan que se les asignen puntos de venta.
const ROLES_CON_PUNTOS_DE_VENTA = ['vendedor_activo', 'vendedor_inactivo', 'supervisor'];


// --- HOOK PERSONALIZADO: Encapsula toda la lógica del formulario ---
const useVendedorForm = () => {
  const { createVendedor, getPointsByCompany } = useContext(apiContext);

  const [formData, setFormData] = useState({
    username: '', password: '', email: '', empresa: '', rol: 'empleado_administrativo',
    puntosVentaAsignados: [], nombre: '', apellido: '', telefono: '', dni: '', llegada: '', salida: ''
  });
  
  const [companyInfo, setCompanyInfo] = useState({ id: '', name: '' });
  const [availablePoints, setAvailablePoints] = useState([]);
  const [selectedPointId, setSelectedPointId] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Cargando datos iniciales...');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const userDataString = localStorage.getItem("userData");
        const dataEmpresaString = localStorage.getItem("dataEmpresa");
        const companyId = userDataString ? JSON.parse(userDataString).empresa : null;
        const companyName = dataEmpresaString ? JSON.parse(dataEmpresaString).nombreEmpresa : 'Empresa sin nombre';

        if (!companyId) {
          throw new Error("No se encontró el ID de la empresa. Por favor, inicie sesión de nuevo.");
        }
        
        setCompanyInfo({ id: companyId, name: companyName });
        setFormData(prev => ({ ...prev, empresa: companyId }));
        
        setLoadingMessage('Cargando puntos de venta...');
        
        const initialResponse = await getPointsByCompany(companyId, 1, 100);
        if (!initialResponse || !initialResponse.puntosDeVenta || !initialResponse.pagination) {
          throw new Error("La respuesta de la API para los puntos de venta es inválida.");
        }
        
        let allPoints = initialResponse.puntosDeVenta;
        const { totalPages } = initialResponse.pagination;

        if (totalPages > 1) {
          setLoadingMessage(`Cargando ${totalPages} páginas de puntos de venta...`);
          const pagePromises = [];
          for (let page = 2; page <= totalPages; page++) {
            pagePromises.push(getPointsByCompany(companyId, page, 100));
          }
          const subsequentPages = await Promise.all(pagePromises);
          subsequentPages.forEach(response => {
            if (response && response.puntosDeVenta) {
              allPoints = [...allPoints, ...response.puntosDeVenta];
            }
          });
        }
        
        setAvailablePoints(allPoints);
        setError('');
      } catch (err) {
        console.error("Error al cargar datos iniciales:", err);
        setError(err.message || "No se pudieron cargar los datos necesarios.");
      } finally {
        setLoading(false);
        setLoadingMessage('');
      }
    };
    
    loadInitialData();
  }, [getPointsByCompany]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newState = { ...prev, [name]: value };
      if (name === 'rol' && !ROLES_CON_PUNTOS_DE_VENTA.includes(value)) {
        newState.puntosVentaAsignados = [];
      }
      return newState;
    });
  };

  const handleAddPoint = () => {
    if (selectedPointId && !formData.puntosVentaAsignados.includes(selectedPointId)) {
      setFormData(prev => ({
        ...prev,
        puntosVentaAsignados: [...prev.puntosVentaAsignados, selectedPointId]
      }));
      setSelectedPointId('');
    }
  };

  const handleRemovePoint = (idToRemove) => {
    setFormData(prev => ({
      ...prev,
      puntosVentaAsignados: prev.puntosVentaAsignados.filter(id => id !== idToRemove)
    }));
  };
  
  const getPointNameById = useCallback((id) => {
    return availablePoints.find(pv => pv._id === id)?.nombre || `ID Desconocido: ${id}`;
  }, [availablePoints]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setError('');

    try {
      if (!formData.username || !formData.password || !formData.email || !formData.nombre || !formData.apellido) {
        throw new Error('Los campos con * son obligatorios.');
      }
      if (formData.password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres.');
      }
      
      const response = await createVendedor(formData);

      if (response?.data?.creado) {
        setSuccessMessage(response.data.message || '¡Empleado registrado exitosamente!');
        setFormData({
          username: '', password: '', email: '', empresa: companyInfo.id, rol: 'empleado_administrativo',
          puntosVentaAsignados: [], nombre: '', apellido: '', telefono: '', dni: '', llegada: '', salida: ''
        });
        setSelectedPointId('');
        setTimeout(() => setSuccessMessage(''), 4000);
      } 
    } catch (err) {
      console.error("Error al registrar empleado:", err);
      setError(err.message || 'Error desconocido al registrar el empleado.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };
  
  return {
    formData, companyInfo, availablePoints, selectedPointId, setSelectedPointId,
    loading, loadingMessage, successMessage, error,
    handleChange, handleAddPoint, handleRemovePoint, getPointNameById, handleSubmit
  };
};


// --- COMPONENTE DE UI: Limpio y enfocado en la presentación ---
export function AddVendedores() {
  const {
    formData, companyInfo, availablePoints, selectedPointId, setSelectedPointId,
    loading, loadingMessage, successMessage, error,
    handleChange, handleAddPoint, handleRemovePoint, getPointNameById, handleSubmit
  } = useVendedorForm();
  
  const unassignedPoints = availablePoints.filter(
    pv => !formData.puntosVentaAsignados.includes(pv._id)
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center">
          <h1 className="text-2xl font-bold text-white tracking-wide">Agregar Nuevo Empleado</h1>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* --- SECCIÓN DE CUENTA Y PERSONAL --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Columna Izquierda: Cuenta */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Información de Cuenta</h2>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Username*</label><input type="text" name="username" value={formData.username} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Password* (mín. 8 caracteres)</label><input type="password" name="password" value={formData.password} onChange={handleChange} required minLength="8" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email*</label><input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol*</label>
                <select name="rol" value={formData.rol} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition">
                  {ROLES_DISPONIBLES.map(rol => (
                    <option key={rol.value} value={rol.value}>{rol.label}</option>
                  ))}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label><input type="text" value={companyInfo.name} readOnly className="w-full px-4 py-2 border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" /></div>
            </div>
            
            {/* Columna Derecha: Personal */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Información Personal</h2>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre*</label><input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Apellido*</label><input type="text" name="apellido" value={formData.apellido} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label><input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">DNI</label><input type="text" name="dni" value={formData.dni} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Hora Llegada</label><input type="time" name="llegada" value={formData.llegada} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Hora Salida</label><input type="time" name="salida" value={formData.salida} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" /></div>
              </div>
            </div>
          </div>

          {/* --- SECCIÓN DINÁMICA DE PUNTOS DE VENTA --- */}
          {ROLES_CON_PUNTOS_DE_VENTA.includes(formData.rol) && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Asignar Puntos de Venta</h2>
              {loading && loadingMessage ? (<p className="text-gray-600 animate-pulse">{loadingMessage}</p>) : 
               error && !successMessage ? (<p className="text-red-600 text-sm">{error}</p>) : (
                <div className="flex items-center gap-2">
                  <select value={selectedPointId} onChange={(e) => setSelectedPointId(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition">
                    <option value="">Seleccionar un punto de venta...</option>
                    {unassignedPoints.map(p => (<option key={p._id} value={p._id}>{p.nombre}</option>))}
                  </select>
                  <button type="button" onClick={handleAddPoint} disabled={!selectedPointId} className="px-5 py-2 rounded-lg font-semibold transition text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed">Agregar</button>
                </div>
              )}
              {formData.puntosVentaAsignados.length > 0 && (
                <div className="mt-2 space-y-2 pt-2">
                  <h3 className="text-sm font-medium text-gray-700">Puntos asignados:</h3>
                  <ul className="space-y-1">{formData.puntosVentaAsignados.map(pointId => (
                    <li key={pointId} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                      <span className="text-gray-800">{getPointNameById(pointId)}</span>
                      <button type="button" onClick={() => handleRemovePoint(pointId)} className="text-red-500 hover:text-red-700 font-bold text-xl px-2">&times;</button>
                    </li>))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {/* --- BOTÓN DE ENVÍO Y MENSAJES --- */}
          <div className="pt-4">
            <button type="submit" disabled={loading} className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors shadow-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-wait">
              {loading ? 'Guardando...' : 'Registrar Empleado'}
            </button>
            {successMessage && (<div className="mt-4 p-3 bg-green-100 text-green-800 border border-green-200 rounded-lg text-sm text-center">{successMessage}</div>)}
            {error && (<div className="mt-4 p-3 bg-red-100 text-red-800 border border-red-200 rounded-lg text-sm text-center">{error}</div>)}
          </div>
        </form>
      </div>
    </div>
  );
}