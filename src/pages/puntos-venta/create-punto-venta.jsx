import React, { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form'; // 1. Importar el hook
import { apiContext } from "../../context/api_context.jsx";

export default function AgregarPuntoVenta() {
  // --- HOOKS Y ESTADO ---
  const { createPointSale, userData, companyData } = useContext(apiContext);
  
  // El estado ahora es solo para mensajes del servidor, no para los campos del formulario.
  const [serverFeedback, setServerFeedback] = useState({ success: '', error: '' });

  // 2. Configurar useForm con valores por defecto
  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors, isSubmitting } 
  } = useForm({
    defaultValues: {
      empresa: userData?.empresa || '',
      companyName: companyData?.nombreEmpresa || '',
      numero: '',
      nombre: '',
      activo: true,
      fechaUltimoCbte: '',
      direccion: '',
      ciudad: '',
      provincia: '',
      codigoPostal: '',
      telefono: ''
    }
  });

  // Sincroniza los valores por defecto si los datos del contexto cargan tarde
  useEffect(() => {
    if (userData?.empresa && companyData?.nombreEmpresa) {
      reset({
        empresa: userData.empresa,
        companyName: companyData.nombreEmpresa,
        activo: true, // Asegura que los valores por defecto se mantengan
      });
    }
  }, [userData, companyData, reset]);

  // --- DATOS Y CONFIGURACIÓN ---
  const provinciasArgentinas = ['Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'];

  // 3. La función de envío ahora recibe la data validada
  const onSubmit = async (data) => {
    setServerFeedback({ success: '', error: '' });

    try {
      const dataToSend = {
        ...data,
        fechaUltimoCbte: data.fechaUltimoCbte || null,
      };
      delete dataToSend.companyName; // No enviar el nombre de la empresa

      await createPointSale(dataToSend);
      setServerFeedback({ success: '¡Punto de venta registrado con éxito!', error: '' });
      
      // Resetea el formulario manteniendo los datos de la empresa
      reset({
        ...data, // Mantiene los datos que no se deben limpiar
        numero: '',
        nombre: '',
        direccion: '',
        ciudad: '',
        provincia: '',
        codigoPostal: '',
        telefono: '',
        fechaUltimoCbte: '',
      });
      
      setTimeout(() => setServerFeedback({ success: '', error: '' }), 4000);
    } catch (e) {
      setServerFeedback({ success: '', error: e.response?.data?.message || e.message || 'Ocurrió un error al registrar el punto de venta.'});
      setTimeout(() => setServerFeedback({ success: '', error: '' }), 5000);
    }
  };

  // --- RENDERIZADO CON TAILWIND CSS Y REACT-HOOK-FORM ---
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Agregar Punto de Venta</h1>
        </div>
        
        {/* 4. handleSubmit se encarga de la validación antes de llamar a onSubmit */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="companyName">Empresa (Owner)*</label>
              <input 
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed" 
                type="text" 
                {...register("companyName")} // Registrado pero sin validación
                readOnly 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="numero">Número de Punto*</label>
              <input 
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-[var(--principal)] focus:border-[var(--principal)]" 
                type="number" 
                id="numero" 
                placeholder="Ej: 4"
                {...register("numero", { 
                  required: "El número es obligatorio.",
                  valueAsNumber: true,
                  min: { value: 1, message: "El número debe ser mayor que 0."} 
                })}
              />
              {/* 5. Mostrar el error si existe */}
              {errors.numero && <span className="text-red-600 text-sm mt-1">{errors.numero.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="nombre">Nombre*</label>
              <input 
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-[var(--principal)] focus:border-[var(--principal)]" 
                type="text" 
                id="nombre" 
                placeholder="Ej: Sucursal Centro"
                {...register("nombre", { required: "El nombre es obligatorio." })}
              />
              {errors.nombre && <span className="text-red-600 text-sm mt-1">{errors.nombre.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="direccion">Dirección</label>
              <input 
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-[var(--principal)] focus:border-[var(--principal)]" 
                type="text" 
                id="direccion" 
                placeholder="Av. Corrientes 1234"
                {...register("direccion")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="ciudad">Ciudad</label>
              <input 
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-[var(--principal)] focus:border-[var(--principal)]" 
                type="text" 
                id="ciudad" 
                placeholder="Ej: Rosario"
                {...register("ciudad")}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="provincia">Provincia</label>
              <select 
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-[var(--principal)] focus:border-[var(--principal)]" 
                id="provincia"
                {...register("provincia")}
              >
                <option value="">Seleccione una provincia</option>
                {provinciasArgentinas.map(prov => <option key={prov} value={prov}>{prov}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="codigoPostal">Código Postal</label>
              <input 
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-[var(--principal)] focus:border-[var(--principal)]" 
                type="text" 
                id="codigoPostal" 
                placeholder="Ej: S2000"
                {...register("codigoPostal")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="telefono">Teléfono</label>
              <input 
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-[var(--principal)] focus:border-[var(--principal)]" 
                type="tel" 
                id="telefono" 
                placeholder="Ej: +543415123456"
                {...register("telefono")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="fechaUltimoCbte">Fecha Último Cbte.</label>
              <input 
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-[var(--principal)] focus:border-[var(--principal)]" 
                type="datetime-local" 
                id="fechaUltimoCbte" 
                {...register("fechaUltimoCbte")}
              />
            </div>

            <div className="md:col-span-2 flex items-center">
              <input 
                type="checkbox" 
                id="activo"
                className="h-4 w-4 text-[var(--principal-shadow)] border-gray-300 rounded focus:ring-[var(--principal)]"
                {...register("activo")}
              />
              <label className="ml-2 block text-sm text-gray-900" htmlFor="activo">Punto de venta activo</label>
            </div>
          </div>

          <div className="mt-8">
            <button 
              type="submit" 
              disabled={isSubmitting} // Se usa isSubmitting en lugar de isLoading manual
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-[var(--principal)] hover:bg-[var(--principal-shadow)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--principal)]'
              }`}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Punto de Venta'}
            </button>
          </div>
        </form>
        
        <div className="mt-4 space-y-2">
            {serverFeedback.success && <div className="p-3 bg-green-100 text-green-800 rounded-md text-center">{serverFeedback.success}</div>}
            {serverFeedback.error && <div className="p-3 bg-red-100 text-red-800 rounded-md text-center">{serverFeedback.error}</div>}
        </div>
      </div>
    </div>
  );
}