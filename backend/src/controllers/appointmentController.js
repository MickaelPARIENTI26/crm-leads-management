const { prisma } = require('../config/database');

// Create a new appointment
const createAppointment = async (req, res) => {
    const { dateRdv, heureRdv, adresse, nom, prenom, telephone, codePostal, leadId } = req.body;
    const agentId = req.user.id; // Get the logged-in user (telepro)

    try {
        console.log('========== CHECKING CONFLICTS ==========');
        console.log('AgentId:', agentId);
        console.log('Requested date:', dateRdv, 'time:', heureRdv);

        // Check if there's already an appointment for THIS agent at the same date and time
        // Get all appointments (the status filter was causing issues with NULL values)
        const myAppointments = await prisma.appointment.findMany({
            where: {
                agentId: agentId
            }
        });

        console.log('Total MY appointments in DB:', myAppointments.length);
        console.log('My appointments:', myAppointments.map(a => ({
            id: a.id,
            date: a.dateRdv,
            time: a.heureRdv,
            status: a.status
        })));

        // Filter appointments for the same date and time
        const conflictingAppointment = myAppointments.find(apt => {
            const aptDate = new Date(apt.dateRdv);
            const reqDate = new Date(dateRdv);

            // Compare dates (year, month, day only)
            const sameDate = aptDate.getFullYear() === reqDate.getFullYear() &&
                           aptDate.getMonth() === reqDate.getMonth() &&
                           aptDate.getDate() === reqDate.getDate();

            const sameTime = apt.heureRdv === heureRdv;

            console.log('Comparing:', {
                existing: { id: apt.id, date: aptDate.toISOString(), time: apt.heureRdv },
                requested: { date: reqDate.toISOString(), time: heureRdv },
                sameDate,
                sameTime,
                result: sameDate && sameTime
            });

            return sameDate && sameTime;
        });

        if (conflictingAppointment) {
            console.log('CONFLICT FOUND! Existing appointment:', conflictingAppointment.id);
            return res.status(400).json({
                error: `Vous avez déjà un rendez-vous le ${new Date(dateRdv).toLocaleDateString('fr-FR')} à ${heureRdv}`
            });
        }

        console.log('No conflict found, creating appointment...');

        const newAppointment = await prisma.appointment.create({
            data: {
                dateRdv: new Date(dateRdv),
                heureRdv,
                adresse,
                nom,
                prenom,
                telephone,
                codePostal,
                leadId: leadId || null,
                agentId,
            },
            include: {
                agent: {
                    select: {
                        id: true,
                        email: true,
                        nom: true,
                    }
                },
                lead: true
            }
        });

        // If linked to a lead, update lead status to RDV
        if (leadId) {
            await prisma.lead.update({
                where: { id: leadId },
                data: { status: 'RDV' }
            });
        }

        res.status(201).json(newAppointment);
    } catch (error) {
        console.error('Create appointment error:', error);
        res.status(500).json({ error: 'Failed to create appointment' });
    }
};

// Get all appointments
const getAllAppointments = async (req, res) => {
    try {
        const appointments = await prisma.appointment.findMany({
            include: {
                agent: {
                    select: {
                        id: true,
                        email: true,
                        nom: true,
                    }
                },
                lead: true
            },
            orderBy: {
                dateRdv: 'asc'
            }
        });
        res.status(200).json(appointments);
    } catch (error) {
        console.error('Get appointments error:', error);
        res.status(500).json({ error: 'Failed to retrieve appointments' });
    }
};

// Get appointments for logged-in telepro
const getMyAppointments = async (req, res) => {
    try {
        const userId = req.user.id;
        const appointments = await prisma.appointment.findMany({
            where: {
                agentId: userId
            },
            include: {
                agent: {
                    select: {
                        id: true,
                        email: true,
                        nom: true,
                    }
                },
                lead: true
            },
            orderBy: {
                dateRdv: 'asc'
            }
        });
        res.status(200).json(appointments);
    } catch (error) {
        console.error('Get my appointments error:', error);
        res.status(500).json({ error: 'Failed to retrieve appointments' });
    }
};

// Update an appointment
const updateAppointment = async (req, res) => {
    const { id } = req.params;
    const { dateRdv, heureRdv, adresse, nom, prenom, telephone, codePostal, status } = req.body;

    try {
        const updatedAppointment = await prisma.appointment.update({
            where: { id },
            data: {
                dateRdv: dateRdv ? new Date(dateRdv) : undefined,
                heureRdv,
                adresse,
                nom,
                prenom,
                telephone,
                codePostal,
                status: status === '' ? null : status,
            },
            include: {
                agent: {
                    select: {
                        id: true,
                        email: true,
                        nom: true,
                    }
                },
                lead: true
            }
        });
        res.status(200).json(updatedAppointment);
    } catch (error) {
        console.error('Update appointment error:', error);
        res.status(500).json({ error: 'Failed to update appointment' });
    }
};

// Delete an appointment
const deleteAppointment = async (req, res) => {
    const { id } = req.params;

    try {
        // Get appointment to check if it has a linked lead
        const appointment = await prisma.appointment.findUnique({
            where: { id }
        });

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // Delete the appointment
        await prisma.appointment.delete({
            where: { id }
        });

        // If linked to a lead, update lead status to ANNULE
        if (appointment.leadId) {
            await prisma.lead.update({
                where: { id: appointment.leadId },
                data: { status: 'ANNULE' }
            });
        }

        res.status(200).json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        console.error('Delete appointment error:', error);
        res.status(500).json({ error: 'Failed to delete appointment' });
    }
};

module.exports = {
    createAppointment,
    getAllAppointments,
    getMyAppointments,
    updateAppointment,
    deleteAppointment,
};
