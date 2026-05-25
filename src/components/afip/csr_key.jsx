import React, { useState } from 'react';
import ModalGenerico from '../modal/ModalGenerico'; // Ajusta la ruta a tu carpeta de modales
import { afipService } from '../../services/afip/afip-general.js';
import Swal from 'sweetalert2';

const GenerateCsrKey = ({ isOpen, onClose, datosEmpresa }) => {
    const [cargando, setCargando] = useState(false);
    const [resultado, setResultado] = useState({ csr: '', key: '' });

    const handleGenerar = async () => {
        try {
            setCargando(true);
            const payload = {
                id: datosEmpresa._id,
                datos: {
                    country: "AR",
                    state: datosEmpresa.empresa.domicilio?.provincia || "Buenos Aires",
                    locality: datosEmpresa.empresa.domicilio?.localidad || "CABA",
                    organization: datosEmpresa.empresa.razonSocial,
                    organizationalUnit: "Sistemas",
                    emailAddress: datosEmpresa.empresa.contacto?.email,
                    cuit: datosEmpresa.empresa.cuit
                }
            };

            const res = await afipService.generarKeyCsr(payload);
            if (res.data?.success) {
                setResultado({
                    csr: res.data.data.csr,
                    key: res.data.data.key
                });
                Swal.fire({
                    icon: 'success',
                    title: '¡Generados!',
                    text: 'Los certificados se crearon correctamente.',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            Swal.fire('Error', 'No se pudo procesar la solicitud', 'error');
        } finally {
            setCargando(false);
        }
    };

    const copiarAlPortapapeles = (texto, tipo) => {
        navigator.clipboard.writeText(texto);
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `${tipo} copiado`,
            showConfirmButton: false,
            timer: 1500
        });
    };

    return (
        <ModalGenerico 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Generar Certificados AFIP"
            width="650px"
        >
            <div className="detalle-perfil">
                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '20px' }}>
                    Esta acción generará una nueva <b>Private Key</b> y un <b>CSR</b>. Deberás copiar y guardar el CSR y subirlo a la web de AFIP. <a href='#' target='_blank' >Tutorial</a>
                </p>

                {/* Campo CSR */}
                <div className="option" style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <p style={{ color: '#888', fontSize: '0.75rem', fontWeight: 'bold' }}>CSR (Certificate Request)</p>
                        {resultado.csr && (
                            <span 
                                onClick={() => copiarAlPortapapeles(resultado.csr, 'CSR')}
                                style={{ color: '#28a4d5', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                <i className="fas fa-copy"></i> COPIAR
                            </span>
                        )}
                    </div>
                    <textarea 
                        readOnly 
                        className="input-field"
                        style={{ height: '100px', fontSize: '10px', fontFamily: 'monospace', backgroundColor: '#f9f9f9', resize: 'none', marginTop: '5px' }}
                        value={resultado.csr}
                        placeholder="El CSR aparecerá aquí..."
                    />
                </div>

                {/* Campo KEY */}
                <div className="option" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <p style={{ color: '#888', fontSize: '0.75rem', fontWeight: 'bold' }}>PRIVATE KEY</p>
                        {resultado.key && (
                            <span 
                                onClick={() => copiarAlPortapapeles(resultado.key, 'Key')}
                                style={{ color: '#28a4d5', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                <i className="fas fa-copy"></i> COPIAR
                            </span>
                        )}
                    </div>
                    <textarea 
                        readOnly 
                        className="input-field"
                        style={{ height: '100px', fontSize: '10px', fontFamily: 'monospace', backgroundColor: '#f9f9f9', resize: 'none', marginTop: '5px' }}
                        value={resultado.key}
                        placeholder="La Key aparecerá aquí..."
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleGenerar} 
                        disabled={cargando}
                        style={{ flex: 1 }}
                    >
                        {cargando ? <i className="fas fa-spinner fa-spin"></i> : 'Generar nuevos archivos'}
                    </button>
                    <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1, backgroundColor: '#eee', color: '#333' }}>
                        Cerrar
                    </button>
                </div>
            </div>
        </ModalGenerico>
    );
};

export default GenerateCsrKey;