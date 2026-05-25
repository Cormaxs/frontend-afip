import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { ImportacionService } from '../../services/inventario/importacion.js';

const UploadForm = ({ empresaId, puntoVentaId, onSuccess }) => {
  const [archivo, setArchivo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setArchivo(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!archivo) {
      Swal.fire('Error', 'Por favor selecciona un archivo', 'error');
      return;
    }

    setUploading(true);
    try {
      const respuesta = await ImportacionService.importarProductos(
        empresaId,
        puntoVentaId,
        archivo
      );

      Swal.fire({
        title: '¡Importación Exitosa!',
        html: `
          <div style="text-align: left;">
            <p><strong>Insertados:</strong> ${respuesta.data.insertados}</p>
            <p><strong>Errores:</strong> ${respuesta.data.errores}</p>
          </div>
        `,
        icon: 'success'
      });

      setArchivo(null);
      if (onSuccess) onSuccess(respuesta.data);
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Error en la importación', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="form-container" style={{ padding: '30px' }}>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: dragActive ? '2px solid #28a4d5' : '2px dashed #ccc',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            backgroundColor: dragActive ? 'rgba(40, 164, 213, 0.05)' : '#f9f9f9',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          <input
            type="file"
            id="file-input"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <label htmlFor="file-input" style={{ cursor: 'pointer', display: 'block' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>📁</div>
            <p style={{ fontWeight: '600', color: '#333', margin: '0 0 5px 0' }}>
              Arrastra aquí tu archivo o haz clic
            </p>
            <p style={{ color: '#999', margin: 0, fontSize: '0.9rem' }}>
              Soportados: Excel (.xlsx, .xls) y CSV
            </p>
          </label>
        </div>

        {archivo && (
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #28a4d5',
            borderRadius: '6px',
            padding: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ margin: 0, fontWeight: '600', color: '#333' }}>
                📄 {archivo.name}
              </p>
              <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#666' }}>
                Tamaño: {(archivo.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={() => setArchivo(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#d9534f',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ✕
            </button>
          </div>
        )}

        <div style={{ fontSize: '0.85rem', color: '#666', backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '6px' }}>
          <p style={{ fontWeight: '600', margin: '0 0 8px 0' }}>Formato esperado:</p>
          <p style={{ margin: '0' }}>
            Columnas: <code>codigoInterno | codigoBarras | nombre | precio | iva | stock | categoria</code>
          </p>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!archivo || uploading}
          style={{ marginTop: '10px' }}
        >
          {uploading ? '⏳ Importando...' : '✓ Importar Productos'}
        </button>
      </form>
    </div>
  );
};

export default UploadForm;
