import React from 'react';
import {
  Compass,
  BookOpen,
  Database,
  Sliders,
  PlayCircle,
  Share2,
  FileText,
  History,
  FolderKanban,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Server,
  FlaskConical
} from 'lucide-react';
import { ResearchProject, ProjectStatus } from '../../types';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  projects: ResearchProject[];
  activeProject: ResearchProject | null;
  onSelectProject: (project: ResearchProject) => void;
  onNewProject: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  projects,
  activeProject,
  onSelectProject,
  onNewProject,
  isCollapsed,
  onToggleCollapse
}) => {
  const navItems = [
    { id: 'home', label: 'Dashboard', icon: FolderKanban, projectRequired: false },
    { id: 'question', label: 'Research Question', icon: Compass, projectRequired: true },
    { id: 'literature', label: 'Literature & Evidence', icon: BookOpen, projectRequired: true },
    { id: 'dataset', label: 'Dataset & Feasibility', icon: Database, projectRequired: true },
    { id: 'methods', label: 'Methods & Planning', icon: Sliders, projectRequired: true },
    { id: 'execution', label: 'Execution & Verification', icon: PlayCircle, projectRequired: true },
    { id: 'graph', label: 'Decision Graph', icon: Share2, projectRequired: true },
    { id: 'manuscript', label: 'Evidence Manuscript', icon: FileText, projectRequired: true },
    { id: 'history', label: 'Provenance History', icon: History, projectRequired: true },
  ];

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'Ready for Analysis':
        return 'text-[var(--status-success)] bg-[var(--status-success-bg)] border border-[var(--status-success)]/30';
      case 'Analyzing':
        return 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30';
      case 'Planning':
        return 'text-[var(--status-warning)] bg-[var(--status-warning-bg)] border border-[var(--status-warning)]/30';
      case 'Needs Review':
        return 'text-[var(--status-danger)] bg-[var(--status-danger-bg)] border border-[var(--status-danger)]/30';
      default:
        return 'text-[var(--text-muted)] bg-[var(--bg-base)] border border-[var(--border)]';
    }
  };

  return (
    <aside
      className={`h-screen bg-[var(--bg-sidebar)] border-r border-[var(--border)] flex flex-col transition-all duration-200 select-none z-20 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 border-b border-[var(--border)] flex items-center justify-between px-3.5">
        <div className="flex items-center space-x-2.5 overflow-hidden cursor-pointer" onClick={() => onSelectView('home')}>
          <div className="w-7 h-7 rounded bg-[var(--accent-primary)] text-[var(--accent-primary-fg)] flex items-center justify-center font-serif text-base tracking-tighter shrink-0 font-medium">
            P
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-serif text-lg tracking-tight text-[var(--text-main)] font-semibold leading-none">
                ProbePeer
              </span>
              <span className="text-[10px] tracking-wider uppercase text-[var(--text-muted)] font-medium mt-0.5">
                Scientific Workspace
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--hover-state)] p-1 rounded transition-colors"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Project Switcher */}
      <div className="p-2 border-b border-[var(--border)]">
        {!isCollapsed ? (
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Current Project
              </span>
              <button
                onClick={onNewProject}
                className="text-[11px] text-[var(--accent-primary)] hover:opacity-80 font-medium flex items-center gap-0.5 hover:underline"
              >
                <Plus size={12} />
                New
              </button>
            </div>
            {projects.length > 0 ? (
              <select
                value={activeProject?.id || ''}
                onChange={(e) => {
                  const found = projects.find((p) => p.id === e.target.value);
                  if (found) onSelectProject(found);
                }}
                className="w-full text-xs font-medium bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-main)] rounded px-2.5 py-1.5 focus:outline-none focus:border-[var(--accent-primary)] truncate"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[var(--bg-surface)] text-[var(--text-main)]">
                    {p.title}
                  </option>
                ))}
              </select>
            ) : (
              <button
                onClick={onNewProject}
                className="w-full text-xs bg-[var(--bg-surface)] border border-dashed border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)] rounded p-2 text-center"
              >
                + Create Research Project
              </button>
            )}
            {activeProject && (
              <div className="mt-2 px-1 flex items-center justify-between">
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${getStatusBadge(
                    activeProject.status
                  )}`}
                >
                  {activeProject.status}
                </span>
                <span className="text-[10px] text-[#78716c] font-mono">
                  {activeProject.domain.split(' ')[0]}
                </span>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onNewProject}
            title="Create New Project"
            className="w-full h-8 flex items-center justify-center bg-white border border-[#d6d3cb] rounded text-[#1c1917] hover:bg-[#f2efe9]"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* Primary Navigation List */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isDisabled = item.projectRequired && !activeProject;

          return (
            <button
              key={item.id}
              disabled={isDisabled}
              onClick={() => onSelectView(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-medium transition-colors text-left ${
                isActive
                  ? 'bg-[var(--bg-surface)] text-[var(--accent-primary)] shadow-none border border-[var(--border)] font-semibold'
                  : isDisabled
                  ? 'text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                  : 'text-[var(--text-main)] hover:bg-[var(--hover-state)]'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)] shrink-0'} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-surface)] text-[11px] text-[var(--text-muted)] transition-colors">
        {!isCollapsed ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="flex items-center gap-1.5 text-[var(--text-main)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)] animate-pulse"></span>
                Python 3.10 Runner
              </span>
              <span className="text-[var(--text-muted)]">Isolated</span>
            </div>
            <div className="flex items-center justify-between font-mono text-[10px] text-[var(--text-muted)]">
              <span>Scholarly APIs</span>
              <span className="text-[var(--status-success)] font-medium">OpenAlex/Crossref</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="Python 3.10 & Scholarly APIs Active">
            <span className="w-2 h-2 rounded-full bg-[var(--status-success)]"></span>
          </div>
        )}
      </div>
    </aside>
  );
};
