import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../contexts/auth/authContext.jsx';
import { ProductosService } from '../../services/inventario/productos.js';
import { ticketsService } from '../../services/tickets/tickets.js';
import { facturasService } from '../../services/afip/facturas/facturacion.js';
import { ClientesService } from '../../services/crm/clientes.js';
import { FacturacionRequerimentos } from '../../utils/facturacionHelper.js';
import ModalBuscadorProductos from '../../components/facturas/ModalBuscadorProductos.jsx';
import {
  AFIP_DOC_TIPOS,
  AFIP_ALICUOTAS_IVA,
  CONDICIONES_IVA_RECEPTOR,
  AFIP_TIPOS_COMPROBANTE,
  AFIP_MONEDAS,
  AFIP_FORMAS_PAGO
} from '../../constants/afipConstants.js';
import '../../components/facturas/facturasForm.css';

import { CajasService } from '../../services/cajas/cajas.js';
import ModalGenerico from '../../components/modal/ModalGenerico.jsx';
import AbrirCajaForm from '../../components/cajas/AbrirCajaForm.jsx';
import Swal from 'sweetalert2';

const formatFechaHora = () => {
  const now = new Date();
  const pad = value => String(value).padStart(2, '0');
  return `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};

const generarVentaId = () => `DESPACHO-${Date.now()}`;

const Despachador = () => {
  const { user, empresa } = useAuth();
  const companyId = empresa?._id || empresa?.id || user?.empresa || user?.empresaId;
  const [mode, setMode] = useState('ticket'); // 'ticket', 'factura', 'notaPedido'
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [items, setItems] = useState([]);
  const [puntosVenta, setPuntosVenta] = useState([]);
  const [pvSeleccionado, setPvSeleccionado] = useState(null);
  const [loadingPv, setLoadingPv] = useState(true);
  const [tipoCbte, setTipoCbte] = useState(11);
  const [docTipo, setDocTipo] = useState(99);
  const [docNro, setDocNro] = useState('0');
  const [condicionIVA, setCondicionIVA] = useState(5);
  const [moneda, setMoneda] = useState('PES');
  const [formaPago, setFormaPago] = useState('Contado');
  const [numeroFactura, setNumeroFactura] = useState(null);
  const [loadingNumero, setLoadingNumero] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState([]);
  const [serverWarnings, setServerWarnings] = useState([]);
  const [montoRecibido, setMontoRecibido] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [clienteSuggestions, setClienteSuggestions] = useState([]);
  const [clienteLoading, setClienteLoading] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [cajaActiva, setCajaActiva] = useState(null);
  const [showAbrirCaja, setShowAbrirCaja] = useState(false);
  const [loadingCaja, setLoadingCaja] = useState(true);

  const ventaId = useMemo(() => generarVentaId(), []);
  const fechaHora = useMemo(() => formatFechaHora(), []);
  const handleSubmitRef = useRef(null);
  const searchInputRef = useRef(null);
  const formaPagoRef = useRef(null);

  useEffect(() => {
    const cargarPuntosVenta = async () => {
      const idEmpresa = empresa?._id || empresa?.id || user?.empresa || user?.empresaId;
      if (!idEmpresa) {
        setLoadingPv(false);
        return;
      }

      try {
        const config = await FacturacionRequerimentos.obtenerConfiguracionPuntosVenta(idEmpresa);
        setPuntosVenta(config.todos);
        setPvSeleccionado(config.principal);
      } catch (error) {
        console.error('Error cargando puntos de venta:', error);
      } finally {
        setLoadingPv(false);
      }
    };

    cargarPuntosVenta();
    verificarCaja();
  }, [user?.empresa, empresa?._id]);

  useEffect(() => {
    verificarCaja();
  }, [pvSeleccionado]);

  const verificarCaja = async () => {
    const idEmpresa = empresa?._id || empresa?.id || user?.empresa || user?.empresaId;
    if (!idEmpresa) {
      setLoadingCaja(false);
      return;
    }
    
    setLoadingCaja(true);
    try {
      const response = await CajasService.obtenerCajasEmpresa(idEmpresa, { estado: 'abierta', limit: 100 });
      const cajas = response.data?.cajas || (Array.isArray(response.data) ? response.data : []);
      
      // Intentar encontrar la caja abierta para el punto de venta seleccionado
      let activa = null;
      if (pvSeleccionado) {
        activa = cajas.find(c => 
          c.estado && c.estado.toLowerCase() === 'abierta' && 
          String(c.puntoDeVenta?._id || c.puntoDeVenta) === String(pvSeleccionado._id)
        );
      }
      
      // Si no hay para ese PV, buscar cualquier caja abierta del usuario/vendedor
      if (!activa) {
        activa = cajas.find(c => 
          c.estado && c.estado.toLowerCase() === 'abierta'
        );
      }
      
      setCajaActiva(activa || null);
    } catch (error) {
      console.error('Error verificando caja:', error);
    } finally {
      setLoadingCaja(false);
    }
  };

  const allowedCondiciones = useMemo(() => {
    if ([1, 2, 3].includes(tipoCbte)) return [1, 6];
    if ([6, 7, 8].includes(tipoCbte)) return [4, 5, 6];
    if ([11, 12, 13].includes(tipoCbte)) return [5];
    return [1, 4, 5, 6];
  }, [tipoCbte]);

  const allowedDocTipos = useMemo(() => {
    if ([1, 2, 3].includes(tipoCbte)) return [80, 86];
    if ([6, 7, 8].includes(tipoCbte)) return [80, 86, 96, 99];
    if ([11, 12, 13].includes(tipoCbte)) return [96, 99];
    return [80, 86, 94, 96, 99];
  }, [tipoCbte]);

  const defaultDocTipoByTipoCbte = useMemo(() => {
    if ([1, 2, 3].includes(tipoCbte)) return 80;
    if ([6, 7, 8].includes(tipoCbte)) return 96;
    if ([11, 12, 13].includes(tipoCbte)) return 96;
    return 80;
  }, [tipoCbte]);

  useEffect(() => {
    if (mode !== 'factura') return;

    if (!allowedCondiciones.includes(Number(condicionIVA))) {
      setCondicionIVA(allowedCondiciones[0]);
    }

    if (!allowedDocTipos.includes(Number(docTipo))) {
      setDocTipo(defaultDocTipoByTipoCbte);
    }
  }, [mode, allowedCondiciones, allowedDocTipos, condicionIVA, docTipo, defaultDocTipoByTipoCbte]);

  useEffect(() => {
    if (!['factura', 'notaPedido'].includes(mode)) {
      setClienteSuggestions([]);
      return;
    }

    if (!companyId || !nombreCliente || nombreCliente.length < 2) {
      setClienteSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setClienteLoading(true);
      try {
        const response = await ClientesService.obtenerClientesEmpresa(companyId, {
          search: nombreCliente,
          limit: 5
        });
        const data = response.data?.data?.clients || [];
        setClienteSuggestions(data);
      } catch (error) {
        console.error('Error buscando clientes frecuentes:', error);
        setClienteSuggestions([]);
      } finally {
        setClienteLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [companyId, mode, nombreCliente]);

  useEffect(() => {
    if (mode !== 'factura' || !pvSeleccionado || !user?.idDbAfip || !empresa?.cuit) {
      setNumeroFactura(null);
      return;
    }

    const obtenerNumero = async () => {
      setLoadingNumero(true);
      try {
        const proximo = await FacturacionRequerimentos.obtenerProximoNumero({
          idDbAfip: user.idDbAfip,
          puntoVenta: pvSeleccionado.numero,
          tipoComprobante: Number(tipoCbte),
          datosEmpresa: empresa
        });
        setNumeroFactura(proximo);
      } catch (error) {
        console.error('Error al obtener número de factura:', error);
        setNumeroFactura(null);
      } finally {
        setLoadingNumero(false);
      }
    };

    obtenerNumero();
  }, [mode, pvSeleccionado, tipoCbte, user?.idDbAfip, empresa]);

  useEffect(() => {
    const handler = (event) => {
      // Evitar que las teclas F activen funciones del navegador si estamos en el despachador
      if (['F1', 'F2', 'F3', 'F4', 'F5', 'F9', 'F10'].includes(event.key)) {
        event.preventDefault();
      }

      switch (event.key) {
        case 'F1':
          searchInputRef.current?.focus();
          break;
        case 'F2':
          setMode('ticket');
          setStatusMessage('Modo Ticket activado (F2)');
          break;
        case 'F3':
          setMode('factura');
          setStatusMessage('Modo Factura AFIP activado (F3)');
          break;
        case 'F4':
          formaPagoRef.current?.focus();
          break;
        case 'F5':
          setIsModalOpen(true);
          break;
        case 'F9':
          setItems([]);
          setMontoRecibido('');
          setStatusMessage('Venta limpiada (F9)');
          break;
        case 'Enter':
          // Solo enviar si no estamos en el buscador (para que Enter en buscador siga buscando)
          if (document.activeElement !== searchInputRef.current) {
            event.preventDefault();
            handleSubmitRef.current?.();
          }
          break;
        case 'Escape':
          setIsModalOpen(false);
          break;
        default:
          break;
      }

      if (event.altKey && event.key.toLowerCase() === 't') {
        event.preventDefault();
        setMode('ticket');
      }
      if (event.altKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setMode('factura');
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        handleSubmitRef.current?.();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const alicuotaIdFromProduct = (product) => {
    const iva = Number(product.alic_IVA || 0);
    const found = AFIP_ALICUOTAS_IVA.find(a => Number(a.value) === iva || Number(a.id) === iva);
    return found ? found.id : AFIP_ALICUOTAS_IVA[0]?.id || 5;
  };

  const addItem = (prod) => {
    const cantidad = 1;
    const porcentajeIva = Number(prod.alic_IVA || 0) / 100;
    const precioLista = Number(prod.precioLista || prod.precioCosto || 0);
    const alicuotaIVA = alicuotaIdFromProduct(prod);
    const precioUnitario = mode === 'factura' && [1, 2, 3].includes(Number(tipoCbte))
      ? Number((precioLista / (1 + porcentajeIva)).toFixed(2))
      : precioLista;

    setItems((current) => [
      ...current,
      {
        idProduct: prod._id,
        codigo: prod.codigoInterno || prod.codigo || prod._id,
        descripcion: prod.producto || prod.descripcion || 'Artículo',
        cantidad,
        precioUnitario,
        alicuotaIVA,
      }
    ]);
    setStatusMessage(`Producto agregado: ${prod.producto || prod.descripcion}`);
    setSearchTerm('');
  };

  const handleSearchProduct = async (event) => {
    if (event) event.preventDefault();
    if (!searchTerm?.trim()) {
      setIsModalOpen(true);
      return;
    }

    if (!user?.empresa) {
      setStatusMessage('No hay empresa cargada para buscar productos.');
      return;
    }

    setSearching(true);
    setStatusMessage('Buscando producto...');

    try {
      const response = await ProductosService.buscadorgeneralProduct({ empresa: user.empresa, q: searchTerm.trim() });
      const productos = response.data.productos || [];

      if (productos.length === 1) {
        addItem(productos[0]);
        return;
      }

      if (productos.length > 1) {
        setSearchQuery(searchTerm.trim());
        setIsModalOpen(true);
        setStatusMessage(`Se encontraron ${productos.length} productos. Seleccione uno.`);
        return;
      }

      setStatusMessage('No se encontró ningún producto. Intente con otro código o nombre.');
    } catch (error) {
      console.error('Error buscando producto:', error);
      setStatusMessage('Error al buscar producto. Abra el buscador para ver resultados.');
      setSearchQuery(searchTerm.trim());
      setIsModalOpen(true);
    } finally {
      setSearching(false);
    }
  };

  const handleRemoveItem = (index) => {
    setItems((current) => current.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((current) => current.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const cantidad = Number(item.cantidad) || 0;
      const precio = Number(item.precioUnitario) || 0;
      return sum + cantidad * precio;
    }, 0);
  }, [items]);

  const ivaTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const cantidad = Number(item.cantidad) || 0;
      const precio = Number(item.precioUnitario) || 0;
      const alicuota = AFIP_ALICUOTAS_IVA.find(a => Number(a.id) === Number(item.alicuotaIVA));
      const porcentaje = alicuota ? Number(alicuota.value) / 100 : 0;
      if (mode === 'factura' && [1, 2, 3].includes(Number(tipoCbte))) {
        const neto = cantidad * precio;
        return sum + neto * porcentaje;
      }
      if (mode === 'factura') {
        const totalGral = cantidad * precio;
        const neto = totalGral / (1 + porcentaje);
        return sum + (totalGral - neto);
      }
      return sum;
    }, 0);
  }, [items, mode, tipoCbte]);

  const total = useMemo(() => Number((subtotal + ivaTotal).toFixed(2)), [subtotal, ivaTotal]);

  const cambio = useMemo(() => {
    const recibido = Number(montoRecibido) || 0;
    if (recibido <= 0) return 0;
    return Math.max(0, recibido - total);
  }, [montoRecibido, total]);

  const getFacturacionPayload = () => {
    const itemsParaAfip = items.map((item) => {
      const cantidad = Number(item.cantidad) || 0;
      const precioIngresado = Number(item.precioUnitario) || 0;
      const alicuotaObj = AFIP_ALICUOTAS_IVA.find(a => Number(a.id) === Number(item.alicuotaIVA));
      const porcentaje = alicuotaObj ? Number(alicuotaObj.value) / 100 : 0;

      const precioUnitarioAfip = [1, 2, 3].includes(Number(tipoCbte))
        ? precioIngresado
        : precioIngresado;

      const netoUnitario = [1, 2, 3].includes(Number(tipoCbte))
        ? precioIngresado
        : Number((precioIngresado / (1 + porcentaje)).toFixed(2));

      return {
        idProduct: item.idProduct,
        codigo: item.codigo,
        descripcion: item.descripcion,
        cantidad,
        precioUnitario: Number(precioUnitarioAfip.toFixed(2)),
        subtotal: Number((netoUnitario * cantidad).toFixed(2)),
        alicuotaIVA: Number(item.alicuotaIVA),
        iva: Number((netoUnitario * cantidad * porcentaje).toFixed(2))
      };
    });

    const importeNeto = itemsParaAfip.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    const importeIVA = itemsParaAfip.reduce((sum, item) => sum + Number(item.iva || 0), 0);

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const fechaYmd = `${yyyy}${mm}${dd}`; // YYYYMMDD required by AFIP

    return {
      idEmpresa: user?.empresa,
      id: user.idDbAfip,
      cuit: empresa?.cuit,
      servicio: 'wsfe',
      cajaId: cajaActiva?._id || null,
      factura: {
        puntoVenta: Number(pvSeleccionado?.numero),
        tipoComprobante: Number(tipoCbte),
        numeroFactura,
        concepto: 1,
        docTipo: Number(docTipo),
        docNro: Number(docNro || 0),
        condicionIVAReceptor: Number(condicionIVA),
        importeNeto: Number(importeNeto.toFixed(2)),
        importeIVA: Number(importeIVA.toFixed(2)),
        importeTotal: total,
        importeNoGravado: 0,
        importeExento: 0,
        importeTributos: 0,
        moneda: moneda,
        cotizacion: 1,
        formaPago: formaPago,
        fecha: fechaYmd,
        fechaHora: now.toISOString(),
        items: itemsParaAfip,
        receptor: {
          nombre: nombreCliente || 'Consumidor Final',
          tipoDocumento: Number(docTipo),
          numeroDocumento: Number(docNro || 0),
          condicionIVA: CONDICIONES_IVA_RECEPTOR.find(c => c.id === condicionIVA)?.desc || 'Consumidor Final'
        },
        iva: itemsParaAfip.reduce((list, item) => {
          const existing = list.find(i => i.id === Number(item.alicuotaIVA));
          const subtotal = Number(item.subtotal || 0);
          const importe = Number(item.iva || 0);
          if (existing) {
            existing.baseImponible += subtotal;
            existing.importe += importe;
          } else {
            list.push({ id: Number(item.alicuotaIVA), baseImponible: subtotal, importe });
          }
          return list;
        }, [])
      }
    };
  };

  const getTicketPayload = () => ({
    datos: {
      ventaId,
      fechaHora: new Date().toISOString(),
      puntoDeVenta: pvSeleccionado?._id || '',
      cajaId: cajaActiva?._id || null,
      tipoComprobante: 'Ticket',
      numeroComprobante: '',
      items: items.map((item) => ({
        idProduct: item.idProduct || null,
        codigo: item.codigo || item.idProduct || '',
        descripcion: item.descripcion || '',
        cantidad: Number(item.cantidad) || 0,
        precioUnitario: Number(item.precioUnitario) || 0,
        totalItem: Number(((Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0)).toFixed(2))
      })),
      totales: {
        descuento: 0,
        subtotal: Number(subtotal.toFixed(2)),
        totalPagar: Number(total.toFixed(2))
      },
      pago: {
        metodo: formaPago,
        montoRecibido: formaPago === 'Contado' ? (Number(montoRecibido) || total) : total,
        cambio: formaPago === 'Contado' ? cambio : 0
      },
      cliente: {
        nombre: 'Consumidor Final',
        dniCuit: '',
        condicionIVA: 'Consumidor Final'
      },
      observaciones: ''
    },
    idEmpresa: user.empresa,
    idUser: user._id
  });

  const parseApiError = async (error) => {
    const parsed = { message: error?.message || 'Error desconocido', errors: [], warnings: [] };
    const rawData = error?.response?.data;
    if (!rawData) return parsed;

    let jsonBody = null;
    try {
      if (rawData instanceof Blob || rawData instanceof ArrayBuffer) {
        const text = await new Blob([rawData]).text();
        jsonBody = JSON.parse(text);
      } else if (typeof rawData === 'string') {
        jsonBody = JSON.parse(rawData);
      } else {
        jsonBody = rawData;
      }
    } catch {
      const text = rawData instanceof Blob || rawData instanceof ArrayBuffer
        ? await new Blob([rawData]).text()
        : String(rawData);
      parsed.message = text || parsed.message;
      return parsed;
    }

    parsed.message = jsonBody.message || jsonBody.error || parsed.message;
    if (Array.isArray(jsonBody.errores)) {
      parsed.errors = jsonBody.errores.map((item) => typeof item === 'string' ? item : item.mensaje || item.message || JSON.stringify(item));
    } else if (jsonBody.errores) {
      parsed.errors = [typeof jsonBody.errores === 'string' ? jsonBody.errores : JSON.stringify(jsonBody.errores)];
    } else if (Array.isArray(jsonBody.errors)) {
      parsed.errors = jsonBody.errors.map((item) => typeof item === 'string' ? item : item.message || JSON.stringify(item));
    } else if (jsonBody.error) {
      parsed.errors = [typeof jsonBody.error === 'string' ? jsonBody.error : JSON.stringify(jsonBody.error)];
    }

    if (Array.isArray(jsonBody.warnings)) {
      parsed.warnings = jsonBody.warnings.map((item) => typeof item === 'string' ? item : item.message || JSON.stringify(item));
    }
    if (jsonBody.observaciones) {
      const falls = Array.isArray(jsonBody.observaciones)
        ? jsonBody.observaciones
        : [jsonBody.observaciones];
      parsed.errors.push(...falls.map((item) => typeof item === 'string' ? item : item.mensaje || item.message || JSON.stringify(item)));
    }

    if (parsed.errors.length === 0 && parsed.message) {
      parsed.errors = [parsed.message];
    }
    return parsed;
  };

  const getNotaPedidoPayload = () => ({
    idEmpresa: empresa?._id || empresa?.id || user?.empresa,
    idUsuario: user._id || user.id,
    puntoDeVenta: pvSeleccionado?.nombre || '',
    items: items.map((item) => ({
      idProduct: item.idProduct || item._id,
      codigo: item.codigo || item.idProduct || '',
      descripcion: item.descripcion || '',
      cantidad: Number(item.cantidad) || 0,
      precioUnitario: Number(item.precioUnitario) || 0,
      totalItem: Number(((Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0)).toFixed(2)),
      alicuotaIVA: 21,
      importeIVA: 0
    })),
    totales: {
      subtotal: Number(subtotal.toFixed(2)),
      descuento: 0,
      totalPagar: Number(total.toFixed(2))
    },
    pago: {
      metodo: formaPago,
      montoRecibido: formaPago === 'Contado' ? (Number(montoRecibido) || total) : total,
      cambio: formaPago === 'Contado' ? cambio : 0
    },
    cliente: {
      nombre: nombreCliente || 'Consumidor Final',
      dniCuit: docNro !== '0' ? docNro : '',
      tipoDocumento: Number(docTipo),
      condicionIVA: CONDICIONES_IVA_RECEPTOR.find(c => c.id === condicionIVA)?.desc || 'Consumidor Final'
    },
    observaciones: '',
    vendedor: user.username,
    tipoComprobante: 'Nota de Pedido'
  });

  const handleSubmit = async () => {
    setServerErrors([]);
    setServerWarnings([]);
    setStatusMessage('');

    if (items.length === 0) {
      setStatusMessage('Agregue al menos un producto antes de enviar.');
      return;
    }

    if (!cajaActiva) {
      Swal.fire({
        title: 'Caja Cerrada',
        text: 'Debes abrir una caja antes de poder realizar ventas.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Abrir Caja Ahora',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          setShowAbrirCaja(true);
        }
      });
      return;
    }

    if (!pvSeleccionado) {
      setStatusMessage('Seleccione un punto de venta.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'ticket') {
        const response = await ticketsService.crearTicketInterno(user._id, getTicketPayload());
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('application/pdf')) {
          const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(pdfBlob);
          window.open(url, '_blank');
          setStatusMessage('Ticket interno creado correctamente. PDF generado.');
          setItems([]);
          return;
        }
        setStatusMessage('Ticket interno creado correctamente.');
        setItems([]);
      } else if (mode === 'notaPedido') {
        const response = await ticketsService.createNotaPedido(getNotaPedidoPayload());
        Swal.fire('¡Éxito!', `Nota de pedido #${response.data.pedidoId} creada. Stock reservado.`, 'success');
        setStatusMessage(`Nota de pedido #${response.data.pedidoId} creada.`);
        setItems([]);
      } else {
        if (!numeroFactura) {
          setStatusMessage('No se pudo obtener el próximo número de factura.');
          setIsSubmitting(false);
          return;
        }
        const response = await facturasService.emitirfacturas(getFacturacionPayload());
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('application/pdf')) {
          const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(pdfBlob);
          window.open(url, '_blank');
          setStatusMessage('Factura emitida correctamente. Se abrió el PDF.');
          setItems([]);
          return;
        }
        setStatusMessage('Factura enviada. Revise la respuesta del servidor.');
      }
    } catch (error) {
      console.error('Error en envío de despacho:', error);
      const parsed = await parseApiError(error);
      setServerErrors(parsed.errors);
      setServerWarnings(parsed.warnings);
      setStatusMessage(parsed.message || 'Error al procesar la operación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  const KbdBadge = ({ children, color = '#64748b' }) => (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f1f5f9',
      color: color,
      border: `1px solid #cbd5e1`,
      borderRadius: '4px',
      padding: '1px 6px',
      fontSize: '0.75rem',
      fontWeight: '700',
      minWidth: '32px',
      marginRight: '6px',
      fontFamily: 'monospace'
    }}>
      {children}
    </span>
  );

  return (
    <div className="factura-container" style={{ 
      maxWidth: '100%', margin: '0', padding: '20px', display: 'flex', gap: '20px', alignItems: 'flex-start', 
      backgroundColor: '#f1f5f9', minHeight: '100vh',
      borderTop: `6px solid ${mode === 'factura' ? '#0f172a' : mode === 'ticket' ? '#2563eb' : '#7c3aed'}`
    }}>
      {/* --- COLUMNA IZQUIERDA: CONFIGURACIÓN Y PRODUCTOS --- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', minWidth: 0 }}>
        
        {/* ENCABEZADO Y ATAJOS - ESTILO EMPRESARIAL */}
        <div className="bg-white p-3 border rounded shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.025em' }}>
                {mode === 'ticket' ? 'DESPACHADOR: TICKET' : mode === 'notaPedido' ? 'DESPACHADOR: PEDIDO' : 'DESPACHADOR: FACTURA AFIP'}
              </h1>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>{(user?.username || 'USUARIO').toUpperCase()} @ {(empresa?.razonSocial || 'EMPRESA').toUpperCase()}</p>
            </div>
            
            <div className="btn-group" role="group" style={{ padding: '2px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <button
                type="button"
                className={`btn btn-sm ${mode === 'ticket' ? 'shadow-sm' : 'btn-link text-decoration-none text-secondary'}`}
                style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: '800', 
                  borderRadius: '4px', 
                  padding: '6px 16px',
                  backgroundColor: mode === 'ticket' ? '#2563eb' : 'transparent',
                  color: mode === 'ticket' ? '#fff' : '#64748b',
                  transition: 'all 0.2s'
                }}
                onClick={() => setMode('ticket')}
              >
                TICKET
              </button>
              <button
                type="button"
                className={`btn btn-sm ${mode === 'factura' ? 'shadow-sm' : 'btn-link text-decoration-none text-secondary'}`}
                style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: '800', 
                  borderRadius: '4px', 
                  padding: '6px 16px',
                  backgroundColor: mode === 'factura' ? '#0f172a' : 'transparent',
                  color: mode === 'factura' ? '#fff' : '#64748b',
                  transition: 'all 0.2s'
                }}
                onClick={() => setMode('factura')}
              >
                FACTURA
              </button>
              <button
                type="button"
                className={`btn btn-sm ${mode === 'notaPedido' ? 'shadow-sm' : 'btn-link text-decoration-none text-secondary'}`}
                style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: '800', 
                  borderRadius: '4px', 
                  padding: '6px 16px',
                  backgroundColor: mode === 'notaPedido' ? '#7c3aed' : 'transparent',
                  color: mode === 'notaPedido' ? '#fff' : '#64748b',
                  transition: 'all 0.2s'
                }}
                onClick={() => setMode('notaPedido')}
              >
                PEDIDO
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}><KbdBadge>F1</KbdBadge><span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>BUSCAR</span></div>
            <div style={{ display: 'flex', alignItems: 'center' }}><KbdBadge>F2</KbdBadge><span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>TICKET</span></div>
            <div style={{ display: 'flex', alignItems: 'center' }}><KbdBadge>F3</KbdBadge><span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>FACTURA</span></div>
            <div style={{ display: 'flex', alignItems: 'center' }}><KbdBadge>F4</KbdBadge><span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>PAGO</span></div>
            <div style={{ display: 'flex', alignItems: 'center' }}><KbdBadge>F5</KbdBadge><span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>AVANZADO</span></div>
            <div style={{ display: 'flex', alignItems: 'center' }}><KbdBadge>F9</KbdBadge><span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>LIMPIAR</span></div>
          </div>
        </div>

        {/* DATOS DEL CLIENTE - SIEMPRE VISIBLES PARA MANTENER DATOS */}
        <div className="bg-white border shadow-sm" style={{ borderRadius: '8px', padding: '16px', opacity: mode === 'ticket' ? 0.7 : 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '3px', height: '14px', backgroundColor: mode === 'factura' ? '#0f172a' : mode === 'ticket' ? '#2563eb' : '#7c3aed', borderRadius: '2px' }}></div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Datos del Cliente {mode === 'ticket' && '(OPCIONAL)'}
            </h4>
          </div>
          
          <div className="form-row" style={{ gap: '12px' }}>
            <div className="form-field" style={{ flex: 2, position: 'relative' }}>
              <label style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '700' }}>RAZÓN SOCIAL / NOMBRE</label>
              <div style={{ position: 'relative' }}>
                <input
                  value={nombreCliente}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (selectedCliente && selectedCliente.razonSocial !== value) setSelectedCliente(null);
                    setNombreCliente(value);
                  }}
                  className="form-control"
                  style={{ height: '40px', fontSize: '0.9rem', border: '1px solid #e2e8f0', borderRadius: '6px', paddingLeft: '32px' }}
                  placeholder="Buscar por nombre o CUIT..."
                  autoComplete="off"
                />
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>👤</span>
              </div>
              {clienteSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0',
                  borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', zIndex: 50, marginTop: '4px', overflow: 'hidden'
                }}>
                  {clienteLoading ? (
                    <div style={{ padding: '12px', fontSize: '0.8rem', color: '#64748b' }}>Buscando...</div>
                  ) : clienteSuggestions.map((cliente) => (
                    <button
                      key={cliente._id} type="button"
                      onClick={() => {
                        setSelectedCliente(cliente);
                        setNombreCliente(cliente.razonSocial || cliente.nombreContacto || '');
                        setDocTipo(allowedDocTipos.includes(cliente.tipoDocumento) ? cliente.tipoDocumento : defaultDocTipoByTipoCbte);
                        setDocNro(cliente.numeroDocumento || '');
                        setCondicionIVA(cliente.condicionIVACodigo || 5);
                        setClienteSuggestions([]);
                      }}
                      style={{
                        width: '100%', padding: '10px 15px', textAlign: 'left', border: 'none', background: 'transparent',
                        cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{cliente.razonSocial || cliente.nombreContacto}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{cliente.numeroDocumento}</div>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px' }}>SELECCIONAR</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="form-field" style={{ width: '130px' }}>
              <label style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '700' }}>TIPO DOC</label>
              <select className="form-select" style={{ height: '40px', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: '6px' }} value={docTipo} onChange={(e) => setDocTipo(Number(e.target.value))}>
                {AFIP_DOC_TIPOS.filter((d) => allowedDocTipos.includes(d.id)).map((d) => (
                  <option key={d.id} value={d.id}>{d.desc}</option>
                ))}
              </select>
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '700' }}>NRO DOCUMENTO</label>
              <input
                type="number" value={docNro} onChange={(e) => setDocNro(e.target.value)}
                className="form-control" style={{ height: '40px', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                placeholder="DNI/CUIT"
              />
            </div>
            <div className="form-field" style={{ width: '180px' }}>
              <label style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '700' }}>CONDICIÓN IVA</label>
              <select className="form-select" style={{ height: '40px', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: '6px' }} value={condicionIVA} onChange={(e) => setCondicionIVA(Number(e.target.value))}>
                {CONDICIONES_IVA_RECEPTOR.filter((c) => allowedCondiciones.includes(c.id)).map((c) => (
                  <option key={c.id} value={c.id}>{c.desc}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* BUSCADOR, PV Y FORMA DE PAGO - ESTILO COBRADOR */}
        <div className="bg-white border shadow-sm" style={{ borderRadius: '8px', padding: '16px' }}>
          <div className="form-row" style={{ gap: '12px', alignItems: 'flex-end' }}>
            <div className="form-field" style={{ flex: 1 }}>
              <label style={{ fontWeight: '800', color: '#0f172a', marginBottom: '8px', display: 'block', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                BÚSQUEDA DE PRODUCTOS <KbdBadge>F1</KbdBadge>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  ref={searchInputRef} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchProduct(e)}
                  className="form-control"
                  style={{ height: '44px', fontSize: '1rem', borderRadius: '6px', border: '2px solid #0f172a', paddingLeft: '36px', fontWeight: '600' }}
                  placeholder="Escanear código o escribir nombre..."
                />
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }}>🔍</span>
              </div>
            </div>
            
            <div className="form-field" style={{ width: '160px' }}>
              <label style={{ fontWeight: '700', color: '#64748b', marginBottom: '8px', display: 'block', fontSize: '0.65rem' }}>PUNTO DE VENTA</label>
              <select
                className="form-select"
                style={{ height: '44px', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid #e2e8f0', fontWeight: '600' }}
                value={pvSeleccionado?._id || ''}
                onChange={(e) => setPvSeleccionado(puntosVenta.find((pv) => pv._id === e.target.value))}
              >
                {puntosVenta.map((pv) => (
                  <option key={pv._id} value={pv._id}>PV {String(pv.numero).padStart(4, '0')} - {pv.nombre}</option>
                ))}
              </select>
            </div>

            <div className="form-field" style={{ width: '160px' }}>
              <label style={{ fontWeight: '700', color: '#64748b', marginBottom: '8px', display: 'block', fontSize: '0.65rem' }}>
                FORMA DE PAGO <KbdBadge>F4</KbdBadge>
              </label>
              <select 
                ref={formaPagoRef}
                className="form-select" 
                style={{ height: '44px', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid #e2e8f0', fontWeight: '600' }}
                value={formaPago} 
                onChange={(e) => setFormaPago(e.target.value)}
              >
                {AFIP_FORMAS_PAGO.map((fp) => (
                  <option key={fp.id} value={fp.id}>{fp.desc.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {mode === 'factura' && (
              <>
                <div className="form-field" style={{ width: '150px' }}>
                  <label style={{ fontWeight: '700', color: '#64748b', marginBottom: '8px', display: 'block', fontSize: '0.65rem' }}>COMPROBANTE</label>
                  <select
                    className="form-select"
                    style={{ height: '44px', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid #e2e8f0', fontWeight: '600' }}
                    value={tipoCbte}
                    onChange={(e) => setTipoCbte(Number(e.target.value))}
                  >
                    {AFIP_TIPOS_COMPROBANTE.filter((t) => [11, 12, 13, 1, 6].includes(t.id)).map((t) => (
                      <option key={t.id} value={t.id}>{t.desc}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field" style={{ width: '180px' }}>
                  <label style={{ fontWeight: '700', color: '#64748b', marginBottom: '8px', display: 'block', fontSize: '0.65rem' }}>NRO ACTUAL</label>
                  <div style={{ 
                    height: '44px', borderRadius: '6px', fontSize: '1rem', border: '1px solid #e2e8f0', 
                    fontWeight: '800', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a',
                    fontFamily: 'monospace'
                  }}>
                    {loadingNumero ? '...' : (numeroFactura ? FacturacionRequerimentos.formatearComprobante(pvSeleccionado?.numero, numeroFactura) : 'N/A')}
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button type="button" className="btn btn-link p-0 text-decoration-none" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }} onClick={() => setIsModalOpen(true)}>
                [F5] BUSCADOR AVANZADO
              </button>
              <button type="button" className="btn btn-link p-0 text-decoration-none" style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '700' }} onClick={() => { setItems([]); setMontoRecibido(''); }}>
                [F9] LIMPIAR VENTA
              </button>
            </div>
            {!loadingCaja && (
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 12px', borderRadius: '6px', 
                backgroundColor: cajaActiva ? '#f0fdf4' : '#fef2f2', border: `1px solid ${cajaActiva ? '#bbf7d0' : '#fecaca'}`
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: cajaActiva ? '#22c55e' : '#ef4444' }}></div>
                <span style={{ fontSize: '0.7rem', fontWeight: '800', color: cajaActiva ? '#166534' : '#991b1b', textTransform: 'uppercase' }}>
                  {cajaActiva ? `CAJA: ${cajaActiva.vendedorAsignado?.nombre || 'OK'}` : 'CAJA CERRADA'}
                </span>
                {!cajaActiva && <button onClick={() => setShowAbrirCaja(true)} style={{ padding: '2px 8px', fontSize: '0.65rem', borderRadius: '4px', border: 'none', backgroundColor: '#ef4444', color: '#fff', fontWeight: '800' }}>ABRIR</button>}
              </div>
            )}
          </div>
        </div>

        {/* TABLA DE PRODUCTOS - ESTILO POS */}
        <div className="bg-white border shadow-sm" style={{ borderRadius: '8px', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="table-responsive" style={{ maxHeight: 'calc(100vh - 420px)', overflowY: 'auto' }}>
            <table className="table table-hover mb-0" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '12px 16px', fontSize: '0.65rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Descripción</th>
                  <th width="100" style={{ padding: '12px 16px', fontSize: '0.65rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>Cant.</th>
                  <th width="140" style={{ padding: '12px 16px', fontSize: '0.65rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Precio Unit.</th>
                  <th width="140" style={{ padding: '12px 16px', fontSize: '0.65rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Total</th>
                  <th width="50" style={{ padding: '12px 16px', borderBottom: '2px solid #e2e8f0' }}></th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: '#fff' }}>
                {items.map((item, index) => {
                  const subtotalItem = (Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0);
                  return (
                    <tr key={`${item.idProduct}-${index}`} style={{ transition: 'background-color 0.1s' }}>
                      <td style={{ padding: '10px 16px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.9rem' }}>{item.descripcion.toUpperCase()}</div>
                        <code style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.codigo}</code>
                      </td>
                      <td style={{ padding: '10px 16px', verticalAlign: 'middle' }}>
                        <input
                          type="number" min="1" className="form-control form-control-sm text-center"
                          style={{ height: '32px', fontWeight: '700', border: '1px solid #e2e8f0' }}
                          value={item.cantidad}
                          onChange={(e) => handleItemChange(index, 'cantidad', Number(e.target.value) || 0)}
                        />
                      </td>
                      <td style={{ padding: '10px 16px', verticalAlign: 'middle' }}>
                        <input
                          type="number" step="0.01" className="form-control form-control-sm text-end"
                          style={{ height: '32px', fontWeight: '700', border: '1px solid #e2e8f0' }}
                          value={item.precioUnitario}
                          onChange={(e) => handleItemChange(index, 'precioUnitario', Number(e.target.value) || 0)}
                        />
                      </td>
                      <td style={{ padding: '10px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem', fontFamily: 'monospace' }}>
                          ${subtotalItem.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                        <button type="button" className="btn btn-sm btn-outline-danger border-0" style={{ padding: '2px 6px' }} onClick={() => handleRemoveItem(index)}>✕</button>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-5" style={{ background: '#fcfcfc' }}>
                      <div style={{ fontSize: '2.5rem', opacity: 0.1, marginBottom: '10px' }}>�</div>
                      <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Esperando productos...</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- COLUMNA DERECHA: RESUMEN Y ACCIONES --- */}
      <div style={{ width: '400px', position: 'sticky', top: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <div className="bg-white border shadow-lg" style={{ borderRadius: '8px', padding: '24px', borderTop: '6px solid #0f172a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: '900', color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Resumen de Operación</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.9rem', fontWeight: '600' }}>
              <span>SUBTOTAL</span>
              <span style={{ fontFamily: 'monospace' }}>${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.9rem', fontWeight: '600' }}>
              <span>IVA TOTAL</span>
              <span style={{ fontFamily: 'monospace' }}>${ivaTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
            {mode === 'factura' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '700', padding: '8px', background: '#f8fafc', borderRadius: '4px' }}>
                <span>NRO COMPROBANTE:</span>
                <span style={{ color: '#0f172a' }}>{loadingNumero ? '...' : (numeroFactura ? FacturacionRequerimentos.formatearComprobante(pvSeleccionado?.numero, numeroFactura) : 'N/A')}</span>
              </div>
            )}
            
            <div style={{ marginTop: '10px', padding: '20px', background: '#0f172a', borderRadius: '8px', color: '#fff' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', marginBottom: '4px', letterSpacing: '0.1em' }}>TOTAL A PAGAR</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: '400', opacity: 0.6 }}>$</span>
                <span style={{ fontSize: '2.5rem', fontWeight: '900', fontFamily: 'monospace', lineHeight: 1 }}>
                  {total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {formaPago === 'Contado' && (
            <div className="mt-4 p-4 border rounded" style={{ backgroundColor: '#f8fafc' }}>
              <div className="mb-3">
                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '800', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>EFECTIVO RECIBIDO</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: '#94a3b8' }}>$</span>
                  <input
                    type="number" value={montoRecibido} onChange={(e) => setMontoRecibido(e.target.value)}
                    className="form-control"
                    style={{ height: '54px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '1.75rem', fontWeight: '800', textAlign: 'right', paddingRight: '15px', fontFamily: 'monospace' }}
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '800' }}>VUELTO</span>
                <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#059669', fontFamily: 'monospace' }}>
                  ${cambio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            className="btn btn-dark w-100 mt-4 shadow-sm"
            style={{ height: '70px', fontSize: '1.1rem', fontWeight: '900', borderRadius: '8px', letterSpacing: '0.05em', transition: 'all 0.2s' }}
            onClick={handleSubmit}
            disabled={isSubmitting || items.length === 0 || (mode === 'factura' && (!numeroFactura || !empresa?.cuit))}
          >
            {isSubmitting ? (
              <div className="d-flex align-items-center justify-content-center gap-2">
                <span className="spinner-border spinner-border-sm"></span>
                <span>PROCESANDO...</span>
              </div>
            ) : (
              <div style={{ lineHeight: 1.2 }}>
                {mode === 'ticket' ? 'CONFIRMAR TICKET' : mode === 'notaPedido' ? 'GENERAR PEDIDO' : 'EMITIR FACTURA'}
                <div style={{ fontSize: '0.65rem', fontWeight: '400', opacity: 0.6, marginTop: '4px' }}>[ENTER] PARA FINALIZAR</div>
              </div>
            )}
          </button>

          {statusMessage && (
            <div className={`mt-3 p-3 rounded text-center shadow-sm ${statusMessage.includes('Error') ? 'bg-danger text-white' : 'bg-success text-white'}`} style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase' }}>
              {statusMessage}
            </div>
          )}
        </div>

        {/* ERRORES Y ADVERTENCIAS - ESTILO COMPACTO */}
        {(serverErrors.length > 0 || serverWarnings.length > 0) && (
          <div className="bg-white border rounded p-3 shadow-sm">
            {serverErrors.length > 0 && (
              <div className="mb-2">
                <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: '900', marginBottom: '4px' }}>✕ ERRORES DETECTADOS</div>
                <ul style={{ paddingLeft: '12px', margin: 0, fontSize: '0.75rem', color: '#b91c1c', fontWeight: '600' }}>
                  {serverErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}
            {serverWarnings.length > 0 && (
              <div>
                <div style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: '900', marginBottom: '4px' }}>⚠ ADVERTENCIAS</div>
                <ul style={{ paddingLeft: '12px', margin: 0, fontSize: '0.75rem', color: '#a16207', fontWeight: '600' }}>
                  {serverWarnings.map((warn, i) => <li key={i}>{warn}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE APERTURA DE CAJA */}
      <ModalGenerico isOpen={showAbrirCaja} onClose={() => setShowAbrirCaja(false)} title="CONTROL DE CAJA" width="500px">
        <AbrirCajaForm puntosVenta={puntosVenta} puntoVenta={pvSeleccionado} onSuccess={() => { setShowAbrirCaja(false); verificarCaja(); Swal.fire('¡Éxito!', 'Caja abierta correctamente.', 'success'); }} />
      </ModalGenerico>

      <ModalBuscadorProductos isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelect={addItem} initialQuery={searchQuery} />
    </div>
  );
};

export default Despachador;
