const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDatabase() {
    try {
        console.log('🧹 Nettoyage de la base de données...');

        // Delete all appointments first (due to foreign key constraints)
        const deletedAppointments = await prisma.appointment.deleteMany({});
        console.log(`✅ ${deletedAppointments.count} rendez-vous supprimés`);

        // Delete all leads
        const deletedLeads = await prisma.lead.deleteMany({});
        console.log(`✅ ${deletedLeads.count} leads supprimés`);

        // Delete all users (telepros and admins)
        const deletedUsers = await prisma.user.deleteMany({});
        console.log(`✅ ${deletedUsers.count} utilisateurs supprimés`);

        console.log('✨ Base de données nettoyée avec succès!');
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanDatabase();
