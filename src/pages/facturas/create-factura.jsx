import React, { useState, useEffect } from 'react';

export function CrearFactura() {
  const [facturaData, setFacturaData] = useState({
    afipRequestData: {
      Auth: {
        Token: "",
        Sign: "",
        Cuit: ""
      },
      FeCAEReq: {
        FeCabReq: {
          CantReg: 1,
          PtoVta: 1,
          CbteTipo: 1
        },
        FeDetReq: [{
          Concepto: 1,
          DocTipo: 80,
          DocNro: "",
          CbteDesde: "",
          CbteHasta: "",
          CbteFch: "",
          ImpTotal: 0,
          ImpTotConc: 0,
          ImpNeto: 0,
          ImpOpEx: 0,
          ImpTrib: 0,
          ImpIVA: 0,
          FchServDesde: "",
          FchServHasta: "",
          FchVtoPago: "",
          MonId: "PES",
          MonCotiz: 1,
          CondicionIVAReceptorId: 1,
          Tributos: [],
          Iva: []
        }]
      }
    },
    facturaData: {
      emisor: {
        razonSocial: "",
        cuit: "",
        domicilio: "",
        localidad: "",
        provincia: "",
        iibb: "",
        fechaInicioActividades: "",
        condicionIVA: "Responsable Inscripto",
        categoriaMonotributo: null,
        actividadAFIP: "",
        puntoVentaSucursal: "",
        telefono: ""
      },
      receptor: {
        razonSocial: "",
        cuit: "",
        condicionIVA: "Responsable Inscripto",
        domicilio: "",
        localidad: "",
        provincia: ""
      },
      comprobante: {
        tipo: "FACTURA A",
        codigoTipo: "001",
        numero: "",
        fecha: new Date().toLocaleDateString('es-AR'),
        puntoVenta: "",
        cae: "",
        fechaVtoCae: "",
        letra: "A",
        leyendaAFIP: "COMPROBANTE AUTORIZADO",
        qrImage: null
      },
      items: [],
      pagos: {
        formaPago: "Transferencia Bancaria",
        monto: 0
      },
      totales: {
        subtotal: 0,
        iva: 0,
        leyendaIVA: "IVA 21%",
        total: 0,
        importeNetoNoGravado: 0,
        importeExento: 0,
        importeOtrosTributos: 0
      },
      observaciones: ""
    }
  });

  const [nuevoItem, setNuevoItem] = useState({
    codigo: "",
    descripcion: "",
    cantidad: 1,
    precioUnitario: 0,
    descuento: 0,
    alicuotaIVA: 21,
    unidadMedida: "94"
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const tiposComprobante = [
    { value: "FACTURA A", codigo: "001" },
    { value: "FACTURA B", codigo: "006" },
    { value: "FACTURA C", codigo: "011" },
    { value: "NOTA DE CRÉDITO A", codigo: "003" },
    { value: "NOTA DE DÉBITO A", codigo: "002" }
  ];

  const provincias = [
    "BUENOS AIRES", "CIUDAD AUTÓNOMA DE BUENOS AIRES", "CATAMARCA", "CHACO",
    "CHUBUT", "CÓRDOBA", "CORRIENTES", "ENTRE RÍOS", "FORMOSA", "JUJUY",
    "LA PAMPA", "LA RIOJA", "MENDOZA", "MISIONES", "NEUQUÉN", "RÍO NEGRO",
    "SALTA", "SAN JUAN", "SAN LUIS", "SANTA CRUZ", "SANTA FE",
    "SANTIAGO DEL ESTERO", "TIERRA DEL FUEGO", "TUCUMÁN"
  ];

  const condicionesIVA = [
    "Responsable Inscripto",
    "Monotributista",
    "Exento",
    "Consumidor Final",
    "No Responsable"
  ];

  const unidadesMedida = [
    { value: "94", label: "Unidad" },
    { value: "7", label: "Kilogramo" },
    { value: "1", label: "Metro" },
    { value: "21", label: "Hora" }
  ];

  const formasPago = [
    "Transferencia Bancaria",
    "Efectivo",
    "Tarjeta de Crédito",
    "Tarjeta de Débito",
    "Cheque",
    "Mercado Pago"
  ];

  const handleChange = (e, section, subSection = null) => {
    const { name, value } = e.target;
    
    setFacturaData(prev => {
      const newData = {...prev};
      if (subSection) {
        newData[section][subSection][name] = value;
      } else if (section) {
        newData[section][name] = value;
      } else {
        newData[name] = value;
      }
      return newData;
    });
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setNuevoItem(prev => ({
      ...prev,
      [name]: name === 'cantidad' || name === 'precioUnitario' || name === 'descuento' || name === 'alicuotaIVA'
        ? parseFloat(value) || 0
        : value
    }));
  };

  const agregarItem = () => {
    if (nuevoItem.descripcion && nuevoItem.precioUnitario > 0) {
      setFacturaData(prev => ({
        ...prev,
        facturaData: {
          ...prev.facturaData,
          items: [...prev.facturaData.items, nuevoItem]
        }
      }));
      
      calcularTotales([...facturaData.facturaData.items, nuevoItem]);
      
      setNuevoItem({
        codigo: "",
        descripcion: "",
        cantidad: 1,
        precioUnitario: 0,
        descuento: 0,
        alicuotaIVA: 21,
        unidadMedida: "94"
      });
    }
  };

  const eliminarItem = (index) => {
    const nuevosItems = facturaData.facturaData.items.filter((_, i) => i !== index);
    setFacturaData(prev => ({
      ...prev,
      facturaData: {
        ...prev.facturaData,
        items: nuevosItems
      }
    }));
    calcularTotales(nuevosItems);
  };

  const calcularTotales = (items) => {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.precioUnitario * item.cantidad * (1 - item.descuento / 100));
    }, 0);

    const iva = items.reduce((sum, item) => {
      return sum + (item.precioUnitario * item.cantidad * (1 - item.descuento / 100) * (item.alicuotaIVA / 100));
    }, 0);

    const total = subtotal + iva;

    setFacturaData(prev => ({
      ...prev,
      facturaData: {
        ...prev.facturaData,
        totales: {
          ...prev.facturaData.totales,
          subtotal: subtotal,
          iva: iva,
          total: total,
          leyendaIVA: `IVA ${items.length > 0 ? items[0].alicuotaIVA : 21}%`
        },
        pagos: {
          ...prev.facturaData.pagos,
          monto: total
        },
        afipRequestData: {
          ...prev.afipRequestData,
          FeCAEReq: {
            ...prev.afipRequestData.FeCAEReq,
            FeDetReq: [{
              ...prev.afipRequestData.FeCAEReq.FeDetReq[0],
              ImpTotal: total,
              ImpNeto: subtotal,
              ImpIVA: iva
            }]
          }
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      if (!facturaData.facturaData.emisor.cuit || !facturaData.facturaData.receptor.cuit) {
        throw new Error('Los CUITs del emisor y receptor son obligatorios');
      }
      if (facturaData.facturaData.items.length === 0) {
        throw new Error('Debe agregar al menos un ítem a la factura');
      }

      const numeroComprobante = Math.floor(Math.random() * 10000) + 1;
      
      const datosCompletos = {
        ...facturaData,
        facturaData: {
          ...facturaData.facturaData,
          comprobante: {
            ...facturaData.facturaData.comprobante,
            numero: numeroComprobante.toString().padStart(8, '0'),
            puntoVenta: facturaData.afipRequestData.FeCAEReq.FeCabReq.PtoVta.toString().padStart(4, '0')
          }
        },
        afipRequestData: {
          ...facturaData.afipRequestData,
          FeCAEReq: {
            ...facturaData.afipRequestData.FeCAEReq,
            FeDetReq: [{
              ...facturaData.afipRequestData.FeCAEReq.FeDetReq[0],
              CbteDesde: numeroComprobante,
              CbteHasta: numeroComprobante,
              CbteFch: facturaData.facturaData.comprobante.fecha.split('/').reverse().join(''),
              DocNro: facturaData.facturaData.receptor.cuit.replace(/-/g, '')
            }]
          }
        }
      };

      console.log('Datos a enviar:', datosCompletos);
      setMessage('Factura generada exitosamente!');
    } catch (err) {
      setError(err.message || 'Error al generar la factura');
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg">
        <div className="p-4 text-center">
          <h1 className="text-xl font-bold">Generar Nueva Factura</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Sección Emisor */}
          <div className="border p-3 rounded">
            <h2 className="font-semibold mb-2">Datos del Emisor</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className="block text-sm">Razón Social*</label><input type="text" name="razonSocial" value={facturaData.facturaData.emisor.razonSocial} onChange={(e) => handleChange(e, 'facturaData', 'emisor')} required className="w-full border px-2 py-1 rounded" /></div>
              <div><label className="block text-sm">CUIT*</label><input type="text" name="cuit" value={facturaData.facturaData.emisor.cuit} onChange={(e) => handleChange(e, 'facturaData', 'emisor')} required className="w-full border px-2 py-1 rounded" placeholder="XX-XXXXXXXX-X" /></div>
              <div><label className="block text-sm">Domicilio</label><input type="text" name="domicilio" value={facturaData.facturaData.emisor.domicilio} onChange={(e) => handleChange(e, 'facturaData', 'emisor')} className="w-full border px-2 py-1 rounded" /></div>
              <div><label className="block text-sm">Localidad</label><input type="text" name="localidad" value={facturaData.facturaData.emisor.localidad} onChange={(e) => handleChange(e, 'facturaData', 'emisor')} className="w-full border px-2 py-1 rounded" /></div>
              <div><label className="block text-sm">Provincia</label><select name="provincia" value={facturaData.facturaData.emisor.provincia} onChange={(e) => handleChange(e, 'facturaData', 'emisor')} className="w-full border px-2 py-1 rounded"><option value="">Seleccione</option>{provincias.map(prov => (<option key={prov} value={prov}>{prov}</option>))}</select></div>
              <div><label className="block text-sm">IIBB</label><input type="text" name="iibb" value={facturaData.facturaData.emisor.iibb} onChange={(e) => handleChange(e, 'facturaData', 'emisor')} className="w-full border px-2 py-1 rounded" /></div>
              <div><label className="block text-sm">Condición IVA*</label><select name="condicionIVA" value={facturaData.facturaData.emisor.condicionIVA} onChange={(e) => handleChange(e, 'facturaData', 'emisor')} required className="w-full border px-2 py-1 rounded">{condicionesIVA.map(cond => (<option key={cond} value={cond}>{cond}</option>))}</select></div>
              <div><label className="block text-sm">Actividad AFIP</label><input type="text" name="actividadAFIP" value={facturaData.facturaData.emisor.actividadAFIP} onChange={(e) => handleChange(e, 'facturaData', 'emisor')} className="w-full border px-2 py-1 rounded" /></div>
            </div>
          </div>

          {/* Sección Receptor */}
          <div className="border p-3 rounded">
            <h2 className="font-semibold mb-2">Datos del Receptor</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className="block text-sm">Razón Social*</label><input type="text" name="razonSocial" value={facturaData.facturaData.receptor.razonSocial} onChange={(e) => handleChange(e, 'facturaData', 'receptor')} required className="w-full border px-2 py-1 rounded" /></div>
              <div><label className="block text-sm">CUIT*</label><input type="text" name="cuit" value={facturaData.facturaData.receptor.cuit} onChange={(e) => handleChange(e, 'facturaData', 'receptor')} required className="w-full border px-2 py-1 rounded" placeholder="XX-XXXXXXXX-X" /></div>
              <div><label className="block text-sm">Condición IVA*</label><select name="condicionIVA" value={facturaData.facturaData.receptor.condicionIVA} onChange={(e) => handleChange(e, 'facturaData', 'receptor')} required className="w-full border px-2 py-1 rounded">{condicionesIVA.map(cond => (<option key={cond} value={cond}>{cond}</option>))}</select></div>
              <div><label className="block text-sm">Domicilio</label><input type="text" name="domicilio" value={facturaData.facturaData.receptor.domicilio} onChange={(e) => handleChange(e, 'facturaData', 'receptor')} className="w-full border px-2 py-1 rounded" /></div>
              <div><label className="block text-sm">Localidad</label><input type="text" name="localidad" value={facturaData.facturaData.receptor.localidad} onChange={(e) => handleChange(e, 'facturaData', 'receptor')} className="w-full border px-2 py-1 rounded" /></div>
              <div><label className="block text-sm">Provincia</label><select name="provincia" value={facturaData.facturaData.receptor.provincia} onChange={(e) => handleChange(e, 'facturaData', 'receptor')} className="w-full border px-2 py-1 rounded"><option value="">Seleccione</option>{provincias.map(prov => (<option key={prov} value={prov}>{prov}</option>))}</select></div>
            </div>
          </div>

          {/* Sección Comprobante */}
          <div className="border p-3 rounded">
            <h2 className="font-semibold mb-2">Datos del Comprobante</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className="block text-sm">Tipo*</label><select name="tipo" value={facturaData.facturaData.comprobante.tipo} onChange={(e) => { const selected = tiposComprobante.find(t => t.value === e.target.value); handleChange(e, 'facturaData', 'comprobante'); setFacturaData(prev => ({ ...prev, facturaData: { ...prev.facturaData, comprobante: { ...prev.facturaData.comprobante, codigoTipo: selected ? selected.codigo : "001" } }, afipRequestData: { ...prev.afipRequestData, FeCAEReq: { ...prev.afipRequestData.FeCAEReq, FeCabReq: { ...prev.afipRequestData.FeCAEReq.FeCabReq, CbteTipo: selected ? parseInt(selected.codigo) : 1 } } } })); }} required className="w-full border px-2 py-1 rounded" >{tiposComprobante.map(tipo => (<option key={tipo.value} value={tipo.value}>{tipo.value}</option>))}</select></div>
              <div><label className="block text-sm">Punto de Venta*</label><input type="number" name="PtoVta" value={facturaData.afipRequestData.FeCAEReq.FeCabReq.PtoVta} onChange={(e) => { setFacturaData(prev => ({ ...prev, afipRequestData: { ...prev.afipRequestData, FeCAEReq: { ...prev.afipRequestData.FeCAEReq, FeCabReq: { ...prev.afipRequestData.FeCAEReq.FeCabReq, PtoVta: parseInt(e.target.value) || 1 } } } })); }} required min="1" className="w-full border px-2 py-1 rounded" /></div>
              <div><label className="block text-sm">Fecha*</label><input type="date" name="fecha" value={facturaData.facturaData.comprobante.fecha.split('/').reverse().join('-')} onChange={(e) => { const fechaFormateada = e.target.value.split('-').reverse().join('/'); setFacturaData(prev => ({ ...prev, facturaData: { ...prev.facturaData, comprobante: { ...prev.facturaData.comprobante, fecha: fechaFormateada } } })); }} required className="w-full border px-2 py-1 rounded" /></div>
            </div>
          </div>

          {/* Sección Items */}
          <div className="border p-3 rounded">
            <h2 className="font-semibold mb-2">Ítems de Factura</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              <div><label className="block text-sm">Código</label><input type="text" name="codigo" value={nuevoItem.codigo} onChange={handleItemChange} className="w-full border px-2 py-1 rounded" /></div>
              <div><label className="block text-sm">Descripción*</label><input type="text" name="descripcion" value={nuevoItem.descripcion} onChange={handleItemChange} required className="w-full border px-2 py-1 rounded" /></div>
              <div><label className="block text-sm">Cantidad*</label><input type="number" name="cantidad" value={nuevoItem.cantidad} onChange={handleItemChange} min="1" step="1" required className="w-full border px-2 py-1 rounded" /></div>
              <div><label className="block text-sm">Precio Unitario*</label><input type="number" name="precioUnitario" value={nuevoItem.precioUnitario} onChange={handleItemChange} min="0" step="0.01" required className="w-full border px-2 py-1 rounded" /></div>
              <div><label className="block text-sm">Descuento (%)</label><input type="number" name="descuento" value={nuevoItem.descuento} onChange={handleItemChange} min="0" max="100" step="1" className="w-full border px-2 py-1 rounded" /></div>
              <div><label className="block text-sm">IVA (%)*</label><input type="number" name="alicuotaIVA" value={nuevoItem.alicuotaIVA} onChange={handleItemChange} min="0" max="100" step="0.1" required className="w-full border px-2 py-1 rounded" /></div>
              <div><label className="block text-sm">Unidad Medida</label><select name="unidadMedida" value={nuevoItem.unidadMedida} onChange={handleItemChange} className="w-full border px-2 py-1 rounded">{unidadesMedida.map(um => (<option key={um.value} value={um.value}>{um.label}</option>))}</select></div>
              <div className="flex items-end"><button type="button" onClick={agregarItem} className="w-full bg-blue-600 text-white py-1 rounded hover:bg-blue-700">Agregar Ítem</button></div>
            </div>
            {facturaData.facturaData.items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead>
                    <tr><th className="p-2 text-left text-sm">Cód.</th><th className="p-2 text-left text-sm">Descripción</th><th className="p-2 text-left text-sm">Cant.</th><th className="p-2 text-left text-sm">P. Unit.</th><th className="p-2 text-left text-sm">Desc.</th><th className="p-2 text-left text-sm">IVA %</th><th className="p-2 text-left text-sm">Subtotal</th><th className="p-2 text-left text-sm">Acciones</th></tr>
                  </thead>
                  <tbody>
                    {facturaData.facturaData.items.map((item, index) => {
                      const subtotal = item.cantidad * item.precioUnitario * (1 - item.descuento / 100);
                      const iva = subtotal * (item.alicuotaIVA / 100);
                      const total = subtotal + iva;
                      return (
                        <tr key={index}>
                          <td className="p-2">{item.codigo}</td><td className="p-2">{item.descripcion}</td><td className="p-2">{item.cantidad}</td><td className="p-2">${item.precioUnitario.toFixed(2)}</td><td className="p-2">{item.descuento}%</td><td className="p-2">{item.alicuotaIVA}%</td><td className="p-2">${total.toFixed(2)}</td>
                          <td className="p-2"><button type="button" onClick={() => eliminarItem(index)} className="text-red-600 hover:text-red-800">Eliminar</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sección Totales y Pagos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border p-3 rounded">
              <h2 className="font-semibold mb-2">Totales</h2>
              <div className="flex justify-between"><span className="font-medium">Subtotal:</span><span>${facturaData.facturaData.totales.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="font-medium">{facturaData.facturaData.totales.leyendaIVA}:</span><span>${facturaData.facturaData.totales.iva.toFixed(2)}</span></div>
              <div className="flex justify-between border-t pt-2 mt-2"><span className="font-bold">Total:</span><span className="font-bold">${facturaData.facturaData.totales.total.toFixed(2)}</span></div>
            </div>

            <div className="border p-3 rounded">
              <h2 className="font-semibold mb-2">Pago</h2>
              <div><label className="block text-sm">Forma de Pago*</label><select name="formaPago" value={facturaData.facturaData.pagos.formaPago} onChange={(e) => handleChange(e, 'facturaData', 'pagos')} required className="w-full border px-2 py-1 rounded">{formasPago.map(fp => (<option key={fp} value={fp}>{fp}</option>))}</select></div>
              <div><label className="block text-sm">Monto de Pago</label><input type="number" name="monto" value={facturaData.facturaData.pagos.monto.toFixed(2)} readOnly className="w-full border px-2 py-1 rounded bg-gray-100" /></div>
            </div>
          </div>

          {/* Sección Observaciones */}
          <div className="border p-3 rounded">
            <h2 className="font-semibold mb-2">Observaciones</h2>
            <div><textarea name="observaciones" value={facturaData.facturaData.observaciones} onChange={(e) => handleChange(e, 'facturaData')} rows="2" className="w-full border px-2 py-1 rounded"></textarea></div>
          </div>

          {/* Mensajes de estado */}
          {message && (<div className="bg-green-100 border border-green-400 text-green-700 p-2 rounded">{message}</div>)}
          {error && (<div className="bg-red-100 border border-red-400 text-red-700 p-2 rounded">{error}</div>)}

          {/* Botón de Submit */}
          <button type="submit" disabled={loading} className="w-full py-2 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Generando Factura...' : 'Generar Factura'}
          </button>
        </form>
      </div>
    </div>
  );
}