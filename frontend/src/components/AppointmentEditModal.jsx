import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getToken } from '../utils/auth';

const AppointmentEditModal = ({ show, handleClose, appointmentData, onAppointmentUpdated }) => {
    const [formData, setFormData] = useState({
        dateRdv: '',
        heureRdv: '',
        adresse: '',
        nom: '',
        prenom: '',
        telephone: '',
        codePostal: '',
        status: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (appointmentData) {
            // Format the date for input type="date"
            const date = new Date(appointmentData.dateRdv);
            const formattedDate = date.toISOString().split('T')[0];

            setFormData({
                dateRdv: formattedDate,
                heureRdv: appointmentData.heureRdv,
                adresse: appointmentData.adresse,
                nom: appointmentData.nom,
                prenom: appointmentData.prenom,
                telephone: appointmentData.telephone,
                codePostal: appointmentData.codePostal,
                status: appointmentData.status || ''
            });
        }
    }, [appointmentData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const token = getToken();
            await axios.put(`http://localhost:5001/api/appointments/${appointmentData.id}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            onAppointmentUpdated();
            handleClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors de la modification du RDV');
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>✏️ Modifier le RDV</h2>
                    <button className="modal-close" onClick={handleClose}>&times;</button>
                </div>

                {error && (
                    <div style={{
                        padding: '12px',
                        marginBottom: '20px',
                        backgroundColor: '#fed7d7',
                        color: '#c53030',
                        borderRadius: '6px',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label>Date du RDV *</label>
                            <input
                                type="date"
                                name="dateRdv"
                                value={formData.dateRdv}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Heure du RDV *</label>
                            <input
                                type="time"
                                name="heureRdv"
                                value={formData.heureRdv}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Nom *</label>
                            <input
                                type="text"
                                name="nom"
                                value={formData.nom}
                                onChange={handleChange}
                                placeholder="Nom du client"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Prénom *</label>
                            <input
                                type="text"
                                name="prenom"
                                value={formData.prenom}
                                onChange={handleChange}
                                placeholder="Prénom du client"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Téléphone *</label>
                            <input
                                type="tel"
                                name="telephone"
                                value={formData.telephone}
                                onChange={handleChange}
                                placeholder="06 12 34 56 78"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Code Postal *</label>
                            <input
                                type="text"
                                name="codePostal"
                                value={formData.codePostal}
                                onChange={handleChange}
                                placeholder="75001"
                                required
                            />
                        </div>

                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Adresse *</label>
                            <input
                                type="text"
                                name="adresse"
                                value={formData.adresse}
                                onChange={handleChange}
                                placeholder="Adresse complète"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Status du RDV</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="">-- Sélectionner --</option>
                                <option value="PAS_SIGNE">Pas signé</option>
                                <option value="SIGNE">Signé</option>
                                <option value="ANNULE">Annulé</option>
                            </select>
                        </div>
                    </div>

                    <div className="modal-actions" style={{ marginTop: '24px' }}>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="btn btn-secondary"
                            disabled={loading}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="btn btn-success"
                            disabled={loading}
                        >
                            {loading ? 'Modification...' : '✓ Modifier le RDV'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AppointmentEditModal;
