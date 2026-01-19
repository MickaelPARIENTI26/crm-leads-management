const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanAllExceptAdmin() {
    try {
        console.log('🗑️  Nettoyage de la base de données...');

        // Supprimer tous les RDV
        const deletedAppointments = await prisma.appointment.deleteMany({});
        console.log(`✅ ${deletedAppointments.count} RDV supprimés`);

        // Supprimer tous les leads
        const deletedLeads = await prisma.lead.deleteMany({});
        console.log(`✅ ${deletedLeads.count} leads supprimés`);

        // Supprimer tous les users SAUF les admins
        const deletedUsers = await prisma.user.deleteMany({
            where: {
                role: 'TELEPRO'
            }
        });
        console.log(`✅ ${deletedUsers.count} télépros supprimés`);

        // Afficher les admins restants
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { email: true, nom: true }
        });
        console.log('\n👤 Admin(s) restant(s):');
        admins.forEach(admin => {
            console.log(`   - ${admin.nom} (${admin.email})`);
        });

        console.log('\n✅ Base de données nettoyée avec succès!');
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanAllExceptAdmin();
