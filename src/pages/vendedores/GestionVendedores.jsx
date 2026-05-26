import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { VendedoresService } from '../../services/vendedores/vendedores.js';
import { useAuth } from '../../contexts/auth/authContext.jsx';
import ModalGenerico from '../../components/modal/ModalGenerico.jsx';
import VendedorForm from '../../components/vendedores/VendedorForm.jsx';

const GestionVendedores = () => {
  const { user } = useAuth();
  const companyId = user?.empresa || user?.empresaId || user?.companyId;
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVendedor, setSelectedVendedor] = useState(null);
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'username',
    order: 'asc',
  });
  const [pagination, setPagination] = useState({
    totalDocs: 0,
    totalPages: 0,
    page: 1,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  useEffect(() => {
    if (companyId) {
      cargarVendedores(searchParams);
    }
  }, [companyId, searchParams]);

  const cargarVendedores = async (params) => {
    if (!companyId) return;
    setLoading(true);
    try {
      const response = await VendedoresService.obtenerVendedoresEmpresa(companyId, params);
      setVendedores(response.data?.docs || response.data?.vendedores || []);
      setPagination({
        totalDocs: response.data?.totalDocs || 0,
        totalPages: response.data?.totalPages || 0,
        page: response.data?.page || 1,
        limit: response.data?.limit || 10,
        hasNextPage: response.data?.hasNextPage || false,
        hasPrevPage: response.data?.hasPrevPage || false,
      });
    } catch (error) {
      console.error('Error cargando vendedores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchParams(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setSearchParams(prev => ({ ...prev, page: newPage }));
  };

  const handleEliminar = async (vendedor) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar: ${vendedor.nombre} ${vendedor.apellido}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await VendedoresService.eliminarVendedor(vendedor._id);
        Swal.fire('Eliminado', 'Vendedor borrado correctamente.', 'success');
        cargarVendedores();
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar', 'error');
      }
    }
  };

  const handleSuccess = () => {
    setModalOpen(false);
    setSelectedVendedor(null);
    cargarVendedores();
    Swal.fire({
      title: '¡Guardado!',
      text: 'Los cambios se realizaron correctamente',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0', fontWeight: '700' }}>Gestión de Vendedores</h1>
          <p style={{ color: '#666', margin: 0 }}>Administra el equipo de ventas de tu empresa</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Buscar vendedor..."
            className="input-field"
            style={{ maxWidth: '300px' }}
            value={searchParams.search}
            onChange={handleSearchChange}
          />
          <button
            className="btn btn-primary"
            onClick={() => {
              setSelectedVendedor(null);
              setModalOpen(true);
            }}
          >
            + Nuevo Vendedor
          </button>
        </div>
      </div>

      {vendedores.length > 0 ? (
        <div className="table-container" style={{ border: '1px solid #eee' }}>
          <table className="office-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px' }}>Usuario</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Nombre</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Email</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>Estado</th>
                <th style={{ textAlign: 'center', padding: '12px', width: '180px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vendedores.map((vendedor) => (
                <tr key={vendedor._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', color: '#2c3e50', fontWeight: '600' }}>{vendedor.username}</td>
                  <td style={{ padding: '12px', color: '#666', fontSize: '0.95rem' }}>
                    {vendedor.nombre} {vendedor.apellido}
                  </td>
                  <td style={{ padding: '12px', color: '#666', fontSize: '0.95rem' }}>{vendedor.email}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span
                      style={{
                        backgroundColor: vendedor.activo ? '#28a745' : '#dc3545',
                        color: '#fff',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.85rem'
                      }}
                    >
                      {vendedor.activo ? '✓ Activo' : '○ Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      className="btn btn-sm"
                      onClick={() => {
                        setSelectedVendedor(vendedor);
                        setModalOpen(true);
                      }}
                      style={{
                        backgroundColor: '#28a4d5',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '5px',
                        fontSize: '0.85rem'
                      }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={() => handleEliminar(vendedor)}
                      style={{
                        backgroundColor: '#d9534f',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <p style={{ color: '#999', marginBottom: '10px' }}>No hay vendedores creados aún</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setSelectedVendedor(null);
              setModalOpen(true);
            }}
          >
            + Crear Vendedor
          </button>
        </div>
      )}

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
          <button
            className="btn btn-sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.hasPrevPage}
          >
            Anterior
          </button>
          <span>Página {pagination.page} de {pagination.totalPages}</span>
          <button
            className="btn btn-sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasNextPage}
          >
            Siguiente
          </button>
        </div>
      )}

      <ModalGenerico
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedVendedor(null);
        }}
        title={selectedVendedor ? 'Editar Vendedor' : 'Nuevo Vendedor'}
        width="550px"
      >
        <VendedorForm initialData={selectedVendedor} onSuccess={handleSuccess} />
      </ModalGenerico>
    </div>
  );
};

export default GestionVendedores;
