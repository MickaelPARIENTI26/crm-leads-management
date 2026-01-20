import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getToken } from '../utils/auth';

const AppointmentModal = ({ show, handleClose, leadData, onAppointmentCreated, initialDate, initialTime }) => {
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        telephone: '',
        codePostal: '',
        adresse: '',
        dateRdv: '',
        heureRdv: '',
        leadId: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (leadData) {
            setFormData({
                nom: leadData.nom || '',
                prenom: leadData.prenom || '',
                telephone: leadData.telephone || '',
                codePostal: leadData.codePostal || '',
                adresse: '',
                dateRdv: initialDate || '',
                heureRdv: initialTime || '',
                leadId: leadData.id || null
            });
        } else if (initialDate || initialTime) {
            setFormData(prev => ({
                ...prev,
                dateRdv: initialDate || prev.dateRdv,
                heureRdv: initialTime || prev.heureRdv
            }));
        }
    }, [leadData, initialDate, initialTime]);

    const searchLeads = async (searchTerm) => {
        if (searchTerm.length < 3) {
            setSearchResults([]);
            setShowSuggestions(false);
            return;
        }

        try {
            const token = getToken();
            console.log('🔍 Searching for:', searchTerm);
            const response = await axios.get(`${API_BASE_URL}/api/leads?search=${searchTerm}/api`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('📋 Results found:', response.data.length);
            setSearchResults(response.data.slice(0, 10)); // Limit to 10 results
            setShowSuggestions(true);
        } catch (error) {
            console.error('❌ Error searching leads:', error);
            setSearchResults([]);
            setShowSuggestions(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        // If typing in nom field, search for leads
        if (name === 'nom') {
            searchLeads(value);
        }
    };

    const selectLead = (lead) => {
        setFormData({
            ...formData,
            nom: lead.nom,
            prenom: lead.prenom,
            telephone: lead.telephone,
            codePostal: lead.codePostal,
            adresse: '',
            leadId: lead.id
        });
        setShowSuggestions(false);
        setSearchResults([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate required fields
        if (!formData.dateRdv || !formData.heureRdv || !formData.adresse) {
            setError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        setLoading(true);
        try {
            const token = getToken();
            const response = await axios.post(`${API_BASE_URL}`/api/appointments',
                formData,
                { headers: { Authorization: `Bearer ${token}` }}
            );

            if (onAppointmentCreated) {
                onAppointmentCreated(response.data);
            }
            handleClose();
        } catch (error) {
            setError('Erreur lors de la création du RDV: ' + (error.response?.data?.error || error.message));
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
            onClick={handleBackdropClick}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
            }}
        >
            <div
                style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '32px',
                    maxWidth: '600px',
                    width: '90%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                }}
            >
                <h2 style={{ marginBottom: '24px', color: '#333' }}>📅 Créer un Rendez-vous</h2>

                {error && (
                    <div className="error-message" style={{ marginBottom: '20px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group" style={{ position: 'relative' }}>
                            <label>Nom *</label>
                            <input
                                type="text"
                                name="nom"
                                value={formData.nom}
                                onChange={handleChange}
                                onFocus={() => formData.nom.length >= 3 && setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                required
                                placeholder="Tapez au moins 3 lettres..."
                                style={{ width: '100%' }}
                            />
                            {showSuggestions && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    backgroundColor: 'white',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                    zIndex: 1001
                                }}>
                                    {searchResults.length > 0 ? (
                                        searchResults.map(lead => (
                                            <div
                                                key={lead.id}
                                                onClick={() => selectLead(lead)}
                                                style={{
                                                    padding: '10px',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid #eee',
                                                    fontSize: '14px'
                                                }}
                                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                                            >
                                                <div style={{ fontWeight: 'bold' }}>{lead.nom} {lead.prenom}</div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>
                                                    {lead.telephone} - {lead.codePostal}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '10px', fontSize: '14px', color: '#999', textAlign: 'center' }}>
                                            Aucun lead trouvé
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Prénom *</label>
                            <input
                                type="text"
                                name="prenom"
                                value={formData.prenom}
                                onChange={handleChange}
                                required
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Téléphone *</label>
                            <input
                                type="tel"
                                name="telephone"
                                value={formData.telephone}
                                onChange={handleChange}
                                required
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Code Postal *</label>
                            <input
                                type="text"
                                name="codePostal"
                                value={formData.codePostal}
                                onChange={handleChange}
                                required
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '16px' }}>
                        <label>Adresse complète *</label>
                        <input
                            type="text"
                            name="adresse"
                            value={formData.adresse}
                            onChange={handleChange}
                            placeholder="Rue, ville..."
                            required
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                        <div className="form-group">
                            <label>Date du RDV *</label>
                            <input
                                type="date"
                                name="dateRdv"
                                value={formData.dateRdv}
                                onChange={handleChange}
                                required
                                style={{ width: '100%' }}
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
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button
                            type="submit"
                            className="btn btn-success"
                            disabled={loading}
                            style={{ flex: 1 }}
                        >
                            {loading ? 'Création...' : '✓ Créer le RDV'}
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="btn btn-secondary"
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

export default AppointmentModal;
