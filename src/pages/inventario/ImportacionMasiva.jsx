import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth/authContext.jsx';
import ModalGenerico from '../../components/modal/ModalGenerico.jsx';
import UploadForm from '../../components/inventario/UploadForm.jsx';
import { puntosVentaService } from '../../services/puntosVenta/puntosVenta.js';
import { FileText, BookOpen, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

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

  const descargarPlantilla = () => {
    const data = [
      {
        'Producto': 'Producto de Ejemplo',
        'Precio Costo': 1000.50,
        'Precio Venta': 1500.00,
        'Stock': 10,
        'IVA': 21,
        'Categoria': 'General',
        'Marca': 'Generica',
        'Codigo Barra': 7791234567890,
        'Codigo Interno': 'ART-001',
        'Descripcion': 'Descripción del producto'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');
    XLSX.writeFile(workbook, 'plantilla_productos_facstock.xlsx');
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0', fontWeight: '700' }}>Importación Masiva de Productos</h1>
          <p style={{ color: '#666', margin: 0 }}>Carga múltiples productos desde un archivo Excel o CSV</p>
        </div>
        <button
          onClick={descargarPlantilla}
          className="btn btn-outline"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#16a34a',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          <Download size={18} />
          Descargar Plantilla Excel
        </button>
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
          <h3 style={{ margin: 0, color: '#333', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
            <FileText size={18} color="#28a4d5" />
            Guía de Importación
          </h3>
          <a 
            href="https://tutorial.facstock.com/importacion-masiva" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              backgroundColor: '#28a4d5', 
              color: '#fff', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <BookOpen size={16} />
            Ver Tutorial Completo
          </a>
        </div>
        
        <p style={{ margin: '0 0 10px 0', color: '#666' }}>
          Para una importación exitosa, asegúrate de que tu archivo tenga los siguientes encabezados:
        </p>
        
        <div style={{
          backgroundColor: '#fff',
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '15px',
          border: '1px solid #e0e0e0'
        }}>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#444' }}>
            <li><strong>Obligatorios:</strong> Producto (Nombre), Precio Costo, Stock.</li>
            <li><strong>Opcionales:</strong> Precio Venta, IVA (def: 21), Categoria, Marca, Codigo Barra, Codigo Interno, Descripcion.</li>
          </ul>
        </div>

        <div style={{ backgroundColor: '#e8f4f8', padding: '10px', borderRadius: '4px', marginTop: '15px' }}>
          <strong style={{ color: '#28a4d5' }}>💡 Tip:</strong> El sistema creará automáticamente las Categorías y Marcas que no existan.
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
