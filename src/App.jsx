import { useRef, useState, useEffect, lazy, Suspense, useCallback } from 'react';
import NoteInput from './components/NoteInput';
import SummaryResult from './components/SummaryResult';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import TopBar from './components/TopBar';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import StatusBar from './components/StatusBar';
import { SkeletonNoteInput, SkeletonSummary } from './components/Skeleton';
import { summarizeNotes, generateQuizFromSummary } from './lib/ai';
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import { AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, FileText, Sparkles, WandSparkles,
  Zap, Shield, ArrowRight, PlayCircle,
  LayoutGrid, BookOpen, ClipboardPaste,
} from 'lucide-react';

const Quiz = lazy(() => import('./components/Quiz'));
const HowItWorks = lazy(() => import('./components/HowItWorks'));
const Features = lazy(() => import('./components/Features'));

const STRIP_ITEMS = [
  { icon: ClipboardPaste, label: 'Summarize anything',   sub: 'Get clean, structured summaries instantly.' },
  { icon: BookOpen,       label: 'Smart key ideas',      sub: 'AI extracts key points that actually matter.' },
  { icon: BrainCircuit,  label: 'Quiz yourself',         sub: 'Auto-generate quizzes to test your understanding.' },
  { icon: LayoutGrid,    label: 'Organized workspace',   sub: 'All your notes, files, and insights in one place.' },
  { icon: FileText,      label: 'PDF & file support',    sub: 'Upload PDFs, docs, or raw text.' },
];

const PLACEHOLDER_VIEWS = ['notes', 'ai', 'study', 'graph', 'search', 'settings'];

function HomeView({ noteText, handleTextChange, uploadedSource, setUploadedSource, handleFileLoaded, handleSummarize, isLoading, onClear, editorMode, handleEditorModeChange, onboardingStep, error, summary, handleQuizAction, isGeneratingQuiz, hasQuizForCurrentSummary, user, noteId, noteInputRef, goHowItWorks }) {
  return (
    <>
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <Sparkles size={16} />
            AI workspace for sharper notes
          </div>
          <h2 id="hero-title">
            Turn chaos<br />into{' '}
            <span style={{
              background: 'linear-gradient(90deg, var(--accent-primary), hsl(190,78%,52%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>clarity.</span>
          </h2>
          <p>
            Paste rough notes, upload study files, and get clean summaries plus quiz-ready recall in seconds.
          </p>
          <div className="hero-ctas">
            <button className="btn-primary hero-cta-primary" onClick={() => noteInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
              Get started free <ArrowRight size={16} />
            </button>
            <button className="hero-cta-ghost" onClick={goHowItWorks}>
              <PlayCircle size={18} />
              See how it works
            </button>
          </div>
          <div className="hero-pills">
            <span className="hero-pill"><Zap size={13} /> Instant summaries</span>
            <span className="hero-pill"><BrainCircuit size={13} /> Smart quizzes</span>
            <span className="hero-pill"><Shield size={13} /> Secure &amp; private</span>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-glass-card hero-glass-card-main">
            <div className="hero-card-topline">
              <span>AI ENGINE</span>
              <span>LIVE</span>
            </div>
            <div className="hero-card-title">Lecture Notes</div>
            <div className="hero-card-lines"><span /><span /><span /></div>
            <div className="hero-progress"><span style={{ width: '72%' }} /></div>
          </div>
          <div className="hero-glass-card hero-floating-card hero-floating-card-left">
            <FileText size={18} />
            <div><strong>PDF ready</strong><span>18 key ideas</span></div>
          </div>
          <div className="hero-glass-card hero-floating-card hero-floating-card-right">
            <BrainCircuit size={18} />
            <div><strong>Quiz built</strong><span>7 questions</span></div>
          </div>
          <div className="hero-glass-card hero-floating-pill">
            <WandSparkles size={16} />
            Clean summary
          </div>
        </div>
      </section>

      <div className="feature-strip feature-strip-desktop">
        {STRIP_ITEMS.map(({ icon: Icon, label, sub }) => (
          <div className="feature-strip-item" key={label}>
            <div className="feature-strip-icon"><Icon size={18} /></div>
            <div>
              <div className="feature-strip-label">{label}</div>
              <div className="feature-strip-sub">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="feature-marquee-outer">
        <div className="feature-marquee-track" aria-hidden="true">
          {[...STRIP_ITEMS, ...STRIP_ITEMS].map(({ icon: Icon, label, sub }, i) => (
            <div className="feature-marquee-card" key={i}>
              <div className="feature-marquee-icon"><Icon size={17} /></div>
              <div>
                <div className="feature-strip-label">{label}</div>
                <div className="feature-strip-sub">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div ref={noteInputRef}>
        <NoteInput
          text={noteText}
          onTextChange={handleTextChange}
          uploadedSource={uploadedSource}
          onUploadedSourceChange={setUploadedSource}
          onFileLoaded={handleFileLoaded}
          onSummarize={handleSummarize}
          isLoading={isLoading}
          onClear={onClear}
          editorMode={editorMode}
          onEditorModeChange={handleEditorModeChange}
          onboardingStep={onboardingStep}
        />
      </div>

      {error && (
        <div style={{
          marginTop: '1.5rem', padding: '0.875rem 1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'hsla(0,84%,60%,0.1)', color: 'hsl(0,84%,60%)',
          textAlign: 'center', border: '1px solid hsla(0,84%,60%,0.2)',
          fontSize: '0.9375rem', wordBreak: 'break-word',
          maxWidth: '800px', margin: '1.5rem auto 0',
        }}>{error}</div>
      )}

      <SummaryResult
        summary={summary}
        onGenerateQuiz={handleQuizAction}
        isGeneratingQuiz={isGeneratingQuiz}
        hasQuiz={hasQuizForCurrentSummary}
        isStreaming={isLoading}
        userId={user?.id || ''}
        noteId={noteId}
        noteText={noteText}
      />
    </>
  );
}

function PlaceholderView({ view }) {
  const icons = {
    notes: FileText, ai: BrainCircuit, study: BookOpen, graph: Share2,
    search: LayoutGrid, settings: LayoutGrid,
  };
  const titles = {
    notes: 'Notes Workspace', ai: 'AI Studio', study: 'Study Center',
    graph: 'Knowledge Graph', search: 'Search', settings: 'Settings',
  };
  const descs = {
    notes: 'Create, edit, and organize your notes with folders, tags, and templates.',
    ai: 'Chat with AI, generate quizzes, flashcards, mind maps, and more.',
    study: 'Review with summaries, quizzes, flashcards, and revision planning.',
    graph: 'Visualize connections between your notes with an interactive knowledge graph.',
    search: 'Search across all your notes, folders, and tags.',
    settings: 'Manage your account, preferences, and workspace settings.',
  };
  const Icon = icons[view] || LayoutGrid;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '4rem 2rem', textAlign: 'center', minHeight: '60vh',
    }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: 'var(--radius-xl)',
        background: 'var(--bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1.5rem',
      }}>
        <Icon size={28} style={{ color: 'var(--accent-primary)' }} />
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>{titles[view]}</h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.7, fontSize: '0.9375rem' }}>{descs[view]}</p>
      <div style={{
        marginTop: '2rem', padding: '1rem 1.5rem',
        borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-secondary)', fontSize: '0.8125rem', color: 'var(--text-tertiary)',
      }}>
        Coming soon — check back for updates
      </div>
    </div>
  );
}

function AppContent() {
  const [summary, setSummary]               = useState('');
  const [noteText, setNoteText]             = useState('');
  const [uploadedSource, setUploadedSource] = useState({ name: '', text: '', type: '' });
  const [isLoading, setIsLoading]           = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [error, setError]                   = useState('');
  const [isAuthOpen, setIsAuthOpen]         = useState(false);
  const [currentView, setCurrentView]       = useState('home');
  const [quizData, setQuizData]             = useState([]);
  const [quizSummary, setQuizSummary]       = useState('');
  const [editorMode, setEditorMode]         = useState('simple');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [noteId, setNoteId]                 = useState('');
  const [sidebarOpen, setSidebarOpen]       = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();

  const noteInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user && !user?.user_metadata?.onboarding_complete) {
      setShowOnboarding(true);
      setOnboardingStep(user?.user_metadata?.onboarding_step || 1);
    } else {
      setShowOnboarding(false);
    }
  }, [user]);

  const updateOnboardingStep = async (nextStep) => {
    setOnboardingStep(nextStep);
    if (user) {
      await supabase.auth.updateUser({
        data: { onboarding_step: nextStep }
      });
    }
  };

  useEffect(() => {
    if (!noteId) {
      setNoteId(crypto.randomUUID?.() || Math.random().toString(36).slice(2));
    }
  }, [noteId]);

  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.matchMedia('(max-width: 639px)').matches || ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
      if (isMobile) {
        document.body.classList.add('is-mobile');
      } else {
        document.body.classList.remove('is-mobile');
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const goHome = () => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goFeatures = () => { setCurrentView('features'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goHowItWorks = () => { setCurrentView('howItWorks'); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handleGetStarted = () => {
    if (currentView !== 'home') {
      setCurrentView('home');
      setTimeout(() => noteInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
    } else {
      noteInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSummarize = async (text) => {
    if (!user) { setIsAuthOpen(true); return; }
    setIsLoading(true); setError(''); setSummary(''); setQuizData([]); setQuizSummary('');
    if (showOnboarding && onboardingStep === 3) {
      updateOnboardingStep(4);
    }
    try {
      await summarizeNotes(text, (chunk) => {
        setSummary((prev) => prev + chunk);
      });
    }
    catch (err) { setError(err.message || 'Something went wrong. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const handleGenerateQuiz = async (summaryText) => {
    if (!user) { setIsAuthOpen(true); return; }
    setIsGeneratingQuiz(true); setError('');
    try {
      const quiz = await generateQuizFromSummary(summaryText);
      setQuizData(quiz); setQuizSummary(summaryText); setCurrentView('quiz');
    } catch (err) { setError(err.message || 'Failed to generate quiz. Please try again.'); }
    finally { setIsGeneratingQuiz(false); }
  };

  const resetUploadedSource = () => setUploadedSource({ name: '', text: '', type: '' });

  const handleTextChange = (text) => {
    setNoteText(text);
    if (uploadedSource.name || uploadedSource.text || uploadedSource.type) resetUploadedSource();
  };

  const handleFileLoaded = (source) => {
    setNoteText(''); setUploadedSource(source); setSummary('');
    setQuizData([]); setQuizSummary(''); setError(''); setCurrentView('home');
  };

  const handleClearSummary = () => {
    setNoteText(''); resetUploadedSource(); setSummary('');
    setQuizData([]); setQuizSummary(''); setCurrentView('home');
  };

  const handleOnboardingComplete = useCallback((template) => {
    setShowOnboarding(false);
    if (template) {
      setNoteText(template.text);
      handleGetStarted();
    }
  }, []);

  const handleEditorModeChange = (mode) => {
    setEditorMode(mode);
  };

  const hasQuizForCurrentSummary = summary && quizSummary === summary && quizData.length > 0;
  const handleQuizAction = (summaryText) => {
    if (hasQuizForCurrentSummary) { setCurrentView('quiz'); return; }
    handleGenerateQuiz(summaryText);
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const isPlacholderView = PLACEHOLDER_VIEWS.includes(currentView);
  const isLandingView = currentView === 'home' || currentView === 'features' || currentView === 'howItWorks';

  return (
    <div className={`workspace-shell${rightPanelOpen ? ' has-right-panel' : ''}`}>
      <div className="workspace-topbar">
        <TopBar
          currentView={currentView}
          onViewChange={handleViewChange}
          onAuthClick={() => setIsAuthOpen(true)}
          onToggleSidebar={() => setSidebarOpen(s => !s)}
          sidebarOpen={sidebarOpen}
          onToggleRightPanel={() => setRightPanelOpen(p => !p)}
          rightPanelOpen={rightPanelOpen}
        />
      </div>

      <div className="workspace-sidebar">
        <LeftSidebar
          currentView={currentView}
          onViewChange={handleViewChange}
          isOpen={sidebarOpen}
        />
      </div>

      <div className="workspace-main">
        {currentView === 'home' && (
          <div className="workspace-content workspace-content-wide" style={{ padding: '2rem 1.5rem' }}>
            <HomeView
              {...{ noteText, handleTextChange, uploadedSource, setUploadedSource, handleFileLoaded, handleSummarize, isLoading, onClear: handleClearSummary, editorMode, handleEditorModeChange, onboardingStep, error, summary, handleQuizAction, isGeneratingQuiz, hasQuizForCurrentSummary, user, noteId, noteInputRef, goHowItWorks }}
            />
          </div>
        )}

        {currentView === 'features' && (
          <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}><div className="skeleton-pulse" style={{width: '100%', height: '400px', borderRadius: '12px'}}></div></div>}>
            <div className="workspace-content workspace-content-wide">
              <Features onGetStarted={handleGetStarted} />
            </div>
          </Suspense>
        )}

        {currentView === 'howItWorks' && (
          <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}><div className="skeleton-pulse" style={{width: '100%', height: '400px', borderRadius: '12px'}}></div></div>}>
            <div className="workspace-content workspace-content-wide">
              <HowItWorks onGetStarted={handleGetStarted} />
            </div>
          </Suspense>
        )}

        {currentView === 'quiz' && (
          <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}><div className="skeleton-pulse" style={{width: '100%', height: '400px', borderRadius: '12px'}}></div></div>}>
            <div className="workspace-content workspace-content-wide" style={{ padding: '2rem 1.5rem' }}>
              <Quiz quizData={quizData} onGoHome={goHome} />
            </div>
          </Suspense>
        )}

        {isPlacholderView && (
          <div className="workspace-content">
            <PlaceholderView view={currentView} />
          </div>
        )}
      </div>

      <div className="workspace-right-panel">
        <RightSidebar isOpen={rightPanelOpen} onClose={() => setRightPanelOpen(false)} />
      </div>

      <div className="workspace-statusbar">
        <StatusBar
          wordCount={noteText ? noteText.split(/\s+/).filter(Boolean).length : 0}
          charCount={noteText.length}
          isStreaming={isLoading}
          isAuthenticated={!!user}
          editorMode={editorMode}
        />
      </div>

      <AnimatePresence>
        {isAuthOpen && <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />}
      </AnimatePresence>

      {showOnboarding && (
        <Onboarding
          step={onboardingStep}
          updateStep={updateOnboardingStep}
          onComplete={handleOnboardingComplete}
          isStreaming={isLoading}
          summary={summary}
        />
      )}

      <style>{`
        .hero-ctas {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          margin-top: 1.75rem;
          flex-wrap: wrap;
        }
        .hero-cta-primary {
          padding: 0.75rem 1.375rem;
          font-size: 1rem;
          font-weight: 700;
          gap: 0.5rem;
        }
        .hero-cta-ghost {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.125rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--text-primary);
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          min-height: 44px;
          white-space: nowrap;
        }
        .hero-cta-ghost:hover {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
          background: hsla(262,80%,60%,0.06);
        }
        .hero-pills {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 1.25rem;
          flex-wrap: wrap;
        }
        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .hero-pill svg { color: var(--accent-primary); }
        @media (max-width: 639px) {
          .hero-ctas { gap: 0.625rem; }
          .hero-cta-primary { width: 100%; justify-content: center; }
          .hero-cta-ghost   { width: 100%; justify-content: center; }
          .hero-pills { gap: 0.625rem; }
        }
        .topbar-mobile-toggle { display: none; }
        @media (max-width: 767px) {
          .topbar-mobile-toggle { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
