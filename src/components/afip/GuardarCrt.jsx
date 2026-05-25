import React, { useState } from 'react';
import ModalGenerico from '../modal/ModalGenerico';
import { afipService } from '../../services/afip/afip-general.js';
import Swal from 'sweetalert2';

const GuardarCrt = ({ isOpen, onClose, idDbAfip, onExito }) => {
    const [certificado, setCertificado] = useState('');
    const [enviando, setEnviando] = useState(false);

    const handleGuardar = async () => {
        if (!certificado.includes("BEGIN CERTIFICATE")) {
            return Swal.fire('Error', 'El formato del certificado no parece válido', 'error');
        }

        try {
            setEnviando(true);
            const payload = {
                id: idDbAfip,
                certificado: certificado.trim()
            };

            const res = await afipService.guardarCrt(payload);

            if (res.data?.success) {
                Swal.fire('¡Logrado!', 'Certificado guardado exitosamente', 'success');
                setCertificado('');
                if (onExito) onExito();
                onClose();
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', error.response?.data?.message || 'No se pudo guardar el certificado', 'error');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <ModalGenerico 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Subir Certificado AFIP (.crt)"
            width="600px"
        >
            <div className="detalle-perfil">
                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '15px' }}>
                    Pega aquí el contenido del archivo <b>.crt</b> que obtuviste desde el portal de AFIP (sección de certificados digitales).
                </p>

                <div className="option">
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#888' }}>
                        CONTENIDO DEL CERTIFICADO
                    </label>
                    <textarea 
                        className="input-field"
                        style={{ 
                            height: '200px', 
                            fontSize: '11px', 
                            fontFamily: 'monospace', 
                            marginTop: '10px',
                            backgroundColor: '#fcfcfc',
                            padding: '12px'
                        }}
                        placeholder="-----BEGIN CERTIFICATE----- ..."
                        value={certificado}
                        onChange={(e) => setCertificado(e.target.value)}
                    />
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleGuardar}
                        disabled={enviando || !certificado}
                        style={{ flex: 1 }}
                    >
                        {enviando ? 'Guardando...' : 'Vincular Certificado'}
                    </button>
                    <button 
                        className="btn btn-secondary" 
                        onClick={onClose}
                        style={{ flex: 1, backgroundColor: '#eee', color: '#333' }}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </ModalGenerico>
    );
};

export default GuardarCrt;