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

export function EmpresaRegister() {
    const navigate = useNavigate();
    const { createEmpresa } = useContext(apiContext);
    const [feedback, setFeedback] = useState({ msg: '', type: '' });

    // 1. Configurar useForm sin 'resolver'. Las validaciones van en cada 'register'.
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            nombreEmpresa: '', razonSocial: '', cuit: '', iibb: '', fechaInicioActividades: '', 
            condicionIVA: 'Responsable Inscripto', actividadAFIP: '', metodoContabilidad: 'Contado', 
            mesInicioFiscal: '1', telefonoContacto: '', numeroWhatsapp: '', emailContacto: '', 
            pais: 'Argentina', provincia: '', ciudad: '', codigoPostal: '', direccion: '', 
            zonaHoraria: 'America/Argentina/Buenos_Aires', monedaDefault: 'PES', 
            fechaVencimientoCertificado: '', ambienteAFIP: 'HOMOLOGACION'
        }
    });

    const condicionesIVA = ['Responsable Inscripto', 'Monotributo', 'Exento', 'No Responsable', 'Consumidor Final'];
    const metodosContabilidad = ['Contado', 'Crédito'];
    const meses = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Mes ${i + 1}` }));
    const zonasHorarias = ['America/Argentina/Buenos_Aires', 'America/Argentina/Cordoba', 'America/Argentina/Mendoza', 'America/Argentina/Salta'];

    // La lógica de envío no cambia, ya que la validación ocurre antes.
    const onSubmit = async (data) => {
        setFeedback({ msg: '', type: '' });
        try {
            const certificadoB64 = data.certificadoDigital?.[0] ? await fileToBase64(data.certificadoDigital[0]) : null;
            const claveB64 = data.clavePrivada?.[0] ? await fileToBase64(data.clavePrivada[0]) : null;

            const dataToSend = {
                ...data,
                mesInicioFiscal: parseInt(data.mesInicioFiscal, 10),
                fechaInicioActividades: new Date(data.fechaInicioActividades).toISOString(),
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
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center">
                    <h1 className="text-2xl font-bold text-white">Registro de Empresa</h1>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 2. Reglas de validación aplicadas directamente en cada campo */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Información Básica</h2>
                        <InputField label="Nombre Comercial" required {...register("nombreEmpresa", { required: "El nombre es obligatorio." })} error={errors.nombreEmpresa?.message} disabled={isSubmitting} />
                        <InputField label="Razón Social" required {...register("razonSocial", { required: "La razón social es obligatoria." })} error={errors.razonSocial?.message} disabled={isSubmitting} />
                        <InputField label="CUIT" required placeholder="XX-XXXXXXXX-X" {...register("cuit", { required: "El CUIT es obligatorio.", minLength: { value: 11, message: "El CUIT debe tener al menos 11 dígitos." } })} error={errors.cuit?.message} disabled={isSubmitting} />
                        <InputField label="IIBB" {...register("iibb")} disabled={isSubmitting} />
                        <InputField type="date" label="Fecha Inicio Actividades" required {...register("fechaInicioActividades", { required: "La fecha es obligatoria." })} error={errors.fechaInicioActividades?.message} disabled={isSubmitting} />
                        <InputField type="select" label="Condición IVA" required options={condicionesIVA} {...register("condicionIVA")} disabled={isSubmitting} />
                        <InputField label="Actividad AFIP" required placeholder="Código de actividad" {...register("actividadAFIP", { required: "La actividad es obligatoria." })} error={errors.actividadAFIP?.message} disabled={isSubmitting} />
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Información Fiscal y Contacto</h2>
                        <InputField type="select" label="Método Contabilidad" required options={metodosContabilidad} {...register("metodoContabilidad")} disabled={isSubmitting} />
                        <InputField type="select" label="Mes Inicio Fiscal" required options={meses} {...register("mesInicioFiscal")} disabled={isSubmitting} />
                        <InputField type="tel" label="Teléfono Contacto" required {...register("telefonoContacto", { required: "El teléfono es obligatorio." })} error={errors.telefonoContacto?.message} disabled={isSubmitting} />
                        <InputField type="tel" label="WhatsApp" {...register("numeroWhatsapp")} disabled={isSubmitting} />
                        <InputField type="email" label="Email Contacto" required {...register("emailContacto", { required: "El email es obligatorio.", pattern: { value: /^\S+@\S+$/i, message: "Formato de email inválido." } })} error={errors.emailContacto?.message} disabled={isSubmitting} />
                        <InputField label="País" required {...register("pais", { required: "El país es obligatorio." })} error={errors.pais?.message} disabled={isSubmitting} />
                        <InputField label="Provincia" required {...register("provincia", { required: "La provincia es obligatoria." })} error={errors.provincia?.message} disabled={isSubmitting} />
                        <InputField label="Ciudad" required {...register("ciudad", { required: "La ciudad es obligatoria." })} error={errors.ciudad?.message} disabled={isSubmitting} />
                    </div>

                    <div className="space-y-4 md:col-span-2">
                        <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Ubicación y Certificados</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Código Postal" {...register("codigoPostal")} disabled={isSubmitting} />
                            <InputField type="select" label="Zona Horaria" required options={zonasHorarias} {...register("zonaHoraria")} disabled={isSubmitting} />
                        </div>
                        <InputField label="Dirección" required {...register("direccion", { required: "La dirección es obligatoria." })} error={errors.direccion?.message} disabled={isSubmitting} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <InputField type="file" label="Certificado Digital" {...register("certificadoDigital")} disabled={isSubmitting} />
                            <InputField type="file" label="Clave Privada" {...register("clavePrivada")} disabled={isSubmitting} />
                            <InputField type="date" label="Vencimiento Certificado" {...register("fechaVencimientoCertificado")} disabled={isSubmitting} />
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <button type="submit" disabled={isSubmitting} className={`w-full py-3 px-4 rounded-lg font-medium text-white ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} transition-colors shadow-md`}>
                             {isSubmitting ? 'Registrando...' : 'Registrar Empresa'}
                        </button>
                    </div>
                </form>
                {feedback.msg && (
                    <div className={`mx-6 mb-4 p-3 rounded-lg text-sm text-center ${feedback.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {feedback.msg}
                    </div>
                )}
            </div>
        </div>
    );
}