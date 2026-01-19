import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { login } from '../services/api';
import { setToken } from '../utils/auth';

const Login = () => {
    const [email, setEmail] = useState('DavidParienti.eco@gmail.com');
    const [password, setPassword] = useState('David2208!');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const history = useHistory();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await login(email, password);
            setToken(response.token);

            // Redirect based on user role
            if (response.user.role === 'ADMIN') {
                history.push('/admin');
            } else {
                history.push('/telepro');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Email ou mot de passe incorrect');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>CRM Leads</h2>
                <p className="login-subtitle">Connectez-vous à votre compte</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="votre@email.com"
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label>Mot de passe</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={loading}
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;