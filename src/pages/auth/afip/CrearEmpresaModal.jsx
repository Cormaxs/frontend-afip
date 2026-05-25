import React from 'react';
import ModalGenerico from "../../../components/modal/ModalGenerico.jsx";
import EmpresaForm from '../../../components/afip/EmpresaForm.jsx';
import { afipService } from '../../../services/afip/afip-general.js';
import Swal from 'sweetalert2';

const CrearEmpresaModal = ({ isOpen, onClose, user, onExito }) => {
  const handleCreate = async (formData) => {
    try {
      const payload = {
        idPropietario: user.empresa,
        empresa: formData,
        iduser: user._id
      };

      const respuesta = await afipService.crearEmpresa(payload);

      if (respuesta.status === 200 || respuesta.data?.success) {
        Swal.fire('¡Éxito!', 'Empresa registrada correctamente', 'success');
        onExito(); // Recarga los datos en el padre
        onClose(); // Cierra el modal
      }
    } catch (error) {
      console.error("Error al crear empresa:", error);
      Swal.fire('Error', 'No se pudo registrar la empresa', 'error');
    }
  };

  return (
    <ModalGenerico isOpen={isOpen} onClose={onClose} title="Configurar Nueva Empresa">
      <EmpresaForm onSubmit={handleCreate} isEditing={false} />
      <button className="btn-cancelar-link" onClick={onClose}>Cancelar</button>
    </ModalGenerico>
  );
};

export default CrearEmpresaModal;