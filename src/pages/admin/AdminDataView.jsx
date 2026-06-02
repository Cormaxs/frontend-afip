import React, { useState } from 'react';
import { ChevronDown, Eye } from 'lucide-react';

export default function AdminDataView({ title, icon: Icon, data = [], columns = [], onClose }) {
    const [expandedRow, setExpandedRow] = useState(null);

    const formatCurrency = (value) => {
        if (typeof value !== 'number') return value;
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2
        }).format(value);
    };

    const formatDate = (value) => {
        if (!value) return 'N/A';
        try {
            return new Date(value).toLocaleDateString('es-AR');
        } catch {
            return value;
        }
    };

    const renderValue = (value, key = '') => {
        if (value === null || value === undefined) return 'N/A';

        // Detectar campos de moneda
        if (typeof value === 'number' && isMoneyField(key)) {
            return formatCurrency(value);
        }

        // Detectar campos de fecha
        if (typeof value === 'string' && isDateField(key)) {
            return formatDate(value);
        }

        // Manejar objetos "totales" especialmente
        if (typeof value === 'object' && !Array.isArray(value)) {
            if (key === 'totales' || key === 'pago') {
                // Retornar solo el totalPagar si existe
                if (value.totalPagar !== undefined) {
                    return formatCurrency(value.totalPagar);
                }
            }
            return '(Objeto)';
        }

        if (typeof value === 'number') {
            return value.toLocaleString('es-AR', { maximumFractionDigits: 2 });
        }

        if (typeof value === 'boolean') {
            return value ? (
                <span className="admin-badge admin-badge--success">Sí</span>
            ) : (
                <span className="admin-badge admin-badge--danger">No</span>
            );
        }

        if (Array.isArray(value)) {
            return `${value.length} items`;
        }

        if (typeof value === 'object') {
            return '(Objeto)';
        }

        return String(value).substring(0, 100);
    };

    const isMoneyField = (key) => {
        const moneyFields = [
            'precio', 'monto', 'total', 'costo', 'lista', 'pagado', 'pendiente',
            'subtotal', 'descuento', 'ingresos', 'egresos', 'inicial', 'final', 'esperado'
        ];
        return moneyFields.some(field => key.toLowerCase().includes(field));
    };

    const isDateField = (key) => {
        const dateFields = ['fecha', 'hora', 'vencimiento', 'emission', 'apertura', 'cierre'];
        return dateFields.some(field => key.toLowerCase().includes(field));
    };

    const getStatusColor = (value) => {
        if (typeof value !== 'string') return '';
        
        const statusColors = {
            'aprobada': 'admin-badge--success',
            'pendiente': 'admin-badge--warning',
            'rechazada': 'admin-badge--danger',
            'entregado': 'admin-badge--success',
            'abierta': 'admin-badge--warning',
            'cerrada': 'admin-badge--success',
            'activo': 'admin-badge--success',
            'pagado': 'admin-badge--success',
            'vencido': 'admin-badge--danger',
            'parcial': 'admin-badge--warning',
        };

        for (const [key, badgeClass] of Object.entries(statusColors)) {
            if (value.toLowerCase().includes(key)) return badgeClass;
        }
        return '';
    };

    const isStatusField = (key) => {
        const statusFields = ['estado', 'status', 'activo'];
        return statusFields.some(field => key.toLowerCase().includes(field));
    };

    return (
        <div className="admin-data-view">
            <div className="admin-data-view-header">
                <div className="admin-data-view-title">
                    {Icon && <Icon size={24} />}
                    <div>
                        <h2>{title}</h2>
                        <p className="admin-data-view-count">{data.length} registros</p>
                    </div>
                </div>
                <button onClick={onClose} className="admin-data-view-close">✕</button>
            </div>

            {data.length === 0 ? (
                <div className="admin-empty-data">
                    <p>No hay datos disponibles</p>
                </div>
            ) : (
                <div className="admin-table-wrapper">
                    <table className="admin-data-table">
                        <thead>
                            <tr>
                                <th className="admin-table-expand"></th>
                                {columns.map(col => (
                                    <th key={col.key} className={`admin-table-col-${col.key}`}>
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, idx) => (
                                <React.Fragment key={idx}>
                                    <tr className={`admin-data-row ${expandedRow === idx ? 'admin-data-row--expanded' : ''}`}>
                                        <td className="admin-table-expand">
                                            <button
                                                onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                                                className="admin-expand-btn"
                                                title="Ver detalles"
                                            >
                                                <ChevronDown size={18} />
                                            </button>
                                        </td>
                                        {columns.map(col => (
                                            <td key={col.key} className="admin-data-cell">
                                                {isStatusField(col.key) ? (
                                                    <span className={`admin-badge ${getStatusColor(row[col.key])}`}>
                                                        {renderValue(row[col.key], col.key)}
                                                    </span>
                                                ) : (
                                                    renderValue(row[col.key], col.key)
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                    {expandedRow === idx && (
                                        <tr className="admin-data-row-expanded">
                                            <td colSpan={columns.length + 1} className="admin-expanded-content">
                                                <div className="admin-expanded-details">
                                                    <h4>Detalles Completos</h4>
                                                    <div className="admin-expanded-grid">
                                                        {Object.entries(row).map(([key, value]) => (
                                                            <div key={key} className="admin-expanded-item">
                                                                <label>{key}</label>
                                                                <span className="admin-expanded-value">
                                                                    {Array.isArray(value) ? (
                                                                        <ul className="admin-items-list">
                                                                            {value.slice(0, 3).map((item, i) => (
                                                                                <li key={i}>
                                                                                    {typeof item === 'object' 
                                                                                        ? JSON.stringify(item).substring(0, 80)
                                                                                        : item
                                                                                    }
                                                                                </li>
                                                                            ))}
                                                                            {value.length > 3 && (
                                                                                <li className="admin-items-more">
                                                                                    +{value.length - 3} más...
                                                                                </li>
                                                                            )}
                                                                        </ul>
                                                                    ) : (
                                                                        renderValue(value, key)
                                                                    )}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
