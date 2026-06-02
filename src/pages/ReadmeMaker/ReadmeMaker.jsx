/* FIX: Consolidated React imports; removed unused useEffect, useRef. */
import { useMemo, useState } from 'react';
import { useReadmeState } from '../../hooks/useReadmeState';
import { useToast } from '../../components/ui/Toast';
import { generateMarkdown } from '../../utils/markdownUtils';
/* FIX: Removed unused SECTIONS import. */
import Sidebar from './Sidebar';
import EditorPanel from './EditorPanel';
import PreviewPanel from './PreviewPanel';
import Navbar from '../../components/layout/Navbar';
import SEOHead from '../../components/shared/SEOHead';


export default function ReadmeMaker() {
  const toast = useToast();

  const {
    formData, updateField,
    sectionState, toggleSection,
    sectionOrder, updateSectionOrder,
    selectedTechs, toggleTech,
    selectedBadges, toggleBadge,
    screenshots, addScreenshots, removeScreenshot,
    applyTemplate, resetAll, clearSaved,
    autoSaved,
  } = useReadmeState();

  const [activeTemplate, setActiveTemplate] = useState(null);

  const currentMd = useMemo(() =>
    generateMarkdown({ formData, sectionState, selectedTechs, selectedBadges, screenshots, sectionOrder }),
    [formData, sectionState, selectedTechs, selectedBadges, screenshots, sectionOrder]
  );

  const activeSectionCount = Object.values(sectionState).filter(Boolean).length;

  function handleApplyTemplate(template, key) {
    applyTemplate(template);
    setActiveTemplate(key);
    toast('✓ Template applied!');
  }

  /* FIX: Completed handleCopyMarkdown with cross-browser fallback.
     Added try/catch to handle all promise rejections and errors. */
  async function handleCopyMarkdown() {
    if (!currentMd) { toast('Generate content first!'); return; }

    // Try modern Clipboard API first (Chrome/Edge)
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(currentMd);
        toast('✓ Copied to clipboard!');
        return;
      }
    } catch (err) {
      // Clipboard API can fail in Firefox or insecure contexts — fall through to fallback
    }

    // Fallback: temporary textarea + execCommand('copy') (Firefox and older browsers)
    try {
      const ta = document.createElement('textarea');
      ta.value = currentMd;
      ta.style.cssText = 'position:absolute;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      toast('✓ Copied to clipboard!');
    } catch (err) {
      toast('Copy failed — please select the raw markdown and copy manually.');
    }
  }

  function handleResetAll() {
    resetAll();
    setActiveTemplate(null);
    toast('✓ Reset complete!');
  }

  function handleClearSaved() {
    clearSaved();
    toast('✓ Saved data cleared!');
  }

  return (
    <>
      <SEOHead
        title="README Maker — READMEForge"
        description="Generate a professional GitHub README in seconds with live preview, templates, and one-click export."
        path="/readme-maker"
        keywords="README maker, GitHub README builder, Markdown generator, README template editor, developer documentation"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'READMEForge README Maker',
          url: 'https://makeareadme.netlify.app/readme-maker',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Web',
          description: 'Browser-based README maker with live Markdown preview, templates, badges, and export tools.',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
      />
      <Navbar />
      <div id="app-builder" style={{ paddingTop: 64 }}>
        <header className="header">
          <div className="header-center">
            <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: '"JetBrains Mono", monospace', marginRight: 4 }}>sections:</span>
            <span id="sectionCount" style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{activeSectionCount}</span>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: '"JetBrains Mono", monospace' }}> active</span>
            <span className={`autosave-status${autoSaved ? ' visible' : ''}`}>✓ Auto-saved</span>
          </div>
          <div className="header-right">
            <a href="https://github.com/Mohit-368/ReadmeForge" target="_blank" rel="noreferrer"
              className="hbtn" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
              </svg>
              Source
            </a>
            <button className="hbtn" onClick={handleClearSaved}>🗑 Clear Saved</button>
            <button className="hbtn" onClick={handleResetAll}>↺ Reset All Fields</button>
            <button className="hbtn" onClick={handleCopyMarkdown}>Copy Markdown</button>
          </div>
        </header>

        <div className="main" style={{ height: 'calc(100vh - 128px)' }}>
          <Sidebar
            sectionState={sectionState}
            toggleSection={toggleSection}
            sectionOrder={sectionOrder}
            updateSectionOrder={updateSectionOrder}
            selectedTechs={selectedTechs}
            toggleTech={toggleTech}
            applyTemplate={handleApplyTemplate}
            activeTemplate={activeTemplate}
          />
          <EditorPanel
            formData={formData}
            updateField={updateField}
            sectionState={sectionState}
            selectedTechs={selectedTechs}
            toggleTech={toggleTech}
            selectedBadges={selectedBadges}
            toggleBadge={toggleBadge}
            screenshots={screenshots}
            addScreenshots={addScreenshots}
            removeScreenshot={removeScreenshot}
          />
          <PreviewPanel
            currentMd={currentMd}
            formData={formData}
            sectionState={sectionState}
            selectedTechs={selectedTechs}
            screenshots={screenshots}
          />
        </div>
      </div>
    </>
  );
}