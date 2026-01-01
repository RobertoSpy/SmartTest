import React, { ButtonHTMLAttributes } from 'react';

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost';
  glow?: boolean;
}

const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  variant = 'primary',
  glow = true,
  className = '',
  style,
  ...props
}) => {
  const baseStyle = {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    fontWeight: 600,
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    opacity: props.disabled ? 0.6 : 1,
  };

  let variantStyle = {};

  if (variant === 'primary') {
    variantStyle = {
      background: 'var(--btn-orange)',
      color: '#fff',
      boxShadow: glow && !props.disabled ? '0 0 15px rgba(234, 88, 12, 0.5)' : 'none',
    };
  } else if (variant === 'danger') {
    variantStyle = {
      background: 'linear-gradient(135deg, var(--neon-red), #991b1b)',
      color: '#fff',
      boxShadow: glow && !props.disabled ? '0 0 15px rgba(239, 68, 68, 0.5)' : 'none',
    };
  } else if (variant === 'ghost') {
    variantStyle = {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid rgba(255,255,255,0.1)',
    };
  }

  return (
    <button
      className={`neon-btn ${className}`}
      style={{ ...baseStyle, ...variantStyle, ...style }}
      {...props}
    >
      {children}
    </button>
  );
};

export default NeonButton;
