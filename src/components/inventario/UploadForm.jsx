import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { ImportacionService } from '../../services/inventario/importacion.js';
import { Folder, FileText, X, Loader2, Check } from 'lucide-react';

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
      const response = await ImportacionService.importarProductos(
        empresaId,
        puntoVentaId,
        archivo
      );

      const result = response.data;

      if (result.success) {
        Swal.fire({
          title: '¡Importación Finalizada!',
          html: `
            <div style="text-align: left; font-size: 0.95rem;">
              <p style="color: #16a34a; font-weight: 600;">✅ Éxito: ${result.exitosos} productos importados.</p>
              ${result.erroresValidacion?.length > 0 ? `
                <p style="color: #ca8a04; font-weight: 600; margin-top: 10px;">⚠️ Errores de Validación (${result.erroresValidacion.length}):</p>
                <ul style="max-height: 150px; overflow-y: auto; background: #fffbeb; padding: 10px 25px; border-radius: 4px; font-size: 0.85rem;">
                  ${result.erroresValidacion.slice(0, 5).map(err => `<li>${err}</li>`).join('')}
                  ${result.erroresValidacion.length > 5 ? '<li>... y otros más.</li>' : ''}
                </ul>
              ` : ''}
              ${result.erroresDB?.length > 0 ? `
                <p style="color: #dc2626; font-weight: 600; margin-top: 10px;">❌ Errores de Base de Datos (${result.erroresDB.length}):</p>
                <p style="font-size: 0.85rem;">Algunos productos no pudieron guardarse (posiblemente códigos duplicados).</p>
              ` : ''}
            </div>
          `,
          icon: result.exitosos > 0 ? 'success' : 'warning'
        });
      } else {
        Swal.fire('Atención', result.message || 'No se pudieron procesar productos', 'warning');
      }

      setArchivo(null);
      if (onSuccess) onSuccess(result);
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
            border: dragActive ? '1px solid #28a4d5' : '1px solid #ccc',
            borderRadius: '4px',
            padding: '40px',
            textAlign: 'center',
            backgroundColor: dragActive ? '#eef8ff' : '#ffffff',
            cursor: 'pointer'
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
            <div style={{ marginBottom: '10px' }}>
              <Folder size={32} color="#28a4d5" />
            </div>
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
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} color="#28a4d5" />
                    {archivo.name}
                  </span>
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
                padding: 0
              }}
              aria-label="Eliminar archivo"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div style={{ fontSize: '0.85rem', color: '#666', backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '4px' }}>
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
          {uploading ? <><Loader2 size={16} className="animate-spin" style={{ marginRight: 8 }} /> Importando...</> : <><Check size={16} style={{ marginRight: 8 }} /> Importar Productos</>}
        </button>
      </form>
    </div>
  );
};

export default UploadForm;
