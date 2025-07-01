import React, { useState, useEffect, useContext, useCallback } from 'react';
import { apiContext } from "../../context/api_context";

// --- Estado Inicial Descriptivo ---
const createInitialState = (userData, companyData) => ({
  empresa: userData?.empresa || '',
  companyName: companyData?.nombreEmpresa || '', // Solo para UI
  numero: '',
  nombre: '',
  activo: true,
  fechaUltimoCbte: '',
  direccion: '',
  ciudad: '',
  provincia: '',
  codigoPostal: '',
  telefono: ''
});

export function AgregarPuntoVenta() {
  // --- HOOKS Y ESTADO ---
  const { createPointSale, userData, companyData } = useContext(apiContext);
  const [formData, setFormData] = useState(() => createInitialState(userData, companyData));
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Sincroniza el estado del formulario si los datos del contexto cargan después del montaje inicial
  useEffect(() => {
    if (userData?.empresa && companyData?.nombreEmpresa) {
      setFormData(prev => ({
        ...prev,
        empresa: userData.empresa,
        companyName: companyData.nombreEmpresa,
      }));
    }
  }, [userData, companyData]);

  // --- DATOS Y CONFIGURACIÓN ---
  const provinciasArgentinas = ['Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'];

  // --- MANEJADORES DE EVENTOS ---
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    // No permitir que el campo de la empresa se modifique manualmente
    if (name === 'empresa') return;

    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Validaciones básicas
      if (!formData.empresa) throw new Error('El ID de la empresa no está cargado. Por favor, recargue la página.');
      if (!formData.numero || isNaN(parseInt(formData.numero, 10)) || formData.numero <= 0) throw new Error('El campo "Número de Punto" es obligatorio y debe ser un número válido mayor que 0.');
      if (!formData.nombre.trim()) throw new Error('El campo "Nombre" es obligatorio.');

      // Prepara los datos para enviar a la API
      const dataToSend = {
        ...formData,
        numero: parseInt(formData.numero, 10),
        ultimoCbteAutorizado: formData.ultimoCbteAutorizado ? parseInt(formData.ultimoCbteAutorizado, 10) : 0,
        fechaUltimoCbte: formData.fechaUltimoCbte || null,
      };
      delete dataToSend.companyName; // No enviar el nombre de la empresa, solo el ID

      await createPointSale(dataToSend);
      setSuccessMessage('¡Punto de venta registrado con éxito!');
      
      // Resetea el formulario manteniendo los datos de la empresa
      setFormData(createInitialState(userData, companyData));
      
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (e) {
      setErrorMessage(e.message || 'Ocurrió un error al registrar el punto de venta.');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDERIZADO ---
  const formStyles = {
    formContainer: { maxWidth: '800px', margin: 'auto', padding: '20px' },
    form: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' },
    formGroup: { marginBottom: '15px' },
    label: { display: 'block', marginBottom: '5px', fontWeight: 'bold' },
    input: { width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' },
    button: { width: '100%', padding: '12px', fontSize: '16px', cursor: 'pointer', border: 'none', borderRadius: '4px', color: 'white' },
    message: { padding: '10px', marginTop: '15px', borderRadius: '4px', textAlign: 'center' }
  };
  
  return (
    <div style={formStyles.formContainer}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1>Agregar Punto de Venta</h1>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div style={formStyles.form}>
            {/* Campo Empresa (solo lectura) */}
            <div style={{ ...formStyles.formGroup, gridColumn: '1 / -1' }}>
                <label style={formStyles.label} htmlFor="companyName">Empresa (Owner)*</label>
                <input style={{...formStyles.input, backgroundColor: '#f0f0f0'}} type="text" id="companyName" value={formData.companyName} readOnly />
            </div>

            {/* Campos del Formulario */}
            <div style={formStyles.formGroup}>
                <label style={formStyles.label} htmlFor="numero">Número de Punto*</label>
                <input style={formStyles.input} type="number" name="numero" id="numero" value={formData.numero} onChange={handleChange} required min="1" placeholder="Ej: 4"/>
            </div>

            <div style={formStyles.formGroup}>
                <label style={formStyles.label} htmlFor="nombre">Nombre*</label>
                <input style={formStyles.input} type="text" name="nombre" id="nombre" value={formData.nombre} onChange={handleChange} required placeholder="Ej: Sucursal Centro"/>
            </div>

            <div style={formStyles.formGroup}>
                <label style={formStyles.label} htmlFor="direccion">Dirección</label>
                <input style={formStyles.input} type="text" name="direccion" id="direccion" value={formData.direccion} onChange={handleChange} placeholder="Av. Corrientes 1234"/>
            </div>

            <div style={formStyles.formGroup}>
                <label style={formStyles.label} htmlFor="ciudad">Ciudad</label>
                <input style={formStyles.input} type="text" name="ciudad" id="ciudad" value={formData.ciudad} onChange={handleChange} placeholder="Ej: Rosario"/>
            </div>
            
            <div style={formStyles.formGroup}>
                <label style={formStyles.label} htmlFor="provincia">Provincia</label>
                <select style={formStyles.input} name="provincia" id="provincia" value={formData.provincia} onChange={handleChange}>
                    <option value="">Seleccione una provincia</option>
                    {provinciasArgentinas.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                </select>
            </div>
            
            <div style={formStyles.formGroup}>
                <label style={formStyles.label} htmlFor="codigoPostal">Código Postal</label>
                <input style={formStyles.input} type="text" name="codigoPostal" id="codigoPostal" value={formData.codigoPostal} onChange={handleChange} placeholder="Ej: S2000"/>
            </div>

            <div style={formStyles.formGroup}>
                <label style={formStyles.label} htmlFor="telefono">Teléfono</label>
                <input style={formStyles.input} type="tel" name="telefono" id="telefono" value={formData.telefono} onChange={handleChange} placeholder="Ej: +543415123456"/>
            </div>

            

            <div style={formStyles.formGroup}>
                <label style={formStyles.label} htmlFor="fechaUltimoCbte">Fecha Último Cbte.</label>
                <input style={formStyles.input} type="datetime-local" name="fechaUltimoCbte" id="fechaUltimoCbte" value={formData.fechaUltimoCbte} onChange={handleChange} />
            </div>

            <div style={{ ...formStyles.formGroup, gridColumn: '1 / -1', display: 'flex', alignItems: 'center' }}>
                <input type="checkbox" name="activo" id="activo" checked={formData.activo} onChange={handleChange} style={{ marginRight: '10px' }}/>
                <label style={{...formStyles.label, marginBottom: '0'}} htmlFor="activo">Punto de venta activo</label>
            </div>
        </div>

        {/* Botón de envío */}
        <div style={{...formStyles.formGroup, marginTop: '20px'}}>
            <button type="submit" disabled={isLoading} style={{ ...formStyles.button, backgroundColor: isLoading ? '#999' : '#007bff' }}>
                {isLoading ? 'Guardando...' : 'Guardar Punto de Venta'}
            </button>
        </div>
      </form>
      
      {/* Mensajes de feedback */}
      {successMessage && <div style={{ ...formStyles.message, backgroundColor: '#d4edda', color: '#155724' }}>{successMessage}</div>}
      {errorMessage && <div style={{ ...formStyles.message, backgroundColor: '#f8d7da', color: '#721c24' }}>{errorMessage}</div>}
    </div>
  );
}