import { useState } from 'react';
import { Link } from 'react-router-dom';
import './JobBoardPage.css';
import { JOBS_DATA } from '../services/jobsData';

const FILTER_OPTIONS = [
  { key: 'all', label: 'Toutes les offres' },
  { key: 'Alternance', label: 'Alternances' },
  { key: 'Stage', label: 'Stages' },
  { key: 'Full remote', label: 'Full remote' },
  { key: 'Hybride', label: 'Hybride' },
];

const TYPE_COLORS = { Alternance: 'green', Stage: 'blue' };

function JobCard({ job }) {
  return (
    <div className="job-card card">
      <div className="job-card-header">
        <div className="job-company-logo">{job.company.charAt(0)}</div>
        <div className="job-header-info">
          <h3 className="job-title">{job.title}</h3>
          <div className="job-meta">
            <span className="job-company">{job.company}</span>
            <span className="job-dot" />
            <span className="job-location">{job.location}</span>
            <span className="job-dot" />
            <span className="job-mode">{job.mode}</span>
          </div>
        </div>
        <div className="job-badges">
          <span className={`badge badge-${TYPE_COLORS[job.type] || 'gray'}`}>{job.type}</span>
          <span className="badge badge-gray">{job.duration}</span>
        </div>
      </div>

      <p className="job-description">{job.description}</p>

      <div className="job-skills">
        {job.skills.map(skill => <span key={skill} className="skill-tag">{skill}</span>)}
      </div>

      <div className="job-footer">
        <span className="job-posted">{job.posted}</span>
        <Link to={`/jobs/${job.id}/apply`} className="btn btn-primary job-apply-btn">
          Postuler →
        </Link>
      </div>
    </div>
  );
}

export default function JobBoardPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredJobs = JOBS_DATA.filter(job => {
    const matchesFilter =
      activeFilter === 'all' ||
      job.type === activeFilter ||
      job.mode === activeFilter;

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      job.skills.some(s => s.toLowerCase().includes(query)) ||
      job.location.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="page-container">
      <div className="jobs-header">
        <div>
          <h1 className="jobs-title font-display">
            Ymatch <span className="text-green">Jobs</span>
          </h1>
          <p className="jobs-subtitle">Offres de stages et alternances sélectionnées pour les étudiants Ynov</p>
        </div>
        <a href="https://ymatch.fr" target="_blank" rel="noopener noreferrer" className="btn btn-secondary jobs-cta">
          Voir ymatch.fr →
        </a>
      </div>

      <div className="jobs-controls">
        <div className="jobs-filters">
          {FILTER_OPTIONS.map(option => (
            <button
              key={option.key}
              className={`filter-btn ${activeFilter === option.key ? 'filter-active' : ''}`}
              onClick={() => setActiveFilter(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="input-field jobs-search"
          placeholder="Rechercher un poste, une techno..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="jobs-count">
        <span>{filteredJobs.length} offre{filteredJobs.length !== 1 ? 's' : ''} disponible{filteredJobs.length !== 1 ? 's' : ''}</span>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="jobs-empty">
          <p>Aucune offre ne correspond à ta recherche.</p>
          <button className="btn btn-secondary" onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}>
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="jobs-grid">
          {filteredJobs.map(job => <JobCard key={job.id} job={job} />)}
        </div>
      )}

      <div className="ymatch-banner card">
        <div className="ymatch-banner-text-block">
          <h3 className="ymatch-banner-title">Tu cherches plus d'offres ?</h3>
          <p className="ymatch-banner-subtitle">Accède à la plateforme Ymatch complète avec des centaines d'offres dédiées aux étudiants Ynov.</p>
        </div>
        <a href="https://ymatch.fr" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
          Ouvrir Ymatch.fr
        </a>
      </div>
    </div>
  );
}
