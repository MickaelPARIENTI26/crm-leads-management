const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const leadRoutes = require('./routes/leadRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const authMiddleware = require('./middlewares/authMiddleware');
const roleMiddleware = require('./middlewares/roleMiddleware');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, roleMiddleware('ADMIN'), userRoutes);
app.use('/api/leads', authMiddleware, leadRoutes);
app.use('/api/appointments', authMiddleware, appointmentRoutes);

// ROUTE TEMPORAIRE - Créer l'admin (à supprimer après utilisation)
app.get('/api/setup-admin', async (req, res) => {
    try {
        const bcrypt = require('bcrypt');
        const email = 'DavidParienti.eco@gmail.com';
        const nom = 'David';
        const password = 'David2208!';

        // Vérifier si l'admin existe déjà
        const existingAdmin = await prisma.user.findUnique({
            where: { email }
        });

        if (existingAdmin) {
            return res.json({ message: '✅ Admin existe déjà !', admin: { email, nom } });
        }

        // Créer l'admin
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = await prisma.user.create({
            data: {
                email,
                nom,
                password: hashedPassword,
                role: 'ADMIN'
            }
        });

        res.json({
            message: '✅ Admin créé avec succès !',
            admin: { email: admin.email, nom: admin.nom }
        });
    } catch (error) {
        console.error('Erreur création admin:', error);
        res.status(500).json({ error: 'Erreur lors de la création de l\'admin' });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});