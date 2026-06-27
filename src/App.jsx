import { useRef, useState, useEffect, lazy, Suspense, useCallback } from 'react';
import Header from './components/Header';
import NoteInput from './components/NoteInput';
import SummaryResult from './components/SummaryResult';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
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
  const { user, loading: authLoading, isNewUser, clearNewUserFlag } = useAuth();

  const noteInputRef = useRef(null);

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

  const goHome        = () => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goFeatures    = () => { setCurrentView('features'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goHowItWorks  = () => { setCurrentView('howItWorks'); window.scrollTo({ top: 0, behavior: 'smooth' }); };

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

  return (
    <div className="app-shell">
      <Header
        currentView={currentView}
        onAuthClick={() => setIsAuthOpen(true)}
        onGoHome={goHome}
        onGoFeatures={goFeatures}
        onGoHowItWorks={goHowItWorks}
        onGetStarted={handleGetStarted}
      />

      <main className="app-main">

        {currentView === 'home' && (
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
                  <button className="btn-primary hero-cta-primary" onClick={handleGetStarted}>
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
              {authLoading ? (
                <SkeletonNoteInput />
              ) : (
                <NoteInput
                  text={noteText}
                  onTextChange={handleTextChange}
                  uploadedSource={uploadedSource}
                  onUploadedSourceChange={setUploadedSource}
                  onFileLoaded={handleFileLoaded}
                  onSummarize={handleSummarize}
                  isLoading={isLoading}
                  onClear={handleClearSummary}
                  editorMode={editorMode}
                  onEditorModeChange={handleEditorModeChange}
                  onboardingStep={onboardingStep}
                />
              )}
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

            {authLoading && summary ? (
              <SkeletonSummary />
            ) : (
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
            )}
          </>
        )}

        {currentView === 'features' && (
          <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}><div className="skeleton-pulse" style={{width: '100%', height: '400px', borderRadius: '12px'}}></div></div>}>
            <Features onGetStarted={handleGetStarted} />
          </Suspense>
        )}

        {currentView === 'howItWorks' && (
          <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}><div className="skeleton-pulse" style={{width: '100%', height: '400px', borderRadius: '12px'}}></div></div>}>
            <HowItWorks onGetStarted={handleGetStarted} />
          </Suspense>
        )}

        {currentView === 'quiz' && (
          <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}><div className="skeleton-pulse" style={{width: '100%', height: '400px', borderRadius: '12px'}}></div></div>}>
            <Quiz quizData={quizData} onGoHome={goHome} />
          </Suspense>
        )}
      </main>

      <footer style={{
        padding: '1.25rem 1rem calc(1.25rem + env(safe-area-inset-bottom))',
        textAlign: 'center', color: 'var(--text-tertiary)',
        fontSize: '0.8125rem', borderTop: '1px solid var(--border-color)',
      }}>
        &copy; 2026 NoteAI SaaS. Built for productivity.
      </footer>

      <AnimatePresence>
        {isAuthOpen && <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />}
      </AnimatePresence>

      {/* Onboarding overlay */}
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
        .feature-strip-label {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.2rem;
          line-height: 1.2;
        }
        .feature-strip-sub {
          font-size: 0.76rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .feature-strip-desktop {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0;
          max-width: 1080px;
          margin: 0 auto 2rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          background-color: var(--bg-secondary);
          overflow: hidden;
        }
        .feature-strip-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1.125rem 1rem;
          border-right: 1px solid var(--border-color);
        }
        .feature-strip-item:last-child { border-right: none; }
        .feature-strip-icon {
          width: 36px; height: 36px; min-width: 36px;
          border-radius: var(--radius-sm);
          background: linear-gradient(135deg, hsla(262,80%,60%,0.16), hsla(262,80%,60%,0.07));
          border: 1px solid hsla(262,80%,60%,0.2);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent-primary);
          margin-top: 2px;
        }
        @media (max-width: 959px) {
          .feature-strip-desktop { grid-template-columns: repeat(3, 1fr); }
          .feature-strip-item:nth-child(3) { border-right: none; }
          .feature-strip-item:nth-child(4),
          .feature-strip-item:nth-child(5) { border-top: 1px solid var(--border-color); }
        }
        .feature-marquee-outer {
          display: none;
          position: relative;
          width: 100%;
          overflow: hidden;
          margin-bottom: 1.25rem;
          -webkit-mask-image:
            linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
          mask-image:
            linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
        }
        .feature-marquee-track {
          display: flex;
          gap: 0.75rem;
          width: max-content;
          padding: 0.25rem 0;
          animation: marquee-scroll 35s linear infinite;
          will-change: transform;
        }
        .feature-marquee-track:hover,
        .feature-marquee-outer:hover .feature-marquee-track {
          animation-play-state: paused;
        }
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .feature-marquee-card {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          width: 195px;
          flex-shrink: 0;
          padding: 0.875rem 1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background-color: var(--bg-secondary);
          box-shadow: var(--shadow-sm);
        }
        .feature-marquee-icon {
          width: 32px; height: 32px; min-width: 32px;
          border-radius: var(--radius-sm);
          background: linear-gradient(135deg, hsla(262,80%,60%,0.16), hsla(262,80%,60%,0.07));
          border: 1px solid hsla(262,80%,60%,0.2);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent-primary);
          margin-top: 2px;
          flex-shrink: 0;
        }
        @media (max-width: 639px) {
          .feature-strip-desktop { display: none !important; }
          .feature-marquee-outer { display: block; }
          .hero-ctas { gap: 0.625rem; }
          .hero-cta-primary { width: 100%; justify-content: center; }
          .hero-cta-ghost   { width: 100%; justify-content: center; }
          .hero-pills { gap: 0.625rem; }
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
