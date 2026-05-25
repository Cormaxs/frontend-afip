import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth/authContext.jsx';
import ModalGenerico from '../../components/modal/ModalGenerico.jsx';
import UploadForm from '../../components/inventario/UploadForm.jsx';
import { puntosVentaService } from '../../services/puntosVenta/puntosVenta.js';

const ImportacionMasiva = () => {
  const { user } = useAuth();
  const [puntosVenta, setPuntosVenta] = useState([]);
  const [selectedPV, setSelectedPV] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (user?.empresa) {
      cargarPuntosVenta();
    }
  }, [user?.empresa]);

  const cargarPuntosVenta = async () => {
    try {
      const response = await puntosVentaService.obtenerPuntosVenta(user.empresa);
      const puntos = response.data?.puntosDeVenta || [];
      setPuntosVenta(puntos);
      if (puntos.length > 0) {
        setSelectedPV(puntos[0]);
      }
    } catch (error) {
      console.error('Error al cargar puntos de venta:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 5px 0', fontWeight: '700' }}>Importación Masiva de Productos</h1>
        <p style={{ color: '#666', margin: 0 }}>Carga múltiples productos desde un archivo Excel o CSV</p>
      </div>

      {/* INSTRUCCIONES */}
      <div style={{
        backgroundColor: '#f0f9ff',
        borderLeft: '4px solid #28a4d5',
        padding: '20px',
        borderRadius: '4px',
        marginBottom: '30px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#333' }}>📋 Formato Esperado</h3>
          <a 
            href="https://tutorial.facstock.com/importacion-masiva" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              backgroundColor: '#28a4d5', 
              color: '#fff', 
              padding: '8px 16px', 
              borderRadius: '20px', 
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📖 Ver Tutorial Completo
          </a>
        </div>
        <p style={{ margin: '0 0 10px 0', color: '#666' }}>Tu archivo Excel o CSV debe tener estas columnas (en este orden):</p>
        <div style={{
          backgroundColor: '#fff',
          padding: '15px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          overflowX: 'auto',
          marginBottom: '15px'
        }}>
          <code>codigoInterno | codigoBarras | nombre | precio | iva | stock | categoria</code>
        </div>
        
        <h4 style={{ margin: '15px 0 10px 0', color: '#333' }}>Ejemplo:</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
          <thead>
            <tr style={{ backgroundColor: '#e8f4f8' }}>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>codigoInterno</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>codigoBarras</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>nombre</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>precio</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>iva</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>stock</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>categoria</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>ABC001</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>7798123456</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>Producto A</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>100</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>21</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>50</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>Electrónica</td>
            </tr>
            <tr style={{ backgroundColor: '#f9f9f9' }}>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>ABC002</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>7798123457</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>Producto B</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>200</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>10.5</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>30</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>Hogar</td>
            </tr>
          </tbody>
        </table>

        <div style={{ backgroundColor: '#fff3cd', padding: '10px', borderRadius: '4px', marginTop: '15px' }}>
          <strong style={{ color: '#856404' }}>⚠️ Nota:</strong> La característica de actualización automática de categorías está en desarrollo. Por ahora, asegúrate de crear las categorías primero.
        </div>
      </div>

      {/* SELECTOR DE PUNTO DE VENTA */}
      <div style={{ marginBottom: '20px' }}>
        <label className="option" style={{ display: 'block', marginBottom: '10px' }}>
          Punto de Venta Destino *
        </label>
        <select
          value={selectedPV?._id || ''}
          onChange={(e) => {
            const pv = puntosVenta.find(p => p._id === e.target.value);
            setSelectedPV(pv);
          }}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '1rem',
            fontFamily: 'sans-serif'
          }}
        >
          {puntosVenta.map(pv => (
            <option key={pv._id} value={pv._id}>
              {pv.nombre} (PV #{pv.numero})
            </option>
          ))}
        </select>
      </div>

      {/* BOTÓN INICIAR */}
      <button
        className="btn btn-primary"
        onClick={() => setModalOpen(true)}
        disabled={!selectedPV}
        style={{
          width: '100%',
          padding: '15px',
          fontSize: '1.1rem',
          fontWeight: '600'
        }}
      >
        📤 Iniciar Importación
      </button>

      {/* MODAL CON UPLOAD */}
      <ModalGenerico
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Cargar Productos"
        width="600px"
      >
        <UploadForm
          empresaId={user?.empresa}
          puntoVentaId={selectedPV?._id}
          onSuccess={() => {
            setModalOpen(false);
            cargarPuntosVenta();
          }}
        />
      </ModalGenerico>
    </div>
  );
};

export default ImportacionMasiva;
