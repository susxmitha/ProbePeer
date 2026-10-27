import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { HomeView } from './components/views/HomeView';
import { ResearchQuestionView } from './components/views/ResearchQuestionView';
import { LiteratureView } from './components/views/LiteratureView';
import { DatasetView } from './components/views/DatasetView';
import { MethodsView } from './components/views/MethodsView';
import { ExecutionView } from './components/views/ExecutionView';
import { DecisionGraphView } from './components/views/DecisionGraphView';
import { ManuscriptView } from './components/views/ManuscriptView';
import { HistoryView } from './components/views/HistoryView';
import { NewProjectModal } from './components/modals/NewProjectModal';
import { ExportModal } from './components/modals/ExportModal';
import { ResearchProject, ProjectStatus } from './types';
import { api } from './services/api';
import { INITIAL_PROJECT } from './services/sampleData';

export default function App() {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [activeProject, setActiveProject] = useState<ResearchProject | null>(null);
  const [currentView, setCurrentView] = useState<string>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Modals state
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectInitialPrompt, setNewProjectInitialPrompt] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize projects on mount and restore active project & view
  useEffect(() => {
    async function loadInitialProjects() {
      try {
        const PROBEPEER_CACHE_VERSION = 'v3.2-prod-n300';
        const savedCacheVer = localStorage.getItem('probepeer_cache_version');
        if (savedCacheVer !== PROBEPEER_CACHE_VERSION) {
          localStorage.removeItem('probepeer_projects_cache');
          localStorage.removeItem('probepeer_active_project_id');
          localStorage.setItem('probepeer_cache_version', PROBEPEER_CACHE_VERSION);
        }

        const loaded = await api.getProjects();
        const savedActiveId = localStorage.getItem('probepeer_active_project_id');
        const savedView = localStorage.getItem('probepeer_last_view');

        if (loaded && loaded.length > 0) {
          setProjects(loaded);
          const found = savedActiveId ? loaded.find((p) => p.id === savedActiveId) : null;
          setActiveProject(found || loaded[0]);
          if (savedView) setCurrentView(savedView);
        } else {
          // Seed with realistic default project
          const seeded = await api.saveProject(INITIAL_PROJECT);
          setProjects([seeded]);
          setActiveProject(seeded);
          localStorage.setItem('probepeer_active_project_id', seeded.id);
        }
      } catch (err) {
        console.error('Failed to load initial projects:', err);
        setProjects([INITIAL_PROJECT]);
        setActiveProject(INITIAL_PROJECT);
      }
    }
    loadInitialProjects();
  }, []);

  // Update active project with instant local cache + debounced server sync
  const handleUpdateProject = (updatedFields: Partial<ResearchProject>) => {
    if (!activeProject) return;

    const updated: ResearchProject = {
      ...activeProject,
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };

    setActiveProject(updated);
    localStorage.setItem('probepeer_active_project_id', updated.id);
    
    // Update memory list and instant local cache so refresh never loses state
    setProjects((prev) => {
      const next = prev.map((p) => (p.id === updated.id ? updated : p));
      localStorage.setItem('probepeer_projects_cache', JSON.stringify(next));
      return next;
    });
    setSaveStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.saveProject(updated);
        setSaveStatus('saved');
      } catch (e) {
        console.warn('Autosave warning:', e);
        setSaveStatus('error');
      }
    }, 400);
  };

  const handleSelectView = (view: string) => {
    setCurrentView(view);
    localStorage.setItem('probepeer_last_view', view);
  };

  const handleUpdateStatus = (newStatus: ProjectStatus) => {
    if (!activeProject) return;
    handleUpdateProject({
      status: newStatus,
      activityHistory: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          category: 'project',
          action: `Project Stage Changed to "${newStatus}"`,
          details: `Manual researcher state transition.`,
          actor: 'Researcher'
        },
        ...(activeProject.activityHistory || [])
      ]
    });
  };

  const handleCreateNewProject = async (newProj: ResearchProject) => {
    setSaveStatus('saving');
    try {
      const saved = await api.saveProject(newProj);
      setProjects((prev) => [saved, ...prev]);
      setActiveProject(saved);
      setCurrentView('question');
      setSaveStatus('saved');
    } catch (err) {
      console.error('Error creating project:', err);
      setProjects((prev) => [newProj, ...prev]);
      setActiveProject(newProj);
      setCurrentView('question');
      setSaveStatus('saved');
    }
  };

  const handleNewProjectWithPrompt = (promptText: string) => {
    setNewProjectInitialPrompt(promptText);
    setIsNewProjectModalOpen(true);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-main)] font-sans antialiased">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={handleSelectView}
        projects={projects}
        activeProject={activeProject}
        onSelectProject={(p) => {
          setActiveProject(p);
          localStorage.setItem('probepeer_active_project_id', p.id);
          if (currentView === 'home') handleSelectView('question');
        }}
        onNewProject={() => handleNewProjectWithPrompt('')}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[var(--bg-base)]">
        {/* Global Header */}
        <Header
          activeProject={activeProject}
          onNewProject={() => handleNewProjectWithPrompt('')}
          onOpenExport={() => setIsExportModalOpen(true)}
          onUpdateStatus={handleUpdateStatus}
          saveStatus={saveStatus}
          currentView={currentView}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 overflow-y-auto bg-[var(--bg-base)] text-[var(--text-main)]">
          {currentView === 'home' && (
            <HomeView
              projects={projects}
              onSelectProject={(p) => {
                setActiveProject(p);
                localStorage.setItem('probepeer_active_project_id', p.id);
                handleSelectView('question');
              }}
              onNewProjectWithPrompt={handleNewProjectWithPrompt}
              onOpenUploadDataset={() => {
                if (activeProject) handleSelectView('dataset');
                else handleNewProjectWithPrompt('Investigating Uploaded Dataset');
              }}
            />
          )}

          {currentView === 'question' && activeProject && (
            <ResearchQuestionView
              project={activeProject}
              onUpdateProject={handleUpdateProject}
              onNavigateToLiterature={() => handleSelectView('literature')}
            />
          )}

          {currentView === 'literature' && activeProject && (
            <LiteratureView
              project={activeProject}
              onUpdateProject={handleUpdateProject}
            />
          )}

          {currentView === 'dataset' && activeProject && (
            <DatasetView
              project={activeProject}
              onUpdateProject={handleUpdateProject}
              onNavigateToMethods={() => handleSelectView('methods')}
            />
          )}

          {currentView === 'methods' && activeProject && (
            <MethodsView
              project={activeProject}
              onUpdateProject={handleUpdateProject}
              onNavigateToExecution={() => handleSelectView('execution')}
            />
          )}

          {currentView === 'execution' && activeProject && (
            <ExecutionView
              project={activeProject}
              onUpdateProject={handleUpdateProject}
              onNavigateToManuscript={() => handleSelectView('manuscript')}
            />
          )}

          {currentView === 'graph' && activeProject && (
            <DecisionGraphView
              project={activeProject}
              onUpdateProject={handleUpdateProject}
            />
          )}

          {currentView === 'manuscript' && activeProject && (
            <ManuscriptView
              project={activeProject}
              onUpdateProject={handleUpdateProject}
              onOpenExport={() => setIsExportModalOpen(true)}
            />
          )}

          {currentView === 'history' && activeProject && (
            <HistoryView project={activeProject} />
          )}
        </main>
      </div>

      {/* Modal Dialogs */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={handleCreateNewProject}
        initialPrompt={newProjectInitialPrompt}
      />

      {activeProject && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          project={activeProject}
        />
      )}
    </div>
  );
}
