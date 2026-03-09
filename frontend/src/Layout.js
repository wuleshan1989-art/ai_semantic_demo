import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import AirsIcon from './AirsIcon';
import { ChevronsLeft, ChevronsRight, Database, Sliders, CloudLightning, ChevronDown, ChevronRight, Box, Clock, Activity, List, Layers } from './Icons';
import { useApp } from './AppContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const { user, theme, setTheme, language, setLanguage, t, repositories, currentRepoId, setCurrentRepoId, logout, llmConfig } = useApp();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRepoMenu, setShowRepoMenu] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Default collapsed
  
  const isActive = (path) => location.pathname === path;
  
  const currentRepo = repositories.find(r => r.id === currentRepoId) || {};

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      transition: 'background-color 0.3s'
    }}>
      {/* Sidebar Navigation */}
      <nav style={{
        width: isSidebarCollapsed ? '64px' : '280px',
        height: '100%',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        zIndex: 20,
        position: 'relative'
      }}>
        {/* Logo Area */}
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
          padding: isSidebarCollapsed ? '0' : '0 20px',
          borderBottom: '1px solid var(--border-color)',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          <Logo size={32} />
          {!isSidebarCollapsed && (
            <div style={{ 
              marginLeft: '12px',
              fontSize: '18px', 
              fontWeight: '700', 
              background: 'linear-gradient(to right, #8B5CF6, #3B82F6)', 
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px'
            }}>
              {t('app.name')}
            </div>
          )}
        </div>

        {/* Repository Switcher */}
        <div style={{ 
          padding: isSidebarCollapsed ? '16px 0' : '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          {/* Repo Selector */}
          <div 
            onClick={() => setShowRepoMenu(!showRepoMenu)}
            style={{
              width: isSidebarCollapsed ? '40px' : '100%',
              height: '48px',
              padding: isSidebarCollapsed ? '0' : '8px 12px',
              borderRadius: '8px',
              backgroundColor: showRepoMenu ? 'var(--hover-bg)' : 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
              position: 'relative',
              transition: 'all 0.2s'
            }}
            title={isSidebarCollapsed ? currentRepo.name : ''}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <div style={{ fontSize: '18px', lineHeight: 1 }}>
                {currentRepo.logo || <Box size={18} color="var(--primary-color)" />}
              </div>
              {!isSidebarCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>{t('layout.repo.warehouse')}</span>
                  <span style={{ fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentRepo.name || t('layout.repo.select')}
                  </span>
                </div>
              )}
            </div>
            {!isSidebarCollapsed && <ChevronDown size={14} color="var(--text-secondary)" />}

            {/* Repo Dropdown Menu */}
            {showRepoMenu && (
              <>
                <div 
                  style={{ position: 'fixed', inset: 0, zIndex: 30 }} 
                  onClick={(e) => { e.stopPropagation(); setShowRepoMenu(false); }} 
                />
                <div 
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: isSidebarCollapsed ? '0' : '100%',
                    left: isSidebarCollapsed ? '100%' : '0',
                    marginLeft: isSidebarCollapsed ? '8px' : '0',
                    marginTop: isSidebarCollapsed ? '0' : '4px',
                    width: '220px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px var(--shadow-color)',
                    zIndex: 40,
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ padding: '4px 8px', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    {t('layout.repo.switch')}
                  </div>
                  {repositories.map(repo => (
                    <button
                      key={repo.id}
                      onClick={() => {
                        if (repo.permission !== 'no-access') {
                          setCurrentRepoId(repo.id);
                          setShowRepoMenu(false);
                        }
                      }}
                      disabled={repo.permission === 'no-access'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px',
                        border: 'none',
                        background: currentRepoId === repo.id ? 'var(--bg-tertiary)' : 'transparent',
                        borderRadius: '6px',
                        cursor: repo.permission === 'no-access' ? 'not-allowed' : 'pointer',
                        textAlign: 'left',
                        color: 'var(--text-primary)',
                        opacity: repo.permission === 'no-access' ? 0.6 : 1
                      }}
                    >
                      <div style={{ fontSize: '16px', width: '24px', textAlign: 'center' }}>
                        {repo.logo || <Box size={16} />}
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {repo.name}
                        </div>
                        {repo.permission === 'no-access' && (
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{t('layout.repo.no_access')}</div>
                        )}
                      </div>
                      {currentRepoId === repo.id && (
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-color)' }} />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        
        <div style={{ height: '1px', backgroundColor: 'var(--border-color)', width: '100%' }} />

        {/* Nav Links */}
        <div style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SidebarLink 
            to="/" 
            active={isActive('/')} 
            icon={<AirsIcon size={24} />} 
            label={t('nav.chat')} 
            collapsed={isSidebarCollapsed} 
          />
          <SidebarLink 
            to="/file-manager" 
            active={isActive('/file-manager')} 
            icon={<Database size={20} />} 
            label={t('nav.files')} 
            collapsed={isSidebarCollapsed} 
          />
          <SidebarLink 
            to="/semantic-service" 
            active={isActive('/semantic-service')} 
            icon={<CloudLightning size={20} />} 
            label={t('nav.semantic_service')} 
            collapsed={isSidebarCollapsed} 
          />
          <SidebarLink 
            to="/scheduler" 
            active={isActive('/scheduler')} 
            icon={<Clock size={20} />} 
            label={t('nav.scheduler')} 
            collapsed={isSidebarCollapsed} 
          />
          <SidebarGroup
            icon={<Activity size={20} />}
            label={t('nav.evaluation') || 'Evaluation'}
            collapsed={isSidebarCollapsed}
            active={isActive('/evaluation/trace') || isActive('/evaluation/sets')}
            onExpand={() => setIsSidebarCollapsed(false)}
          >
            <SidebarLink 
              to="/evaluation/trace" 
              active={isActive('/evaluation/trace')} 
              icon={<List size={18} />} 
              label={t('eval.trace.title') || "Trace"} 
              collapsed={isSidebarCollapsed}
              nested={true}
            />
            <SidebarLink 
              to="/evaluation/sets" 
              active={isActive('/evaluation/sets')} 
              icon={<Layers size={18} />} 
              label={t('eval.sets.title') || "Eval Sets"} 
              collapsed={isSidebarCollapsed}
              nested={true}
            />
          </SidebarGroup>
          <SidebarLink 
            to="/management" 
            active={isActive('/management')} 
            icon={<Sliders size={20} />} 
            label={t('nav.management')} 
            collapsed={isSidebarCollapsed} 
          />
        </div>

        {/* Bottom Actions */}
        <div style={{ padding: '16px 8px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          {/* User Avatar */}
          {user && (
          <div 
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
              gap: '12px', 
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              width: '100%',
              transition: 'background-color 0.2s',
              backgroundColor: showUserMenu ? 'var(--hover-bg)' : 'transparent',
              position: 'relative'
            }}
          >
            <img 
              src={user.avatar} 
              alt="User" 
              style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--border-color)', flexShrink: 0 }} 
            />
            {!isSidebarCollapsed && (
              <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontSize: '14px', fontWeight: '500' }}>
                {user.name}
              </div>
            )}

            {/* User Menu Popup */}
            {showUserMenu && (
              <>
                <div 
                  style={{ position: 'fixed', inset: 0, zIndex: 30 }} 
                  onClick={(e) => { e.stopPropagation(); setShowUserMenu(false); }} 
                />
                <div 
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '8px',
                    marginBottom: '8px',
                    width: '240px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px var(--shadow-color)',
                    zIndex: 40,
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', marginBottom: '4px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{user.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>user@example.com</div>
                  </div>

                  <div style={{ padding: '0 8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>{t('settings.theme')}</div>
                    <div style={{ display: 'flex', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', padding: '2px' }}>
                      <button 
                        onClick={() => setTheme('light')}
                        style={{ 
                          flex: 1, 
                          border: 'none', 
                          padding: '6px', 
                          borderRadius: '4px',
                          backgroundColor: theme === 'light' ? 'var(--bg-secondary)' : 'transparent',
                          color: theme === 'light' ? 'var(--primary-color)' : 'var(--text-secondary)',
                          boxShadow: theme === 'light' ? '0 1px 2px var(--shadow-color)' : 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        ☀️ Light
                      </button>
                      <button 
                        onClick={() => setTheme('dark')}
                        style={{ 
                          flex: 1, 
                          border: 'none', 
                          padding: '6px', 
                          borderRadius: '4px',
                          backgroundColor: theme === 'dark' ? 'var(--bg-secondary)' : 'transparent',
                          color: theme === 'dark' ? 'var(--primary-color)' : 'var(--text-secondary)',
                          boxShadow: theme === 'dark' ? '0 1px 2px var(--shadow-color)' : 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        🌙 Dark
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: '0 8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>{t('settings.language')}</div>
                    <div style={{ display: 'flex', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', padding: '2px' }}>
                      <button 
                        onClick={() => setLanguage('zh')}
                        style={{ 
                          flex: 1, 
                          border: 'none', 
                          padding: '6px', 
                          borderRadius: '4px',
                          backgroundColor: language === 'zh' ? 'var(--bg-secondary)' : 'transparent',
                          color: language === 'zh' ? 'var(--primary-color)' : 'var(--text-secondary)',
                          boxShadow: language === 'zh' ? '0 1px 2px var(--shadow-color)' : 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        中文
                      </button>
                      <button 
                        onClick={() => setLanguage('en')}
                        style={{ 
                          flex: 1, 
                          border: 'none', 
                          padding: '6px', 
                          borderRadius: '4px',
                          backgroundColor: language === 'en' ? 'var(--bg-secondary)' : 'transparent',
                          color: language === 'en' ? 'var(--primary-color)' : 'var(--text-secondary)',
                          boxShadow: language === 'en' ? '0 1px 2px var(--shadow-color)' : 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        EN
                      </button>
                    </div>
                  </div>

                  <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />
                  
                  <button 
                    onClick={logout}
                    style={{ 
                    textAlign: 'left', 
                    padding: '8px 12px', 
                    border: 'none', 
                    backgroundColor: 'transparent', 
                    color: '#ef4444', 
                    cursor: 'pointer', 
                    borderRadius: '6px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {t('user.logout')}
                  </button>
                </div>
              </>
            )}
          </div>
          )}

          {/* Collapse Toggle */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            style={{
              width: '100%',
              padding: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-end',
              borderRadius: '8px',
              transition: 'background-color 0.2s'
            }}
          >
            {isSidebarCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
          </button>
        </div>
      </nav>

      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {React.Children.map(children, child => 
          React.isValidElement(child) ? React.cloneElement(child, { llmConfig }) : child
        )}
      </main>
    </div>
  );
};

const SidebarGroup = ({ icon, label, children, active, collapsed, onExpand }) => {
  const [isOpen, setIsOpen] = useState(active);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (active) setIsOpen(true);
  }, [active]);

  const handleClick = () => {
    if (collapsed && onExpand) {
      onExpand();
      setIsOpen(true);
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          padding: '10px 12px',
          borderRadius: '8px',
          cursor: 'pointer',
          color: active ? 'var(--primary-color)' : 'var(--text-secondary)',
          backgroundColor: isHovered ? 'var(--bg-tertiary)' : 'transparent',
          fontWeight: '500',
          transition: 'all 0.2s ease',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          position: 'relative',
          userSelect: 'none'
        }}
      >
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        {!collapsed && (
          <>
            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {label}
            </span>
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </>
        )}
        
        {/* Tooltip for collapsed mode */}
        {collapsed && isHovered && (
          <div style={{
            position: 'absolute',
            left: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginLeft: '8px',
            backgroundColor: 'var(--text-primary)',
            color: 'var(--bg-primary)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            zIndex: 50,
            boxShadow: '0 2px 4px var(--shadow-color)',
            pointerEvents: 'none'
          }}>
            {label}
          </div>
        )}
      </div>
      
      {/* Children */}
      {!collapsed && isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {children}
        </div>
      )}
    </>
  );
};

const SidebarLink = ({ to, icon, label, active, collapsed, nested }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link 
      to={to} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '10px 12px',
        paddingLeft: nested ? '44px' : '12px', // Indent if nested
        borderRadius: '8px',
        textDecoration: 'none',
        color: active ? 'var(--primary-color)' : 'var(--text-secondary)',
        backgroundColor: active ? 'var(--hover-bg)' : (isHovered ? 'var(--bg-tertiary)' : 'transparent'),
        fontWeight: active ? '600' : '500',
        transition: 'all 0.2s ease',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        position: 'relative'
      }}
    >
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      {!collapsed && (
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', opacity: 1, transition: 'opacity 0.2s' }}>
          {label}
        </span>
      )}
      
      {/* Tooltip for collapsed mode */}
      {collapsed && isHovered && (
        <div style={{
          position: 'absolute',
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: '8px',
          backgroundColor: 'var(--text-primary)',
          color: 'var(--bg-primary)',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          zIndex: 50,
          boxShadow: '0 2px 4px var(--shadow-color)',
          pointerEvents: 'none'
        }}>
          {label}
        </div>
      )}
    </Link>
  );
};

export default Layout;