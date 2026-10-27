import { Download, Plus, CheckCircle2, RefreshCw, AlertCircle, Sun, Moon } from 'lucide-react';
import { ResearchProject, ProjectStatus } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  activeProject: ResearchProject | null;
  onNewProject: () => void;
  onOpenExport: () => void;
  onUpdateStatus: (newStatus: ProjectStatus) => void;
  saveStatus: 'saved' | 'saving' | 'error';
  currentView: string;
}

const statusOptions: ProjectStatus[] = [
  'Draft',
  'Investigating',
  'Planning',
  'Ready for Analysis',
  'Analyzing',
  'Needs Review',
  'Archived'
];

export const Header: React.FC<HeaderProps> = ({
  activeProject,
  onNewProject,
  onOpenExport,
  onUpdateStatus,
  saveStatus,
  currentView
}) => {
  const { theme, toggleTheme } = useTheme();
  const getViewTitle = () => {
    switch (currentView) {
      case 'home':
        return 'Research Workspace Dashboard';
      case 'question':
        return 'Research Question & Hypotheses';
      case 'literature':
        return 'Scholarly Literature & Evidence Matrix';
      case 'dataset':
        return 'Dataset Discovery & Feasibility Inspection';
      case 'methods':
        return 'Methods & Analysis Protocol';
      case 'execution':
        return 'Computational Execution & Validation';
      case 'graph':
        return 'Research Decision Graph';
      case 'manuscript':
        return 'Evidence-Linked Manuscript Workspace';
      case 'history':
        return 'Provenance Ledger & Audit Trail';
      default:
        return 'Research Workspace';
    }
  };

  return (
    <header className="h-14 border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 flex items-center justify-between shrink-0 transition-colors">
      {/* Left breadcrumb */}
      <div className="flex items-center space-x-3 overflow-hidden">
        <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">
          {getViewTitle()}
        </span>
        {activeProject && (
          <>
            <span className="text-[var(--border)]">/</span>
            <span className="text-xs font-medium text-[var(--text-main)] truncate max-w-md" title={activeProject.title}>
              {activeProject.title}
            </span>
          </>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-2.5">
        {/* Autosave Indicator */}
        <div className="flex items-center space-x-1.5 text-[11px] font-mono text-[var(--text-muted)] mr-1">
          {saveStatus === 'saved' && (
            <>
              <CheckCircle2 size={13} className="text-[var(--status-success)]" />
              <span>Ledger synced</span>
            </>
          )}
          {saveStatus === 'saving' && (
            <>
              <RefreshCw size={13} className="text-[var(--accent-primary)] animate-spin" />
              <span>Saving...</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <AlertCircle size={13} className="text-[var(--status-danger)]" />
              <span>Cached locally</span>
            </>
          )}
        </div>

        {/* Project Status Selector */}
        {activeProject && (
          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-[var(--text-muted)] font-medium hidden sm:inline">Stage:</span>
            <select
              value={activeProject.status}
              onChange={(e) => onUpdateStatus(e.target.value as ProjectStatus)}
              className="text-xs font-medium bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-main)] rounded px-2 py-1 focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-[var(--bg-surface)] text-[var(--text-main)]">
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Persistent Theme Toggle (Sun/Moon) */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode (Dusty Pink & Periwinkle)' : 'Switch to Dark Mode (Dark Plum & Stormy Blue)'}
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-main)] bg-[var(--bg-surface)] border border-[var(--border)] hover:bg-[var(--hover-state)] px-2.5 py-1.5 rounded transition-colors"
          aria-label="Toggle light/dark theme"
        >
          {theme === 'dark' ? (
            <Sun size={13} className="text-[var(--accent-primary)]" />
          ) : (
            <Moon size={13} className="text-[var(--accent-primary)]" />
          )}
          <span className="hidden md:inline text-[11px] font-mono capitalize">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </span>
        </button>

        {/* Export Button */}
        {activeProject && (
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-main)] bg-[var(--bg-surface)] border border-[var(--border)] hover:bg-[var(--hover-state)] px-2.5 py-1.5 rounded transition-colors"
          >
            <Download size={13} />
            <span>Export Archive</span>
          </button>
        )}

        {/* New Project Button */}
        <button
          onClick={onNewProject}
          className="flex items-center gap-1 text-xs font-medium text-[var(--accent-primary-fg)] bg-[var(--accent-primary)] hover:opacity-90 px-3 py-1.5 rounded transition-all shadow-none"
        >
          <Plus size={13} />
          <span>New Project</span>
        </button>
      </div>
    </header>
  );
};
