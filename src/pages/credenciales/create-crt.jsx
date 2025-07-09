import React, { useState } from 'react';

export default function CertificateUploader() {
    const [certData, setCertData] = useState({ content: '' });
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({ msg: '', type: '' });
    const [fName, setFName] = useState('');

    const hFileC = e => { const f = e.target.files[0]; if (f) { setFName(f.name); const r = new FileReader(); r.onload = ev => setCertData({ content: ev.target.result }); r.readAsText(f); } };
    const hTextC = e => setCertData({ content: e.target.value });
    const clearF = () => { setCertData({ content: '' }); setFName(''); setFeedback({ msg: '', type: '' }); };

    const handleSubmit = async e => {
        e.preventDefault(); setLoading(true); setFeedback({ msg: '', type: '' });
        try {
            if (!certData.content || !certData.content.includes('-----BEGIN CERTIFICATE-----') || !certData.content.includes('-----END CERTIFICATE-----'))
                throw new Error('El contenido del certificado no es válido');
            console.log('Datos a enviar:', { certificateContent: certData.content });
            // API call goes here: await uploadCertificate({ certificateContent: certData.content });
            setFeedback({ msg: 'Certificado subido exitosamente!', type: 'success' });
        } catch (err) {
            console.error("Error:", err);
            setFeedback({ msg: err.message || 'Error al subir el certificado', type: 'error' });
        } finally { setLoading(false); }
    };

    return ( // JSX starts here
        <div className="min-h-screen bg-gray-50 py-8 px-4"><div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center">
                <h1 className="text-2xl font-bold text-white">Subir Certificado Digital</h1></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-4"><h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Contenido del Certificado</h2>
                    <div className="flex flex-col space-y-4"><div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar archivo .crt o .pem</label>
                        <label className="flex flex-col items-center px-4 py-3 bg-white text-blue-500 rounded-lg border border-dashed border-blue-500 cursor-pointer hover:bg-blue-50 w-full">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                            <span className="mt-2 text-sm text-center">{fName || 'Haz clic para seleccionar un archivo'}</span>
                            <input type="file" accept=".crt,.pem,.cer" className="hidden" onChange={hFileC} />
                        </label></div>
                        <div className="relative"><label className="block text-sm font-medium text-gray-700 mb-2">O pegar el contenido directamente</label>
                            <textarea name="certificateContent" value={certData.content} onChange={hTextC} rows={12} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-mono text-sm" placeholder="-----BEGIN CERTIFICATE-----\nMIIDSTCCAjGgAwIBAgIIVS2WyEx2d7AwDQYJKoZIhvcNAQENBQAwODEaMBgGA1UE...\n-----END CERTIFICATE-----" />
                            {certData.content && (<button type="button" onClick={clearF} className="absolute top-8 right-2 p-1 text-gray-500 hover:text-gray-700" title="Limpiar">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>)}
                        </div></div>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 flex">
                        <div className="flex-shrink-0"><svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg></div>
                        <div className="ml-3"><p className="text-sm text-yellow-700">Asegúrese de que el certificado sea válido y esté en formato PEM. El contenido debe incluir las líneas "-----BEGIN CERTIFICATE-----" y "-----END CERTIFICATE-----".</p></div>
                    </div></div>
                <div className="pt-4 flex space-x-4">
                    <button type="button" onClick={clearF} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">Limpiar</button>
                    <button type="submit" disabled={loading || !certData.content} className={`flex-1 py-3 px-4 rounded-lg font-medium text-white ${loading || !certData.content ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} transition-colors shadow-md`}>
                        {loading ? (<span className="flex items-center justify-center"><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Subiendo...</span>) : 'Subir Certificado'}
                    </button></div>
            </form>
            {feedback.msg && (<div className={`mx-6 mb-4 p-3 rounded-lg text-sm ${feedback.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{feedback.msg}</div>)}
            {certData.content && (<div className="mx-6 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Vista previa del certificado:</h3>
                <div className="font-mono text-xs bg-white p-3 rounded overflow-x-auto">{certData.content.split('\n').slice(0, 5).join('\n')}<span className="text-gray-500"> ... </span>{certData.content.split('\n').slice(-3).join('\n')}</div>
            </div>)}
        </div></div>
    );
}