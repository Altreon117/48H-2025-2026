import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import apiService from '../services/apiService';
import { JOBS_DATA } from '../services/jobsData';
import './JobBoardPage.css';

function formatSize(sizeInBytes) {
  if (!sizeInBytes && sizeInBytes !== 0) return '';
  if (sizeInBytes < 1024) return `${sizeInBytes} o`;
  if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} Ko`;
  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function ScoreBar({ score }) {
  const safe = Math.max(0, Math.min(100, score || 0));
  return (
    <div className="application-score-wrap">
      <div className="application-score-header">
        <span>Compatibilité candidature</span>
        <strong>{safe}%</strong>
      </div>
      <div className="application-score-track">
        <div className="application-score-fill" style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
}

export default function JobApplyPage() {
  const { jobId } = useParams();
  const numericJobId = Number(jobId);

  const selectedJob = useMemo(
    () => JOBS_DATA.find(job => job.id === numericJobId),
    [numericJobId]
  );

  const [cvFile, setCvFile] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  if (!selectedJob) {
    return <Navigate to="/jobs" replace />;
  }

  const handleAnalyze = async (event) => {
    event.preventDefault();

    if (!cvFile) {
      setAnalysisError('Ajoute ton CV avant de lancer l\'analyse.');
      return;
    }

    if (!coverLetter.trim()) {
      setAnalysisError('Ajoute une lettre de motivation pour recevoir des conseils ciblés.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError('');
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const payload = new FormData();
      payload.append('jobId', String(selectedJob.id));
      payload.append('jobTitle', selectedJob.title);
      payload.append('jobCompany', selectedJob.company);
      payload.append('jobDescription', selectedJob.description);
      payload.append('jobSkills', selectedJob.skills.join(', '));
      payload.append('coverLetter', coverLetter);
      payload.append('cvFile', cvFile);

      const response = await apiService.postForm('/jobs/analyze-application', payload);
      setAnalysis(response.analysis);
    } catch (error) {
      setAnalysisError(error.message || 'Impossible de lancer l\'analyse IA.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!analysis) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await apiService.post('/jobs/submit-application', {
        jobId: selectedJob.id,
        jobTitle: selectedJob.title,
        jobCompany: selectedJob.company,
        coverLetter,
        matchScore: analysis.matchScore,
      });

      setSubmitSuccess(response.message || 'Candidature soumise avec succès.');
    } catch (error) {
      setSubmitError(error.message || 'Impossible de soumettre la candidature.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container application-page">
      <div className="application-topbar">
        <Link to="/jobs" className="application-back-link">← Retour aux offres</Link>
      </div>

      <section className="application-job-summary card">
        <div className="job-card-header">
          <div className="job-company-logo">{selectedJob.company.charAt(0)}</div>
          <div className="job-header-info">
            <h2 className="job-title application-job-title">{selectedJob.title}</h2>
            <div className="job-meta">
              <span className="job-company">{selectedJob.company}</span>
              <span className="job-dot" />
              <span className="job-location">{selectedJob.location}</span>
              <span className="job-dot" />
              <span className="job-mode">{selectedJob.mode}</span>
            </div>
          </div>
          <div className="job-badges">
            <span className="badge badge-green">{selectedJob.type}</span>
          </div>
        </div>
      </section>

      <form className="application-form" onSubmit={handleAnalyze}>
        <section className="application-block card">
          <label className="application-label">Ton CV</label>
          <label className="application-upload">
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={(e) => setCvFile(e.target.files?.[0] || null)}
            />
            <span className="application-upload-text">Déposer un CV (PDF ou TXT)</span>
          </label>
          {cvFile && (
            <div className="application-file-pill">
              <span>{cvFile.name}</span>
              <span>{formatSize(cvFile.size)}</span>
              <button type="button" className="application-file-remove" onClick={() => setCvFile(null)}>✕</button>
            </div>
          )}
        </section>

        <section className="application-block card">
          <label htmlFor="cover-letter" className="application-label">Lettre de motivation</label>
          <textarea
            id="cover-letter"
            className="application-textarea"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Explique pourquoi ton profil correspond au poste, ce que tu veux apprendre et ta motivation."
            rows={8}
            maxLength={4000}
          />
          <div className="application-letter-meta">{coverLetter.length}/4000 caractères</div>
        </section>

        {analysisError && <div className="error-message">{analysisError}</div>}

        <div className="application-actions">
          <button type="submit" className="btn btn-primary application-submit" disabled={isAnalyzing}>
            {isAnalyzing ? 'Analyse en cours...' : 'Analyser ma candidature avec IA'}
          </button>
        </div>
      </form>

      {analysis && (
        <section className="application-analysis card">
          <h3 className="application-analysis-title">Retour IA sur ta candidature</h3>
          <ScoreBar score={analysis.matchScore} />

          <div className="application-analysis-grid">
            <div>
              <h4>Forces</h4>
              <ul>
                {(analysis.strengths || []).map((item, index) => <li key={`s-${index}`}>{item}</li>)}
              </ul>
            </div>
            <div>
              <h4>Améliorations recommandées</h4>
              <ul>
                {(analysis.improvements || []).map((item, index) => <li key={`i-${index}`}>{item}</li>)}
              </ul>
            </div>
          </div>

          <div className="application-next-step">
            <h4>Exemple de reformulation</h4>
            <p>{analysis.rewrittenExcerpt}</p>
          </div>

          <div className="application-next-step">
            <h4>Plan d'action conseillé</h4>
            <p>{analysis.nextSteps}</p>
          </div>

          <div className="application-actions application-actions-bottom">
            <button
              type="button"
              className="btn btn-primary application-submit"
              onClick={handleSubmitApplication}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Soumission en cours...' : 'Soumettre ma candidature'}
            </button>
          </div>

          {submitError && <div className="error-message" style={{ marginTop: 10 }}>{submitError}</div>}
          {submitSuccess && <div className="success-message" style={{ marginTop: 10 }}>{submitSuccess}</div>}
        </section>
      )}
    </div>
  );
}
