import React, { useState } from 'react';

export function CrearFactura() {
  // Estado inicial basado en la estructura proporcionada
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
      
      // Calcular totales
      calcularTotales([...facturaData.facturaData.items, nuevoItem]);
      
      // Resetear formulario de item
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
      // Validaciones básicas
      if (!facturaData.facturaData.emisor.cuit || !facturaData.facturaData.receptor.cuit) {
        throw new Error('Los CUITs del emisor y receptor son obligatorios');
      }
      if (facturaData.facturaData.items.length === 0) {
        throw new Error('Debe agregar al menos un ítem a la factura');
      }

      // Generar número de comprobante (simulado)
      const numeroComprobante = Math.floor(Math.random() * 10000) + 1;
      
      // Actualizar datos con número generado
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
      // Aquí iría la llamada a la API:
      // const response = await crearFactura(datosCompletos);
      
      setMessage('Factura generada exitosamente!');
    } catch (err) {
      setError(err.message || 'Error al generar la factura');
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Generar Nueva Factura</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Sección Emisor */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-800 border-b border-blue-200 pb-2 mb-4">Datos del Emisor</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social*</label>
                <input
                  type="text"
                  name="razonSocial"
                  value={facturaData.facturaData.emisor.razonSocial}
                  onChange={(e) => handleChange(e, 'facturaData', 'emisor')}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">CUIT*</label>
                <input
                  type="text"
                  name="cuit"
                  value={facturaData.facturaData.emisor.cuit}
                  onChange={(e) => handleChange(e, 'facturaData', 'emisor')}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="XX-XXXXXXXX-X"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Domicilio</label>
                <input
                  type="text"
                  name="domicilio"
                  value={facturaData.facturaData.emisor.domicilio}
                  onChange={(e) => handleChange(e, 'facturaData', 'emisor')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Localidad</label>
                <input
                  type="text"
                  name="localidad"
                  value={facturaData.facturaData.emisor.localidad}
                  onChange={(e) => handleChange(e, 'facturaData', 'emisor')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                <select
                  name="provincia"
                  value={facturaData.facturaData.emisor.provincia}
                  onChange={(e) => handleChange(e, 'facturaData', 'emisor')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="">Seleccione una provincia</option>
                  {provincias.map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">IIBB</label>
                <input
                  type="text"
                  name="iibb"
                  value={facturaData.facturaData.emisor.iibb}
                  onChange={(e) => handleChange(e, 'facturaData', 'emisor')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Condición IVA*</label>
                <select
                  name="condicionIVA"
                  value={facturaData.facturaData.emisor.condicionIVA}
                  onChange={(e) => handleChange(e, 'facturaData', 'emisor')}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  {condicionesIVA.map(cond => (
                    <option key={cond} value={cond}>{cond}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Actividad AFIP</label>
                <input
                  type="text"
                  name="actividadAFIP"
                  value={facturaData.facturaData.emisor.actividadAFIP}
                  onChange={(e) => handleChange(e, 'facturaData', 'emisor')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Sección Receptor */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-800 border-b border-blue-200 pb-2 mb-4">Datos del Receptor</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social*</label>
                <input
                  type="text"
                  name="razonSocial"
                  value={facturaData.facturaData.receptor.razonSocial}
                  onChange={(e) => handleChange(e, 'facturaData', 'receptor')}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">CUIT*</label>
                <input
                  type="text"
                  name="cuit"
                  value={facturaData.facturaData.receptor.cuit}
                  onChange={(e) => handleChange(e, 'facturaData', 'receptor')}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="XX-XXXXXXXX-X"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Condición IVA*</label>
                <select
                  name="condicionIVA"
                  value={facturaData.facturaData.receptor.condicionIVA}
                  onChange={(e) => handleChange(e, 'facturaData', 'receptor')}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  {condicionesIVA.map(cond => (
                    <option key={cond} value={cond}>{cond}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Domicilio</label>
                <input
                  type="text"
                  name="domicilio"
                  value={facturaData.facturaData.receptor.domicilio}
                  onChange={(e) => handleChange(e, 'facturaData', 'receptor')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Localidad</label>
                <input
                  type="text"
                  name="localidad"
                  value={facturaData.facturaData.receptor.localidad}
                  onChange={(e) => handleChange(e, 'facturaData', 'receptor')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                <select
                  name="provincia"
                  value={facturaData.facturaData.receptor.provincia}
                  onChange={(e) => handleChange(e, 'facturaData', 'receptor')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="">Seleccione una provincia</option>
                  {provincias.map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sección Comprobante */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-800 border-b border-blue-200 pb-2 mb-4">Datos del Comprobante</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo*</label>
                <select
                  name="tipo"
                  value={facturaData.facturaData.comprobante.tipo}
                  onChange={(e) => {
                    const selected = tiposComprobante.find(t => t.value === e.target.value);
                    handleChange(e, 'facturaData', 'comprobante');
                    setFacturaData(prev => ({
                      ...prev,
                      facturaData: {
                        ...prev.facturaData,
                        comprobante: {
                          ...prev.facturaData.comprobante,
                          codigoTipo: selected ? selected.codigo : "001"
                        }
                      },
                      afipRequestData: {
                        ...prev.afipRequestData,
                        FeCAEReq: {
                          ...prev.afipRequestData.FeCAEReq,
                          FeCabReq: {
                            ...prev.afipRequestData.FeCAEReq.FeCabReq,
                            CbteTipo: selected ? parseInt(selected.codigo) : 1
                          }
                        }
                      }
                    }));
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  {tiposComprobante.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>{tipo.value}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Punto de Venta*</label>
                <input
                  type="number"
                  name="PtoVta"
                  value={facturaData.afipRequestData.FeCAEReq.FeCabReq.PtoVta}
                  onChange={(e) => {
                    setFacturaData(prev => ({
                      ...prev,
                      afipRequestData: {
                        ...prev.afipRequestData,
                        FeCAEReq: {
                          ...prev.afipRequestData.FeCAEReq,
                          FeCabReq: {
                            ...prev.afipRequestData.FeCAEReq.FeCabReq,
                            PtoVta: parseInt(e.target.value) || 1
                          }
                        }
                      }
                    }));
                  }}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha*</label>
                <input
                  type="date"
                  name="fecha"
                  value={facturaData.facturaData.comprobante.fecha.split('/').reverse().join('-')}
                  onChange={(e) => {
                    const fechaFormateada = e.target.value.split('-').reverse().join('/');
                    setFacturaData(prev => ({
                      ...prev,
                      facturaData: {
                        ...prev.facturaData,
                        comprobante: {
                          ...prev.facturaData.comprobante,
                          fecha: fechaFormateada
                        }
                      }
                    }));
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Sección Items */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-800 border-b border-blue-200 pb-2 mb-4">Ítems de Factura</h2>
            
            {/* Formulario para agregar items */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                <input
                  type="text"
                  name="codigo"
                  value={nuevoItem.codigo}
                  onChange={handleItemChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción*</label>
                <input
                  type="text"
                  name="descripcion"
                  value={nuevoItem.descripcion}
                  onChange={handleItemChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad*</label>
                <input
                  type="number"
                  name="cantidad"
                  value={nuevoItem.cantidad}
                  onChange={handleItemChange}
                  min="1"
                  step="1"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio Unitario*</label>
                <input
                  type="number"
                  name="precioUnitario"
                  value={nuevoItem.precioUnitario}
                  onChange={handleItemChange}
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descuento (%)</label>
                <input
                  type="number"
                  name="descuento"
                  value={nuevoItem.descuento}
                  onChange={handleItemChange}
                  min="0"
                  max="100"
                  step="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">IVA (%)*</label>
                <input
                  type="number"
                  name="alicuotaIVA"
                  value={nuevoItem.alicuotaIVA}
                  onChange={handleItemChange}
                  min="0"
                  max="100"
                  step="0.1"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad Medida</label>
                <select
                  name="unidadMedida"
                  value={nuevoItem.unidadMedida}
                  onChange={handleItemChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  {unidadesMedida.map(um => (
                    <option key={um.value} value={um.value}>{um.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={agregarItem}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Agregar Ítem
                </button>
              </div>
            </div>

            {/* Lista de items agregados */}
            {facturaData.facturaData.items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Código</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Descripción</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Cantidad</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">P. Unitario</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Descuento</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">IVA %</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Subtotal</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {facturaData.facturaData.items.map((item, index) => {
                      const subtotal = item.cantidad * item.precioUnitario * (1 - item.descuento / 100);
                      const iva = subtotal * (item.alicuotaIVA / 100);
                      const total = subtotal + iva;

                      return (
                        <tr key={index}>
                          <td className="px-4 py-2 whitespace-nowrap">{item.codigo}</td>
                          <td className="px-4 py-2">{item.descripcion}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{item.cantidad}</td>
                          <td className="px-4 py-2 whitespace-nowrap">${item.precioUnitario.toFixed(2)}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{item.descuento}%</td>
                          <td className="px-4 py-2 whitespace-nowrap">{item.alicuotaIVA}%</td>
                          <td className="px-4 py-2 whitespace-nowrap">${total.toFixed(2)}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => eliminarItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sección Totales y Pagos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-800 border-b border-blue-200 pb-2 mb-4">Totales</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Subtotal:</span>
                  <span>${facturaData.facturaData.totales.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{facturaData.facturaData.totales.leyendaIVA}:</span>
                  <span>${facturaData.facturaData.totales.iva.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold">${facturaData.facturaData.totales.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-800 border-b border-blue-200 pb-2 mb-4">Pago</h2>
              <div className="space-y-4">
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pago*</label>
                  <select
                    name="formaPago"
                    value={facturaData.facturaData.pagos.formaPago}
                    onChange={(e) => handleChange(e, 'facturaData', 'pagos')}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  >
                    {formasPago.map(fp => (
                      <option key={fp} value={fp}>{fp}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto*</label>
                  <input
                    type="number"
                    name="monto"
                    value={facturaData.facturaData.pagos.monto}
                    onChange={(e) => handleChange(e, 'facturaData', 'pagos')}
                    min="0"
                    step="0.01"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              name="observaciones"
              value={facturaData.facturaData.observaciones}
              onChange={(e) => handleChange(e, 'facturaData', 'observaciones')}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          {/* Botón de envío */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || facturaData.facturaData.items.length === 0}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white ${loading || facturaData.facturaData.items.length === 0 ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} transition-colors shadow-md`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generando Factura...
                </span>
              ) : 'Generar Factura'}
            </button>
          </div>
        </form>

        {message && (
          <div className="mx-6 mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}