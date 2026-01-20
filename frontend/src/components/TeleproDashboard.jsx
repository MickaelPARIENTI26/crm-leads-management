import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getToken, removeToken, getUserRole } from '../utils/auth';
import LeadEditModal from './LeadEditModal';
import AppointmentModal from './AppointmentModal';
import AppointmentEditModal from './AppointmentEditModal';

const TeleproDashboard = () => {
    const [activeTab, setActiveTab] = useState('leads'); // leads, rdv, calendar
    const [rdvTab, setRdvTab] = useState('my'); // my, calendar
    const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
    const [leads, setLeads] = useState([]);
    const [filteredLeads, setFilteredLeads] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [allAppointments, setAllAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLead, setSelectedLead] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [showAppointmentEditModal, setShowAppointmentEditModal] = useState(false);
    const [appointmentLead, setAppointmentLead] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [initialAppointmentDate, setInitialAppointmentDate] = useState(null);
    const [initialAppointmentTime, setInitialAppointmentTime] = useState(null);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [commentValues, setCommentValues] = useState({});
    const [stats, setStats] = useState({
        total: 0,
        nrp: 0,
        aRappele: 0,
        rdv: 0,
        annule: 0
    });
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

    useEffect(() => {
        const token = getToken();
        const role = getUserRole();

        if (!token || role !== 'TELEPRO') {
            history.push('/');
            return;
        }

        fetchMyLeads();
        fetchMyAppointments();
        fetchAllAppointments();
    }, [history]);

    useEffect(() => {
        let filtered = leads;

        // Filter by status
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(lead => lead.status === statusFilter);
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
    }, [statusFilter, searchQuery, leads]);

    const fetchMyLeads = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await axios.get(`${API_BASE_URL}/api/leads/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLeads(response.data);
            calculateStats(response.data);
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyAppointments = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${API_BASE_URL}/api/appointments/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAppointments(response.data);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
    };

    const fetchAllAppointments = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${API_BASE_URL}/api/appointments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAllAppointments(response.data);
        } catch (error) {
            console.error('Error fetching all appointments:', error);
        }
    };

    const calculateStats = (leadsData) => {
        setStats({
            total: leadsData.length,
            nrp: leadsData.filter(l => l.status === 'NRP').length,
            aRappele: leadsData.filter(l => l.status === 'A_RAPPELE').length,
            rdv: leadsData.filter(l => l.status === 'RDV').length,
            annule: leadsData.filter(l => l.status === 'ANNULE').length
        });
    };

    const handleEditLead = (lead) => {
        setSelectedLead(lead);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedLead(null);
        fetchMyLeads();
    };

    const handleCommentChange = (leadId, value) => {
        setCommentValues(prev => ({
            ...prev,
            [leadId]: value
        }));
    };

    const handleCommentBlur = async (leadId) => {
        const newComment = commentValues[leadId];
        if (newComment === undefined) return;

        try {
            const token = getToken();
            await axios.put(`${API_BASE_URL}/api/leads/${leadId}`,
                { commentaire: newComment },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            // Update local leads state
            setLeads(prev => prev.map(lead =>
                lead.id === leadId ? { ...lead, commentaire: newComment } : lead
            ));
            setEditingCommentId(null);
        } catch (error) {
            console.error('Error updating comment:', error);
        }
    };

    const handleStatusChange = async (lead, newStatus) => {
        if (newStatus === 'RDV') {
            // Open appointment modal
            setAppointmentLead(lead);
            setShowAppointmentModal(true);
        } else {
            // Update status directly
            try {
                const token = getToken();
                const statusValue = newStatus === '' ? null : newStatus;
                await axios.put(`${API_BASE_URL}/api/leads/${lead.id}`,
                    { status: statusValue },
                    { headers: { Authorization: `Bearer ${token}` }}
                );
                // Update local leads state
                setLeads(prev => prev.map(l =>
                    l.id === lead.id ? { ...l, status: statusValue } : l
                ));
                calculateStats(leads.map(l =>
                    l.id === lead.id ? { ...l, status: statusValue } : l
                ));
            } catch (error) {
                console.error('Error updating status:', error);
            }
        }
    };

    const handleAppointmentCreated = (appointment) => {
        // Update lead status to RDV
        if (appointmentLead) {
            setLeads(prev => prev.map(l =>
                l.id === appointmentLead.id ? { ...l, status: 'RDV' } : l
            ));
            calculateStats(leads.map(l =>
                l.id === appointmentLead.id ? { ...l, status: 'RDV' } : l
            ));
        }
        setShowAppointmentModal(false);
        setAppointmentLead(null);
        fetchMyAppointments(); // Refresh appointments list
        fetchAllAppointments(); // Refresh all appointments list
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

    const handleDeleteAppointment = async (appointmentId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce RDV ?')) {
            return;
        }

        try {
            const token = getToken();
            await axios.delete(`${API_BASE_URL}/api/appointments/${appointmentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchMyAppointments();
            fetchAllAppointments();
            fetchMyLeads(); // Refresh leads to update status
        } catch (error) {
            console.error('Error deleting appointment:', error);
        }
    };

    const handleAppointmentStatusChange = async (appointmentId, newStatus) => {
        try {
            const token = getToken();
            await axios.put(`${API_BASE_URL}/api/appointments/${appointmentId}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            fetchMyAppointments();
            fetchAllAppointments();
        } catch (error) {
            console.error('Error updating appointment status:', error);
        }
    };

    const handleEditAppointment = (appointment) => {
        setSelectedAppointment(appointment);
        setShowAppointmentEditModal(true);
    };

    const handleAppointmentUpdated = () => {
        setShowAppointmentEditModal(false);
        setSelectedAppointment(null);
        fetchMyAppointments();
        fetchAllAppointments();
    };

    const handleLogout = () => {
        removeToken();
        history.push('/');
    };

    const getStatusLabel = (status) => {
        const labels = {
            'NRP': 'NRP',
            'A_RAPPELE': 'A rappelé',
            'RDV': 'RDV',
            'ANNULE': 'Annulé',
            'PAS_FAIT_DE_DEMANDE': 'Pas fait de demande'
        };
        return labels[status] || status;
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
                <h1>📞 Télépro Dashboard</h1>
                <div className="navbar-actions">
                    <span className="user-info">Télépro</span>
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
                        📋 Mes Leads
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
                        📅 Mes RDV
                    </button>
                </div>
            </div>

            <div className="content">
                {/* Onglet Mes Leads */}
                {activeTab === 'leads' && (
                    <>
                        {/* Stats Cards */}
                        <div className="stats-grid">
                    <div className="stat-card" style={{ borderLeftColor: '#667eea' }}>
                        <h3>Total Leads</h3>
                        <div className="stat-value">{stats.total}</div>
                    </div>
                    <div className="stat-card" style={{ borderLeftColor: '#d63031' }}>
                        <h3>NRP</h3>
                        <div className="stat-value">{stats.nrp}</div>
                    </div>
                    <div className="stat-card" style={{ borderLeftColor: '#0984e3' }}>
                        <h3>A rappelé</h3>
                        <div className="stat-value">{stats.aRappele}</div>
                    </div>
                    <div className="stat-card" style={{ borderLeftColor: '#00b894' }}>
                        <h3>RDV</h3>
                        <div className="stat-value">{stats.rdv}</div>
                    </div>
                </div>

                {/* Leads List */}
                <div className="card">
                    <div className="card-header">
                        <h2>Mes Leads ({filteredLeads.length})</h2>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            {/* Search Input */}
                            <input
                                type="text"
                                placeholder="🔍 Rechercher par nom ou prénom..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    fontSize: '14px',
                                    border: '2px solid #e0e0e0',
                                    borderRadius: '6px',
                                    minWidth: '250px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                            />
                            {/* Status Filters */}
                            <button
                                onClick={() => setStatusFilter('ALL')}
                                className={`btn ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ padding: '6px 12px', fontSize: '13px' }}
                            >
                                Tous
                            </button>
                            <button
                                onClick={() => setStatusFilter('NRP')}
                                className={`btn ${statusFilter === 'NRP' ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ padding: '6px 12px', fontSize: '13px' }}
                            >
                                NRP
                            </button>
                            <button
                                onClick={() => setStatusFilter('A_RAPPELE')}
                                className={`btn ${statusFilter === 'A_RAPPELE' ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ padding: '6px 12px', fontSize: '13px' }}
                            >
                                A rappelé
                            </button>
                            <button
                                onClick={() => setStatusFilter('RDV')}
                                className={`btn ${statusFilter === 'RDV' ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ padding: '6px 12px', fontSize: '13px' }}
                            >
                                RDV
                            </button>
                            <button
                                onClick={() => setStatusFilter('ANNULE')}
                                className={`btn ${statusFilter === 'ANNULE' ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ padding: '6px 12px', fontSize: '13px' }}
                            >
                                Annulé
                            </button>
                            <button
                                onClick={() => setStatusFilter('PAS_FAIT_DE_DEMANDE')}
                                className={`btn ${statusFilter === 'PAS_FAIT_DE_DEMANDE' ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ padding: '6px 12px', fontSize: '13px' }}
                            >
                                Pas fait de demande
                            </button>
                        </div>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Chauffage</th>
                                    <th>Nom Complet</th>
                                    <th>Email</th>
                                    <th>Téléphone</th>
                                    <th>Code Postal</th>
                                    <th>Status</th>
                                    <th>Commentaire</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                            {statusFilter === 'ALL'
                                                ? 'Aucun lead assigné pour le moment.'
                                                : `Aucun lead avec le statut "${getStatusLabel(statusFilter)}".`
                                            }
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLeads.map(lead => (
                                        <tr key={lead.id}>
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
                                            <td style={{ fontWeight: 600 }}>{lead.prenom} {lead.nom}</td>
                                            <td>{lead.email}</td>
                                            <td>
                                                <a
                                                    href={`tel:${lead.telephone}`}
                                                    style={{ color: '#667eea', textDecoration: 'none', fontWeight: 500 }}
                                                >
                                                    {lead.telephone}
                                                </a>
                                            </td>
                                            <td>{lead.codePostal}</td>
                                            <td>
                                                <select
                                                    value={lead.status || ''}
                                                    onChange={(e) => handleStatusChange(lead, e.target.value)}
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
                                            <td style={{ maxWidth: '250px' }}>
                                                <input
                                                    type="text"
                                                    value={commentValues[lead.id] !== undefined ? commentValues[lead.id] : (lead.commentaire || '')}
                                                    onChange={(e) => handleCommentChange(lead.id, e.target.value)}
                                                    onBlur={() => handleCommentBlur(lead.id)}
                                                    onFocus={() => setEditingCommentId(lead.id)}
                                                    placeholder="Ajouter un commentaire..."
                                                    style={{
                                                        width: '100%',
                                                        padding: '6px 8px',
                                                        border: editingCommentId === lead.id ? '2px solid #667eea' : '1px solid #ddd',
                                                        borderRadius: '4px',
                                                        fontSize: '13px',
                                                        transition: 'border 0.2s ease'
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => handleEditLead(lead)}
                                                    className="btn btn-primary"
                                                    style={{ padding: '6px 14px', fontSize: '13px' }}
                                                >
                                                    ✏️ Modifier
                                                </button>
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

                {/* Onglet Mes RDV */}
                {activeTab === 'rdv' && (
                    <>
                        {/* Sous-navigation RDV */}
                        <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setRdvTab('my')}
                                className={`btn ${rdvTab === 'my' ? 'btn-primary' : 'btn-secondary'}`}
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

                        {/* Mes RDV */}
                        {rdvTab === 'my' && (
                            <div className="card">
                                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2>Tous les Rendez-vous ({allAppointments.length})</h2>
                                    <button
                                        onClick={() => {
                                            setAppointmentLead(null);
                                            setInitialAppointmentDate('');
                                            setInitialAppointmentTime('');
                                            setShowAppointmentModal(true);
                                        }}
                                        className="btn btn-primary"
                                        style={{ fontSize: '14px', padding: '10px 20px' }}
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
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allAppointments.length === 0 ? (
                                                <tr>
                                                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                                        Aucun rendez-vous planifié pour le moment.
                                                    </td>
                                                </tr>
                                            ) : (
                                                allAppointments.map(appointment => (
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

                        {/* Calendrier */}
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
                                        const weekAppointments = allAppointments.filter(apt => {
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
            </div>

            {/* Edit Modal */}
            {showModal && selectedLead && (
                <LeadEditModal
                    show={showModal}
                    handleClose={handleCloseModal}
                    leadData={selectedLead}
                />
            )}

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

export default TeleproDashboard;