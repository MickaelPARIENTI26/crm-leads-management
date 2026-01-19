const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createAdmin() {
    try {
        const email = 'DavidParienti.eco@gmail.com';
        const nom = 'David';
        const password = 'David2208!';

        // Delete existing admin if exists
        console.log('🗑️  Suppression de l\'admin existant s\'il existe...');
        await prisma.user.deleteMany({
            where: {
                email: email
            }
        });

        console.log('👤 Création de l\'utilisateur admin...');
        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.user.create({
            data: {
                email,
                nom,
                password: hashedPassword,
                role: 'ADMIN'
            }
        });

        console.log('✅ Admin créé avec succès!');
        console.log(`📧 Email: ${admin.email}`);
        console.log(`👤 Nom: ${admin.nom}`);
        console.log(`🔑 Role: ${admin.role}`);
    } catch (error) {
        console.error('❌ Erreur lors de la création de l\'admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
