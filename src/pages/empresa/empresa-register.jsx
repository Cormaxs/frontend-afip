import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiContext } from '../../context/api_context';

// Componente auxiliar para un campo de formulario genérico
const InputField = ({ label, name, type = 'text', value, onChange, options, required, placeholder, className, disabled, minLength }) => (
    <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && '*'}</label>
        {type === 'select' ? (
            <select name={name} value={value} onChange={onChange} required={required} disabled={disabled} className={"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition " + (className || "")}>
                {options.map(opt => <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>)}
            </select>
        ) : type === 'file' ? (
            <input type="file" name={name} onChange={onChange} required={required} disabled={disabled} className={"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition " + (className || "")} />
        ) : (
            <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} disabled={disabled} minLength={minLength} className={"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition " + (className || "")} />
        )}
    </div>
);

export function EmpresaRegister() {
    const navigate = useNavigate();
    const { createEmpresa } = useContext(apiContext);

    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({ msg: '', type: '' });

    const [empresaData, setEmpresaData] = useState({
        nombreEmpresa: '', razonSocial: '', cuit: '', iibb: '', fechaInicioActividades: '', condicionIVA: 'Responsable Inscripto', actividadAFIP: '',
        metodoContabilidad: 'Contado', mesInicioFiscal: 1, telefonoContacto: '', numeroWhatsapp: '', emailContacto: '', pais: 'Argentina',
        provincia: '', ciudad: '', codigoPostal: '', direccion: '', zonaHoraria: 'America/Argentina/Buenos_Aires', monedaDefault: 'PES',
        certificadoDigital: '', clavePrivada: '', fechaVencimientoCertificado: '', ambienteAFIP: 'HOMOLOGACION'
    });

    const condicionesIVA = ['Responsable Inscripto', 'Monotributo', 'Exento', 'No Responsable', 'Consumidor Final'];
    const metodosContabilidad = ['Contado', 'Crédito'];
    const meses = Array.from({ length: 12 }, (_, i) => i + 1);
    const zonasHorarias = ['America/Argentina/Buenos_Aires', 'America/Argentina/Cordoba', 'America/Argentina/Mendoza', 'America/Argentina/Salta'];

    const handleChange = e => { const { name, value } = e.target; setEmpresaData(p => ({ ...p, [name]: value })); };
    const handleFileChange = e => { const { name, files } = e.target; if (files && files[0]) { const r = new FileReader(); r.onloadend = () => setEmpresaData(p => ({ ...p, [name]: r.result.split(',')[1] })); r.readAsDataURL(files[0]); } else setEmpresaData(p => ({ ...p, [name]: '' })); };

    const handleSubmit = async e => {
        e.preventDefault(); setLoading(true); setFeedback({ msg: '', type: '' });
        try {
            const requiredFields = ['nombreEmpresa', 'razonSocial', 'cuit', 'fechaInicioActividades', 'condicionIVA', 'actividadAFIP', 'telefonoContacto', 'emailContacto', 'pais', 'provincia', 'ciudad', 'direccion'];
            for (const field of requiredFields) { if (!empresaData[field]) throw new Error(`Por favor, completa el campo obligatorio: ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}.`); }

            const dataToSend = { ...empresaData, mesInicioFiscal: parseInt(empresaData.mesInicioFiscal),
                fechaInicioActividades: new Date(empresaData.fechaInicioActividades).toISOString(),
                fechaVencimientoCertificado: empresaData.fechaVencimientoCertificado ? new Date(empresaData.fechaVencimientoCertificado).toISOString() : null,
                certificadoDigital: empresaData.certificadoDigital || null, clavePrivada: empresaData.clavePrivada || null
            };

            const result = await createEmpresa(dataToSend);
            if (!result) throw new Error('Error desconocido al registrar la empresa. No se recibieron datos de confirmación.');
            setFeedback({ msg: 'Empresa registrada exitosamente!', type: 'success' });
            setTimeout(() => navigate('/register'), 2000);
        } catch (err) {
            console.error("Error al registrar empresa:", err);
            setFeedback({ msg: err.message || 'Error al registrar la empresa. Intenta de nuevo.', type: 'error' });
        } finally { setLoading(false); }
    };

    return ( // Inicia el conteo de líneas de EmpresaRegister aquí
        <div className="min-h-screen bg-gray-50 py-8 px-4"><div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center">
                <h1 className="text-2xl font-bold text-white">Registro de Empresa</h1></div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4"><h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Información Básica</h2>
                    <InputField label="Nombre Comercial" name="nombreEmpresa" value={empresaData.nombreEmpresa} onChange={handleChange} required />
                    <InputField label="Razón Social" name="razonSocial" value={empresaData.razonSocial} onChange={handleChange} required />
                    <InputField label="CUIT" name="cuit" value={empresaData.cuit} onChange={handleChange} required placeholder="XX-XXXXXXXX-X" />
                    <InputField label="IIBB" name="iibb" value={empresaData.iibb} onChange={handleChange} />
                    <InputField type="date" label="Fecha Inicio Actividades" name="fechaInicioActividades" value={empresaData.fechaInicioActividades} onChange={handleChange} required />
                    <InputField type="select" label="Condición IVA" name="condicionIVA" value={empresaData.condicionIVA} onChange={handleChange} required options={condicionesIVA} />
                    <InputField label="Actividad AFIP" name="actividadAFIP" value={empresaData.actividadAFIP} onChange={handleChange} required placeholder="Código de actividad" />
                </div>
                <div className="space-y-4"><h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Información Fiscal y Contacto</h2>
                    <InputField type="select" label="Método Contabilidad" name="metodoContabilidad" value={empresaData.metodoContabilidad} onChange={handleChange} required options={metodosContabilidad} />
                    <InputField type="select" label="Mes Inicio Fiscal" name="mesInicioFiscal" value={empresaData.mesInicioFiscal} onChange={handleChange} required options={meses} />
                    <InputField type="tel" label="Teléfono Contacto" name="telefonoContacto" value={empresaData.telefonoContacto} onChange={handleChange} required />
                    <InputField type="tel" label="WhatsApp" name="numeroWhatsapp" value={empresaData.numeroWhatsapp} onChange={handleChange} />
                    <InputField type="email" label="Email Contacto" name="emailContacto" value={empresaData.emailContacto} onChange={handleChange} required />
                    <InputField label="País" name="pais" value={empresaData.pais} onChange={handleChange} required />
                    <InputField label="Provincia" name="provincia" value={empresaData.provincia} onChange={handleChange} required />
                    <InputField label="Ciudad" name="ciudad" value={empresaData.ciudad} onChange={handleChange} required />
                </div>
                <div className="space-y-4 md:col-span-2"><h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Ubicación y Certificados</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Código Postal" name="codigoPostal" value={empresaData.codigoPostal} onChange={handleChange} />
                        <InputField type="select" label="Zona Horaria" name="zonaHoraria" value={empresaData.zonaHoraria} onChange={handleChange} required options={zonasHorarias} />
                    </div>
                    <InputField label="Dirección" name="direccion" value={empresaData.direccion} onChange={handleChange} required />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InputField type="file" label="Certificado Digital" name="certificadoDigital" onChange={handleFileChange} />
                        <InputField type="file" label="Clave Privada" name="clavePrivada" onChange={handleFileChange} />
                        <InputField type="date" label="Vencimiento Certificado" name="fechaVencimientoCertificado" value={empresaData.fechaVencimientoCertificado} onChange={handleChange} />
                    </div>
                </div>
                <div className="md:col-span-2">
                    <button type="submit" disabled={loading} className={`w-full py-3 px-4 rounded-lg font-medium text-white ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} transition-colors shadow-md`}>
                        {loading ? (<span className="flex items-center justify-center"><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Registrando Empresa...</span>) : 'Registrar Empresa'}
                    </button>
                </div>
            </form>
            {feedback.msg && (<div className={`mx-6 mb-4 p-3 rounded-lg text-sm ${feedback.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{feedback.msg}</div>)}
        </div></div>
    );
}