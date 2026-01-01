import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Search, GitBranch, Binary, Box, History } from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        marginBottom: '8px',
        borderRadius: '8px',
        color: isActive ? '#ea580c' : '#ffffff',
        background: isActive ? 'rgba(234, 88, 12, 0.1)' : 'transparent',
        border: isActive ? '1px solid rgba(234, 88, 12, 0.3)' : '1px solid transparent',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        fontWeight: isActive ? 600 : 500,
      })}
    >
      <Icon size={18} color="currentColor" />
      <span style={{ fontSize: '0.9rem' }}>{label}</span>
    </NavLink>
  );
};

const Layout: React.FC = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', overflowX: 'hidden', background: '#0f172a' }}>

      {/* Main Content (Left - Purple Gradient) */}
      <main style={{
        flex: 1,
        background: 'var(--bg-content)',
        overflowY: 'auto',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'inset -5px 0 20px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          flex: 1,
          padding: '40px',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}>
          <Outlet />
        </div>
      </main>

      {/* Sidebar (Right - Dark Background) */}
      <aside style={{
        width: 'var(--sidebar-width)',
        background: '#0f172a',
        borderLeft: '1px solid #1e293b',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '40px', textAlign: 'right' }}>
          <h1 style={{ margin: 0, fontSize: '1.6rem', letterSpacing: '-0.03em', color: '#ea580c' }}>
            SmartTest
          </h1>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
            Subcategory Edition
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

          <div style={{ marginBottom: '24px' }}>
            <p style={{
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#ea580c',
              marginBottom: '12px',
              borderBottom: '1px solid #334155',
              paddingBottom: '4px',
              textAlign: 'right',
              fontWeight: 700
            }}>
              Core Modules
            </p>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <SidebarItem to="/nash" icon={LayoutDashboard} label="Nash" />
              <SidebarItem to="/search" icon={Search} label="Search" />
              <SidebarItem to="/minmax" icon={GitBranch} label="MinMax" />
              <SidebarItem to="/csp" icon={Binary} label="CSP" />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <p style={{
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#ea580c',
              marginBottom: '12px',
              borderBottom: '1px solid #334155',
              paddingBottom: '4px',
              textAlign: 'right',
              fontWeight: 700
            }}>
              Tools
            </p>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <SidebarItem to="/generate-all" icon={Box} label="Test Generator" />
              <SidebarItem to="/history" icon={History} label="History" />
            </div>
          </div>

        </nav>

        {/* Footer */}
        <div style={{
          marginTop: 'auto',
          paddingTop: '20px',
          borderTop: '1px solid #334155',
          textAlign: 'right',
          fontSize: '0.75rem',
          color: '#cbd5e1'
        }}>
          <div>v4.4 Purple Fixed</div>
        </div>

      </aside>

    </div>
  );
};

export default Layout;
