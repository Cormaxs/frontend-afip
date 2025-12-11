import React from 'react';

// Componente reutilizable para los zócalos de configuración
const ZocaloConfiguracion = ({ title, subtitle, panelName, activePanel, setActivePanel }) => {
    const isActive = activePanel === panelName;
    
    const getCardClass = () => 
        `p-3 rounded-lg shadow-sm cursor-pointer transition-all duration-200 text-center border ${
            isActive 
            ? 'bg-[var(--principal)] text-white shadow-lg border-2 border-white' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
        }`;
    
    const handleClick = () => {
        setActivePanel(isActive ? null : panelName);
    };

    return (
        <div className={getCardClass()} onClick={handleClick}>
            <h3 className="font-bold text-sm mb-1">{title}</h3>
            <p className={`text-xs truncate ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                {subtitle}
            </p>
        </div>
    );
};

export default ZocaloConfiguracion;