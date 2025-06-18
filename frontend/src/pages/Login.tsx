import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG, COOKIE_CONFIG } from '../config';
import Cookies from 'js-cookie';
import styles from '../styles/Login.module.scss';
import { useAuth } from '../contexts/AuthContext';

const UserIcon = () => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" style={{marginRight:12, color:'#b0b3b8'}}>
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7"/>
        <path d="M4 20c0-2.21 3.582-4 8-4s8 1.79 8 4" stroke="currentColor" strokeWidth="1.7"/>
    </svg>
);
const LockIcon = () => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" style={{marginRight:12, color:'#b0b3b8'}}>
        <rect x="5" y="11" width="14" height="8" rx="3" stroke="currentColor" strokeWidth="1.7"/>
        <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.7"/>
    </svg>
);
const EyeIcon = ({open}:{open:boolean}) => open ? (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" style={{cursor:'pointer', color:'#b0b3b8'}}>
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" stroke="currentColor" strokeWidth="1.7"/>
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/>
    </svg>
) : (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" style={{cursor:'pointer', color:'#b0b3b8'}}>
        <path d="M17.94 17.94C16.11 19.25 14.13 20 12 20c-7 0-11-8-11-8a21.8 21.8 0 0 1 5.06-6.06M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .47-.09.92-.26 1.33M21.06 21.06 2.94 2.94" stroke="currentColor" strokeWidth="1.7"/>
    </svg>
);

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { checkAuth } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Login attempt with:', { username, password });
        console.log('API URL:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`);

        try {
            const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
                username,
                password
            });
            console.log('Login response:', response.data);

            if (response.data.success) {
                // Store user data and token
                Cookies.set(COOKIE_CONFIG.TOKEN_KEY, response.data.user.token, {
                    expires: COOKIE_CONFIG.EXPIRES_IN
                });
                Cookies.set('user', JSON.stringify({
                    username: response.data.user.username,
                    isAdmin: response.data.user.is_admin
                }), {
                    expires: COOKIE_CONFIG.EXPIRES_IN
                });
                await checkAuth(); // Check auth status after login
                navigate('/');
            } else {
                setError(response.data.message || 'Kullanıcı adı veya şifre hatalı.');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || 'Giriş sırasında bir hata oluştu.');
        }
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginBox}>
                <img src="/cengelstudio-logo.png" alt="Logo" className={styles.logo} />
                <h1 className={styles.brand}>Mountary</h1>
                <p className={styles.subtitle}>Devam etmek için kullanıcı bilgilerini girin</p>
                <form onSubmit={handleLogin} className={styles.form} autoComplete="off">
                    <div className={styles.inputGroup}>
                        <div className={styles.inputWrapper}>
                            <UserIcon />
                            <input
                                type="text"
                                placeholder="Kullanıcı Adı"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={styles.input}
                                autoComplete="username"
                            />
                        </div>
                    </div>
                    <div className={styles.inputGroup}>
                        <div className={styles.inputWrapper}>
                            <LockIcon />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Şifre"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={styles.input}
                                autoComplete="current-password"
                            />
                            <span onClick={() => setShowPassword(v => !v)} className={styles.eyeIcon}><EyeIcon open={showPassword} /></span>
                        </div>
                    </div>
                    {error && <p className={styles.error}>{error}</p>}
                    <button type="submit" className={styles.button}>
                        Giriş Yap
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
