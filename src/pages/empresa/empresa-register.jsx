import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { apiContext } from '../../context/api_context';
import InputField from '../../components/InputField'; // Asegúrate que la ruta sea correcta

// Función auxiliar para convertir un archivo a Base64
const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
});

export default function EmpresaRegister() {
    const navigate = useNavigate();
    const { createEmpresa } = useContext(apiContext);
    const [feedback, setFeedback] = useState({ msg: '', type: '' });

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            nombreEmpresa: '', razonSocial: '', cuit: '', iibb: '', fechaInicioActividades: '', 
            condicionIVA: 'Responsable Inscripto', actividadAFIP: '', metodoContabilidad: 'Contado', 
            mesInicioFiscal: '1', telefonoContacto: '', numeroWhatsapp: '', emailContacto: '', 
            pais: 'Argentina', provincia: '', ciudad: '', codigoPostal: '', direccion: '', 
            zonaHoraria: 'America/Argentina/Catamarca', monedaDefault: 'PES', 
            fechaVencimientoCertificado: '', ambienteAFIP: 'HOMOLOGACION'
        }
    });

    const onSubmit = async (data) => {
        setFeedback({ msg: '', type: '' });
        try {
            const certificadoB64 = data.certificadoDigital?.[0] ? await fileToBase64(data.certificadoDigital[0]) : null;
            const claveB64 = data.clavePrivada?.[0] ? await fileToBase64(data.clavePrivada[0]) : null;

            const dataToSend = {
                ...data,
                mesInicioFiscal: parseInt(data.mesInicioFiscal, 10),
                fechaInicioActividades: data.fechaInicioActividades ? new Date(data.fechaInicioActividades).toISOString() : null,
                fechaVencimientoCertificado: data.fechaVencimientoCertificado ? new Date(data.fechaVencimientoCertificado).toISOString() : null,
                certificadoDigital: certificadoB64,
                clavePrivada: claveB64,
            };

            await createEmpresa(dataToSend);
            setFeedback({ msg: 'Empresa registrada exitosamente!', type: 'success' });
            setTimeout(() => navigate('/register'), 2000); 
        } catch (err) {
            console.error("Error al registrar empresa:", err);
            setFeedback({ msg: err.response?.data?.message || err.response?.data?.error || 'Error al registrar la empresa.', type: 'error' });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-[var(--principal)] to-indigo-700 p-6 text-center">
                    <h1 className="text-3xl font-bold text-white">Registrar Nueva Empresa</h1>
                    <p className="text-blue-100 mt-1">Completa los datos esenciales para empezar.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-10">
                    
                    {/* SECCIÓN 1: INFORMACIÓN ESENCIAL (OBLIGATORIA) */}
                    <fieldset className="space-y-6">
                        <legend className="text-xl font-semibold text-gray-800 border-b-2 border-[var(--principal)] pb-2">
                            Información Esencial (sin afip)
                        </legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Nombre Comercial de la Empresa" required {...register("nombreEmpresa", { required: "El nombre es obligatorio." })} error={errors.nombreEmpresa?.message} disabled={isSubmitting} />
                            
                            <InputField type="email" label="Email de Contacto" required {...register("emailContacto", { required: "El email es obligatorio.", pattern: { value: /^\S+@\S+$/i, message: "Formato de email inválido." } })} error={errors.emailContacto?.message} disabled={isSubmitting} />
                            <InputField type="tel" label="Teléfono de Contacto" required {...register("telefonoContacto", { required: "El teléfono es obligatorio." })} error={errors.telefonoContacto?.message} disabled={isSubmitting} />
                            <InputField label="Dirección" required {...register("direccion", { required: "La dirección es obligatoria." })} error={errors.direccion?.message} disabled={isSubmitting} />
                            <InputField label="Código Postal" required {...register("codigoPostal", { required: "El código postal es obligatorio." })} error={errors.codigoPostal?.message} disabled={isSubmitting} />
                            <InputField label="Ciudad" required {...register("ciudad", { required: "La ciudad es obligatoria." })} error={errors.ciudad?.message} disabled={isSubmitting} />
                            <InputField label="Provincia" required {...register("provincia", { required: "La provincia es obligatoria." })} error={errors.provincia?.message} disabled={isSubmitting} />
                            <InputField label="País" required {...register("pais", { required: "El país es obligatorio." })} defaultValue="Argentina" error={errors.pais?.message} disabled={isSubmitting} />
                          
                        </div>
                    </fieldset>

                    {/* SECCIÓN 2: INFORMACIÓN FISCAL (OPCIONAL) */}
                    <details className="group rounded-lg border p-4">
                        <summary className="cursor-pointer list-none font-semibold text-gray-700 hover:text-[var(--principal)]">
                            Añadir Información Fiscal (Opcional)
                        </summary>
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="CUIT" placeholder="XX-XXXXXXXX-X" {...register("cuit")} disabled={isSubmitting} />
                            <InputField type="select" label="Condición IVA" options={['Responsable Inscripto', 'Monotributo', 'Exento', 'No Responsable', 'Consumidor Final']} {...register("condicionIVA")} disabled={isSubmitting} />
                            <InputField label="Ingresos Brutos (IIBB)" {...register("iibb")} disabled={isSubmitting} />
                            <InputField type="date" label="Fecha Inicio Actividades" {...register("fechaInicioActividades")} disabled={isSubmitting} />
                            <InputField label="Actividad Principal AFIP" placeholder="Código de actividad" {...register("actividadAFIP")} disabled={isSubmitting} />
                            <InputField label="Razón Social" {...register("razonSocial")} disabled={isSubmitting} />
                            <InputField type="tel" label="WhatsApp (Opcional)" {...register("numeroWhatsapp")} disabled={isSubmitting} />
                            <InputField type="select" label="Mes Inicio Fiscal" options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Mes ${i + 1}` }))} {...register("mesInicioFiscal")} disabled={isSubmitting} />
                            <InputField type="select" label="Método Contabilidad" options={['Contado', 'Devengado']} {...register("metodoContabilidad")} disabled={isSubmitting} />
                            <InputField type="select" label="Zona Horaria" options={['America/Argentina/Catamarca', 'America/Argentina/Buenos_Aires', 'America/Argentina/Cordoba']} {...register("zonaHoraria")} disabled={isSubmitting} />
                        </div>
                        <div className="mt-6 pt-4 border-t">
                             <h3 className="text-md font-semibold text-gray-600 mb-4">Certificados AFIP para Factura Electrónica</h3>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <InputField type="file" label="Certificado Digital (.crt)" {...register("certificadoDigital")} disabled={isSubmitting} />
                                <InputField type="file" label="Clave Privada (.key)" {...register("clavePrivada")} disabled={isSubmitting} />
                                <InputField type="date" label="Vencimiento Certificado" {...register("fechaVencimientoCertificado")} disabled={isSubmitting} />
                             </div>
                        </div>
                    </details>
                    
                    {/* BOTÓN DE ENVÍO */}
                    <div className="pt-6 border-t">
                        <button type="submit" disabled={isSubmitting} className={`cursor-pointer w-full py-3 px-4 rounded-lg font-semibold text-white text-lg transition-colors shadow-lg ${isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-[var(--principal)] hover:bg-[var(--principal-activo)]'}`}>
                            {isSubmitting ? 'Registrando...' : 'Crear Empresa'}
                        </button>
                    </div>
                </form>

                {feedback.msg && (
                    <div className={`mx-8 mb-8 p-4 rounded-lg text-center ${feedback.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {feedback.msg}
                    </div>
                )}
            </div>
        </div>
    );
}