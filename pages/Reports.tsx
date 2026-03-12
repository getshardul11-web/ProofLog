import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/storage';
import { WorkLog, Status, ACCENT_COLORS } from '../types';
import { REPORT_TEMPLATES, ReportTemplateKey } from '../services/gemini';
import {
  Sparkles,
  Copy,
  Check,
  FileText,
  Clock,
  AlertTriangle,
  Mail,
  NotepadText,
  ChevronDown,
} from 'lucide-react';

const Reports: React.FC = () => {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [reportText, setReportText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notionCopied, setNotionCopied] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [accentColor, setAccentColor] = useState('#F4C430');

  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplateKey>('weekly');
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const templateMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      const u = await db.getUser();
      if (!mounted) return;
      if (u) {
        setUser(u);
        setAccentColor(ACCENT_COLORS[u.accentColor as keyof typeof ACCENT_COLORS] || '#F4C430');
      }

      const allLogs = await db.getLogs();
      if (!mounted) return;

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recentLogs = allLogs
        .filter((l) => l.createdAt > sevenDaysAgo)
        .sort((a, b) => b.createdAt - a.createdAt);

      setLogs(recentLogs);
    };

    loadData();
    return () => { mounted = false; };
  }, []);

  // Close template menu when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (templateMenuRef.current && !templateMenuRef.current.contains(e.target as Node)) {
        setShowTemplateMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isHeading = (line: string) => {
    const t = line.trim().toLowerCase();
    return (
      t === 'core tasks' ||
      t === 'highlights' ||
      t === 'top category' ||
      t === 'learnings'
    );
  };

  const stripMarkdown = (text: string) => {
    return text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/here'?s the analysis:?/gi, '')
      .trim();
  };

  const formatReportText = (raw: string) => {
    if (!raw) return '';
    let text = stripMarkdown(raw);
    text = text.replace(/here is a professional summary[\s\S]*?impact\.\s*/gi, '');
    text = text.replace(/---/g, '');
    text = text.replace(/^\d+\.\s*/gm, '');
    text = text.replace(/^\*\s+/gm, '• ');
    text = text.replace(/^\-\s+/gm, '• ');
    text = text.replace(/^•\s*$/gm, '');
    text = text.replace(/\n{3,}/g, '\n\n');
    return text.trim();
  };

  const getReportForExport = () => {
    if (!reportText) return '';
    return formatReportText(reportText);
  };

  const runWithTimeout = async <T,>(promise: Promise<T>, ms: number) => {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out after 30s')), ms)
    );
    return Promise.race([promise, timeoutPromise]);
  };

  const handleGenerateAI = async () => {
    if (logs.length === 0) return;

    setIsGenerating(true);
    setReportText('');

    try {
      const safeLogs = logs.slice(0, 25).map((l) => ({
        title: l.title,
        impact: l.impact,
        status: l.status,
        timeSpent: l.timeSpent,
        category: l.category,
        createdAt: l.createdAt,
      }));

      const res = await fetch('http://localhost:4000/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: safeLogs,
          template: selectedTemplate,
          instructions: `
instructions: \`
Write the weekly report as if I am sending it to my mentors.
Do NOT refer to me in third person. Never say "the person", "the developer", or "the logs show".
Write directly in first-person work language such as "Worked on", "Improved", "Resolved", etc.

The report MUST start with the week line in this format:

WEEK OF <DATE RANGE>

Example:
WEEK OF 9–15 MAR

Then follow EXACTLY this structure.

CORE TASKS

• Identify the project with the most total time spent.
• Summarize the main work done in that project using the logs.
• Combine related logs into a clear narrative of what was worked on.

HIGHLIGHTS

Group important outcomes into sub-categories such as:

Product
Design
Engineering
Infrastructure

Under each category include bullet points describing the work done.

TOP CATEGORY

• Identify the category with the most time spent.
• Briefly explain why this category dominated the week.

LEARNINGS

Derive the top 3 meta learnings from the work. These should be deeper patterns such as:

• product thinking
• engineering patterns
• design insights
• workflow improvements

Formatting rules:

• NEVER include phrases like "Here is the analysis", "Summary", "Insights", or "Suggestions".
• Do NOT write introductions.
• Do NOT mention logs.
• Do NOT mention analysis.
• Section titles MUST be uppercase.
• Leave one blank line after each section title.
• Use bullet points only (•).
• No emojis.
\`
`
        }),
      });

      const data = await res.json();

      if (!data?.report) {
        throw new Error('Local LLM returned empty response');
      }

      setReportText(data.report);
    } catch (err: any) {
      console.error('Local report generation failed:', err);
      setReportText(
        `Can't generate report right now.\n\nReason: ${err?.message || 'Unknown error'}`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!reportText) return;
    navigator.clipboard.writeText(getReportForExport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDraftEmail = () => {
    if (!reportText) return;
    const subject = encodeURIComponent('Weekly Update');
    const body = encodeURIComponent(getReportForExport());
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, '_blank');
  };

  const handleNotionExport = async () => {
    if (!reportText) return;
    const formatted = getReportForExport();
    await navigator.clipboard.writeText(formatted);
    setNotionCopied(true);
    setTimeout(() => setNotionCopied(false), 2500);
    const notionPage =
      user?.notionReportsUrl ||
      'https://www.notion.so/shardulgupta/Week-14-3009c6509142809595c0c1e3eb4db083?source=copy_link';
    window.open(notionPage, '_blank');
  };

  const wins = logs.filter((l) => l.status === Status.DONE);
  const ongoing = logs.filter((l) => l.status === Status.IN_PROGRESS);
  const blockers = logs.filter((l) => l.status === Status.BLOCKED);

  const formattedReport = reportText ? formatReportText(reportText) : '';
  const currentTemplate = REPORT_TEMPLATES[selectedTemplate];

  return (
    <div className="relative w-full flex flex-col gap-5">
      {/* TOP ACTION BAR */}
      <div className="relative z-[20] flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2 sm:mb-6">
        <div>
          <p className="text-[18px] sm:text-[20px] font-semibold text-slate-900 tracking-tight">
            Your reports, sir.
          </p>
          <p className="text-sm text-slate-400 mt-0.5">
            Template: <span className="font-semibold text-slate-600">{currentTemplate.label}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">

          {/* Template Selector */}
          <div className="relative" ref={templateMenuRef}>
            <button
              onClick={() => setShowTemplateMenu(v => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold shadow-sm hover:shadow-md transition-all border border-slate-200 bg-white whitespace-nowrap text-sm text-slate-700"
            >
              <FileText size={15} className="text-slate-500" />
              <span>{currentTemplate.label}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${showTemplateMenu ? 'rotate-180' : ''}`} />
            </button>

            {showTemplateMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Output Format</p>
                </div>
                {(Object.entries(REPORT_TEMPLATES) as [ReportTemplateKey, typeof REPORT_TEMPLATES[ReportTemplateKey]][]).map(([key, tmpl]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedTemplate(key);
                      setShowTemplateMenu(false);
                      setReportText('');
                    }}
                    className={`w-full text-left px-4 py-3 transition-colors hover:bg-slate-50 ${selectedTemplate === key ? 'bg-amber-50' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold ${selectedTemplate === key ? 'text-amber-700' : 'text-slate-800'}`}>
                        {tmpl.label}
                      </p>
                      {selectedTemplate === key && (
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{tmpl.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Generate */}
          <button
            onClick={handleGenerateAI}
            disabled={isGenerating || logs.length === 0}
            className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-full font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 bg-white whitespace-nowrap"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                <span className="text-slate-700 text-sm">Analyzing…</span>
              </>
            ) : (
              <>
                <Sparkles size={16} style={{ color: accentColor }} />
                <span className="text-slate-900 tracking-tight text-sm">Generate report</span>
              </>
            )}
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            disabled={!reportText}
            className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-full font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 bg-white whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check size={16} className="text-emerald-600" />
                <span className="text-sm">Copied</span>
              </>
            ) : (
              <>
                <Copy size={16} className="text-slate-500" />
                <span className="text-sm">Copy</span>
              </>
            )}
          </button>

          {/* Email */}
          <button
            onClick={handleDraftEmail}
            disabled={!reportText}
            className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-full font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 bg-white whitespace-nowrap"
          >
            <Mail size={16} className="text-slate-500" />
            <span className="text-sm">Email</span>
          </button>

          {/* Notion */}
          <button
            onClick={handleNotionExport}
            disabled={!reportText}
            className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-full font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 bg-white whitespace-nowrap"
          >
            <NotepadText size={16} className="text-slate-500" />
            <span className="text-sm">{notionCopied ? 'Copied!' : 'Notion'}</span>
          </button>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch" style={{ minHeight: '60vh' }}>
        {/* LEFT — Raw breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden" style={{ minHeight: '400px' }}>
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                <FileText size={18} className="text-slate-600" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">Raw breakdown</h3>
                <p className="text-sm text-slate-500">Last 7 days ({logs.length} logs)</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
              <Clock size={14} />
              Weekly logs
            </div>
          </div>

          <div className="overflow-y-auto p-6 space-y-8 max-h-[60vh] lg:max-h-none lg:flex-1">
            {/* Wins */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h4 className="font-semibold text-emerald-700 text-sm tracking-tight">Wins ({wins.length})</h4>
              </div>
              <div className="space-y-3">
                {wins.map((log) => (
                  <div key={log.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="font-semibold text-slate-900 text-sm tracking-tight">{log.title}</p>
                    <p className="text-slate-600 text-sm mt-1 leading-relaxed">{log.impact}</p>
                  </div>
                ))}
                {wins.length === 0 && <p className="text-slate-400 text-sm italic">No completed wins logged yet.</p>}
              </div>
            </section>

            {/* In Progress */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <h4 className="font-semibold text-sky-700 text-sm tracking-tight">In progress ({ongoing.length})</h4>
              </div>
              <div className="space-y-3">
                {ongoing.map((log) => (
                  <div key={log.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="font-semibold text-slate-900 text-sm tracking-tight">{log.title}</p>
                    <p className="text-slate-600 text-sm mt-1 leading-relaxed">{log.impact}</p>
                  </div>
                ))}
                {ongoing.length === 0 && <p className="text-slate-400 text-sm italic">No ongoing work logged.</p>}
              </div>
            </section>

            {/* Blockers */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h4 className="font-semibold text-rose-700 text-sm tracking-tight">Blockers ({blockers.length})</h4>
              </div>
              <div className="space-y-3">
                {blockers.map((log) => (
                  <div key={log.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="font-semibold text-slate-900 text-sm tracking-tight">{log.title}</p>
                    <p className="text-slate-600 text-sm mt-1 leading-relaxed">{log.impact}</p>
                  </div>
                ))}
                {blockers.length === 0 && <p className="text-slate-400 text-sm italic">No blockers reported.</p>}
              </div>
            </section>
          </div>
        </div>

        {/* RIGHT — Smart summary */}
        <div className="bg-white rounded-[26px] border border-black/10 shadow-sm flex flex-col relative overflow-hidden" style={{ minHeight: '400px' }}>
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                <Sparkles size={18} style={{ color: accentColor }} />
              </div>
              <div>
                <h3 className="font-semibold tracking-tight text-[15px] text-slate-900">Smart summary</h3>
                <p className="text-sm text-slate-500">{currentTemplate.label} · Ollama3</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
              <Clock size={14} />
              Last 7 days
            </div>
          </div>

          <div className="overflow-y-auto p-6 max-h-[60vh] lg:max-h-none lg:flex-1">
            {reportText ? (
              <div className="text-[15px] text-slate-700 leading-[24px] space-y-2">
                {formattedReport.split('\n').map((line, idx) => {
                  const trimmed = line.trim();
                  if (!trimmed) return null;

                  if (isHeading(trimmed)) {
                    return (
                      <div key={idx} className="text-slate-900 font-bold text-[16px] pt-4 first:pt-0">
                        {trimmed}
                      </div>
                    );
                  }

                  if (trimmed.startsWith('•')) {
                    return (
                      <div key={idx} className="flex gap-3 pl-2">
                        <div className="text-slate-300 font-bold mt-0.5">•</div>
                        <div>{trimmed.slice(1).trim()}</div>
                      </div>
                    );
                  }

                  return <div key={idx}>{trimmed}</div>;
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-6 gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <Sparkles size={20} style={{ color: accentColor }} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-base tracking-tight">Ready when you are.</h4>
                  <p className="text-slate-400 text-sm mt-1">
                    Select a format above and click Generate.
                  </p>
                </div>

                {logs.length < 3 && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 px-4 py-2 rounded-full bg-amber-50/80 border border-amber-100">
                    <AlertTriangle size={14} />
                    Log at least 3 items for best results
                  </div>
                )}
              </div>
            )}
          </div>

          {reportText && (
            <div className="px-6 py-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
              <span className="font-semibold">Generated with Ollama3 · {currentTemplate.label}</span>
              <span className="font-medium">{new Date().toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
