const express = require('express');
const multer = require('multer');
const pdfParseModule = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});

const pdfParse = typeof pdfParseModule === 'function'
    ? pdfParseModule
    : pdfParseModule.default;

function sanitizeText(value, maxLength = 20000) {
    if (!value) return '';
    return String(value).replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

async function extractCvText(file) {
    if (!file) return '';

    const mimeType = file.mimetype || '';
    const fileName = file.originalname || '';

    if (mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
        if (typeof pdfParse !== 'function') {
            console.warn('[JOB AI] pdf-parse indisponible, analyse sans texte CV.');
            return '';
        }

        try {
            const parsed = await pdfParse(file.buffer);
            return sanitizeText(parsed?.text || '', 30000);
        } catch (error) {
            console.warn('[JOB AI] Échec lecture PDF, analyse sans texte CV:', error.message);
            return '';
        }
    }

    if (mimeType.startsWith('text/') || fileName.toLowerCase().endsWith('.txt')) {
        return sanitizeText(file.buffer.toString('utf8'), 30000);
    }

    return '';
}

function localHeuristicAnalysis({ coverLetter, cvText, jobTitle, jobCompany, jobSkills }) {
    const strengths = [];
    const improvements = [];

    if (coverLetter.length > 350) {
        strengths.push('La lettre de motivation est suffisamment développée.');
    } else {
        improvements.push('Développer davantage la lettre de motivation (objectif: 8 à 12 lignes utiles).');
    }

    if (/expérience|projet|réalis/i.test(coverLetter)) {
        strengths.push('La lettre mentionne des expériences ou réalisations concrètes.');
    } else {
        improvements.push('Ajouter un exemple précis de projet, mission ou résultat mesurable.');
    }

    if (cvText.length > 400) {
        strengths.push('Le CV contient assez d\'informations textuelles pour une analyse.');
    } else {
        improvements.push('Le CV semble trop court ou difficile à lire: vérifier le contenu et le format du fichier.');
    }

    const expectedSkills = jobSkills
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

    const profileText = `${cvText} ${coverLetter}`.toLowerCase();
    const matchedSkills = expectedSkills.filter((skill) => profileText.includes(skill));

    if (matchedSkills.length > 0) {
        strengths.push(`Compétences détectées en phase avec l\'offre: ${matchedSkills.join(', ')}.`);
    } else {
        improvements.push(`Relier explicitement ton profil aux compétences clés demandées (${jobSkills}).`);
    }

    const score = Math.max(35, Math.min(92, Math.round((matchedSkills.length / Math.max(1, expectedSkills.length)) * 60 + (coverLetter.length > 350 ? 25 : 10) + (cvText.length > 400 ? 12 : 0))));

    return {
        matchScore: score,
        strengths,
        improvements,
        rewrittenExcerpt: `Je candidate au poste de ${jobTitle} chez ${jobCompany} avec une motivation forte pour contribuer rapidement sur des sujets concrets. Mon parcours académique et mes projets me permettent d\'apporter de la valeur dès les premières semaines, notamment sur les compétences suivantes: ${jobSkills}.`,
        nextSteps: 'Adapte ton CV au poste visé, ajoute 2 résultats chiffrés, et termine ta lettre par une proposition de disponibilité claire pour un échange.',
        source: 'heuristic',
    };
}

async function generateAiAnalysis(input) {
    if (!process.env.GEMINI_API_KEY) {
        return localHeuristicAnalysis(input);
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

        const prompt = `Tu es un coach carrière. Analyse la candidature pour un poste.

Poste: ${input.jobTitle}
Entreprise: ${input.jobCompany}
Description: ${input.jobDescription}
Compétences attendues: ${input.jobSkills}

CV (texte extrait): ${input.cvText || 'CV non lisible'}
Lettre de motivation: ${input.coverLetter}

Réponds STRICTEMENT en JSON valide avec ce schéma:
{
  "matchScore": number de 0 à 100,
  "strengths": ["..."] (3 à 5 points),
  "improvements": ["..."] (3 à 6 points actionnables),
  "rewrittenExcerpt": "paragraphe amélioré de 3 à 5 phrases",
  "nextSteps": "plan court en 2-3 phrases"
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonText = text.replace(/^```json\s*/i, '').replace(/^```/, '').replace(/```$/, '').trim();

        const parsed = JSON.parse(jsonText);

        return {
            matchScore: Number(parsed.matchScore) || 0,
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 6) : [],
            improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 8) : [],
            rewrittenExcerpt: parsed.rewrittenExcerpt || '',
            nextSteps: parsed.nextSteps || '',
            source: 'gemini',
        };
    } catch (error) {
        console.warn('[JOB AI] Fallback heuristique:', error.message);
        return localHeuristicAnalysis(input);
    }
}

router.post('/analyze-application', upload.single('cvFile'), async (req, res) => {
    try {
        const jobTitle = sanitizeText(req.body.jobTitle, 180);
        const jobCompany = sanitizeText(req.body.jobCompany, 120);
        const jobDescription = sanitizeText(req.body.jobDescription, 2000);
        const jobSkills = sanitizeText(req.body.jobSkills, 600);
        const coverLetter = sanitizeText(req.body.coverLetter, 6000);

        if (!jobTitle || !jobCompany) {
            return res.status(400).json({ error: 'Poste invalide pour la candidature.' });
        }

        if (!coverLetter || coverLetter.length < 20) {
            return res.status(400).json({ error: 'La lettre de motivation doit contenir au moins 20 caractères.' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Le CV est requis.' });
        }

        const cvText = await extractCvText(req.file);
        const analysis = await generateAiAnalysis({
            jobTitle,
            jobCompany,
            jobDescription,
            jobSkills,
            coverLetter,
            cvText,
        });

        return res.json({ analysis });
    } catch (error) {
        console.error('[JOB AI ERROR]', error.message);
        return res.status(500).json({ error: 'Impossible d\'analyser la candidature pour le moment.' });
    }
});

router.post('/submit-application', async (req, res) => {
    try {
        const jobId = Number(req.body.jobId);
        const jobTitle = sanitizeText(req.body.jobTitle, 180);
        const jobCompany = sanitizeText(req.body.jobCompany, 120);
        const coverLetter = sanitizeText(req.body.coverLetter, 6000);
        const matchScore = Number(req.body.matchScore);

        if (!jobId || !jobTitle || !jobCompany) {
            return res.status(400).json({ error: 'Informations du poste invalides.' });
        }

        if (!coverLetter || coverLetter.length < 80) {
            return res.status(400).json({ error: 'La lettre de motivation est trop courte pour soumettre la candidature.' });
        }

        return res.status(201).json({
            message: `Candidature envoyée pour ${jobTitle} chez ${jobCompany}.`,
            application: {
                id: `local-${Date.now()}`,
                jobId,
                jobTitle,
                jobCompany,
                status: 'submitted',
                matchScore: Number.isFinite(matchScore) ? matchScore : null,
                submittedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('[JOB SUBMIT ERROR]', error.message);
        return res.status(500).json({ error: 'Impossible de soumettre la candidature pour le moment.' });
    }
});

module.exports = router;
