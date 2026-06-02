import { useState, useCallback, useRef } from 'react';
import { SECTIONS, DEFAULT_BADGES } from '../utils/constants';
import { loadData, saveData, clearData } from './useLocalStorage';

const initialFormData = {
  projName: '', tagline: '', ghUser: '', repoSlug: '',
  description: '', demoUrl: '', features: '', prereqs: '',
  installCmds: '', envVars: '', usageCmd: '', rawStructure: '',
  videoUrl: '', imageUrls: '', apiDocs: '', apiBase: '',
  contribNotes: '', authorName: '', authorGh: '', authorEmail: '',
  authorLinkedin: '', authorWebsite: '', customTech: '', license: 'MIT',
  supportMsg: '', supportBmac: '', supportKofi: '', supportPatreon: '', supportGhSponsors: '',
  abstractText: '', paperLink: '', datasetLink: '', methodology: '', bibtexCitation: '',
};

function buildDefaultSectionState() {
  const s = {};
  SECTIONS.forEach(sec => { s[sec.id] = sec.default; });
  return s;
}

export function useReadmeState() {
  const saved = loadData();

  const [formData, setFormData] = useState(() => {
    if (saved?.fields) return { ...initialFormData, ...saved.fields };
    return initialFormData;
  });

  const [sectionState, setSectionState] = useState(() => {
    const defaults = buildDefaultSectionState();
    if (saved?.sections) {
      Object.keys(defaults).forEach(id => {
        if (id in saved.sections) defaults[id] = !!saved.sections[id];
      });
    }
    return defaults;
  });

  const [sectionOrder, setSectionOrder] = useState(() => {
    if (saved?.sectionOrder) {
      const savedOrder = saved.sectionOrder.filter(id => SECTIONS.some(sec => sec.id === id));
      const missing = SECTIONS.map(sec => sec.id).filter(id => !savedOrder.includes(id));
      return [...savedOrder, ...missing];
    }
    return SECTIONS.map(sec => sec.id);
  });

  const [selectedTechs, setSelectedTechs] = useState(() =>
    saved?.techs ? new Set(saved.techs) : new Set()
  );

  const [selectedBadges, setSelectedBadges] = useState(() =>
    saved?.badges ? new Set(saved.badges) : new Set(DEFAULT_BADGES)
  );

  const [screenshots, setScreenshots] = useState([]);
  const [autoSaved, setAutoSaved] = useState(false);
  const saveTimerRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  const scheduleSave = useCallback((fd, ss, st, sb, so) => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveData({ formData: fd, sectionState: ss, selectedTechs: st, selectedBadges: sb, sectionOrder: so });
      setAutoSaved(true);
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => setAutoSaved(false), 2000);
    }, 600);
  }, []);

  const updateField = useCallback((field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      scheduleSave(next, sectionState, selectedTechs, selectedBadges, sectionOrder);
      return next;
    });
  }, [sectionState, selectedTechs, selectedBadges, sectionOrder, scheduleSave]);

  const toggleSection = useCallback((id, checked) => {
    setSectionState(prev => {
      const next = { ...prev, [id]: checked };
      scheduleSave(formData, next, selectedTechs, selectedBadges, sectionOrder);
      return next;
    });
  }, [formData, selectedTechs, selectedBadges, sectionOrder, scheduleSave]);

  const updateSectionOrder = useCallback((newOrder) => {
    setSectionOrder(newOrder);
    scheduleSave(formData, sectionState, selectedTechs, selectedBadges, newOrder);
  }, [formData, sectionState, selectedTechs, selectedBadges, scheduleSave]);

  const toggleTech = useCallback((label) => {
    setSelectedTechs(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      scheduleSave(formData, sectionState, next, selectedBadges, sectionOrder);
      return next;
    });
  }, [formData, sectionState, selectedBadges, sectionOrder, scheduleSave]);

  const toggleBadge = useCallback((id) => {
    setSelectedBadges(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      scheduleSave(formData, sectionState, selectedTechs, next, sectionOrder);
      return next;
    });
  }, [formData, sectionState, selectedTechs, sectionOrder, scheduleSave]);

  const applyTemplate = useCallback((template) => {
    setFormData(prev => {
      const next = {
        ...prev,
        projName: template.name,
        tagline: template.tag,
        description: template.desc,
        features: template.features,
        abstractText: template.abstractText || '',
        paperLink: template.paperLink || '',
        datasetLink: template.datasetLink || '',
        methodology: template.methodology || '',
        bibtexCitation: template.bibtexCitation || '',
      };
      const nextSections = { ...sectionState, academic: !!template.abstractText };
      scheduleSave(next, nextSections, new Set(template.techs), selectedBadges, sectionOrder);
      return next;
    });
    setSectionState(prev => ({ ...prev, academic: !!template.abstractText }));
    setSelectedTechs(new Set(template.techs));
  }, [sectionState, selectedBadges, sectionOrder, scheduleSave]);

  const resetAll = useCallback(() => {
    setFormData(initialFormData);
    setSectionState(buildDefaultSectionState());
    setSectionOrder(SECTIONS.map(sec => sec.id));
    setSelectedTechs(new Set());
    setSelectedBadges(new Set(DEFAULT_BADGES));
    setScreenshots([]);
    clearData();
  }, []);

  const clearSaved = useCallback(() => {
    clearData();
  }, []);

  const addScreenshots = useCallback((files) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      /* FIX: Added error handling for FileReader to prevent silent failures. */
      reader.onerror = () => {
        toast('❌ Failed to read image file.');
      };
      reader.onload = (e) => {
        setScreenshots(prev => [...prev, { name: file.name, dataUrl: e.target.result }]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removeScreenshot = useCallback((idx) => {
    setScreenshots(prev => prev.filter((_, i) => i !== idx));
  }, []);

  return {
    formData, updateField,
    sectionState, toggleSection,
    sectionOrder, updateSectionOrder,
    selectedTechs, toggleTech,
    selectedBadges, toggleBadge,
    screenshots, addScreenshots, removeScreenshot,
    applyTemplate, resetAll, clearSaved,
    autoSaved,
  };
}
