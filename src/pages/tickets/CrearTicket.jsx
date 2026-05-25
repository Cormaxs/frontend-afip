import React, { useMemo, useState, useEffect } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/auth/authContext.jsx';
import { ticketsService } from '../../services/tickets/tickets.js';
import { FacturacionRequerimentos } from '../../utils/facturacionHelper.js';
import ModalBuscadorProductos from '../../components/facturas/ModalBuscadorProductos.jsx';
import { AFIP_FORMAS_PAGO } from '../../constants/afipConstants.js';
import '../../components/facturas/facturasForm.css';

const formatFechaHora = () => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}, ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};

const generarVentaId = () => `TICKET-${Date.now()}`;

const CrearTicket = () => {
  const { user } = useAuth();
  const [puntosVenta, setPuntosVenta] = useState([]);
  const [pvSeleccionado, setPvSeleccionado] = useState(null);
  const [loadingPv, setLoadingPv] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { control, register, handleSubmit, setValue, formState: { errors }, reset } = useForm({
    defaultValues: {
      datos: {
        ventaId: generarVentaId(),
        fechaHora: formatFechaHora(),
        puntoDeVenta: '',
        tipoComprobante: 'Ticket',
        numeroComprobante: '',
        items: [
          {
            idProduct: '',
            codigo: '',
            descripcion: '',
            cantidad: 1,
            precioUnitario: 0,
          }
        ],
        totales: {
          descuento: 0,
        },
        pago: {
          metodo: 'Contado',
          montoRecibido: null,
          cambio: null,
        },
        cliente: {
          nombre: 'nadie',
          dniCuit: '',
          condicionIVA: 'Consumidor Final',
        },
        observaciones: '',
      }
    }
  });

  useEffect(() => {
    const cargarPuntosVenta = async () => {
      if (!user?.empresa) {
        setLoadingPv(false);
        return;
      }

      try {
        const config = await FacturacionRequerimentos.obtenerConfiguracionPuntosVenta(user.empresa);
        setPuntosVenta(config.todos);
        setPvSeleccionado(config.principal);
        if (config.principal?._id) {
          setValue('datos.puntoDeVenta', config.principal._id);
        }
      } catch (error) {
        console.error('Error cargando puntos de venta:', error);
      } finally {
        setLoadingPv(false);
      }
    };

    cargarPuntosVenta();
  }, [user?.empresa, setValue]);

  const { fields, append, remove } = useFieldArray({ control, name: 'datos.items' });
  const items = useWatch({ control, name: 'datos.items' }) || [];
  const descuento = useWatch({ control, name: 'datos.totales.descuento' }) || 0;

  const totales = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const cantidad = Number(item.cantidad) || 0;
      const precio = Number(item.precioUnitario) || 0;
      return sum + cantidad * precio;
    }, 0);
    const totalPagar = Number((subtotal - (Number(descuento) || 0)).toFixed(2));
    return { subtotal: Number(subtotal.toFixed(2)), descuento: Number(descuento || 0), totalPagar };
  }, [items, descuento]);

  const onSelectProducto = (prod) => {
    append({
      idProduct: prod._id,
      codigo: prod.codigoInterno || prod.codigo || '',
      descripcion: prod.producto || prod.descripcion || '',
      cantidad: 1,
      precioUnitario: Number(prod.precioLista || prod.precioCosto || 0),
    });
    setIsModalOpen(false);
  };

  const onSubmit = async (formData) => {
    if (!user?._id || !user?.empresa) {
      Swal.fire('Error', 'No se encontró usuario o empresa.', 'error');
      return;
    }

    const ventaId = formData.datos.ventaId || generarVentaId();
    const puntoDeVenta = formData.datos.puntoDeVenta || pvSeleccionado?._id || '';

    const itemsPayload = formData.datos.items.map((item) => ({
      ...item,
      cantidad: Number(item.cantidad) || 0,
      precioUnitario: Number(item.precioUnitario) || 0,
      totalItem: Number(((Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0)).toFixed(2)),
    }));

    const payload = {
      datos: {
        ...formData.datos,
        ventaId,
        puntoDeVenta,
        tipoComprobante: 'Ticket',
        items: itemsPayload,
        totales,
        pago: {
          metodo: formData.datos.pago.metodo || 'Contado',
          montoRecibido: formData.datos.pago.montoRecibido ? Number(formData.datos.pago.montoRecibido) : null,
          cambio: formData.datos.pago.cambio ? Number(formData.datos.pago.cambio) : null,
        }
      },
      idEmpresa: user.empresa,
      idUser: user._id,
    };

    try {
      const response = await ticketsService.crearTicketInterno(user._id, payload);
      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('application/pdf')) {
        const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      }
      Swal.fire('OK', 'Ticket interno creado correctamente.', 'success');
      reset({
        datos: {
          ventaId: generarVentaId(),
          fechaHora: formatFechaHora(),
          puntoDeVenta: puntoDeVenta,
          tipoComprobante: 'Ticket',
          numeroComprobante: '',
          items: [
            { idProduct: '', codigo: '', descripcion: '', cantidad: 1, precioUnitario: 0 }
          ],
          totales: { descuento: 0 },
          pago: { metodo: 'Contado', montoRecibido: null, cambio: null },
          cliente: { nombre: 'nadie', dniCuit: '', condicionIVA: 'Consumidor Final' },
          observaciones: '',
        }
      });
    } catch (error) {
      console.error(error);
      Swal.fire('Error', error.response?.data?.message || 'No se pudo crear el ticket interno.', 'error');
    }
  };

  return (
    <div className="factura-container">
      <h1 style={{ marginBottom: '20px' }}>Crear Ticket Interno</h1>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '18px' }}>
        <div className="section-card">
          <h6 className="section-title">Configuración del ticket</h6>
          <div className="form-row">
            <div className="form-field" style={{ flex: 1 }}>
              <label>Venta ID</label>
              <input type="text" className="form-control-cian" {...register('datos.ventaId')} readOnly />
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label>Fecha y hora</label>
              <input type="text" className="form-control-cian" {...register('datos.fechaHora')} readOnly />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field" style={{ flex: 1 }}>
              <label>Punto de Venta</label>
              <input
                type="text"
                className="form-control-cian"
                value={pvSeleccionado ? `${pvSeleccionado.numero || pvSeleccionado._id} — ${pvSeleccionado.nombre || 'Principal'}` : ''}
                readOnly
              />
              <input type="hidden" {...register('datos.puntoDeVenta')} />
              {loadingPv && <small style={{ color: '#6c757d' }}>Cargando punto de venta...</small>}
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label>Tipo de comprobante</label>
              <input type="text" className="form-control-cian" value="Ticket" readOnly />
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label>Número de comprobante</label>
              <input type="text" className="form-control-cian" {...register('datos.numeroComprobante')} placeholder="Número interno" />
            </div>
          </div>
        </div>

        <div className="section-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="section-title mb-0">Selección de productos</h6>
            <button type="button" className="btn-cian-outline" onClick={() => setIsModalOpen(true)}>
              + Buscar producto
            </button>
          </div>
          <table className="table-items">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th width="100">Cant.</th>
                <th width="140">Precio Unit.</th>
                <th width="140">Total</th>
                <th width="80"></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => {
                const cantidad = Number(items[index]?.cantidad || 0);
                const precio = Number(items[index]?.precioUnitario || 0);
                return (
                  <tr key={field.id}>
                    <td>
                      <input type="text" className="input-table" {...register(`datos.items.${index}.codigo`)} readOnly />
                    </td>
                    <td>
                      <input type="text" className="input-table" {...register(`datos.items.${index}.descripcion`)} readOnly />
                    </td>
                    <td>
                      <input type="number" min="1" className="input-table text-center" {...register(`datos.items.${index}.cantidad`, { valueAsNumber: true })} />
                    </td>
                    <td>
                      <input type="number" min="0" step="0.01" className="input-table text-end" {...register(`datos.items.${index}.precioUnitario`, { valueAsNumber: true })} />
                    </td>
                    <td className="text-end fw-bold">${(cantidad * precio).toFixed(2)}</td>
                    <td>
                      <button type="button" className="btn-cian-outline" onClick={() => remove(index)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button type="button" className="btn-cian-outline" onClick={() => append({ idProduct: '', codigo: '', descripcion: '', cantidad: 1, precioUnitario: 0 })}>
            + Agregar fila manual
          </button>
        </div>

        <div className="section-card">
          <h6 className="section-title">Totales y pago</h6>
          <div className="form-row">
            <div className="form-field" style={{ flex: 1 }}>
              <label>Subtotal</label>
              <input type="text" className="form-control-cian" value={`$ ${totales.subtotal.toFixed(2)}`} readOnly />
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label>Descuento</label>
              <input type="number" min="0" step="0.01" className="form-control-cian" {...register('datos.totales.descuento', { valueAsNumber: true })} />
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label>Total a pagar</label>
              <input type="text" className="form-control-cian" value={`$ ${totales.totalPagar.toFixed(2)}`} readOnly />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field" style={{ flex: 1 }}>
              <label>Método de pago</label>
              <select className="form-control-cian" {...register('datos.pago.metodo')}>
                {AFIP_FORMAS_PAGO.map((fp) => (
                  <option key={fp.id} value={fp.id}>{fp.desc}</option>
                ))}
              </select>
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label>Monto recibido</label>
              <input type="number" min="0" step="0.01" className="form-control-cian" {...register('datos.pago.montoRecibido', { valueAsNumber: true })} />
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label>Cambio</label>
              <input type="number" min="0" step="0.01" className="form-control-cian" {...register('datos.pago.cambio', { valueAsNumber: true })} />
            </div>
          </div>
        </div>

        <div className="section-card">
          <h6 className="section-title">Datos del cliente</h6>
          <div className="form-row">
            <div className="form-field" style={{ flex: 1 }}>
              <label>Nombre</label>
              <input type="text" className="form-control-cian" {...register('datos.cliente.nombre')} />
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label>DNI/CUIT</label>
              <input type="text" className="form-control-cian" {...register('datos.cliente.dniCuit')} />
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label>Condición IVA</label>
              <input type="text" className="form-control-cian" {...register('datos.cliente.condicionIVA')} />
            </div>
          </div>
        </div>

        <div className="section-card">
          <h6 className="section-title">Observaciones</h6>
          <textarea rows="4" className="form-control-cian" {...register('datos.observaciones')} />
        </div>

        <button type="submit" className="btn-cian-primary" style={{ width: 'fit-content' }}>
          Crear Ticket Interno
        </button>
      </form>

      <ModalBuscadorProductos
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={onSelectProducto}
      />
    </div>
  );
};

export default CrearTicket;
