const { prisma } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parseExcelFile, normalizePhoneNumber } = require('../utils/excelParser');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = process.env.EXCEL_UPLOAD_PATH || 'uploads/excel_files';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        if (ext !== '.xlsx' && ext !== '.xls') {
            return cb(new Error('Only Excel files are allowed'));
        }
        cb(null, true);
    }
});

const createLead = async (req, res) => {
    const { dateLead, systemeChauffage, type, codePostal, prenom, nom, email, telephone } = req.body;

    try {
        // Normaliser le téléphone
        const normalizedPhone = normalizePhoneNumber(telephone);

        if (!normalizedPhone) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

        // Vérifier si le téléphone existe déjà
        const existingLead = await prisma.lead.findFirst({
            where: { telephone: normalizedPhone }
        });

        if (existingLead) {
            return res.status(400).json({ error: 'A lead with this phone number already exists' });
        }

        const newLead = await prisma.lead.create({
            data: {
                dateLead,
                systemeChauffage: systemeChauffage || null,
                type,
                codePostal,
                prenom,
                nom,
                email,
                telephone: normalizedPhone,
                status: null, // Status vide par défaut
            },
        });
        res.status(201).json(newLead);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create lead' });
    }
};

const getLeads = async (req, res) => {
    try {
        const { search } = req.query;

        // Build where clause for search
        const whereClause = search ? {
            OR: [
                { nom: { contains: search, mode: 'insensitive' } },
                { prenom: { contains: search, mode: 'insensitive' } },
                { telephone: { contains: search } }
            ]
        } : {};

        const leads = await prisma.lead.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(leads);
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ error: 'Failed to retrieve leads' });
    }
};

const updateLead = async (req, res) => {
    const { id } = req.params;
    const { status, commentaire } = req.body;

    try {
        const updatedLead = await prisma.lead.update({
            where: { id },
            data: { status, commentaire },
        });
        res.status(200).json(updatedLead);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update lead' });
    }
};

const assignLeads = async (req, res) => {
    const { leadIds, assignedToId } = req.body;

    try {
        const updatedLeads = await prisma.lead.updateMany({
            where: {
                id: { in: leadIds },
            },
            data: {
                assignedToId,
            },
        });
        res.status(200).json(updatedLeads);
    } catch (error) {
        res.status(500).json({ error: 'Failed to assign leads' });
    }
};

// Import leads from Excel
const importLeads = [
    upload.single('file'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const leads = parseExcelFile(req.file.path);

            // Récupérer tous les téléphones existants en base
            const existingLeads = await prisma.lead.findMany({
                select: { telephone: true }
            });

            const existingPhones = new Set(existingLeads.map(l => l.telephone));

            // Filtrer les leads pour ne garder que ceux qui n'existent pas déjà
            const leadsToInsert = leads.filter(lead => {
                return !existingPhones.has(lead.telephone);
            });

            let insertedCount = 0;
            const skippedCount = leads.length - leadsToInsert.length;

            // Insérer les leads un par un pour éviter les erreurs si un lead a un problème
            for (const lead of leadsToInsert) {
                try {
                    await prisma.lead.create({
                        data: {
                            ...lead,
                            dateLead: new Date(lead.dateLead)
                        }
                    });
                    insertedCount++;
                } catch (error) {
                    console.error('Error inserting lead:', error);
                    // Continue avec le suivant
                }
            }

            // Delete the uploaded file after processing
            fs.unlinkSync(req.file.path);

            res.status(201).json({
                message: 'Leads imported successfully',
                inserted: insertedCount,
                skipped: skippedCount,
                total: leads.length
            });
        } catch (error) {
            console.error('Import error:', error);
            // S'assurer de supprimer le fichier même en cas d'erreur
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ error: 'Failed to import leads: ' + error.message });
        }
    }
];

// Get all leads (for admin) or assigned leads (for telepro)
const getAllLeads = async (req, res) => {
    try {
        const { search } = req.query;
        const userRole = req.user.role;
        const userId = req.user.id;

        // Build where clause for search
        let whereClause = {};

        // If telepro, only show their assigned leads
        if (userRole === 'TELEPRO') {
            whereClause.assignedToId = userId;
        }

        // Add search filters
        if (search) {
            whereClause.OR = [
                { nom: { contains: search, mode: 'insensitive' } },
                { prenom: { contains: search, mode: 'insensitive' } },
                { telephone: { contains: search } }
            ];

            // If telepro, combine assignedToId with search
            if (userRole === 'TELEPRO') {
                whereClause = {
                    AND: [
                        { assignedToId: userId },
                        {
                            OR: [
                                { nom: { contains: search, mode: 'insensitive' } },
                                { prenom: { contains: search, mode: 'insensitive' } },
                                { telephone: { contains: search } }
                            ]
                        }
                    ]
                };
            }
        }

        const leads = await prisma.lead.findMany({
            where: whereClause,
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        email: true,
                        nom: true,
                        role: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.status(200).json(leads);
    } catch (error) {
        console.error('Get leads error:', error);
        res.status(500).json({ error: 'Failed to retrieve leads' });
    }
};

// Get leads assigned to the logged-in telepro
const getMyLeads = async (req, res) => {
    try {
        const userId = req.user.id;
        const leads = await prisma.lead.findMany({
            where: {
                assignedToId: userId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.status(200).json(leads);
    } catch (error) {
        console.error('Get my leads error:', error);
        res.status(500).json({ error: 'Failed to retrieve leads' });
    }
};

module.exports = {
    createLead,
    getLeads,
    updateLead,
    assignLeads,
    importLeads,
    getAllLeads,
    getMyLeads,
};