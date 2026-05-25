// src/constants/afipConstants.js

export const AFIP_TIPOS_COMPROBANTE = [
    { id: 1, desc: "Factura A" },
    { id: 6, desc: "Factura B" },
    { id: 11, desc: "Factura C" },
    { id: 3, desc: "Nota de Crédito A" },
    { id: 8, desc: "Nota de Crédito B" },
    { id: 13, desc: "Nota de Crédito C" },
    { id: 2, desc: "Nota de Débito A" },
    { id: 7, desc: "Nota de Débito B" },
    { id: 12, desc: "Nota de Débito C" },
];

export const AFIP_CONCEPTOS = [
    { id: 1, desc: "Productos" },
    { id: 2, desc: "Servicios" },
    { id: 3, desc: "Productos y Servicios" },
];

export const AFIP_DOC_TIPOS = [
    { id: 80, desc: "CUIT" },
    { id: 86, desc: "CUIL" },
    { id: 96, desc: "DNI" },
    { id: 94, desc: "Pasaporte" },
    { id: 99, desc: "Doc. (Otro)" },
];

export const AFIP_ALICUOTAS_IVA = [
    { id: 5, desc: "21%", value: 0.21 },
    { id: 4, desc: "10.5%", value: 0.105 },
    { id: 6, desc: "27%", value: 0.27 },
    { id: 8, desc: "5%", value: 0.05 },
    { id: 9, desc: "2.5%", value: 0.025 },
    { id: 3, desc: "0%", value: 0 },
];

export const AFIP_MONEDAS = [
    { id: "PES", desc: "Pesos Argentinos" },
    { id: "DOL", desc: "Dólar Estadounidense" },
];

// Opcional: Condición IVA del Receptor (útil para el formulario)
export const CONDICIONES_IVA_RECEPTOR = [
    { id: 1, desc: "IVA Responsable Inscripto" },
    { id: 4, desc: "Exento" },
    { id: 5, desc: "Consumidor Final" },
    { id: 6, desc: "Responsable Monotributo" },
];


export const COMPROBANTES_POR_IVA = {
    1: [1, 2, 3], // Responsable Inscripto -> Puede recibir A, B, C (según emisor)
    6: [1, 2, 3], // Monotributista -> Puede recibir A, B, C
    5: [6, 11],    // Consumidor Final -> Solo B o C
    4: [6, 11],    // Exento -> Solo B o C
};

export const COMPROBANTES_CON_IVA_DESGLOSADO = [1, 2, 3];

export const AFIP_FORMAS_PAGO = [
    { id: "Contado", desc: "Contado" },
    { id: "Tarjeta de Crédito", desc: "Tarjeta de Crédito" },
    { id: "Tarjeta de Débito", desc: "Tarjeta de Débito" },
    { id: "Transferencia Bancaria", desc: "Transferencia Bancaria" },
    { id: "Cheque", desc: "Cheque" },
    { id: "Mercado Pago", desc: "Mercado Pago" },
    { id: "Otros", desc: "Otros" },
];