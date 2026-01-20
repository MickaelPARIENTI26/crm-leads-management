const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function normalizeEmails() {
    try {
        console.log('Starting email normalization...');

        // Get all users
        const users = await prisma.user.findMany();
        console.log(`Found ${users.length} users to process`);

        // Update each user's email to lowercase
        for (const user of users) {
            const normalizedEmail = user.email.toLowerCase();

            if (user.email !== normalizedEmail) {
                console.log(`Updating email: ${user.email} -> ${normalizedEmail}`);

                await prisma.user.update({
                    where: { id: user.id },
                    data: { email: normalizedEmail }
                });

                console.log(`✓ Updated user: ${user.nom || user.email}`);
            } else {
                console.log(`✓ Email already normalized: ${user.email}`);
            }
        }

        console.log('\n✅ Email normalization completed successfully!');
    } catch (error) {
        console.error('❌ Error normalizing emails:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

normalizeEmails();
