import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getToken } from '../utils/auth';
import { API_BASE_URL } from '../config';

const LeadEditModal = ({ show, handleClose, leadData }) => {
    const [formData, setFormData] = useState({
        status: '',
        commentaire: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (leadData) {
            setFormData({
                status: leadData.status || 'NRP',
                commentaire: leadData.commentaire || ''
            });
        }
    }, [leadData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = getToken();
            await axios.put(
                `${API_BASE_URL}/api/leads/${leadData.id}`,
                formData,
                { headers: { Authorization: `Bearer ${token}` }}
            );
            handleClose();
        } catch (err) {
            setError('Erreur lors de la mise à jour du lead');
            console.error('Error updating lead:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    if (!show) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                animation: 'fadeIn 0.2s ease'
            }}
            onClick={handleBackdropClick}
        >
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    maxWidth: '500px',
                    width: '90%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                    animation: 'slideUp 0.3s ease'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '22px', color: '#333', margin: 0 }}>
                        ✏️ Modifier le Lead
                    </h2>
                    <button
                        onClick={handleClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '28px',
                            cursor: 'pointer',
                            color: '#999',
                            padding: '0',
                            lineHeight: '1'
                        }}
                    >
                        ×
                    </button>
                </div>

                {leadData && (
                    <div style={{
                        background: '#f8f9fa',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        fontSize: '14px'
                    }}>
                        <p style={{ margin: '4px 0' }}>
                            <strong>Contact:</strong> {leadData.prenom} {leadData.nom}
                        </p>
                        <p style={{ margin: '4px 0' }}>
                            <strong>Téléphone:</strong> {leadData.telephone}
                        </p>
                        <p style={{ margin: '4px 0' }}>
                            <strong>Email:</strong> {leadData.email}
                        </p>
                    </div>
                )}

                {error && (
                    <div className="error-message" style={{ marginBottom: '16px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        >
                            <option value="NRP">Ne Répond Pas</option>
                            <option value="A_RAPPELER">À Rappeler</option>
                            <option value="RDV_PRIS">RDV Pris</option>
                            <option value="ANNULE">Annulé</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Commentaire</label>
                        <textarea
                            name="commentaire"
                            value={formData.commentaire}
                            onChange={handleChange}
                            rows="5"
                            placeholder="Ajoutez un commentaire sur ce lead..."
                            disabled={loading}
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ flex: 1 }}
                        >
                            {loading ? '⏳ Enregistrement...' : '💾 Enregistrer'}
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="btn btn-secondary"
                            disabled={loading}
                            style={{ flex: 1 }}
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LeadEditModal;