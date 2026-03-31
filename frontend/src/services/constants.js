export const CAMPUS_LIST = [
    'Aix-en-Provence', 'Bordeaux', 'Casablanca', 'Lille', 'Lyon',
    'Montpellier', 'Nice', 'Paris Est', 'Paris Ouest', 'Rennes',
    'Rouen', 'Strasbourg', 'Toulouse',
];

export const FILIERE_LIST = [
    'Informatique',
    'Cybersécurité',
    'Intelligence Artificielle & Data',
    '3D, Animation, Jeu Vidéo & Technologies Immersives',
    'Marketing & Communication Digitale',
    'Digital & IA',
    'Création & Digital Design',
    'Audiovisuel',
    "Architecture d'intérieur",
    'Bâtiment Numérique',
];

export const PROMOTION_LIST = ['B1', 'B2', 'B3', 'M1', 'M2'];

// Regex: lettres, chiffres, point, tiret, underscore — pas d'espaces
export const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,30}$/;

export function validatePasswordClient(password) {
    const errors = [];
    if (password.length < 8) errors.push('au moins 8 caractères');
    if (!/[A-Z]/.test(password)) errors.push('une majuscule');
    if (!/[a-z]/.test(password)) errors.push('une minuscule');
    if (!/[0-9]/.test(password)) errors.push('un chiffre');
    if (!/[^A-Za-z0-9]/.test(password)) errors.push('un caractère spécial');
    return errors;
}

export function getPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 2) return { level: 'weak', label: 'Faible', color: '#dc3545' };
    if (score <= 4) return { level: 'medium', label: 'Moyen', color: '#fd7e14' };
    return { level: 'strong', label: 'Fort', color: '#28a745' };
}
