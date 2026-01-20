import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getToken, removeToken, getUserRole } from '../utils/auth';
import AppointmentModal from './AppointmentModal';
import AppointmentEditModal from './AppointmentEditModal';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, telepros, leads
    const [rdvTab, setRdvTab] = useState('all'); // all, calendar
    const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
    const [stats, setStats] = useState({
        totalLeads: 0,
        assignedLeads: 0,
        unassignedLeads: 0,
        telepros: 0
    });
    const [leads, setLeads] = useState([]);
    const [filteredLeads, setFilteredLeads] = useState([]);
    const [telepros, setTelepros] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [selectedTelepro, setSelectedTelepro] = useState('');
    const [showCreateTelepro, setShowCreateTelepro] = useState(false);
    const [showEditTelepro, setShowEditTelepro] = useState(false);
    const [editingTelepro, setEditingTelepro] = useState(null);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [showAppointmentEditModal, setShowAppointmentEditModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [appointmentLead, setAppointmentLead] = useState(null);
    const [initialAppointmentDate, setInitialAppointmentDate] = useState(null);
    const [initialAppointmentTime, setInitialAppointmentTime] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const history = useHistory();

    // Get start of week (Monday)
    const getWeekStart = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };

    // Navigate weeks
    const goToPreviousWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentWeekStart(newDate);
    };

    const goToNextWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentWeekStart(newDate);
    };

    const goToToday = () => {
        setCurrentWeekStart(getWeekStart(new Date()));
    };

    const [newTelepro, setNewTelepro] = useState({
        nom: '',
        email: '',
        password: ''
    });

    useEffect(() => {
        const token = getToken();
        const role = getUserRole();

        if (!token || role !== 'ADMIN') {
            history.push('/');
            return;
        }

        fetchData();
    }, [history]);

    useEffect(() => {
        let filtered = leads;

        if (typeFilter !== 'ALL') {
            filtered = filtered.filter(lead => lead.type === typeFilter);
        }

        if (statusFilter !== 'ALL') {
            if (statusFilter === 'EMPTY') {
                filtered = filtered.filter(lead => !lead.status);
            } else {
                filtered = filtered.filter(lead => lead.status === statusFilter);
            }
        }

        // Filter by search query (nom or prenom)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(lead =>
                lead.nom?.toLowerCase().includes(query) ||
                lead.prenom?.toLowerCase().includes(query)
            );
        }

        setFilteredLeads(filtered);
    }, [leads, typeFilter, statusFilter, searchQuery]);

    const fetchData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchLeads(),
                fetchTelepros(),
                fetchAppointments()
            ]);
        } catch (error) {
            showMessage('error', 'Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const fetchLeads = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${API_BASE_URL}/api/leads`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLeads(response.data);
            setFilteredLeads(response.data);

            // Calculate stats
            const totalLeads = response.data.length;
            const assignedLeads = response.data.filter(l => l.assignedToId).length;
            setStats(prev => ({
                ...prev,
                totalLeads,
                assignedLeads,
                unassignedLeads: totalLeads - assignedLeads
            }));
        } catch (error) {
            console.error('Error fetching leads:', error);
        }
    };

    const fetchTelepros = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${API_BASE_URL}/api/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const teleprosList = response.data.filter(u => u.role === 'TELEPRO');
            setTelepros(teleprosList);
            setStats(prev => ({ ...prev, telepros: teleprosList.length }));
        } catch (error) {
            console.error('Error fetching telepros:', error);
        }
    };

    const fetchAppointments = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${API_BASE_URL}/api/appointments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAppointments(response.data);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
    };

    const handleSelectLead = (leadId) => {
        setSelectedLeads(prev => {
            if (prev.includes(leadId)) {
                return prev.filter(id => id !== leadId);
            } else {
                return [...prev, leadId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedLeads.length === filteredLeads.length && filteredLeads.length > 0) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(filteredLeads.map(lead => lead.id));
        }
    };

    const handleAssignLeads = async () => {
        if (selectedLeads.length === 0) {
            showMessage('error', 'Veuillez sélectionner au moins un lead');
            return;
        }
        if (!selectedTelepro) {
            showMessage('error', 'Veuillez sélectionner un télépro');
            return;
        }

        try {
            const token = getToken();
            await axios.post(`${API_BASE_URL}/api/leads/assign`,
                { leadIds: selectedLeads, assignedToId: selectedTelepro },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            showMessage('success', `${selectedLeads.length} lead(s) assigné(s) avec succès`);
            setSelectedLeads([]);
            setSelectedTelepro('');
            fetchLeads();
        } catch (error) {
            showMessage('error', 'Erreur lors de l\'assignation des leads');
        }
    };

    const handleUnassignLead = async (leadId) => {
        try {
            const token = getToken();
            await axios.post(`${API_BASE_URL}/api/leads/assign`,
                { leadIds: [leadId], assignedToId: null },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            showMessage('success', 'Lead désassigné avec succès');
            fetchLeads();
        } catch (error) {
            showMessage('error', 'Erreur lors de la désassignation du lead');
        }
    };

    const handleUnassignSelectedLeads = async () => {
        if (selectedLeads.length === 0) {
            showMessage('error', 'Veuillez sélectionner au moins un lead');
            return;
        }

        try {
            const token = getToken();
            await axios.post(`${API_BASE_URL}/api/leads/assign`,
                { leadIds: selectedLeads, assignedToId: null },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            showMessage('success', `${selectedLeads.length} lead(s) désassigné(s) avec succès`);
            setSelectedLeads([]);
            setSelectedTelepro('');
            fetchLeads();
        } catch (error) {
            showMessage('error', 'Erreur lors de la désassignation des leads');
        }
    };

    const handleCreateTelepro = async (e) => {
        e.preventDefault();
        try {
            const token = getToken();
            await axios.post(`${API_BASE_URL}/api/users`,
                { ...newTelepro, role: 'TELEPRO' },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            showMessage('success', 'Télépro créé avec succès');
            setShowCreateTelepro(false);
            setNewTelepro({ nom: '', email: '', password: '' });
            fetchTelepros();
        } catch (error) {
            showMessage('error', 'Erreur lors de la création du télépro');
        }
    };

    const handleEditTelepro = (telepro) => {
        setEditingTelepro({
            id: telepro.id,
            nom: telepro.nom || '',
            email: telepro.email,
            password: '' // Empty by default, only fill if changing password
        });
        setShowEditTelepro(true);
    };

    const handleUpdateTelepro = async (e) => {
        e.preventDefault();
        try {
            const token = getToken();
            const updateData = {
                nom: editingTelepro.nom,
                email: editingTelepro.email,
                role: 'TELEPRO'
            };

            // Only include password if it was changed
            if (editingTelepro.password && editingTelepro.password.trim() !== '') {
                updateData.password = editingTelepro.password;
            }

            await axios.put(`${API_BASE_URL}/api/users/${editingTelepro.id}`,
                updateData,
                { headers: { Authorization: `Bearer ${token}` }}
            );
            showMessage('success', 'Télépro modifié avec succès');
            setShowEditTelepro(false);
            setEditingTelepro(null);
            fetchTelepros();
        } catch (error) {
            showMessage('error', 'Erreur lors de la modification du télépro');
        }
    };

    const handleDeleteTelepro = async (teleproId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce télépro ? Tous ses leads seront désassignés.')) {
            return;
        }

        try {
            const token = getToken();
            await axios.delete(`${API_BASE_URL}/api/users/${teleproId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showMessage('success', 'Télépro supprimé avec succès');
            fetchTelepros();
            fetchLeads(); // Refresh leads as they may be unassigned now
        } catch (error) {
            showMessage('error', 'Erreur lors de la suppression du télépro');
        }
    };

    const handleDeleteAppointment = async (appointmentId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce RDV ?')) {
            return;
        }

        try {
            const token = getToken();
            await axios.delete(`${API_BASE_URL}/api/appointments/${appointmentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showMessage('success', 'RDV supprimé avec succès');
            fetchAppointments();
            fetchLeads(); // Refresh leads to update status
        } catch (error) {
            showMessage('error', 'Erreur lors de la suppression du RDV');
        }
    };

    const handleAppointmentCreated = () => {
        // Update lead status to RDV if appointment was created from a lead
        if (appointmentLead) {
            setLeads(prev => prev.map(l =>
                l.id === appointmentLead.id ? { ...l, status: 'RDV' } : l
            ));
        }
        setShowAppointmentModal(false);
        setAppointmentLead(null);
        fetchAppointments();
        fetchLeads();
        showMessage('success', 'RDV créé avec succès');
    };

    const handleCloseAppointmentModal = () => {
        setShowAppointmentModal(false);
        setAppointmentLead(null);
        setInitialAppointmentDate(null);
        setInitialAppointmentTime(null);
    };

    const handleCalendarSlotDoubleClick = (date, hour) => {
        // Format date as YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        // Format time as HH:MM
        const formattedTime = `${String(hour).padStart(2, '0')}:00`;

        setInitialAppointmentDate(formattedDate);
        setInitialAppointmentTime(formattedTime);
        setAppointmentLead(null);
        setShowAppointmentModal(true);
    };

    const handleStatusChange = async (leadId, newStatus) => {
        // If status is RDV, open appointment modal instead
        if (newStatus === 'RDV') {
            const lead = leads.find(l => l.id === leadId);
            if (lead) {
                setAppointmentLead(lead);
                setShowAppointmentModal(true);
            }
            return;
        }

        try {
            const token = getToken();
            const statusValue = newStatus === '' ? null : newStatus;
            await axios.put(`${API_BASE_URL}/api/leads/${leadId}`,
                { status: statusValue },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            // Update local leads state
            setLeads(prev => prev.map(l =>
                l.id === leadId ? { ...l, status: statusValue } : l
            ));
            showMessage('success', 'Status mis à jour');
        } catch (error) {
            showMessage('error', 'Erreur lors de la mise à jour du status');
        }
    };

    const handleAppointmentStatusChange = async (appointmentId, newStatus) => {
        try {
            const token = getToken();
            await axios.put(`${API_BASE_URL}/api/appointments/${appointmentId}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            // Update local appointments state
            setAppointments(prev => prev.map(a =>
                a.id === appointmentId ? { ...a, status: newStatus } : a
            ));
            showMessage('success', 'Status RDV mis à jour');
        } catch (error) {
            showMessage('error', 'Erreur lors de la mise à jour du status RDV');
        }
    };

    const handleEditAppointment = (appointment) => {
        setSelectedAppointment(appointment);
        setShowAppointmentEditModal(true);
    };

    const handleAppointmentUpdated = () => {
        setShowAppointmentEditModal(false);
        setSelectedAppointment(null);
        fetchAppointments();
        showMessage('success', 'RDV modifié avec succès');
    };

    const handleLogout = () => {
        removeToken();
        history.push('/');
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <nav className="navbar">
                <h1>🎯 CRM Admin</h1>
                <div className="navbar-actions">
                    <span className="user-info">Administrateur</span>
                    <button onClick={handleLogout} className="btn-logout">
                        Déconnexion
                    </button>
                </div>
            </nav>

            {/* Menu de navigation */}
            <div style={{
                background: 'white',
                borderBottom: '2px solid #e0e0e0',
                padding: '0 32px'
            }}>
                <div style={{
                    display: 'flex',
                    gap: '0',
                    maxWidth: '1400px',
                    margin: '0 auto'
                }}>
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        style={{
                            padding: '16px 24px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'dashboard' ? '3px solid #667eea' : '3px solid transparent',
                            color: activeTab === 'dashboard' ? '#667eea' : '#666',
                            fontWeight: activeTab === 'dashboard' ? 600 : 500,
                            cursor: 'pointer',
                            fontSize: '15px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        📊 Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('leads')}
                        style={{
                            padding: '16px 24px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'leads' ? '3px solid #667eea' : '3px solid transparent',
                            color: activeTab === 'leads' ? '#667eea' : '#666',
                            fontWeight: activeTab === 'leads' ? 600 : 500,
                            cursor: 'pointer',
                            fontSize: '15px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        📋 Liste des Leads
                    </button>
                    <button
                        onClick={() => setActiveTab('rdv')}
                        style={{
                            padding: '16px 24px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'rdv' ? '3px solid #667eea' : '3px solid transparent',
                            color: activeTab === 'rdv' ? '#667eea' : '#666',
                            fontWeight: activeTab === 'rdv' ? 600 : 500,
                            cursor: 'pointer',
                            fontSize: '15px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        📅 RDV
                    </button>
                    <button
                        onClick={() => setActiveTab('telepros')}
                        style={{
                            padding: '16px 24px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'telepros' ? '3px solid #667eea' : '3px solid transparent',
                            color: activeTab === 'telepros' ? '#667eea' : '#666',
                            fontWeight: activeTab === 'telepros' ? 600 : 500,
                            cursor: 'pointer',
                            fontSize: '15px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        👥 Liste des Télépros
                    </button>
                    <button
                        onClick={() => setActiveTab('statistics')}
                        style={{
                            padding: '16px 24px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'statistics' ? '3px solid #667eea' : '3px solid transparent',
                            color: activeTab === 'statistics' ? '#667eea' : '#666',
                            fontWeight: activeTab === 'statistics' ? 600 : 500,
                            cursor: 'pointer',
                            fontSize: '15px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        📈 Statistiques
                    </button>
                </div>
            </div>

            <div className="content">
                {message.text && (
                    <div className={message.type === 'success' ? 'success-message' : 'error-message'}>
                        {message.text}
                    </div>
                )}

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <>
                        {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Leads</h3>
                        <div className="stat-value">{stats.totalLeads}</div>
                    </div>
                    <div className="stat-card">
                        <h3>Leads Assignés</h3>
                        <div className="stat-value">{stats.assignedLeads}</div>
                    </div>
                    <div className="stat-card">
                        <h3>Leads Non Assignés</h3>
                        <div className="stat-value">{stats.unassignedLeads}</div>
                    </div>
                    <div className="stat-card">
                        <h3>Télépros</h3>
                        <div className="stat-value">{stats.telepros}</div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <div className="card-header">
                        <h2>Actions Rapides</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => history.push('/import-leads')}
                            className="btn btn-primary"
                        >
                            📥 Importer des Leads
                        </button>
                        <button
                            onClick={() => setShowCreateTelepro(!showCreateTelepro)}
                            className="btn btn-success"
                        >
                            👤 Créer un Télépro
                        </button>
                    </div>
                </div>

                {/* Create Telepro Form */}
                {showCreateTelepro && (
                    <div className="card">
                        <div className="card-header">
                            <h2>Créer un nouveau télépro</h2>
                        </div>
                        <form onSubmit={handleCreateTelepro}>
                            <div className="form-group">
                                <label>Nom *</label>
                                <input
                                    type="text"
                                    value={newTelepro.nom}
                                    onChange={(e) => setNewTelepro({...newTelepro, nom: e.target.value})}
                                    placeholder="Nom du télépro"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={newTelepro.email}
                                    onChange={(e) => setNewTelepro({...newTelepro, email: e.target.value})}
                                    placeholder="telepro@example.com"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Mot de passe</label>
                                <input
                                    type="password"
                                    value={newTelepro.password}
                                    onChange={(e) => setNewTelepro({...newTelepro, password: e.target.value})}
                                    placeholder="Minimum 8 caractères"
                                    required
                                    minLength="8"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="submit" className="btn btn-success">
                                    Créer
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateTelepro(false)}
                                    className="btn btn-secondary"
                                >
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Leads Assignment */}
                <div className="card">
                    <div className="card-header">
                        <h2>Gestion des Leads ({leads.length})</h2>
                        {selectedLeads.length > 0 && (
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'center',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                padding: '12px 20px',
                                borderRadius: '10px',
                                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                            }}>
                                <span style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>
                                    ✓ {selectedLeads.length} lead(s) sélectionné(s)
                                </span>
                                <select
                                    value={selectedTelepro}
                                    onChange={(e) => setSelectedTelepro(e.target.value)}
                                    style={{
                                        padding: '10px 16px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        backgroundColor: 'white',
                                        color: '#333',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        minWidth: '200px'
                                    }}
                                >
                                    <option value="">👤 Choisir un télépro</option>
                                    {telepros.map(telepro => (
                                        <option key={telepro.id} value={telepro.id}>
                                            {telepro.nom || telepro.email}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleAssignLeads}
                                    disabled={!selectedTelepro}
                                    style={{
                                        padding: '10px 24px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        backgroundColor: 'white',
                                        color: '#667eea',
                                        cursor: selectedTelepro ? 'pointer' : 'not-allowed',
                                        opacity: selectedTelepro ? 1 : 0.6,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedTelepro) {
                                            e.target.style.transform = 'translateY(-2px)';
                                            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                    }}
                                >
                                    ✓ Assigner
                                </button>
                                <button
                                    onClick={handleUnassignSelectedLeads}
                                    style={{
                                        padding: '10px 24px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        backgroundColor: '#e74c3c',
                                        color: 'white',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                    }}
                                >
                                    ✕ Désassigner
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Filtres */}
                    <div style={{ padding: '16px 24px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: '#555', fontSize: '14px' }}>Filtrer par:</span>

                            {/* Filtre par Type */}
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <label style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>Type:</label>
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        border: '2px solid #e0e0e0',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        backgroundColor: 'white'
                                    }}
                                >
                                    <option value="ALL">Tous</option>
                                    <option value="PV">PV</option>
                                    <option value="ITE">ITE</option>
                                    <option value="PAC">PAC</option>
                                </select>
                            </div>

                            {/* Filtre par Status */}
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <label style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>Status:</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        border: '2px solid #e0e0e0',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        backgroundColor: 'white'
                                    }}
                                >
                                    <option value="ALL">Tous</option>
                                    <option value="EMPTY">Vide</option>
                                    <option value="NRP">NRP</option>
                                    <option value="A_RAPPELE">A rappelé</option>
                                    <option value="RDV">RDV</option>
                                    <option value="ANNULE">Annulé</option>
                                    <option value="PAS_FAIT_DE_DEMANDE">Pas fait de demande</option>
                                </select>
                            </div>

                            <span style={{ fontSize: '13px', color: '#888', marginLeft: 'auto' }}>
                                {filteredLeads.length} résultat{filteredLeads.length > 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>
                                        <input
                                            type="checkbox"
                                            checked={selectedLeads.length === leads.length && leads.length > 0}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Chauffage</th>
                                    <th>Nom</th>
                                    <th>Prénom</th>
                                    <th>Email</th>
                                    <th>Téléphone</th>
                                    <th>Code Postal</th>
                                    <th>Status</th>
                                    <th>Assigné à</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                            {leads.length === 0 ? 'Aucun lead disponible. Importez des leads pour commencer.' : 'Aucun lead ne correspond aux filtres sélectionnés.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLeads.map(lead => (
                                        <tr key={lead.id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedLeads.includes(lead.id)}
                                                    onChange={() => handleSelectLead(lead.id)}
                                                />
                                            </td>
                                            <td>{new Date(lead.dateLead).toLocaleDateString('fr-FR')}</td>
                                            <td>
                                                <span style={{
                                                    background: lead.type === 'PV' ? '#f39c12' : lead.type === 'ITE' ? '#3498db' : '#e74c3c',
                                                    color: 'white',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    fontWeight: 600
                                                }}>
                                                    {lead.type}
                                                </span>
                                            </td>
                                            <td>{lead.systemeChauffage}</td>
                                            <td>{lead.nom}</td>
                                            <td>{lead.prenom}</td>
                                            <td>{lead.email}</td>
                                            <td>{lead.telephone}</td>
                                            <td>{lead.codePostal}</td>
                                            <td>
                                                <select
                                                    value={lead.status || ''}
                                                    onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                                    style={{
                                                        padding: '6px 10px',
                                                        borderRadius: '6px',
                                                        border: '2px solid #e0e0e0',
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        backgroundColor: !lead.status ? '#f7f7f7' :
                                                            lead.status === 'NRP' ? '#fed7d7' :
                                                            lead.status === 'A_RAPPELE' ? '#bee3f8' :
                                                            lead.status === 'RDV' ? '#c6f6d5' :
                                                            lead.status === 'PAS_FAIT_DE_DEMANDE' ? '#e9d5ff' : '#fef5e7',
                                                        color: !lead.status ? '#888' :
                                                            lead.status === 'NRP' ? '#c53030' :
                                                            lead.status === 'A_RAPPELE' ? '#2c5282' :
                                                            lead.status === 'RDV' ? '#22543d' :
                                                            lead.status === 'PAS_FAIT_DE_DEMANDE' ? '#6b21a8' : '#744210'
                                                    }}
                                                >
                                                    <option value="">-- Vide --</option>
                                                    <option value="NRP">NRP</option>
                                                    <option value="A_RAPPELE">A rappelé</option>
                                                    <option value="RDV">RDV</option>
                                                    <option value="ANNULE">Annulé</option>
                                                    <option value="PAS_FAIT_DE_DEMANDE">Pas fait de demande</option>
                                                </select>
                                            </td>
                                            <td>
                                                {lead.assignedTo ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontWeight: 500 }}>{lead.assignedTo.nom || lead.assignedTo.email}</span>
                                                        <button
                                                            onClick={() => handleUnassignLead(lead.id)}
                                                            style={{
                                                                padding: '4px 8px',
                                                                fontSize: '12px',
                                                                background: '#e74c3c',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontWeight: 600
                                                            }}
                                                            title="Désassigner ce lead"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#999', fontStyle: 'italic' }}>Non assigné</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                    </>
                )}

                {/* Liste des Leads Tab */}
                {activeTab === 'leads' && (
                    <div className="card">
                        <div className="card-header">
                            <h2>Gestion des Leads ({leads.length})</h2>
                            {selectedLeads.length > 0 && (
                                <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    alignItems: 'center',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    padding: '12px 20px',
                                    borderRadius: '10px',
                                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                                }}>
                                    <span style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>
                                        ✓ {selectedLeads.length} lead(s) sélectionné(s)
                                    </span>
                                    <select
                                        value={selectedTelepro}
                                        onChange={(e) => setSelectedTelepro(e.target.value)}
                                        style={{
                                            padding: '10px 16px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            fontSize: '14px',
                                            fontWeight: 500,
                                            backgroundColor: 'white',
                                            color: '#333',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                            minWidth: '200px'
                                        }}
                                    >
                                        <option value="">👤 Choisir un télépro</option>
                                        {telepros.map(telepro => (
                                            <option key={telepro.id} value={telepro.id}>
                                                {telepro.nom || telepro.email}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleAssignLeads}
                                        disabled={!selectedTelepro}
                                        style={{
                                            padding: '10px 24px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            backgroundColor: 'white',
                                            color: '#667eea',
                                            cursor: selectedTelepro ? 'pointer' : 'not-allowed',
                                            opacity: selectedTelepro ? 1 : 0.6,
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedTelepro) {
                                                e.target.style.transform = 'translateY(-2px)';
                                                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                        }}
                                    >
                                        ✓ Assigner
                                    </button>
                                    <button
                                        onClick={handleUnassignSelectedLeads}
                                        style={{
                                            padding: '10px 24px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            backgroundColor: '#e74c3c',
                                            color: 'white',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.transform = 'translateY(-2px)';
                                            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                        }}
                                    >
                                        ✕ Désassigner
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Filtres */}
                        <div style={{ padding: '16px 24px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, color: '#555', fontSize: '14px' }}>Filtrer par:</span>

                                {/* Filtre par Type */}
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <label style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>Type:</label>
                                    <select
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            border: '2px solid #e0e0e0',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            backgroundColor: 'white'
                                        }}
                                    >
                                        <option value="ALL">Tous</option>
                                        <option value="PV">PV</option>
                                        <option value="ITE">ITE</option>
                                        <option value="PAC">PAC</option>
                                    </select>
                                </div>

                                {/* Filtre par Status */}
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <label style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>Status:</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            border: '2px solid #e0e0e0',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            backgroundColor: 'white'
                                        }}
                                    >
                                        <option value="ALL">Tous</option>
                                        <option value="EMPTY">Vide</option>
                                        <option value="NRP">NRP</option>
                                        <option value="A_RAPPELE">A rappelé</option>
                                        <option value="RDV">RDV</option>
                                        <option value="ANNULE">Annulé</option>
                                        <option value="PAS_FAIT_DE_DEMANDE">Pas fait de demande</option>
                                    </select>
                                </div>

                                {/* Recherche par Nom/Prénom */}
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <label style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>Recherche:</label>
                                    <input
                                        type="text"
                                        placeholder="Nom ou prénom..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            border: '2px solid #e0e0e0',
                                            fontSize: '13px',
                                            backgroundColor: 'white',
                                            minWidth: '180px',
                                            outline: 'none'
                                        }}
                                    />
                                </div>

                                <span style={{ fontSize: '13px', color: '#888', marginLeft: 'auto' }}>
                                    {filteredLeads.length} résultat{filteredLeads.length > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>
                                            <input
                                                type="checkbox"
                                                checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Chauffage</th>
                                        <th>Nom</th>
                                        <th>Prénom</th>
                                        <th>Email</th>
                                        <th>Téléphone</th>
                                        <th>Code Postal</th>
                                        <th>Status</th>
                                        <th>Assigné à</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLeads.length === 0 ? (
                                        <tr>
                                            <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                                {leads.length === 0 ? 'Aucun lead disponible. Importez des leads pour commencer.' : 'Aucun lead ne correspond aux filtres sélectionnés.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredLeads.map(lead => (
                                            <tr key={lead.id}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedLeads.includes(lead.id)}
                                                        onChange={() => handleSelectLead(lead.id)}
                                                    />
                                                </td>
                                                <td>{new Date(lead.dateLead).toLocaleDateString('fr-FR')}</td>
                                                <td>
                                                    <span style={{
                                                        background: lead.type === 'PV' ? '#f39c12' : lead.type === 'ITE' ? '#3498db' : '#e74c3c',
                                                        color: 'white',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        fontWeight: 600
                                                    }}>
                                                        {lead.type}
                                                    </span>
                                                </td>
                                                <td>{lead.systemeChauffage}</td>
                                                <td>{lead.nom}</td>
                                                <td>{lead.prenom}</td>
                                                <td>{lead.email}</td>
                                                <td>{lead.telephone}</td>
                                                <td>{lead.codePostal}</td>
                                                <td>
                                                    <select
                                                        value={lead.status || ''}
                                                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                                        style={{
                                                            padding: '6px 10px',
                                                            borderRadius: '6px',
                                                            border: '2px solid #e0e0e0',
                                                            fontSize: '13px',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            backgroundColor: !lead.status ? '#f7f7f7' :
                                                                lead.status === 'NRP' ? '#fed7d7' :
                                                                lead.status === 'A_RAPPELE' ? '#bee3f8' :
                                                                lead.status === 'RDV' ? '#c6f6d5' :
                                                                lead.status === 'PAS_FAIT_DE_DEMANDE' ? '#e9d5ff' : '#fef5e7',
                                                            color: !lead.status ? '#888' :
                                                                lead.status === 'NRP' ? '#c53030' :
                                                                lead.status === 'A_RAPPELE' ? '#2c5282' :
                                                                lead.status === 'RDV' ? '#22543d' :
                                                                lead.status === 'PAS_FAIT_DE_DEMANDE' ? '#6b21a8' : '#744210'
                                                        }}
                                                    >
                                                        <option value="">-- Vide --</option>
                                                        <option value="NRP">NRP</option>
                                                        <option value="A_RAPPELE">A rappelé</option>
                                                        <option value="RDV">RDV</option>
                                                        <option value="ANNULE">Annulé</option>
                                                        <option value="PAS_FAIT_DE_DEMANDE">Pas fait de demande</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    {lead.assignedTo ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontWeight: 500 }}>{lead.assignedTo.nom || lead.assignedTo.email}</span>
                                                            <button
                                                                onClick={() => handleUnassignLead(lead.id)}
                                                                style={{
                                                                    padding: '4px 8px',
                                                                    fontSize: '12px',
                                                                    background: '#e74c3c',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontWeight: 600
                                                                }}
                                                                title="Désassigner ce lead"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: '#999', fontStyle: 'italic' }}>Non assigné</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Liste des Télépros Tab */}
                {activeTab === 'telepros' && (
                    <>
                        <div className="card">
                            <div className="card-header">
                                <h2>Liste des Télépros ({telepros.length})</h2>
                                <button
                                    onClick={() => setShowCreateTelepro(!showCreateTelepro)}
                                    className="btn btn-success"
                                >
                                    ➕ Créer un Télépro
                                </button>
                            </div>

                            {showCreateTelepro && (
                                <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Nouveau télépro</h3>
                                    <form onSubmit={handleCreateTelepro}>
                                        <div className="form-group">
                                            <label>Nom *</label>
                                            <input
                                                type="text"
                                                value={newTelepro.nom}
                                                onChange={(e) => setNewTelepro({...newTelepro, nom: e.target.value})}
                                                placeholder="Nom du télépro"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Email</label>
                                            <input
                                                type="email"
                                                value={newTelepro.email}
                                                onChange={(e) => setNewTelepro({...newTelepro, email: e.target.value})}
                                                placeholder="telepro@example.com"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Mot de passe</label>
                                            <input
                                                type="password"
                                                value={newTelepro.password}
                                                onChange={(e) => setNewTelepro({...newTelepro, password: e.target.value})}
                                                placeholder="Minimum 8 caractères"
                                                required
                                                minLength="8"
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button type="submit" className="btn btn-success">
                                                Créer
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowCreateTelepro(false)}
                                                className="btn btn-secondary"
                                            >
                                                Annuler
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {showEditTelepro && editingTelepro && (
                                <div style={{ padding: '20px', background: '#fff3cd', borderRadius: '8px', marginBottom: '20px', border: '2px solid #ffc107' }}>
                                    <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Modifier le télépro</h3>
                                    <form onSubmit={handleUpdateTelepro}>
                                        <div className="form-group">
                                            <label>Nom</label>
                                            <input
                                                type="text"
                                                value={editingTelepro.nom}
                                                onChange={(e) => setEditingTelepro({...editingTelepro, nom: e.target.value})}
                                                placeholder="Nom du télépro"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Email *</label>
                                            <input
                                                type="email"
                                                value={editingTelepro.email}
                                                onChange={(e) => setEditingTelepro({...editingTelepro, email: e.target.value})}
                                                placeholder="telepro@example.com"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Nouveau mot de passe (laisser vide pour ne pas changer)</label>
                                            <input
                                                type="password"
                                                value={editingTelepro.password}
                                                onChange={(e) => setEditingTelepro({...editingTelepro, password: e.target.value})}
                                                placeholder="Minimum 8 caractères"
                                                minLength="8"
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button type="submit" className="btn btn-primary">
                                                Mettre à jour
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowEditTelepro(false);
                                                    setEditingTelepro(null);
                                                }}
                                                className="btn btn-secondary"
                                            >
                                                Annuler
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Nom</th>
                                            <th>Email</th>
                                            <th>Date de création</th>
                                            <th>Nombre de leads assignés</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {telepros.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                                    Aucun télépro créé. Créez votre premier télépro pour commencer.
                                                </td>
                                            </tr>
                                        ) : (
                                            telepros.map(telepro => (
                                                <tr key={telepro.id}>
                                                    <td style={{ fontWeight: 600 }}>{telepro.nom || '-'}</td>
                                                    <td>{telepro.email}</td>
                                                    <td>{new Date(telepro.createdAt).toLocaleDateString('fr-FR')}</td>
                                                    <td>
                                                        <span style={{
                                                            background: '#667eea',
                                                            color: 'white',
                                                            padding: '4px 12px',
                                                            borderRadius: '12px',
                                                            fontSize: '13px',
                                                            fontWeight: 600
                                                        }}>
                                                            {leads.filter(l => l.assignedToId === telepro.id).length} leads
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button
                                                                onClick={() => handleEditTelepro(telepro)}
                                                                className="btn"
                                                                style={{
                                                                    padding: '6px 14px',
                                                                    fontSize: '13px',
                                                                    background: '#667eea',
                                                                    color: 'white'
                                                                }}
                                                            >
                                                                ✏️ Modifier
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteTelepro(telepro.id)}
                                                                className="btn"
                                                                style={{
                                                                    padding: '6px 14px',
                                                                    fontSize: '13px',
                                                                    background: '#e74c3c',
                                                                    color: 'white'
                                                                }}
                                                            >
                                                                🗑️ Supprimer
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* RDV Tab */}
                {activeTab === 'rdv' && (
                    <>
                        {/* Sub-navigation for RDV */}
                        <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setRdvTab('all')}
                                className={`btn ${rdvTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ padding: '10px 24px', fontSize: '14px', width: '180px' }}
                            >
                                Tous les RDV
                            </button>
                            <button
                                onClick={() => setRdvTab('calendar')}
                                className={`btn ${rdvTab === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ padding: '10px 24px', fontSize: '14px', width: '180px' }}
                            >
                                📅 Calendrier
                            </button>
                        </div>

                        {/* Tous les RDV view */}
                        {rdvTab === 'all' && (
                            <div className="card">
                                <div className="card-header">
                                    <h2>Tous les Rendez-vous ({appointments.length})</h2>
                                    <button
                                        onClick={() => setShowAppointmentModal(true)}
                                        className="btn btn-success"
                                    >
                                        ➕ Ajouter un RDV
                                    </button>
                                </div>

                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Heure</th>
                                                <th>Nom</th>
                                                <th>Prénom</th>
                                                <th>Téléphone</th>
                                                <th>Code Postal</th>
                                                <th>Adresse</th>
                                                <th>Télépro</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {appointments.length === 0 ? (
                                                <tr>
                                                    <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                                        Aucun rendez-vous planifié.
                                                    </td>
                                                </tr>
                                            ) : (
                                                appointments.map(appointment => (
                                                    <tr key={appointment.id}>
                                                        <td style={{ fontWeight: 600 }}>
                                                            {new Date(appointment.dateRdv).toLocaleDateString('fr-FR')}
                                                        </td>
                                                        <td>{appointment.heureRdv}</td>
                                                        <td>{appointment.nom}</td>
                                                        <td>{appointment.prenom}</td>
                                                        <td>
                                                            <a
                                                                href={`tel:${appointment.telephone}`}
                                                                style={{ color: '#667eea', textDecoration: 'none', fontWeight: 500 }}
                                                            >
                                                                {appointment.telephone}
                                                            </a>
                                                        </td>
                                                        <td>{appointment.codePostal}</td>
                                                        <td style={{ maxWidth: '250px' }}>{appointment.adresse}</td>
                                                        <td>{appointment.agent?.nom || appointment.agent?.email}</td>
                                                        <td>
                                                            <select
                                                                value={appointment.status || ''}
                                                                onChange={(e) => handleAppointmentStatusChange(appointment.id, e.target.value)}
                                                                style={{
                                                                    padding: '6px 10px',
                                                                    borderRadius: '6px',
                                                                    border: '2px solid #e0e0e0',
                                                                    fontSize: '13px',
                                                                    fontWeight: 600,
                                                                    cursor: 'pointer',
                                                                    backgroundColor: appointment.status === 'ANNULE' ? '#fed7d7' :
                                                                        appointment.status === 'PAS_SIGNE' ? '#fef5e7' :
                                                                        appointment.status === 'SIGNE' ? '#c6f6d5' : '#f7fafc',
                                                                    color: appointment.status === 'ANNULE' ? '#c53030' :
                                                                        appointment.status === 'PAS_SIGNE' ? '#744210' :
                                                                        appointment.status === 'SIGNE' ? '#22543d' : '#718096'
                                                                }}
                                                            >
                                                                <option value="">-- Sélectionner --</option>
                                                                <option value="PAS_SIGNE">Pas signé</option>
                                                                <option value="SIGNE">Signé</option>
                                                                <option value="ANNULE">Annulé</option>
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button
                                                                    onClick={() => handleEditAppointment(appointment)}
                                                                    className="btn"
                                                                    style={{
                                                                        padding: '6px 14px',
                                                                        fontSize: '13px',
                                                                        background: '#667eea',
                                                                        color: 'white'
                                                                    }}
                                                                >
                                                                    ✏️ Modifier
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteAppointment(appointment.id)}
                                                                    className="btn"
                                                                    style={{
                                                                        padding: '6px 14px',
                                                                        fontSize: '13px',
                                                                        background: '#e74c3c',
                                                                        color: 'white'
                                                                    }}
                                                                >
                                                                    🗑️ Supprimer
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Calendar view */}
                        {rdvTab === 'calendar' && (
                            <div className="card">
                                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2>📅 Calendrier - Vue Semaine</h2>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <button onClick={goToPreviousWeek} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                                            ← Semaine précédente
                                        </button>
                                        <button onClick={goToToday} className="btn btn-primary" style={{ padding: '8px 16px' }}>
                                            Aujourd'hui
                                        </button>
                                        <button onClick={goToNextWeek} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                                            Semaine suivante →
                                        </button>
                                    </div>
                                </div>

                                <div style={{ padding: '0', overflowX: 'auto' }}>
                                    {(() => {
                                        const weekStart = getWeekStart(currentWeekStart);
                                        const weekDays = Array.from({ length: 7 }, (_, i) => {
                                            const date = new Date(weekStart);
                                            date.setDate(date.getDate() + i);
                                            return date;
                                        });

                                        const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7h à 20h

                                        // Filter appointments for the current week (excluding cancelled)
                                        const weekAppointments = appointments.filter(apt => {
                                            const aptDate = new Date(apt.dateRdv);
                                            return aptDate >= weekDays[0] && aptDate <= weekDays[6] && apt.status !== 'ANNULE';
                                        });

                                        // Group appointments by day
                                        const appointmentsByDay = weekDays.map(day => {
                                            const dayStr = day.toDateString();
                                            return weekAppointments.filter(apt =>
                                                new Date(apt.dateRdv).toDateString() === dayStr
                                            );
                                        });

                                        const today = new Date().toDateString();

                                        return (
                                            <div style={{ display: 'flex', minWidth: '900px' }}>
                                                {/* Time column */}
                                                <div style={{ width: '80px', borderRight: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
                                                    <div style={{ height: '60px', borderBottom: '1px solid #e0e0e0' }}></div>
                                                    {hours.map(hour => (
                                                        <div key={hour} style={{
                                                            height: '60px',
                                                            borderBottom: '1px solid #e0e0e0',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '12px',
                                                            color: '#666',
                                                            fontWeight: 500
                                                        }}>
                                                            {hour}:00
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Days columns */}
                                                {weekDays.map((day, dayIndex) => {
                                                    const isToday = day.toDateString() === today;
                                                    const dayAppointments = appointmentsByDay[dayIndex];

                                                    return (
                                                        <div key={dayIndex} style={{
                                                            flex: 1,
                                                            borderRight: dayIndex < 6 ? '1px solid #e0e0e0' : 'none',
                                                            backgroundColor: isToday ? '#f0f4ff' : 'white'
                                                        }}>
                                                            {/* Day header */}
                                                            <div style={{
                                                                height: '60px',
                                                                borderBottom: '2px solid #e0e0e0',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                backgroundColor: isToday ? '#667eea' : '#fafafa',
                                                                color: isToday ? 'white' : '#333'
                                                            }}>
                                                                <div style={{ fontSize: '11px', fontWeight: 500 }}>
                                                                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][dayIndex]}
                                                                </div>
                                                                <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px' }}>
                                                                    {day.getDate()}
                                                                </div>
                                                            </div>

                                                            {/* Hour slots */}
                                                            <div style={{ position: 'relative' }}>
                                                                {hours.map(hour => (
                                                                    <div
                                                                        key={hour}
                                                                        style={{
                                                                            height: '60px',
                                                                            borderBottom: '1px solid #f0f0f0',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                        onDoubleClick={() => handleCalendarSlotDoubleClick(day, hour)}
                                                                        title="Double-cliquez pour créer un RDV"
                                                                    ></div>
                                                                ))}

                                                                {/* Appointments */}
                                                                {dayAppointments.map(appointment => {
                                                                    const [hourStr] = appointment.heureRdv.split(':');
                                                                    const aptHour = parseInt(hourStr);
                                                                    const topPosition = (aptHour - 7) * 60;

                                                                    return (
                                                                        <div
                                                                            key={appointment.id}
                                                                            style={{
                                                                                position: 'absolute',
                                                                                top: `${topPosition}px`,
                                                                                left: '4px',
                                                                                right: '4px',
                                                                                height: '56px',
                                                                                backgroundColor: appointment.status === 'ANNULE' ? '#fed7d7' :
                                                                                    appointment.status === 'PAS_SIGNE' ? '#fef5e7' :
                                                                                    appointment.status === 'SIGNE' ? '#c6f6d5' : '#f7fafc',
                                                                                border: '1px solid',
                                                                                borderColor: appointment.status === 'ANNULE' ? '#c53030' :
                                                                                    appointment.status === 'PAS_SIGNE' ? '#9a7b4f' :
                                                                                    appointment.status === 'SIGNE' ? '#38a169' : '#cbd5e0',
                                                                                borderRadius: '4px',
                                                                                padding: '4px 6px',
                                                                                cursor: 'pointer',
                                                                                overflow: 'hidden',
                                                                                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                                                                                transition: 'all 0.2s ease',
                                                                                fontSize: '11px'
                                                                            }}
                                                                            onDoubleClick={() => handleEditAppointment(appointment)}
                                                                            onMouseEnter={(e) => {
                                                                                e.currentTarget.style.transform = 'scale(1.02)';
                                                                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                                                                                e.currentTarget.style.zIndex = '10';
                                                                            }}
                                                                            onMouseLeave={(e) => {
                                                                                e.currentTarget.style.transform = 'scale(1)';
                                                                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
                                                                                e.currentTarget.style.zIndex = '1';
                                                                            }}
                                                                            title={`${appointment.heureRdv} - ${appointment.prenom} ${appointment.nom}\n${appointment.telephone}\n${appointment.adresse}\nTélépro: ${appointment.agent?.nom || appointment.agent?.email}`}
                                                                        >
                                                                            <div style={{ fontWeight: 700, marginBottom: '2px', color: '#333' }}>
                                                                                {appointment.heureRdv}
                                                                            </div>
                                                                            <div style={{ fontWeight: 600, marginBottom: '2px', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                                {appointment.prenom} {appointment.nom}
                                                                            </div>
                                                                            <div style={{ fontSize: '10px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                                📞 {appointment.telephone}
                                                                            </div>
                                                                            <div style={{ fontSize: '10px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                                                                                Telepro: {appointment.agent?.nom || appointment.agent?.email}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Statistics Tab */}
                {activeTab === 'statistics' && (
                    <>
                        <div className="card" style={{ marginBottom: '24px' }}>
                            <div className="card-header">
                                <h2>📊 Statistiques Globales</h2>
                            </div>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Métrique</th>
                                            <th>Nombre</th>
                                            <th>Pourcentage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ fontWeight: 600 }}>Total des Leads</td>
                                            <td>
                                                <span style={{
                                                    background: '#667eea',
                                                    color: 'white',
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '13px',
                                                    fontWeight: 600
                                                }}>
                                                    {leads.length}
                                                </span>
                                            </td>
                                            <td>100%</td>
                                        </tr>
                                        <tr>
                                            <td>RDV</td>
                                            <td>
                                                <span style={{
                                                    background: '#c6f6d5',
                                                    color: '#22543d',
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '13px',
                                                    fontWeight: 600
                                                }}>
                                                    {leads.filter(l => l.status === 'RDV').length}
                                                </span>
                                            </td>
                                            <td>{leads.length > 0 ? ((leads.filter(l => l.status === 'RDV').length / leads.length) * 100).toFixed(1) : 0}%</td>
                                        </tr>
                                        <tr>
                                            <td>Annulé</td>
                                            <td>
                                                <span style={{
                                                    background: '#fef5e7',
                                                    color: '#744210',
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '13px',
                                                    fontWeight: 600
                                                }}>
                                                    {leads.filter(l => l.status === 'ANNULE').length}
                                                </span>
                                            </td>
                                            <td>{leads.length > 0 ? ((leads.filter(l => l.status === 'ANNULE').length / leads.length) * 100).toFixed(1) : 0}%</td>
                                        </tr>
                                        <tr>
                                            <td>NRP</td>
                                            <td>
                                                <span style={{
                                                    background: '#fed7d7',
                                                    color: '#c53030',
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '13px',
                                                    fontWeight: 600
                                                }}>
                                                    {leads.filter(l => l.status === 'NRP').length}
                                                </span>
                                            </td>
                                            <td>{leads.length > 0 ? ((leads.filter(l => l.status === 'NRP').length / leads.length) * 100).toFixed(1) : 0}%</td>
                                        </tr>
                                        <tr>
                                            <td>A rappelé</td>
                                            <td>
                                                <span style={{
                                                    background: '#bee3f8',
                                                    color: '#2c5282',
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '13px',
                                                    fontWeight: 600
                                                }}>
                                                    {leads.filter(l => l.status === 'A_RAPPELE').length}
                                                </span>
                                            </td>
                                            <td>{leads.length > 0 ? ((leads.filter(l => l.status === 'A_RAPPELE').length / leads.length) * 100).toFixed(1) : 0}%</td>
                                        </tr>
                                        <tr>
                                            <td>Pas fait de demande</td>
                                            <td>
                                                <span style={{
                                                    background: '#e9d5ff',
                                                    color: '#6b21a8',
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '13px',
                                                    fontWeight: 600
                                                }}>
                                                    {leads.filter(l => l.status === 'PAS_FAIT_DE_DEMANDE').length}
                                                </span>
                                            </td>
                                            <td>{leads.length > 0 ? ((leads.filter(l => l.status === 'PAS_FAIT_DE_DEMANDE').length / leads.length) * 100).toFixed(1) : 0}%</td>
                                        </tr>
                                        <tr>
                                            <td>Sans statut</td>
                                            <td>
                                                <span style={{
                                                    background: '#f7f7f7',
                                                    color: '#888',
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '13px',
                                                    fontWeight: 600
                                                }}>
                                                    {leads.filter(l => !l.status).length}
                                                </span>
                                            </td>
                                            <td>{leads.length > 0 ? ((leads.filter(l => !l.status).length / leads.length) * 100).toFixed(1) : 0}%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Statistics by Product Type */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                            {/* PAC Statistics */}
                            <div className="card">
                                <div className="card-header">
                                    <h2>📊 Statistiques PAC</h2>
                                </div>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Métrique</th>
                                                <th>Nombre</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td style={{ fontWeight: 600 }}>Total PAC</td>
                                                <td>
                                                    <span style={{
                                                        background: '#667eea',
                                                        color: 'white',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        fontWeight: 600
                                                    }}>
                                                        {leads.filter(l => l.type === 'PAC').length}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>RDV</td>
                                                <td>
                                                    <span style={{
                                                        background: '#c6f6d5',
                                                        color: '#22543d',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        fontWeight: 600
                                                    }}>
                                                        {leads.filter(l => l.type === 'PAC' && l.status === 'RDV').length}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Annulé</td>
                                                <td>
                                                    <span style={{
                                                        background: '#fef5e7',
                                                        color: '#744210',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        fontWeight: 600
                                                    }}>
                                                        {leads.filter(l => l.type === 'PAC' && l.status === 'ANNULE').length}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>NRP</td>
                                                <td>
                                                    <span style={{
                                                        background: '#fed7d7',
                                                        color: '#c53030',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        fontWeight: 600
                                                    }}>
                                                        {leads.filter(l => l.type === 'PAC' && l.status === 'NRP').length}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>A rappelé</td>
                                                <td>
                                                    <span style={{
                                                        background: '#bee3f8',
                                                        color: '#2c5282',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        fontWeight: 600
                                                    }}>
                                                        {leads.filter(l => l.type === 'PAC' && l.status === 'A_RAPPELE').length}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Pas fait de demande</td>
                                                <td>
                                                    <span style={{
                                                        background: '#e9d5ff',
                                                        color: '#6b21a8',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        fontWeight: 600
                                                    }}>
                                                        {leads.filter(l => l.type === 'PAC' && l.status === 'PAS_FAIT_DE_DEMANDE').length}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Sans statut</td>
                                                <td>
                                                    <span style={{
                                                        background: '#f7f7f7',
                                                        color: '#888',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        fontWeight: 600
                                                    }}>
                                                        {leads.filter(l => l.type === 'PAC' && !l.status).length}
                                                    </span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* PV Statistics */}
                            <div className="card">
                                <div className="card-header">
                                    <h2>📊 Statistiques PV</h2>
                                </div>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Métrique</th>
                                                <th>Nombre</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td style={{ fontWeight: 600 }}>Total PV</td>
                                                <td>
                                                    <span style={{
                                                        background: '#667eea',
                                                        color: 'white',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        fontWeight: 600
                                                    }}>
                                                        {leads.filter(l => l.type === 'PV').length}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>RDV</td>
                                                <td>
                                                    <span style={{
                                                        background: '#c6f6d5',
                                                        color: '#22543d',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        fontWeight: 600
                                                    }}>
                                                        {leads.filter(l => l.type === 'PV' && l.status === 'RDV').length}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Annulé</td>
                                                <td>
                                                    <span style={{
                                                        background: '#fef5e7',
                                                        color: '#744210',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        fontWeight: 600
                                                    }}>
                                                        {leads.filter(l => l.type === 'PV' && l.status === 'ANNULE').length}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>NRP</td>
                                                <td>
                                                    <span style={{
                                                        background: '#fed7d7',
                                                        color: '#c53030',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        fontWeight: 600
                                                    }}>
                                                        {leads.filter(l => l.type === 'PV' && l.status === 'NRP').length}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>A rappelé</td>
                                                <td>
                                                    <span style={{
                                                        background: '#bee3f8',
                                                        color: '#2c5282',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        fontWeight: 600
                                                    }}>
                                                        {leads.filter(l => l.type === 'PV' && l.status === 'A_RAPPELE').length}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Pas fait de demande</td>
                                                <td>
                                                    <span style={{
                                                        background: '#e9d5ff',
                                                        color: '#6b21a8',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        fontWeight: 600
                                                    }}>
                                                        {leads.filter(l => l.type === 'PV' && l.status === 'PAS_FAIT_DE_DEMANDE').length}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Sans statut</td>
                                                <td>
                                                    <span style={{
                                                        background: '#f7f7f7',
                                                        color: '#888',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        fontWeight: 600
                                                    }}>
                                                        {leads.filter(l => l.type === 'PV' && !l.status).length}
                                                    </span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* ITE Statistics */}
                            <div className="card">
                                <div className="card-header">
                                    <h2>📊 Statistiques ITE</h2>
                                </div>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Métrique</th>
                                                <th>Nombre</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td style={{ fontWeight: 600 }}>Total ITE</td>
                                                <td>
                                                    <span style={{
                                                        background: '#667eea',
                                                        color: 'white',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        fontWeight: 600
                                                    }}>
                                                        {leads.filter(l => l.type === 'ITE').length}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>RDV</td>
                                                <td>
                                                    <span style={{
                                                        background: '#c6f6d5',
                                                        color: '#22543d',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        fontWeight: 600
                                                    }}>
                                                        {leads.filter(l => l.type === 'ITE' && l.status === 'RDV').length}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Annulé</td>
                                                <td>
                                                    <span style={{
                                                        background: '#fef5e7',
                                                        color: '#744210',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        fontWeight: 600
                                                    }}>
                                                        {leads.filter(l => l.type === 'ITE' && l.status === 'ANNULE').length}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>NRP</td>
                                                <td>
                                                    <span style={{
                                                        background: '#fed7d7',
                                                        color: '#c53030',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        fontWeight: 600
                                                    }}>
                                                        {leads.filter(l => l.type === 'ITE' && l.status === 'NRP').length}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>A rappelé</td>
                                                <td>
                                                    <span style={{
                                                        background: '#bee3f8',
                                                        color: '#2c5282',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        fontWeight: 600
                                                    }}>
                                                        {leads.filter(l => l.type === 'ITE' && l.status === 'A_RAPPELE').length}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Pas fait de demande</td>
                                                <td>
                                                    <span style={{
                                                        background: '#e9d5ff',
                                                        color: '#6b21a8',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        fontWeight: 600
                                                    }}>
                                                        {leads.filter(l => l.type === 'ITE' && l.status === 'PAS_FAIT_DE_DEMANDE').length}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Sans statut</td>
                                                <td>
                                                    <span style={{
                                                        background: '#f7f7f7',
                                                        color: '#888',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '13px',
                                                        fontWeight: 600
                                                    }}>
                                                        {leads.filter(l => l.type === 'ITE' && !l.status).length}
                                                    </span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Appointment Modal */}
            {showAppointmentModal && (
                <AppointmentModal
                    show={showAppointmentModal}
                    handleClose={handleCloseAppointmentModal}
                    leadData={appointmentLead}
                    onAppointmentCreated={handleAppointmentCreated}
                    initialDate={initialAppointmentDate}
                    initialTime={initialAppointmentTime}
                />
            )}

            {/* Appointment Edit Modal */}
            {showAppointmentEditModal && selectedAppointment && (
                <AppointmentEditModal
                    show={showAppointmentEditModal}
                    handleClose={() => setShowAppointmentEditModal(false)}
                    appointmentData={selectedAppointment}
                    onAppointmentUpdated={handleAppointmentUpdated}
                />
            )}
        </div>
    );
};

export default AdminDashboard;
