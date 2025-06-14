import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function EmpresaRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Estado inicial basado en el objeto proporcionado
  const [empresaData, setEmpresaData] = useState({
    nombreEmpresa: '',
    razonSocial: '',
    cuit: '',
    iibb: '',
    fechaInicioActividades: '',
    condicionIVA: 'Responsable Inscripto',
    actividadAFIP: '',
    metodoContabilidad: 'Contado',
    mesInicioFiscal: 1,
    telefonoContacto: '',
    numeroWhatsapp: '',
    emailContacto: '',
    pais: 'Argentina',
    provincia: '',
    ciudad: '',
    codigoPostal: '',
    direccion: '',
    zonaHoraria: 'America/Argentina/Buenos_Aires',
    monedaDefault: 'PES',
    certificadoDigital: '',
    clavePrivada: '',
    fechaVencimientoCertificado: '',
    ambienteAFIP: 'HOMOLOGACION'
  });

  const condicionesIVA = [
    'Responsable Inscripto',
    'Monotributo',
    'Exento',
    'No Responsable',
    'Consumidor Final'
  ];

  const metodosContabilidad = ['Contado', 'Crédito'];
  const meses = Array.from({ length: 12 }, (_, i) => i + 1);
  const zonasHorarias = [
    'America/Argentina/Buenos_Aires',
    'America/Argentina/Cordoba',
    'America/Argentina/Mendoza',
    'America/Argentina/Salta'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmpresaData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEmpresaData(prev => ({
          ...prev,
          [name]: reader.result.split(',')[1] // Extrae solo el contenido base64
        }));
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Validación básica
      if (!empresaData.cuit || !empresaData.emailContacto) {
        throw new Error('CUIT y Email de contacto son campos obligatorios');
      }

      // Preparar datos para la API
      const dataToSend = {
        ...empresaData,
        mesInicioFiscal: parseInt(empresaData.mesInicioFiscal),
        // Convertir fechas a formato ISO si es necesario
        fechaInicioActividades: new Date(empresaData.fechaInicioActividades).toISOString(),
        fechaVencimientoCertificado: empresaData.fechaVencimientoCertificado 
          ? new Date(empresaData.fechaVencimientoCertificado).toISOString() 
          : null
      };

      console.log('Datos a enviar:', dataToSend);
      // Aquí iría la llamada a la API:
      // const response = await registerEmpresa(dataToSend);
      
      setMessage('Empresa registrada exitosamente!');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.message || 'Error al registrar la empresa');
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Registro de Empresa</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna 1 */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Información Básica</h2>
            
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial*</label>
              <input
                type="text"
                name="nombreEmpresa"
                value={empresaData.nombreEmpresa}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social*</label>
              <input
                type="text"
                name="razonSocial"
                value={empresaData.razonSocial}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">CUIT*</label>
              <input
                type="text"
                name="cuit"
                value={empresaData.cuit}
                onChange={handleChange}
                required
                placeholder="XX-XXXXXXXX-X"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">IIBB</label>
              <input
                type="text"
                name="iibb"
                value={empresaData.iibb}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio Actividades*</label>
              <input
                type="date"
                name="fechaInicioActividades"
                value={empresaData.fechaInicioActividades}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Condición IVA*</label>
              <select
                name="condicionIVA"
                value={empresaData.condicionIVA}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                {condicionesIVA.map(opcion => (
                  <option key={opcion} value={opcion}>{opcion}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Actividad AFIP*</label>
              <input
                type="text"
                name="actividadAFIP"
                value={empresaData.actividadAFIP}
                onChange={handleChange}
                required
                placeholder="Código de actividad"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Columna 2 */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Información Fiscal y Contacto</h2>
            
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Método Contabilidad*</label>
              <select
                name="metodoContabilidad"
                value={empresaData.metodoContabilidad}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                {metodosContabilidad.map(opcion => (
                  <option key={opcion} value={opcion}>{opcion}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mes Inicio Fiscal*</label>
              <select
                name="mesInicioFiscal"
                value={empresaData.mesInicioFiscal}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                {meses.map(mes => (
                  <option key={mes} value={mes}>{mes}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Contacto*</label>
              <input
                type="tel"
                name="telefonoContacto"
                value={empresaData.telefonoContacto}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <input
                type="tel"
                name="numeroWhatsapp"
                value={empresaData.numeroWhatsapp}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Contacto*</label>
              <input
                type="email"
                name="emailContacto"
                value={empresaData.emailContacto}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">País*</label>
              <input
                type="text"
                name="pais"
                value={empresaData.pais}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Provincia*</label>
              <input
                type="text"
                name="provincia"
                value={empresaData.provincia}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad*</label>
              <input
                type="text"
                name="ciudad"
                value={empresaData.ciudad}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Columna 3 */}
          <div className="space-y-4 md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Ubicación y Certificados</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                <input
                  type="text"
                  name="codigoPostal"
                  value={empresaData.codigoPostal}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Zona Horaria*</label>
                <select
                  name="zonaHoraria"
                  value={empresaData.zonaHoraria}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  {zonasHorarias.map(zona => (
                    <option key={zona} value={zona}>{zona}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección*</label>
              <input
                type="text"
                name="direccion"
                value={empresaData.direccion}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificado Digital*</label>
                <input
                  type="file"
                  name="certificadoDigital"
                  onChange={handleFileChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Clave Privada*</label>
                <input
                  type="file"
                  name="clavePrivada"
                  onChange={handleFileChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento Certificado</label>
                <input
                  type="date"
                  name="fechaVencimientoCertificado"
                  value={empresaData.fechaVencimientoCertificado}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} transition-colors shadow-md`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registrando Empresa...
                </span>
              ) : 'Registrar Empresa'}
            </button>
          </div>
        </form>

        {message && (
          <div className="mx-6 mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}