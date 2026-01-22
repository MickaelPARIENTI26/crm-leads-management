const XLSX = require('xlsx');

// Normalise un numéro de téléphone pour détecter les doublons
const normalizePhoneNumber = (phone) => {
    if (!phone) return null;

    // Convertir en string et enlever tous les caractères non numériques
    let cleaned = String(phone).replace(/[^0-9]/g, '');

    // Si commence par 336, enlever le 33 et ajouter 0
    if (cleaned.startsWith('336')) {
        cleaned = '0' + cleaned.substring(2);
    }
    // Si commence par 337, enlever le 33 et ajouter 0
    else if (cleaned.startsWith('337')) {
        cleaned = '0' + cleaned.substring(2);
    }
    // Si commence par 33, enlever le 33 et ajouter 0
    else if (cleaned.startsWith('33') && cleaned.length === 11) {
        cleaned = '0' + cleaned.substring(2);
    }
    // Si ne commence pas par 0 et fait 9 chiffres, ajouter 0 devant
    else if (!cleaned.startsWith('0') && cleaned.length === 9) {
        cleaned = '0' + cleaned;
    }

    // Retourner seulement si c'est un numéro valide (10 chiffres commençant par 0)
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
        return cleaned;
    }

    return null;
};

// Détermine le type de lead selon le nom de l'onglet
const getLeadTypeFromSheetName = (sheetName) => {
    const upperName = sheetName.toUpperCase();

    if (upperName.includes('PAC')) return 'PAC';
    if (upperName.includes('PV')) return 'PV';
    if (upperName.includes('ITE')) return 'ITE';

    // Par défaut, retourner PAC si aucun type détecté
    return 'PAC';
};

// Mapper les colonnes du fichier Excel aux champs de la base
const mapRowToLead = (row) => {
    // Créer un mapping case-insensitive des clés
    const rowKeys = Object.keys(row);
    const keyMap = {};

    rowKeys.forEach(key => {
        const upperKey = key.toUpperCase().trim();
        keyMap[upperKey] = key;
    });

    // Extraire les valeurs en utilisant différents noms possibles
    const chauffage = row[keyMap['CHAUFFAGE']] || row[keyMap['CHAUF']] || '';
    const date = row[keyMap['DATE']];
    const email = row[keyMap['MAIL']] || row[keyMap['EMAIL']];
    const prenom = row[keyMap['PRENOM']] || row[keyMap['PRÉNOM']];
    const nom = row[keyMap['NOM']];
    const codePostal = row[keyMap['CP']] || row[keyMap['CODE POSTAL']] || row[keyMap['CODEPOSTAL']];
    const telephone = row[keyMap['TEL']] || row[keyMap['TELEPHONE']] || row[keyMap['TÉLÉPHONE']] || row[keyMap['TEL.']];

    return {
        chauffage,
        date,
        email,
        prenom,
        nom,
        codePostal,
        telephone
    };
};

// Valide qu'une ligne a les champs obligatoires
const isValidLead = (lead) => {
    return lead.date && lead.email && lead.prenom && lead.nom && lead.codePostal && lead.telephone;
};

const parseExcelFile = (filePath) => {
    const workbook = XLSX.readFile(filePath);
    const allLeads = [];
    const seenPhones = new Set(); // Pour détecter les doublons dans le fichier lui-même

    // Parser tous les onglets
    workbook.SheetNames.forEach(sheetName => {
        // Skip les onglets avec "NE PAS IMPORTER" dans le nom
        if (sheetName.toUpperCase().includes('NE PAS IMPORTER')) {
            console.log(`Skipping sheet: ${sheetName} (contains "NE PAS IMPORTER")`);
            return;
        }

        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        // Déterminer le type selon le nom de l'onglet
        const leadType = getLeadTypeFromSheetName(sheetName);

        data.forEach(row => {
            // Skip les lignes vides ou sans données pertinentes
            if (Object.keys(row).length === 0) return;

            // Mapper les colonnes
            const mapped = mapRowToLead(row);

            // Valider que la ligne a les champs obligatoires
            if (!isValidLead(mapped)) return;

            // Normaliser le téléphone
            const normalizedPhone = normalizePhoneNumber(mapped.telephone);
            if (!normalizedPhone) return; // Skip si le téléphone n'est pas valide

            // Vérifier les doublons dans le fichier
            if (seenPhones.has(normalizedPhone)) return; // Skip les doublons
            seenPhones.add(normalizedPhone);

            // Créer l'objet lead
            allLeads.push({
                dateLead: mapped.date,
                systemeChauffage: mapped.chauffage || null,
                type: leadType,
                codePostal: String(mapped.codePostal),
                prenom: mapped.prenom,
                nom: mapped.nom,
                email: mapped.email,
                telephone: normalizedPhone,
                status: null, // Status vide par défaut
                commentaire: null
            });
        });
    });

    return allLeads;
};

module.exports = {
    parseExcelFile,
    normalizePhoneNumber, // Export pour utilisation dans le contrôleur
};