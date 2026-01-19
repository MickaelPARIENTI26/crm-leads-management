const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    // Create default admin user
    const adminEmail = 'DavidParienti.eco@gmail.com';
    const adminPassword = 'David2208!';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await prisma.user.create({
        data: {
            email: adminEmail,
            password: hashedPassword,
            role: 'ADMIN',
            createdAt: new Date(),
        },
    });

    console.log('Admin user created');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });