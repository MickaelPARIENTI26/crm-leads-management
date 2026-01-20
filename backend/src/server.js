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

// TEMPORARY ROUTE: Normalize all emails to lowercase
app.post('/api/normalize-emails-temp', async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        const updates = [];

        for (const user of users) {
            const normalizedEmail = user.email.toLowerCase();
            if (user.email !== normalizedEmail) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { email: normalizedEmail }
                });
                updates.push({ old: user.email, new: normalizedEmail });
            }
        }

        res.json({
            message: 'Email normalization completed',
            updatedCount: updates.length,
            updates
        });
    } catch (error) {
        console.error('Error normalizing emails:', error);
        res.status(500).json({ error: 'Failed to normalize emails' });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});