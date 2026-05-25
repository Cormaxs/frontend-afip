import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import ModalGenerico from '../../components/modal/ModalGenerico.jsx';
import { useAuth } from '../../contexts/auth/authContext.jsx';
import { ProveedoresService } from '../../services/proveedores/proveedores.js';

const Proveedores = () => {
  const { user } = useAuth();
  const companyId = user?.empresa?._id || user?.empresa;
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      nombre: '',
      cuit: '',
      telefono: '',
      email: '',
      direccion: '',
      terminosPago: '30 días',
      notas: '',
      activo: true
    }
  });

  useEffect(() => {
    if (companyId) cargarProveedores();
  }, [companyId]);

  const cargarProveedores = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const response = await ProveedoresService.obtenerProveedores(companyId);
      setProveedores(response.data?.proveedores || response.data || []);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      Swal.fire('Error', 'No se pudieron cargar los proveedores.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalProveedor = (proveedor = null) => {
    setSelectedProveedor(proveedor);
    if (proveedor) {
      reset({
        nombre: proveedor.nombre || '',
        cuit: proveedor.contacto?.cuit || '',
        telefono: proveedor.contacto?.telefono || '',
        email: proveedor.contacto?.email || '',
        direccion: proveedor.contacto?.direccion || '',
        terminosPago: proveedor.terminosPago || '30 días',
        notas: proveedor.notas || '',
        activo: proveedor.activo ?? true
      });
    } else {
      reset({
        nombre: '',
        cuit: '',
        telefono: '',
        email: '',
        direccion: '',
        terminosPago: '30 días',
        notas: '',
        activo: true
      });
    }
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setSelectedProveedor(null);
    reset();
  };

  const guardarProveedor = async (data) => {
    if (!companyId) {
      Swal.fire('Error', 'No se encontró la empresa asociada.', 'error');
      return;
    }

    const payload = {
      nombre: data.nombre,
      empresa: companyId,
      contacto: {
        cuit: data.cuit,
        telefono: data.telefono,
        email: data.email,
        direccion: data.direccion
      },
      terminosPago: data.terminosPago,
      notas: data.notas,
      activo: data.activo
    };

    try {
      if (selectedProveedor?._id) {
        await ProveedoresService.actualizarProveedor(selectedProveedor._id, payload);
        Swal.fire('Actualizado', 'Proveedor actualizado correctamente.', 'success');
      } else {
        await ProveedoresService.crearProveedor(payload);
        Swal.fire('Creado', 'Proveedor creado correctamente.', 'success');
      }
      cerrarModal();
      cargarProveedores();
    } catch (error) {
      console.error('Error guardando proveedor:', error);
      Swal.fire('Error', error.response?.data?.error || 'No se pudo guardar el proveedor', 'error');
    }
  };

  const eliminarProveedor = async (proveedor) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar proveedor?',
      text: `Vas a eliminar a ${proveedor.nombre}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    try {
      await ProveedoresService.eliminarProveedor(proveedor._id);
      Swal.fire('Eliminado', 'Proveedor eliminado correctamente.', 'success');
      cargarProveedores();
    } catch (error) {
      console.error('Error eliminando proveedor:', error);
      Swal.fire('Error', 'No se pudo eliminar el proveedor.', 'error');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontWeight: '700' }}>Proveedores</h1>
        <p style={{ margin: 0, color: '#666' }}>Administra los proveedores y su cuenta corriente.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div />
        <button className="btn btn-primary" onClick={() => abrirModalProveedor(null)}>
          + Nuevo Proveedor
        </button>
      </div>

      <div className="table-container" style={{ border: '1px solid #eee' }}>
        <table className="office-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px' }}>Nombre</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>CUIT</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Contacto</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Saldo</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Activo</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>Cargando...</td></tr>
            ) : proveedores.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No se encontraron proveedores.</td></tr>
            ) : proveedores.map((proveedor) => (
              <tr key={proveedor._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{proveedor.nombre}</td>
                <td style={{ padding: '12px' }}>{proveedor.contacto?.cuit || '---'}</td>
                <td style={{ padding: '12px' }}>
                  {proveedor.contacto?.telefono || '---'}
                  <br />
                  {proveedor.contacto?.email || '---'}
                </td>
                <td style={{ padding: '12px' }}>$ {Number(proveedor.saldoCuentaCorriente || 0).toFixed(2)}</td>
                <td style={{ padding: '12px' }}>{proveedor.activo ? 'Sí' : 'No'}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button className="btn btn-sm" style={{ marginRight: '8px' }} onClick={() => abrirModalProveedor(proveedor)}>
                    ✏️ Editar
                  </button>
                  <button className="btn btn-sm" style={{ backgroundColor: '#d9534f', color: '#fff' }} onClick={() => eliminarProveedor(proveedor)}>
                    🗑️ Eliminar
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
        title={`${selectedProveedor ? 'Editar' : 'Nuevo'} proveedor`}
        width="600px"
      >
        <form onSubmit={handleSubmit(guardarProveedor)} style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label className="option">Nombre *</label>
            <input type="text" className="input-field" {...register('nombre', { required: 'El nombre es obligatorio' })} />
            {errors.nombre && <small style={{ color: '#d9534f' }}>{errors.nombre.message}</small>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="option">CUIT</label>
              <input type="text" className="input-field" {...register('cuit')} />
            </div>
            <div>
              <label className="option">Teléfono</label>
              <input type="text" className="input-field" {...register('telefono')} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="option">Email</label>
              <input type="email" className="input-field" {...register('email')} />
            </div>
            <div>
              <label className="option">Dirección</label>
              <input type="text" className="input-field" {...register('direccion')} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="option">Términos de pago</label>
              <input type="text" className="input-field" {...register('terminosPago')} />
            </div>
            <div>
              <label className="option">Activo</label>
              <select className="input-field" {...register('activo')}>
                <option value={true}>Sí</option>
                <option value={false}>No</option>
              </select>
            </div>
          </div>

          <div>
            <label className="option">Notas</label>
            <textarea className="input-field" style={{ minHeight: '90px' }} {...register('notas')} />
          </div>

          <button type="submit" className="btn btn-primary">
            {selectedProveedor ? 'Guardar cambios' : 'Crear proveedor'}
          </button>
        </form>
      </ModalGenerico>
    </div>
  );
};

export default Proveedores;
