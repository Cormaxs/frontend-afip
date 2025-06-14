import React, { useState } from 'react';

export function GenerarCertificadoDigital() {
  const [certificadoData, setCertificadoData] = useState({
    datos: {
      country: "AR",
      state: "",
      locality: "",
      organization: "",
      organizationalUnit: "",
      emailAddress: "",
      cuit: ""
    }
  });

  const [certificadoFile, setCertificadoFile] = useState(null);
  const [clavePrivadaFile, setClavePrivadaFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const provinciasArgentina = [
    "Buenos Aires",
    "Ciudad Autónoma de Buenos Aires",
    "Catamarca",
    "Chaco",
    "Chubut",
    "Córdoba",
    "Corrientes",
    "Entre Ríos",
    "Formosa",
    "Jujuy",
    "La Pampa",
    "La Rioja",
    "Mendoza",
    "Misiones",
    "Neuquén",
    "Río Negro",
    "Salta",
    "San Juan",
    "San Luis",
    "Santa Cruz",
    "Santa Fe",
    "Santiago del Estero",
    "Tierra del Fuego",
    "Tucumán"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCertificadoData(prev => ({
      ...prev,
      datos: {
        ...prev.datos,
        [name]: value
      }
    }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === 'certificado') {
        setCertificadoFile(file);
      } else {
        setClavePrivadaFile(file);
      }
    }
  };

  const formatCuit = (value) => {
    // Eliminar todos los caracteres no numéricos
    const numericValue = value.replace(/\D/g, '');
    
    // Aplicar formato XX-XXXXXXXX-X
    if (numericValue.length <= 2) {
      return numericValue;
    } else if (numericValue.length <= 10) {
      return `${numericValue.slice(0, 2)}-${numericValue.slice(2)}`;
    } else {
      return `${numericValue.slice(0, 2)}-${numericValue.slice(2, 10)}-${numericValue.slice(10, 11)}`;
    }
  };

  const handleCuitChange = (e) => {
    const formattedValue = formatCuit(e.target.value);
    setCertificadoData(prev => ({
      ...prev,
      datos: {
        ...prev.datos,
        cuit: formattedValue
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Validaciones
      if (!certificadoData.datos.cuit || certificadoData.datos.cuit.length !== 13) {
        throw new Error('El CUIT debe tener el formato XX-XXXXXXXX-X');
      }
      if (!certificadoData.datos.organization) {
        throw new Error('La organización es requerida');
      }
      if (!certificadoFile || !clavePrivadaFile) {
        throw new Error('Debe subir ambos archivos: certificado y clave privada');
      }

      // Crear FormData para enviar archivos y datos
      const formData = new FormData();
      formData.append('certificado', certificadoFile);
      formData.append('clavePrivada', clavePrivadaFile);
      formData.append('datos', JSON.stringify(certificadoData.datos));

      console.log('Datos a enviar:', {
        datos: certificadoData.datos,
        certificado: certificadoFile.name,
        clavePrivada: clavePrivadaFile.name
      });

      // Aquí iría la llamada a la API:
      // const response = await generarCertificado(formData);
      
      setMessage('Certificado digital generado exitosamente!');
    } catch (err) {
      setError(err.message || 'Error al generar el certificado digital');
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Generar Certificado Digital</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Datos del Certificado</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">País*</label>
                <input
                  type="text"
                  name="country"
                  value={certificadoData.datos.country}
                  onChange={handleChange}
                  required
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-gray-100"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Provincia*</label>
                <select
                  name="state"
                  value={certificadoData.datos.state}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="">Seleccione una provincia</option>
                  {provinciasArgentina.map(provincia => (
                    <option key={provincia} value={provincia}>{provincia}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Localidad*</label>
                <input
                  type="text"
                  name="locality"
                  value={certificadoData.datos.locality}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Organización*</label>
                <input
                  type="text"
                  name="organization"
                  value={certificadoData.datos.organization}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad Organizacional</label>
                <input
                  type="text"
                  name="organizationalUnit"
                  value={certificadoData.datos.organizationalUnit}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                <input
                  type="email"
                  name="emailAddress"
                  value={certificadoData.datos.emailAddress}
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
                  value={certificadoData.datos.cuit}
                  onChange={handleCuitChange}
                  required
                  placeholder="XX-XXXXXXXX-X"
                  maxLength="13"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Archivos del Certificado</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificado (.crt)*</label>
                <div className="flex items-center">
                  <label className="flex flex-col items-center px-4 py-6 bg-white text-blue-500 rounded-lg border border-dashed border-blue-500 cursor-pointer hover:bg-blue-50">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    <span className="mt-2 text-sm">{certificadoFile ? certificadoFile.name : 'Seleccionar archivo'}</span>
                    <input 
                      type="file" 
                      accept=".crt,.pem" 
                      className="hidden" 
                      onChange={(e) => handleFileChange(e, 'certificado')}
                    />
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Clave Privada (.key)*</label>
                <div className="flex items-center">
                  <label className="flex flex-col items-center px-4 py-6 bg-white text-blue-500 rounded-lg border border-dashed border-blue-500 cursor-pointer hover:bg-blue-50">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    <span className="mt-2 text-sm">{clavePrivadaFile ? clavePrivadaFile.name : 'Seleccionar archivo'}</span>
                    <input 
                      type="file" 
                      accept=".key" 
                      className="hidden" 
                      onChange={(e) => handleFileChange(e, 'clavePrivada')}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Asegúrese de que los archivos del certificado y clave privada sean los correctos y correspondan al mismo certificado.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
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
                  Generando...
                </span>
              ) : 'Generar Certificado'}
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