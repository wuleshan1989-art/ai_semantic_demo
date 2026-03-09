import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from './AppContext';
import Logo from './Logo';

const LoginPage = () => {
  const { login, loginWithPassword, language, setLanguage, t } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  useEffect(() => {
    // Check for auth callback
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('code');
    const source = searchParams.get('source'); // 'wechat' or undefined (default feishu)
    
    if (code) {
      // Handle callback
      const handleCallback = async () => {
        try {
            await login(code, source);
            navigate('/');
        } catch (err) {
            console.error('Login failed', err);
            alert('Login failed. Please try again.');
        }
      };
      handleCallback();
    }
  }, [location, login, navigate]);

  const handleFeishuLogin = () => {
    // Redirect to backend mock login endpoint
    window.location.href = 'http://localhost:3001/api/auth/feishu/login';
  };

  const handleWechatLogin = () => {
      window.location.href = 'http://localhost:3001/api/auth/wechat/login';
  };

  const handlePasswordLogin = async (e) => {
      e.preventDefault();
      setError('');
      try {
          await loginWithPassword(username, password);
          navigate('/');
      } catch (err) {
          setError(t('login.error'));
      }
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      position: 'relative'
    }}>
      {/* Language Switcher */}
      <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '8px' }}>
          <button 
             onClick={() => setLanguage('zh')}
             style={{ 
                 padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', 
                 backgroundColor: language === 'zh' ? 'var(--primary-color)' : 'transparent',
                 color: language === 'zh' ? 'white' : 'var(--text-secondary)',
                 cursor: 'pointer', fontSize: '12px'
             }}
          >
              中文
          </button>
          <button 
             onClick={() => setLanguage('en')}
             style={{ 
                 padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', 
                 backgroundColor: language === 'en' ? 'var(--primary-color)' : 'transparent',
                 color: language === 'en' ? 'white' : 'var(--text-secondary)',
                 cursor: 'pointer', fontSize: '12px'
             }}
          >
              English
          </button>
      </div>

      <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Logo size={64} />
        <h1 style={{ 
            marginTop: '20px', 
            fontSize: '24px', 
            background: 'linear-gradient(to right, #8B5CF6, #3B82F6)', 
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
        }}>
            {t('login.title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            {t('login.subtitle')}
        </p>
      </div>

      <div style={{
        padding: '40px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px var(--shadow-color)',
        width: '320px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px', color: 'var(--text-secondary)' }}>{t('login.username')}</label>
                <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none' }}
                    placeholder={t('login.enter_username')}
                />
            </div>
            <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px', color: 'var(--text-secondary)' }}>{t('login.password')}</label>
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none' }}
                    placeholder={t('login.enter_password')}
                />
            </div>
            {error && <div style={{ color: '#ef4444', fontSize: '12px' }}>{error}</div>}
            <button 
                type="submit"
                style={{ 
                    padding: '12px', borderRadius: '8px', border: 'none', 
                    backgroundColor: 'var(--primary-color)', color: 'white', 
                    fontWeight: '600', cursor: 'pointer', fontSize: '14px' 
                }}
            >
                {t('login.submit')}
            </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
            {t('login.or')}
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button
                onClick={handleFeishuLogin}
                title={t('login.feishu')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'; }}
            >
                {/* Feishu/Lark Icon - Flat Design */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
                    <path d="M22 2L11 13" stroke="#3370FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" fill="#3370FF" stroke="#3370FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>

            <button
                onClick={handleWechatLogin}
                title={t('login.wechat')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'; }}
            >
                {/* WeChat Icon - Flat Design */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="#07C160" />
                </svg>
            </button>
        </div>

        <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
            {t('login.footer')}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
