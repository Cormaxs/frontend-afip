import React, { useState } from 'react';

// Componente auxiliar para Input/Select/File (fuera del componente principal para no contar en sus líneas)
const InputField = ({ label, name, value, onChange, type = 'text', options, required, placeholder, className, disabled, onFileChange, file }) => (
    <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && '*'}</label>
        {type === 'select' ? (
            <select name={name} value={value} onChange={onChange} required={required} disabled={disabled} className={"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition " + (className || "")}>
                <option value="">Seleccione una provincia</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        ) : type === 'file' ? (
            <label className="flex flex-col items-center px-4 py-6 bg-white text-blue-500 rounded-lg border border-dashed border-blue-500 cursor-pointer hover:bg-blue-50">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                <span className="mt-2 text-sm">{file ? file.name : 'Seleccionar archivo'}</span>
                <input type="file" accept={name === 'certificado' ? ".crt,.pem" : ".key"} className="hidden" onChange={onFileChange} required={required} />
            </label>
        ) : (
            <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} disabled={disabled} maxLength={name === 'cuit' ? 13 : undefined} className={"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition " + (className || "")} />
        )}
    </div>
);

export function GenerarCertificadoDigital() {
    const [certData, setCertData] = useState({ datos: { country: "AR", state: "", locality: "", organization: "", organizationalUnit: "", emailAddress: "", cuit: "" } });
    const [certFile, setCertFile] = useState(null);
    const [privKeyFile, setPrivKeyFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({ msg: '', type: '' });

    const provinciasArg = ["Buenos Aires", "Ciudad Autónoma de Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán"];

    const hC = e => { const { name, value } = e.target; setCertData(p => ({ ...p, datos: { ...p.datos, [name]: value } })); };
    const hFC = (e, type) => { const f = e.target.files[0]; if (type === 'certificado') setCertFile(f); else setPrivKeyFile(f); };
    const fCuit = v => { const nV = v.replace(/\D/g, ''); return nV.length <= 2 ? nV : nV.length <= 10 ? `${nV.slice(0, 2)}-${nV.slice(2)}` : `${nV.slice(0, 2)}-${nV.slice(2, 10)}-${nV.slice(10, 11)}`; };
    const hCC = e => setCertData(p => ({ ...p, datos: { ...p.datos, cuit: fCuit(e.target.value) } }));

    const handleSubmit = async e => {
        e.preventDefault(); setLoading(true); setFeedback({ msg: '', type: '' });
        try {
            if (!certData.datos.cuit || certData.datos.cuit.length !== 13) throw new Error('El CUIT debe tener el formato XX-XXXXXXXX-X');
            if (!certData.datos.organization) throw new Error('La organización es requerida');
            if (!certFile || !privKeyFile) throw new Error('Debe subir ambos archivos: certificado y clave privada');

            const formData = new FormData();
            formData.append('certificado', certFile);
            formData.append('clavePrivada', privKeyFile);
            formData.append('datos', JSON.stringify(certData.datos));

            console.log('Datos a enviar:', { datos: certData.datos, certificado: certFile.name, clavePrivada: privKeyFile.name });
            // API call: await generarCertificado(formData);
            setFeedback({ msg: 'Certificado digital generado exitosamente!', type: 'success' });
        } catch (err) {
            console.error("Error:", err);
            setFeedback({ msg: err.message || 'Error al generar el certificado digital', type: 'error' });
        } finally { setLoading(false); }
    };

    return ( // JSX starts here
        <div className="min-h-screen bg-gray-50 py-8 px-4"><div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center">
                <h1 className="text-2xl font-bold text-white">Generar Certificado Digital</h1></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-4"><h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Datos del Certificado</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="País" name="country" value={certData.datos.country} onChange={hC} required disabled className="bg-gray-100" />
                        <InputField type="select" label="Provincia" name="state" value={certData.datos.state} onChange={hC} required options={provinciasArg} />
                        <InputField label="Localidad" name="locality" value={certData.datos.locality} onChange={hC} required />
                        <InputField label="Organización" name="organization" value={certData.datos.organization} onChange={hC} required />
                        <InputField label="Unidad Organizacional" name="organizationalUnit" value={certData.datos.organizationalUnit} onChange={hC} />
                        <InputField type="email" label="Email" name="emailAddress" value={certData.datos.emailAddress} onChange={hC} required />
                        <InputField label="CUIT" name="cuit" value={certData.datos.cuit} onChange={hCC} required placeholder="XX-XXXXXXXX-X" />
                    </div></div>
                <div className="space-y-4"><h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Archivos del Certificado</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField type="file" label="Certificado (.crt)" name="certificado" onFileChange={e => hFC(e, 'certificado')} file={certFile} required />
                        <InputField type="file" label="Clave Privada (.key)" name="clavePrivada" onFileChange={e => hFC(e, 'clavePrivada')} file={privKeyFile} required />
                    </div>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 flex">
                        <div className="flex-shrink-0"><svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg></div>
                        <div className="ml-3"><p className="text-sm text-yellow-700">Asegúrese de que los archivos del certificado y clave privada sean los correctos y correspondan al mismo certificado.</p></div>
                    </div></div>
                <div className="pt-4">
                    <button type="submit" disabled={loading} className={`w-full py-3 px-4 rounded-lg font-medium text-white ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} transition-colors shadow-md`}>
                        {loading ? (<span className="flex items-center justify-center"><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Generando...</span>) : 'Generar Certificado'}
                    </button></div>
            </form>
            {feedback.msg && (<div className={`mx-6 mb-4 p-3 rounded-lg text-sm ${feedback.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{feedback.msg}</div>)}
        </div></div>
    );
}