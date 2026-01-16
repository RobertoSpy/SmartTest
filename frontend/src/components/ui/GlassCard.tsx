import React, { HTMLAttributes } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  header?: React.ReactNode;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, header, className = '', style, ...props }) => {
  return (
    <div
      className={`glass-panel ${className}`}
      style={{ padding: '24px', position: 'relative', overflow: 'hidden', ...style }}
      {...props}
    >
      {header && (
        <div style={{
          marginBottom: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          paddingBottom: '10px'
        }}>
          {header}
        </div>
      )}
      {children}
    </div>
  );
};

export default GlassCard;
