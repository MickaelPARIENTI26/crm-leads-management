import React, { useEffect, useState } from 'react';
import axios from 'axios';

const LeadsList = () => {
    const [leads, setLeads] = useState([]);
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [telepros, setTelepros] = useState([]);
    const [assignedTo, setAssignedTo] = useState('');

    useEffect(() => {
        fetchLeads();
        fetchTelepros();
    }, []);

    const fetchLeads = async () => {
        try {
            const response = await axios.get('/leads');
            setLeads(response.data);
        } catch (error) {
            console.error('Error fetching leads:', error);
        }
    };

    const fetchTelepros = async () => {
        try {
            const response = await axios.get('/users?role=TELEPRO');
            setTelepros(response.data);
        } catch (error) {
            console.error('Error fetching telepros:', error);
        }
    };

    const handleSelectLead = (leadId) => {
        setSelectedLeads((prevSelected) => {
            if (prevSelected.includes(leadId)) {
                return prevSelected.filter((id) => id !== leadId);
            } else {
                return [...prevSelected, leadId];
            }
        });
    };

    const handleAssignLeads = async () => {
        try {
            await axios.post('/leads/assign', { leadIds: selectedLeads, assignedToId: assignedTo });
            fetchLeads();
            setSelectedLeads([]);
            setAssignedTo('');
        } catch (error) {
            console.error('Error assigning leads:', error);
        }
    };

    return (
        <div>
            <h2>Leads List</h2>
            <table className="table">
                <thead>
                    <tr>
                        <th>
                            <input
                                type="checkbox"
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedLeads(leads.map((lead) => lead.id));
                                    } else {
                                        setSelectedLeads([]);
                                    }
                                }}
                                checked={selectedLeads.length === leads.length}
                            />
                        </th>
                        <th>Date</th>
                        <th>Nom</th>
                        <th>Prénom</th>
                        <th>Email</th>
                        <th>Téléphone</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {leads.map((lead) => (
                        <tr key={lead.id}>
                            <td>
                                <input
                                    type="checkbox"
                                    checked={selectedLeads.includes(lead.id)}
                                    onChange={() => handleSelectLead(lead.id)}
                                />
                            </td>
                            <td>{new Date(lead.dateLead).toLocaleDateString()}</td>
                            <td>{lead.nom}</td>
                            <td>{lead.prenom}</td>
                            <td>{lead.email}</td>
                            <td>{lead.telephone}</td>
                            <td>{lead.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div>
                <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                    <option value="">Select Telepro</option>
                    {telepros.map((telepro) => (
                        <option key={telepro.id} value={telepro.id}>
                            {telepro.email}
                        </option>
                    ))}
                </select>
                <button onClick={handleAssignLeads} disabled={selectedLeads.length === 0 || !assignedTo}>
                    Assign Leads
                </button>
            </div>
        </div>
    );
};

export default LeadsList;