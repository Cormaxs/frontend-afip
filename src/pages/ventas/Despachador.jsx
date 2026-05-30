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

  const KbdBadge = ({ children, color = '#28a4d5' }) => (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
      color: color,
      border: `2px solid ${color}`,
      borderRadius: '6px',
      padding: '2px 8px',
      fontSize: '0.9rem',
      fontWeight: '800',
      minWidth: '35px',
      boxShadow: `0 2px 0 ${color}44`,
      marginRight: '5px'
    }}>
      {children}
    </span>
  );

  return (
    <div className="factura-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-3 rounded shadow-sm">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>Despachador de Ventas</h1>
          <div style={{ display: 'flex', gap: '20px', marginTop: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <KbdBadge color="#28a4d5">F1</KbdBadge> <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>BUSCAR</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <KbdBadge color="#8b5cf6">F2</KbdBadge> <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>TICKET</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <KbdBadge color="#ec4899">F3</KbdBadge> <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>FACTURA</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <KbdBadge color="#10b981">F4</KbdBadge> <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>PAGO</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <KbdBadge color="#f59e0b">F5</KbdBadge> <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>AVANZADO</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <KbdBadge color="#ef4444">F9</KbdBadge> <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>LIMPIAR</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <KbdBadge color="#1e293b">ENTER</KbdBadge> <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>CONFIRMAR</span>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
          <div className="btn-group" role="group" style={{ padding: '5px', background: '#f1f5f9', borderRadius: '8px' }}>
            <button
              type="button"
              className={`btn ${mode === 'ticket' ? 'btn-cian-primary shadow-sm' : 'btn-ghost'}`}
              style={{ borderRadius: '6px', transition: 'all 0.2s' }}
              onClick={() => setMode('ticket')}
            >
              Ticket Rápido
            </button>
            <button
              type="button"
              className={`btn ${mode === 'factura' ? 'btn-cian-primary shadow-sm' : 'btn-ghost'}`}
              style={{ borderRadius: '6px', transition: 'all 0.2s' }}
              onClick={() => setMode('factura')}
            >
              Factura AFIP
            </button>
            <button
              type="button"
              className={`btn ${mode === 'notaPedido' ? 'btn-cian-primary shadow-sm' : 'btn-ghost'}`}
              style={{ borderRadius: '6px', transition: 'all 0.2s' }}
              onClick={() => setMode('notaPedido')}
            >
              Nota de Pedido
            </button>
          </div>

          {!loadingCaja && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '6px 12px', 
              borderRadius: '20px', 
              backgroundColor: cajaActiva ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${cajaActiva ? '#bbf7d0' : '#fecaca'}`
            }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: cajaActiva ? '#22c55e' : '#ef4444' 
              }}></div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: cajaActiva ? '#166534' : '#991b1b' }}>
                {cajaActiva ? `Caja Abierta: ${cajaActiva.vendedorAsignado?.nombre || 'OK'}` : 'Caja Cerrada'}
              </span>
              {!cajaActiva && (
                <button 
                  onClick={() => setShowAbrirCaja(true)}
                  style={{ 
                    padding: '2px 8px', 
                    fontSize: '0.75rem', 
                    borderRadius: '4px', 
                    border: 'none', 
                    backgroundColor: '#ef4444', 
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  ABRIR CAJA
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE APERTURA DE CAJA */}
      <ModalGenerico
        isOpen={showAbrirCaja}
        onClose={() => setShowAbrirCaja(false)}
        title="Apertura de Caja"
        width="500px"
      >
        <AbrirCajaForm 
          puntosVenta={puntosVenta}
          puntoVenta={pvSeleccionado}
          onSuccess={() => {
            setShowAbrirCaja(false);
            verificarCaja();
            Swal.fire('¡Éxito!', 'Caja abierta correctamente. Ya puedes vender.', 'success');
          }}
        />
      </ModalGenerico>

      <div className="section-card mb-4 shadow-sm" style={{ border: 'none', borderRadius: '12px' }}>
        <div className="form-row" style={{ gap: '20px', alignItems: 'flex-end' }}>
          <div className="form-field" style={{ flex: 1 }}>
            <label style={{ fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'block' }}>
              🔍 Buscar producto / Escanear código <small className="text-muted">(F1)</small>
            </label>
            <input
              ref={searchInputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchProduct(e)}
              className="form-control-cian"
              style={{ height: '48px', fontSize: '1.1rem', borderRadius: '8px' }}
              placeholder="Escriba código o nombre y presione Enter..."
            />
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <small className="text-muted">Si no encuentra el código, presione <kbd>F5</kbd> para búsqueda manual.</small>
              <button 
                type="button" 
                className="btn btn-link btn-sm p-0" 
                style={{ textDecoration: 'none', color: '#28a4d5', fontSize: '0.85rem' }}
                onClick={() => setIsModalOpen(true)}
              >
                🖱️ Abrir Buscador Avanzado
              </button>
            </div>
          </div>
          <div className="form-field" style={{ width: '200px' }}>
            <label style={{ fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'block' }}>Punto de Venta</label>
            <select
              className="form-select-cian"
              style={{ height: '48px', borderRadius: '8px' }}
              value={pvSeleccionado?._id || ''}
              onChange={(e) => setPvSeleccionado(puntosVenta.find((pv) => pv._id === e.target.value))}
            >
              {puntosVenta.map((pv) => (
                <option key={pv._id} value={pv._id}>
                  {String(pv.numero).padStart(5, '0')} - {pv.nombre}
                </option>
              ))}
            </select>
            {loadingPv && <small style={{ color: '#6c757d' }}>Cargando PV...</small>}
          </div>
          <div className="form-field" style={{ width: '220px' }}>
            <label style={{ fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'block' }}>
              💳 Forma de Pago <small className="text-muted">(F4)</small>
            </label>
            <select 
              ref={formaPagoRef}
              className="form-select-cian" 
              style={{ height: '48px', borderRadius: '8px' }}
              value={formaPago} 
              onChange={(e) => setFormaPago(e.target.value)}
            >
              {AFIP_FORMAS_PAGO.map((fp) => (
                <option key={fp.id} value={fp.id}>{fp.desc}</option>
              ))}
            </select>
          </div>
          
          {mode === 'factura' && (
            <>
              <div className="form-field" style={{ width: '200px' }}>
                <label style={{ fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'block' }}>Comprobante</label>
                <select
                  className="form-select-cian"
                  style={{ height: '48px', borderRadius: '8px' }}
                  value={tipoCbte}
                  onChange={(e) => setTipoCbte(Number(e.target.value))}
                >
                  {AFIP_TIPOS_COMPROBANTE.filter((t) => [11, 12, 13, 1, 6].includes(t.id)).map((t) => (
                    <option key={t.id} value={t.id}>{t.desc}</option>
                  ))}
                </select>
              </div>
              <div className="form-field" style={{ width: '220px' }}>
                <label style={{ fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'block' }}>Número de Comprobante</label>
                <div
                  className="p-2 rounded"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    minHeight: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#0f172a',
                    fontWeight: 700,
                    fontSize: '0.95rem'
                  }}
                >
                  {loadingNumero ? 'Cargando...' : (numeroFactura ? FacturacionRequerimentos.formatearComprobante(pvSeleccionado?.numero, numeroFactura) : 'No disponible')}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="section-card shadow-sm h-100" style={{ border: 'none', borderRadius: '12px' }}>
            <div className="table-responsive">
              <table className="table-items w-100">
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '15px' }}>Descripción</th>
                    <th width="80" style={{ padding: '15px' }}>Cant.</th>
                    <th width="120" style={{ padding: '15px' }}>Precio</th>
                    <th width="120" style={{ padding: '15px' }} className="text-end">Total</th>
                    <th width="50" style={{ padding: '15px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const subtotalItem = (Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0);
                    return (
                      <tr key={`${item.idProduct}-${index}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: '600', color: '#334155' }}>{item.descripcion}</div>
                          <small style={{ color: '#64748b' }}>{item.codigo}</small>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input
                            type="number"
                            min="1"
                            className="input-table text-center"
                            style={{ background: '#f8fafc', borderRadius: '4px' }}
                            value={item.cantidad}
                            onChange={(e) => handleItemChange(index, 'cantidad', Number(e.target.value) || 0)}
                          />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input
                            type="number"
                            step="0.01"
                            className="input-table text-end"
                            style={{ background: '#f8fafc', borderRadius: '4px' }}
                            value={item.precioUnitario}
                            onChange={(e) => handleItemChange(index, 'precioUnitario', Number(e.target.value) || 0)}
                          />
                        </td>
                        <td style={{ padding: '12px' }} className="text-end fw-bold text-dark">
                          ${subtotalItem.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <button 
                            type="button" 
                            className="btn-close" 
                            style={{ fontSize: '0.7rem' }}
                            onClick={() => handleRemoveItem(index)}
                            aria-label="Remove"
                          ></button>
                        </td>
                      </tr>
                    );
                  })}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-5">
                        <div style={{ fontSize: '3rem', opacity: 0.2 }}>🛒</div>
                        <p className="mt-2">No hay productos en la venta.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="section-card shadow-sm" style={{ border: 'none', borderRadius: '12px', background: '#1e293b', color: '#fff' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#94a3b8' }}>Resumen de Venta</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>IVA</span>
                <span>${ivaTotal.toFixed(2)}</span>
              </div>
              <hr style={{ borderTop: '1px solid #334155', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.8rem', fontWeight: '800' }}>
                <span>TOTAL</span>
                <span style={{ color: '#38bdf8' }}>${total.toFixed(2)}</span>
              </div>
            </div>

            {formaPago === 'Contado' && (
              <div className="mt-4 p-3 rounded" style={{ background: '#334155' }}>
                <div className="mb-3">
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Monto Recibido</label>
                  <input
                    type="number"
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(e.target.value)}
                    className="form-control-cian"
                    style={{ background: '#1e293b', border: '1px solid #475569', color: '#fff', fontSize: '1.2rem', textAlign: 'right' }}
                    placeholder="0.00"
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Vuelto</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#4ade80' }}>${cambio.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              className="btn-cian-primary w-100 py-3 mt-4 shadow-lg"
              style={{ fontSize: '1.2rem', fontWeight: '700', borderRadius: '8px' }}
              onClick={handleSubmit}
              disabled={isSubmitting || items.length === 0 || (mode === 'factura' && (!numeroFactura || !empresa?.cuit))}
            >
              {isSubmitting ? (
                <><span className="spinner-border spinner-border-sm me-2"></span> Procesando...</>
              ) : (
                <>{mode === 'ticket' ? 'CONFIRMAR TICKET' : mode === 'notaPedido' ? 'CREAR PEDIDO' : 'EMITIR FACTURA'} <small style={{ opacity: 0.7, fontSize: '0.8rem' }}>(ENTER)</small></>
              )}
            </button>
          </div>

          {statusMessage && (
            <div className={`mt-3 p-2 rounded text-center ${statusMessage.includes('Error') ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'}`} style={{ fontSize: '0.9rem' }}>
              {statusMessage}
            </div>
          )}
        </div>
      </div>

      {['factura', 'notaPedido'].includes(mode) && (
        <div className="section-card shadow-sm mb-4" style={{ border: 'none', borderRadius: '12px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '15px' }}>Datos del Cliente {mode === 'notaPedido' && '(Requerido para Facturación)'}</h4>
          <div className="form-row">
            <div className="form-field" style={{ flex: 1, position: 'relative' }}>
              <label>Nombre / Razón Social {mode === 'notaPedido' && '*'}</label>
              <input
                value={nombreCliente}
                onChange={(e) => {
                  const value = e.target.value;
                  if (selectedCliente && selectedCliente.razonSocial !== value) {
                    setSelectedCliente(null);
                  }
                  setNombreCliente(value);
                }}
                className="form-control-cian"
                placeholder="Buscar cliente frecuente o Consumidor Final"
                required={mode === 'notaPedido'}
                autoComplete="off"
              />
              {clienteSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  boxShadow: '0 15px 30px rgba(15, 23, 42, 0.08)',
                  zIndex: 20,
                  maxHeight: '240px',
                  overflowY: 'auto'
                }}>
                  {clienteLoading ? (
                    <div style={{ padding: '12px', color: '#64748b' }}>Buscando clientes...</div>
                  ) : clienteSuggestions.map((cliente) => (
                    <button
                      key={cliente._id}
                      type="button"
                      onClick={() => {
                        setSelectedCliente(cliente);
                        setNombreCliente(cliente.razonSocial || cliente.nombreContacto || '');
                        setDocTipo(allowedDocTipos.includes(cliente.tipoDocumento) ? cliente.tipoDocumento : defaultDocTipoByTipoCbte);
                        setDocNro(cliente.numeroDocumento || '');
                        setCondicionIVA(cliente.condicionIVACodigo || 5);
                        setClienteSuggestions([]);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        textAlign: 'left',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: '#0f172a'
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{cliente.razonSocial || cliente.nombreContacto || 'Cliente'}</div>
                      <div style={{ fontSize: '0.85rem', color: '#475569' }}>{cliente.numeroDocumento || 'Sin documento'}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="form-row mt-3">
            <div className="form-field" style={{ width: '170px' }}>
              <label>Tipo Doc. {mode === 'notaPedido' && '*'}</label>
              <select className="form-select-cian" value={docTipo} onChange={(e) => setDocTipo(Number(e.target.value))}>
                {AFIP_DOC_TIPOS.filter((d) => allowedDocTipos.includes(d.id)).map((d) => (
                  <option key={d.id} value={d.id}>{d.desc}</option>
                ))}
              </select>
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label>Número de Documento / CUIT {mode === 'notaPedido' && '*'}</label>
              <input
                type="number"
                value={docNro}
                onChange={(e) => setDocNro(e.target.value)}
                className="form-control-cian"
                placeholder="DNI o CUIT"
                required={mode === 'notaPedido'}
              />
            </div>
            <div className="form-field" style={{ width: '180px' }}>
              <label>Moneda</label>
              <select className="form-select-cian" value={moneda} onChange={(e) => setMoneda(e.target.value)}>
                {AFIP_MONEDAS.map((m) => (
                  <option key={m.id} value={m.id}>{m.desc}</option>
                ))}
              </select>
            </div>
            <div className="form-field" style={{ width: '220px' }}>
              <label>Condición IVA {mode === 'notaPedido' && '*'}</label>
              <select className="form-select-cian" value={condicionIVA} onChange={(e) => setCondicionIVA(Number(e.target.value))}>
                {CONDICIONES_IVA_RECEPTOR.filter((c) => allowedCondiciones.includes(c.id)).map((c) => (
                  <option key={c.id} value={c.id}>{c.desc}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <ModalBuscadorProductos
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={addItem}
        initialQuery={searchQuery}
      />
    </div>
  );
};

export default Despachador;
