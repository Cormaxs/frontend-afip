import React, { useContext, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { apiContext } from '../../context/api_context.jsx';
import Swal from 'sweetalert2';

// --- Icono de Spinner (reutilizable) ---
const SpinnerIcon = ({ className = "h-5 w-5" }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default function UpdateEmpresa() {
    const { updateEmpresa, companyData } = useContext(apiContext);

    const { register, handleSubmit, formState: { errors, isSubmitting, isDirty }, reset } = useForm();

    // --- Rellenar el formulario cuando los datos de la empresa estén disponibles ---
    useEffect(() => {
        if (companyData) {
            // Formatear la fecha para el input type="date"
            const formattedDate = companyData.fechaInicioActividades 
                ? new Date(companyData.fechaInicioActividades).toISOString().split('T')[0] 
                : '';

            reset({
                ...companyData,
                fechaInicioActividades: formattedDate
            });
        }
    }, [companyData, reset]);

    // --- Función de envío del formulario ---
    const onSubmit = async (data) => {
        if (!companyData?._id) {
            Swal.fire('Error', 'No se encontró el ID de la empresa.', 'error');
            return;
        }

        try {
            await updateEmpresa(companyData._id, data);
            
            // Actualiza el estado del formulario para que isDirty sea false
            reset(data);

            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: 'Los datos de la empresa han sido actualizados.',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Ocurrió un error al actualizar los datos.';
            Swal.fire('Error', errorMessage, 'error');
            console.error("Error al actualizar empresa:", err);
        }
    };

    if (!companyData) {
        return <div className="text-center p-10">Cargando datos de la empresa...</div>;
    }

    // --- Clases de estilo reutilizables ---
    const commonInputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[var(--principal)] focus:border-[var(--principal)]";
    const labelClasses = "block text-sm font-medium text-gray-700";

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md border">
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">Datos de mi Empresa</h2>
                    <p className="text-sm text-gray-500 mb-6">Actualizá la información fiscal y de contacto de tu negocio.</p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        {/* --- SECCIÓN DATOS GENERALES --- */}
                        <fieldset>
                            <legend className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Información General</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="nombreEmpresa" className={labelClasses}>Nombre de Fantasía *</label>
                                    <input id="nombreEmpresa" type="text" {...register("nombreEmpresa", { required: "El nombre es requerido." })} className={commonInputClasses} />
                                    {errors.nombreEmpresa && <em className="text-red-500 text-xs mt-1">{errors.nombreEmpresa.message}</em>}
                                </div>
                                <div>
                                    <label htmlFor="razonSocial" className={labelClasses}>Razón Social</label>
                                    <input id="razonSocial" type="text" {...register("razonSocial")} className={commonInputClasses} />
                                </div>
                            </div>
                        </fieldset>

                        {/* --- SECCIÓN DATOS FISCALES --- */}
                        <fieldset>
                            <legend className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Información Fiscal</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div>
                                    <label htmlFor="cuit" className={labelClasses}>CUIT</label>
                                    <input id="cuit" type="text" {...register("cuit", { pattern: { value: /^\d{2}-\d{8}-\d{1}$/, message: "Formato de CUIT inválido (ej: 20-12345678-9)" } })} className={commonInputClasses} placeholder="XX-XXXXXXXX-X"/>
                                    {errors.cuit && <em className="text-red-500 text-xs mt-1">{errors.cuit.message}</em>}
                                </div>
                                <div>
                                    <label htmlFor="condicionIVA" className={labelClasses}>Condición frente al IVA</label>
                                    <select id="condicionIVA" {...register("condicionIVA")} className={commonInputClasses}>
                                        <option value="Responsable Inscripto">Responsable Inscripto</option>
                                        <option value="Monotributista">Monotributista</option>
                                        <option value="Exento">Exento</option>
                                        <option value="Consumidor Final">Consumidor Final</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="fechaInicioActividades" className={labelClasses}>Inicio de Actividades</label>
                                    <input id="fechaInicioActividades" type="date" {...register("fechaInicioActividades")} className={commonInputClasses} />
                                </div>
                            </div>
                        </fieldset>

                        {/* --- SECCIÓN DATOS DE CONTACTO --- */}
                        <fieldset>
                            <legend className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Información de Contacto y Domicilio</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="telefonoContacto" className={labelClasses}>Teléfono</label>
                                    <input id="telefonoContacto" type="tel" {...register("telefonoContacto")} className={commonInputClasses} />
                                </div>
                                <div>
                                    <label htmlFor="emailContacto" className={labelClasses}>Email</label>
                                    <input id="emailContacto" type="email" {...register("emailContacto", { pattern: { value: /.+@.+\..+/, message: "Formato de email inválido." } })} className={commonInputClasses} />
                                    {errors.emailContacto && <em className="text-red-500 text-xs mt-1">{errors.emailContacto.message}</em>}
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="direccion" className={labelClasses}>Dirección Fiscal *</label>
                                    <input id="direccion" type="text" {...register("direccion", { required: "La dirección es requerida." })} className={commonInputClasses} />
                                    {errors.direccion && <em className="text-red-500 text-xs mt-1">{errors.direccion.message}</em>}
                                </div>
                                <div>
                                    <label htmlFor="ciudad" className={labelClasses}>Ciudad *</label>
                                    <input id="ciudad" type="text" {...register("ciudad", { required: "La ciudad es requerida." })} className={commonInputClasses} />
                                    {errors.ciudad && <em className="text-red-500 text-xs mt-1">{errors.ciudad.message}</em>}
                                </div>
                                <div>
                                    <label htmlFor="provincia" className={labelClasses}>Provincia *</label>
                                    <input id="provincia" type="text" {...register("provincia", { required: "La provincia es requerida." })} className={commonInputClasses} />
                                    {errors.provincia && <em className="text-red-500 text-xs mt-1">{errors.provincia.message}</em>}
                                </div>
                                <div>
                                    <label htmlFor="codigoPostal" className={labelClasses}>Código Postal *</label>
                                    <input id="codigoPostal" type="text" {...register("codigoPostal", { required: "El código postal es requerido." })} className={commonInputClasses} />
                                    {errors.codigoPostal && <em className="text-red-500 text-xs mt-1">{errors.codigoPostal.message}</em>}
                                </div>
                            </div>
                        </fieldset>

                        {/* --- BOTÓN DE ENVÍO --- */}
                        <div className="flex justify-end pt-4">
                            <button 
                                type="submit" 
                                disabled={isSubmitting || !isDirty} 
                                className="inline-flex items-center justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--principal)] hover:bg-[var(--principal-shadow)] disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmitting && <SpinnerIcon className="h-5 w-5 -ml-1 mr-2"/>}
                                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}