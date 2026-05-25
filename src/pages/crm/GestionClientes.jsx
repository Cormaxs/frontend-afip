import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import ModalGenerico from '../../components/modal/ModalGenerico.jsx';
import { useAuth } from '../../contexts/auth/authContext.jsx';
import { ClientesService } from '../../services/crm/clientes.js';

const CONDICIONES_IVA = [
  { label: 'Consumidor Final', value: 'Consumidor Final', code: 5 },
  { label: 'Monotributista', value: 'Monotributista', code: 6 },
  { label: 'Responsable Inscripto', value: 'Responsable Inscripto', code: 1 },
  { label: 'Exento', value: 'Exento', code: 4 },
  { label: 'No Responsable', value: 'No Responsable', code: 3 }
];

const TIPOS_DOC = [
  { label: 'DNI', value: 96 },
  { label: 'CUIT', value: 80 },
  { label: 'CUIL', value: 86 }
];

const GestionClientes = () => {
  const { user } = useAuth();
  const companyId = user?.empresa?._id || user?.empresa;
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      razonSocial: '',
      nombreContacto: '',
      tipoDocumento: 96,
      numeroDocumento: '',
      condicionIVA: 'Consumidor Final',
      condicionIVACodigo: 5,
      domicilio: '',
      localidad: '',
      provincia: '',
      telefono: '',
      email: '',
      observaciones: '',
      activo: true
    }
  });

  const selectedCondicionIVA = watch('condicionIVA');

  useEffect(() => {
    const condicion = CONDICIONES_IVA.find(c => c.value === selectedCondicionIVA);
    if (condicion) {
      setValue('condicionIVACodigo', condicion.code);
    }
  }, [selectedCondicionIVA, setValue]);

  useEffect(() => {
    if (companyId) cargarClientes();
  }, [companyId, searchTerm]);

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const response = await ClientesService.obtenerClientesEmpresa(companyId, { search: searchTerm });
      setClientes(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      Swal.fire('Error', 'No se pudieron cargar los clientes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCliente = (cliente = null) => {
    setSelectedCliente(cliente);
    if (cliente) {
      reset({
        razonSocial: cliente.razonSocial || '',
        nombreContacto: cliente.nombreContacto || '',
        tipoDocumento: cliente.tipoDocumento || 96,
        numeroDocumento: cliente.numeroDocumento || '',
        condicionIVA: cliente.condicionIVA || 'Consumidor Final',
        condicionIVACodigo: cliente.condicionIVACodigo || 5,
        domicilio: cliente.domicilio || '',
        localidad: cliente.localidad || '',
        provincia: cliente.provincia || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        observaciones: cliente.observaciones || '',
        activo: cliente.activo ?? true
      });
    } else {
      reset({
        razonSocial: '',
        nombreContacto: '',
        tipoDocumento: 96,
        numeroDocumento: '',
        condicionIVA: 'Consumidor Final',
        condicionIVACodigo: 5,
        domicilio: '',
        localidad: '',
        provincia: '',
        telefono: '',
        email: '',
        observaciones: '',
        activo: true
      });
    }
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setSelectedCliente(null);
    reset();
  };

  const guardarCliente = async (data) => {
    if (!companyId) {
      Swal.fire('Error', 'No se encontró la empresa asociada.', 'error');
      return;
    }

    const payload = {
      ...data,
      owner: companyId
    };

    try {
      if (selectedCliente?._id) {
        await ClientesService.actualizarCliente(selectedCliente._id, payload);
        Swal.fire('Actualizado', 'Cliente actualizado correctamente.', 'success');
      } else {
        await ClientesService.crearCliente(payload);
        Swal.fire('Creado', 'Cliente creado correctamente.', 'success');
      }
      cerrarModal();
      cargarClientes();
    } catch (error) {
      console.error('Error guardando cliente:', error);
      Swal.fire('Error', error.response?.data?.error || 'No se pudo guardar el cliente', 'error');
    }
  };

  const eliminarCliente = async (cliente) => {
    const confirm = await Swal.fire({
      title: '¿Desactivar cliente?',
      text: `Vas a desactivar a ${cliente.razonSocial}. El historial se mantendrá pero no aparecerá en las búsquedas activas.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    try {
      await ClientesService.eliminarCliente(cliente._id);
      Swal.fire('Desactivado', 'Cliente desactivado correctamente.', 'success');
      cargarClientes();
    } catch (error) {
      console.error('Error desactivando cliente:', error);
      Swal.fire('Error', 'No se pudo desactivar el cliente.', 'error');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontWeight: '700' }}>Clientes (CRM)</h1>
        <p style={{ margin: 0, color: '#666' }}>Gestiona tu base de clientes y sus datos fiscales.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '16px', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="Buscar por nombre, documento o email..." 
          className="input-field"
          style={{ maxWidth: '400px' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn btn-primary" onClick={() => abrirModalCliente(null)}>
          + Nuevo Cliente
        </button>
      </div>

      <div className="table-container" style={{ border: '1px solid #eee' }}>
        <table className="office-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px' }}>Razón Social / Nombre</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Documento</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Condición IVA</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Contacto</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Saldo CC</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>Cargando...</td></tr>
            ) : clientes.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No se encontraron clientes.</td></tr>
            ) : clientes.map((cliente) => (
              <tr key={cliente._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>
                  <strong>{cliente.razonSocial}</strong>
                  {cliente.nombreContacto && <div style={{ fontSize: '0.85rem', color: '#666' }}>{cliente.nombreContacto}</div>}
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#888', display: 'block' }}>
                    {TIPOS_DOC.find(t => t.value === cliente.tipoDocumento)?.label || 'Doc'}:
                  </span>
                  {cliente.numeroDocumento || '---'}
                </td>
                <td style={{ padding: '12px' }}>{cliente.condicionIVA}</td>
                <td style={{ padding: '12px' }}>
                  {cliente.telefono && <div style={{ fontSize: '0.85rem' }}>📞 {cliente.telefono}</div>}
                  {cliente.email && <div style={{ fontSize: '0.85rem' }}>📧 {cliente.email}</div>}
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{ color: cliente.saldoCuentaCorriente > 0 ? '#d9534f' : '#28a745', fontWeight: 'bold' }}>
                    $ {Number(cliente.saldoCuentaCorriente || 0).toFixed(2)}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button className="btn btn-sm" style={{ marginRight: '8px' }} onClick={() => abrirModalCliente(cliente)}>
                    ✏️
                  </button>
                  <button className="btn btn-sm" style={{ backgroundColor: '#f8f9fa', color: '#d9534f', border: '1px solid #ddd' }} onClick={() => eliminarCliente(cliente)}>
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ModalGenerico
        isOpen={modalOpen}
        onClose={cerrarModal}
        title={`${selectedCliente ? 'Editar' : 'Nuevo'} Cliente`}
        width="700px"
      >
        <form onSubmit={handleSubmit(guardarCliente)} style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="option">Razón Social / Nombre *</label>
              <input type="text" className="input-field" {...register('razonSocial', { required: 'Campo obligatorio' })} />
              {errors.razonSocial && <small style={{ color: '#d9534f' }}>{errors.razonSocial.message}</small>}
            </div>
            <div>
              <label className="option">Nombre de Contacto</label>
              <input type="text" className="input-field" {...register('nombreContacto')} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label className="option">Tipo Doc.</label>
              <select className="input-field" {...register('tipoDocumento')}>
                {TIPOS_DOC.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="option">Nro. Documento</label>
              <input type="text" className="input-field" {...register('numeroDocumento')} />
            </div>
            <div>
              <label className="option">Condición IVA *</label>
              <select className="input-field" {...register('condicionIVA')}>
                {CONDICIONES_IVA.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="option">Email</label>
              <input type="email" className="input-field" {...register('email')} />
            </div>
            <div>
              <label className="option">Teléfono</label>
              <input type="text" className="input-field" {...register('telefono')} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label className="option">Domicilio</label>
              <input type="text" className="input-field" {...register('domicilio')} />
            </div>
            <div>
              <label className="option">Localidad</label>
              <input type="text" className="input-field" {...register('localidad')} />
            </div>
            <div>
              <label className="option">Provincia</label>
              <input type="text" className="input-field" {...register('provincia')} />
            </div>
          </div>

          <div>
            <label className="option">Observaciones</label>
            <textarea className="input-field" rows="2" {...register('observaciones')}></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" className="btn" style={{ backgroundColor: '#eee' }} onClick={cerrarModal}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {selectedCliente ? 'Actualizar' : 'Crear'} Cliente
            </button>
          </div>
        </form>
      </ModalGenerico>
    </div>
  );
};

export default GestionClientes;
