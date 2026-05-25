import React from 'react';

const DetalleFactura = ({ factura, pdfUrl, loadingPdf }) => {
  if (!factura) return null;

  return (
    <div className="factura-viewer">
      {/* Header con datos del receptor */}
      <div className="factura-header">
        <span>
          <strong>Receptor:</strong> {factura.receptorNombre || 'Consumidor Final'}
        </span>
        {pdfUrl && (
          <a
            href={pdfUrl}
            download={`Factura_${factura.cbteDesde}.pdf`}
            className="btn btn--primary btn--sm"
          >
            Descargar PDF
          </a>
        )}
      </div>

      {/* Visor de PDF */}
      <div className="pdf-viewer">
        {loadingPdf ? (
          <div className="pdf-viewer__loading">
            <span>Cargando Comprobante...</span>
          </div>
        ) : pdfUrl ? (
          <object
            data={pdfUrl}
            type="application/pdf"
            width="100%"
            height="100%"
            className="pdf-embed"
          >
            <iframe
              src={pdfUrl}
              width="100%"
              height="100%"
              title="Vista previa del comprobante"
              className="pdf-iframe"
            >
              <p>
                Tu navegador no admite PDFs.{' '}
                <a href={pdfUrl} download>
                  Descárgalo aquí
                </a>
              </p>
            </iframe>
          </object>
        ) : (
          <div className="pdf-viewer__error">
            No se pudo generar la vista previa.
          </div>
        )}
      </div>
    </div>
  );
};

export default DetalleFactura;