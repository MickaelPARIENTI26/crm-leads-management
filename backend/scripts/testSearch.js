const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSearch() {
    try {
        const search = 'brz';

        console.log('=== TEST SEARCH ===');
        console.log('Search term:', search);

        // Build where clause for search
        const whereClause = search ? {
            OR: [
                { nom: { contains: search, mode: 'insensitive' } },
                { prenom: { contains: search, mode: 'insensitive' } },
                { telephone: { contains: search } }
            ]
        } : {};

        console.log('Where clause:', JSON.stringify(whereClause, null, 2));

        const leads = await prisma.lead.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });

        console.log('Results count:', leads.length);

        if (leads.length > 0) {
            console.log('\nFirst 5 results:');
            leads.slice(0, 5).forEach(lead => {
                console.log(`- ${lead.nom} ${lead.prenom} (${lead.telephone})`);
            });
        }

        console.log('==================');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testSearch();
