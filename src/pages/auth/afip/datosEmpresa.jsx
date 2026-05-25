import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/auth/authContext.jsx';
import { afipService } from '../../../services/afip/afip-general.js';
import CrearEmpresaModal from './CrearEmpresaModal';
import EditarEmpresaModal from './EditarEmpresaModal';
import GenerateCsrKey from '../../../components/afip/csr_key.jsx'; 
import GuardarCrt from '../../../components/afip/GuardarCrt.jsx'; 
import VerificarTA from '../../../components/afip/verificarTA.jsx';

import '../../auth/entrada.css';

const DatosEmpresa = () => {
  const { user, empresaAuth } = useAuth();
  const [datosEmpresa, setDatosEmpresa] = useState(null);
  const [cargando, setCargando] = useState(true);
  
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalCsrOpen, setModalCsrOpen] = useState(false); 
  const [modalCrtOpen, setModalCrtOpen] = useState(false); 

  const fetchDatos = useCallback(async () => {
    // CORRECCIÓN: Si no hay idDbAfip, cambiamos cargando a false y salimos.
    if (!user?.idDbAfip) {
      setCargando(false);
      return;
    }
    
    try {
      const respuesta = await afipService.obtenerdatosEmpresa(user.idDbAfip);
      if (respuesta.data?.success) {
        const d = respuesta.data.data;
        setDatosEmpresa(d);

        empresaAuth({
          id: d._id,
          razonSocial: d.empresa.razonSocial,
          cuit: d.empresa.cuit,
          puntoVenta: d.config.puntoVenta,
          tipoResponsable: d.empresa.tipoResponsable,
          entorno: d.config.entorno
        });
      }
    } catch (error) {
      console.error("Error al obtener empresa:", error);
    } finally {
      setCargando(false);
    }
  }, [user?.idDbAfip, empresaAuth]); // empresaAuth agregado para consistencia

  useEffect(() => {
    fetchDatos();
  }, [fetchDatos]);

  if (cargando) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Cargando datos fiscales...</p>;

  if (!datosEmpresa) {
    return (
      <div className="container-fluid" style={{ maxWidth: '600px', margin: '20px auto', textAlign: 'center' }}>
        <div className="door-card">
           <i className="fas fa-building" style={{ fontSize: '3rem', color: '#ccc', marginBottom: '20px' }}></i>
           <h3>Configuración Inicial</h3>
           <p>Aún no has configurado los datos de tu empresa.</p>
           <button className="btn btn-primary" onClick={() => setModalCrearOpen(true)}>Configurar ahora</button>
        </div>
        <CrearEmpresaModal isOpen={modalCrearOpen} onClose={() => setModalCrearOpen(false)} user={user} onExito={fetchDatos} />
      </div>
    );
  }

  return (
    <div className="container-fluid" style={{ maxWidth: '750px', margin: '20px auto' }}>
      
      <div style={{ marginBottom: '15px' }}>
          <VerificarTA 
              idDbAfip={datosEmpresa._id} 
              cuit={datosEmpresa.empresa.cuit} 
              servicio="wsfe" 
          />
      </div>

      <div className="door-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '600' }}>Datos de la Empresa</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => setModalCsrOpen(true)} style={{ fontSize: '0.8rem' }}>
              <i className="fas fa-key"></i> Certificados
            </button>
            <button className="btn btn-secondary" onClick={() => setModalCrtOpen(true)} style={{ fontSize: '0.8rem' }}>
              <i className="fas fa-upload"></i> CRT
            </button>
            <button className="btn btn-primary" onClick={() => setModalEditarOpen(true)}>
              Editar
            </button>
          </div>
        </div>

        <div className="detalle-perfil">
          <div className="option">
            <p style={{ color: '#888', fontSize: '0.7rem', fontWeight: 'bold' }}>RAZÓN SOCIAL</p>
            <p style={{ fontWeight: '600', fontSize: '1.2rem' }}>{datosEmpresa.empresa.razonSocial}</p>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#888', fontSize: '0.7rem' }}>CUIT</p>
              <p>{datosEmpresa.empresa.cuit}</p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#888', fontSize: '0.7rem' }}>IVA</p>
              <p>{datosEmpresa.empresa.tipoResponsable}</p>
            </div>
          </div>

          <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px', display: 'flex', justifyContent: 'space-between' }}>
             <small style={{ color: '#999' }}>PUNTO DE VENTA: <b>{datosEmpresa.config.puntoVenta}</b></small>
             <small style={{ color: datosEmpresa.config.entorno === 'prod' ? '#2ecc71' : '#e67e22', fontWeight: 'bold' }}>
               {datosEmpresa.config.entorno === 'prod' ? 'PRODUCCIÓN' : 'TESTING'}
             </small>
          </div>
        </div>
      </div>

      <GenerateCsrKey isOpen={modalCsrOpen} onClose={() => setModalCsrOpen(false)} datosEmpresa={datosEmpresa} />
      <GuardarCrt isOpen={modalCrtOpen} onClose={() => setModalCrtOpen(false)} idDbAfip={datosEmpresa._id} onExito={fetchDatos} />
      <EditarEmpresaModal isOpen={modalEditarOpen} onClose={() => setModalEditarOpen(false)} user={user} datosActuales={datosEmpresa} onExito={fetchDatos} />
      <CrearEmpresaModal isOpen={modalCrearOpen} onClose={() => setModalCrearOpen(false)} user={user} onExito={fetchDatos} />
    </div>
  );
};

export default DatosEmpresa;