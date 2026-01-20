const { prisma } = require('../config/database');
const bcrypt = require('bcrypt');

// Create a new user
exports.createUser = async (req, res) => {
    const { email, password, role, nom } = req.body;

    try {
        // Convertir l'email en minuscules pour assurer la cohérence
        const emailLowerCase = email.toLowerCase();
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email: emailLowerCase,
                password: hashedPassword,
                role,
                nom: nom || null,
            },
        });
        res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
        res.status(500).json({ error: 'Error creating user' });
    }
};

// Get all users
exports.getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving users' });
    }
};

// Get a user by ID
exports.getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving user' });
    }
};

// Update a user
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { email, role } = req.body;

    try {
        // Convertir l'email en minuscules si fourni
        const emailLowerCase = email ? email.toLowerCase() : undefined;
        const user = await prisma.user.update({
            where: { id },
            data: {
                email: emailLowerCase,
                role,
            },
        });
        res.status(200).json({ message: 'User updated successfully', user });
    } catch (error) {
        res.status(500).json({ error: 'Error updating user' });
    }
};

// Delete a user
exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.user.delete({
            where: { id },
        });
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting user' });
    }
};