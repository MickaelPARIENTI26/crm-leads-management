import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { getToken, removeToken } from '../utils/auth';
import { API_BASE_URL } from '../config';

const ImportLeads = () => {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const history = useHistory();

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
                setFile(selectedFile);
                setMessage({ type: '', text: '' });
            } else {
                setMessage({ type: 'error', text: 'Veuillez sélectionner un fichier Excel (.xlsx ou .xls)' });
            }
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
                setFile(droppedFile);
                setMessage({ type: '', text: '' });
            } else {
                setMessage({ type: 'error', text: 'Veuillez sélectionner un fichier Excel (.xlsx ou .xls)' });
            }
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!file) {
            setMessage({ type: 'error', text: 'Veuillez sélectionner un fichier Excel.' });
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        try {
            const token = getToken();
            const response = await axios.post(`${API_BASE_URL}/api/leads/import`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                },
            });
            setMessage({
                type: 'success',
                text: `✅ Import terminé ! ${response.data.inserted} leads ajoutés, ${response.data.skipped} doublons ignorés (sur ${response.data.total} au total)`
            });
            setFile(null);

            // Redirect to admin dashboard after 2 seconds
            setTimeout(() => {
                history.push('/admin');
            }, 2000);
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Erreur lors de l\'importation : ' + (error.response?.data?.error || error.message)
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        removeToken();
        history.push('/');
    };

    return (
        <div className="dashboard-container">
            <nav className="navbar">
                <h1>📥 Importer des Leads</h1>
                <div className="navbar-actions">
                    <button onClick={() => history.push('/admin')} className="btn btn-secondary">
                        ← Retour
                    </button>
                    <button onClick={handleLogout} className="btn-logout">
                        Déconnexion
                    </button>
                </div>
            </nav>

            <div className="content">
                <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div className="card-header">
                        <h2>Importer des leads depuis Excel</h2>
                    </div>

                    {message.text && (
                        <div className={message.type === 'success' ? 'success-message' : 'error-message'}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div
                            className={`upload-section ${dragActive ? 'drag-active' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('fileInput').click()}
                        >
                            <div className="upload-icon">📄</div>
                            {file ? (
                                <div>
                                    <p style={{ color: '#667eea', fontWeight: 600, fontSize: '16px', marginBottom: '8px' }}>
                                        {file.name}
                                    </p>
                                    <p style={{ color: '#888', fontSize: '14px' }}>
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#555' }}>
                                        Glissez-déposez votre fichier Excel ici
                                    </p>
                                    <p style={{ color: '#888', fontSize: '14px' }}>
                                        ou cliquez pour sélectionner un fichier
                                    </p>
                                    <p style={{ color: '#999', fontSize: '12px', marginTop: '12px' }}>
                                        Formats acceptés : .xlsx, .xls
                                    </p>
                                </div>
                            )}
                            <input
                                id="fileInput"
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                        </div>

                        <div style={{ marginTop: '24px' }}>
                            <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#555' }}>
                                📋 Format attendu du fichier Excel
                            </h3>
                            <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', fontSize: '14px' }}>
                                <p style={{ marginBottom: '12px', fontWeight: 600 }}>📋 Colonnes requises dans votre fichier Excel :</p>
                                <ul style={{ marginLeft: '20px', color: '#666', lineHeight: '1.8' }}>
                                    <li><strong>DATE</strong> : Date du lead (obligatoire)</li>
                                    <li><strong>MAIL</strong> ou <strong>EMAIL</strong> : Adresse email (obligatoire)</li>
                                    <li><strong>PRENOM</strong> : Prénom du contact (obligatoire)</li>
                                    <li><strong>NOM</strong> : Nom du contact (obligatoire)</li>
                                    <li><strong>CP</strong> : Code postal (obligatoire)</li>
                                    <li><strong>TEL</strong> ou <strong>TEL.</strong> : Numéro de téléphone (obligatoire)</li>
                                    <li><strong>CHAUFFAGE</strong> : Type de chauffage (optionnel)</li>
                                </ul>

                                <div style={{ marginTop: '16px', padding: '12px', background: '#e3f2fd', borderRadius: '6px' }}>
                                    <p style={{ fontWeight: 600, color: '#1565c0', marginBottom: '8px' }}>💡 Informations importantes :</p>
                                    <ul style={{ marginLeft: '20px', color: '#1976d2', fontSize: '13px', lineHeight: '1.8' }}>
                                        <li>Le <strong>type de produit</strong> (PV, ITE, PAC) est détecté automatiquement selon le <strong>nom de l'onglet</strong> Excel</li>
                                        <li>Les colonnes peuvent être dans n'importe quel ordre</li>
                                        <li>Les doublons (même numéro de téléphone) sont automatiquement ignorés</li>
                                        <li>Les lignes incomplètes sont ignorées</li>
                                        <li>Tous les onglets du fichier Excel seront importés</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '24px', padding: '14px', fontSize: '16px' }}
                            disabled={!file || loading}
                        >
                            {loading ? '⏳ Importation en cours...' : '📥 Importer les leads'}
                        </button>

                        {file && (
                            <button
                                type="button"
                                onClick={() => {
                                    setFile(null);
                                    setMessage({ type: '', text: '' });
                                }}
                                className="btn btn-secondary"
                                style={{ width: '100%', marginTop: '12px', padding: '12px' }}
                            >
                                ❌ Annuler
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ImportLeads;