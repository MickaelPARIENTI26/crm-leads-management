const { body, validationResult } = require('express-validator');

const validateLogin = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validateLogin,

  validateEmail: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  validatePassword: (password) => {
    // Password must be at least 8 characters long and contain at least one number and one letter
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return regex.test(password);
  },

  validateLeadData: (lead) => {
    const { prenom, nom, email, telephone, systemeChauffage } = lead;
    const errors = [];

    if (!prenom || prenom.trim() === '') {
      errors.push('Prénom est requis.');
    }
    if (!nom || nom.trim() === '') {
      errors.push('Nom est requis.');
    }
    if (!email || !this.validateEmail(email)) {
      errors.push('Email est invalide.');
    }
    if (!telephone || telephone.trim() === '') {
      errors.push('Téléphone est requis.');
    }
    if (!systemeChauffage || systemeChauffage.trim() === '') {
      errors.push('Système de chauffage est requis.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};