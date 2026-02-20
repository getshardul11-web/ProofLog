import React, { useState, useEffect } from 'react';
import { db } from '../services/storage';
import { WorkLog, Status, ACCENT_COLORS } from '../types';
import { generateSmartReport } from '../services/gemini';
import {
  Sparkles,
  Copy,
  Check,
  FileText,
  Clock,
  AlertTriangle,
  Mail,
  NotepadText,
} from 'lucide-react';

const Reports: React.FC = () => {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [reportText, setReportText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notionCopied, setNotionCopied] = useState(false);

  const user = db.getUser();
  const accentColor =
    ACCENT_COLORS[user.accentColor as keyof typeof ACCENT_COLORS] || '#F4C430';

  useEffect(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const recentLogs = db
      .getLogs()
      .filter((l) => l.createdAt > sevenDaysAgo)
      .sort((a, b) => b.createdAt - a.createdAt);

    setLogs(recentLogs);
  }, []);

  const isHeading = (line: string) => {
    const t = line.trim().toLowerCase();

    return (
      t === 'overview' ||
      t === 'key accomplishments' ||
      t === 'ongoing work' ||
      t === 'risks & blockers' ||
      t === 'risks and blockers' ||
      t === 'next steps' ||
      t === 'blockers' ||
      t === 'wins' ||
      t === 'in progress'
    );
  };

  const stripMarkdown = (text: string) => {
    return text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\*\*/g, '')
      .replace(/###/g, '')
      .replace(/\*/g, '')
      .replace(/_/g, '')
      .replace(/\r\n/g, '\n')
      .trim();
  };

  const formatReportText = (raw: string) => {
    if (!raw) return '';

    let text = stripMarkdown(raw);

    text = text.replace(
      /here is a professional summary[\s\S]*?impact\.\s*/gi,
      ''
    );

    text = text.replace(/---/g, '');

    text = text
      .replace(/1\.\s*/g, '')
      .replace(/2\.\s*/g, '')
      .replace(/3\.\s*/g, '');

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
      setTimeout(() => reject(new Error('Request timed out')), ms)
    );

    return Promise.race([promise, timeoutPromise]);
  };

  const handleGenerateAI = async () => {
    if (logs.length === 0) return;

    setIsGenerating(true);
    setReportText('');

    try {
      // LIMIT to prevent Gemini choking
      const safeLogs = logs
        .slice(0, 25) // max 25 logs only
        .map((l) => ({
          title: l.title,
          impact: l.impact,
          status: l.status,
          timeSpent: l.timeSpent,
          category: l.category,
          createdAt: l.createdAt,
        }));

      console.log('Sending logs to Gemini:', safeLogs);

      const result = await runWithTimeout(generateSmartReport(safeLogs as any), 25000);

      if (!result || typeof result !== 'string') {
        throw new Error('Gemini returned empty response');
      }

      setReportText(result);
    } catch (err: any) {
      console.error('Report generation failed:', err);

      setReportText(
        `Can't generate report right now.\n\nReason: ${
          err?.message || 'Unknown error'
        }\n\nTry again in a minute.`
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

    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`,
      '_blank'
    );
  };

  const handleNotionExport = async () => {
    if (!reportText) return;

    const formatted = getReportForExport();
    await navigator.clipboard.writeText(formatted);

    setNotionCopied(true);
    setTimeout(() => setNotionCopied(false), 2500);

    const notionPage =
      user.notionReportsUrl ||
      'https://www.notion.so/shardulgupta/Week-14-3009c6509142809595c0c1e3eb4db083?source=copy_link';

    window.open(notionPage, '_blank');
  };

  const wins = logs.filter((l) => l.status === Status.DONE);
  const ongoing = logs.filter((l) => l.status === Status.IN_PROGRESS);
  const blockers = logs.filter((l) => l.status === Status.BLOCKED);

  const formattedReport = reportText ? formatReportText(reportText) : '';

  return (
    <div className="relative w-full h-[calc(100vh-150px)] flex flex-col gap-5 overflow-hidden">
      {/* TOP ACTION BAR */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <p className="text-[20px] font-semibold text-slate-900 tracking-tight">
          Your reports, sir.
        </p>

        <div className="w-full lg:w-[calc(50%-16px)] flex gap-3">
          <button
            onClick={handleGenerateAI}
            disabled={isGenerating || logs.length === 0}
            className="flex-[1.3] flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-black/15 bg-white/70 backdrop-blur-xl whitespace-nowrap"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                <span className="text-slate-700">Analyzing…</span>
              </>
            ) : (
              <>
                <Sparkles size={18} style={{ color: accentColor }} />
                <span className="text-slate-900 tracking-tight">
                  Generate smart report
                </span>
              </>
            )}
          </button>

          <button
            onClick={handleCopy}
            disabled={!reportText}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-black/15 bg-white/70 backdrop-blur-xl whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check size={18} className="text-emerald-600" />
                Copied
              </>
            ) : (
              <>
                <Copy size={18} className="text-slate-500" />
                Copy report
              </>
            )}
          </button>

          <button
            onClick={handleDraftEmail}
            disabled={!reportText}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-black/15 bg-white/70 backdrop-blur-xl whitespace-nowrap"
          >
            <Mail size={18} className="text-slate-500" />
            Draft email
          </button>

          <button
            onClick={handleNotionExport}
            disabled={!reportText}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-black/15 bg-white/70 backdrop-blur-xl whitespace-nowrap"
          >
            <NotepadText size={18} className="text-slate-500" />
            {notionCopied ? 'Copied for Notion' : 'Notion export'}
          </button>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 overflow-hidden items-stretch">
        {/* LEFT */}
        <div className="bg-white/60 backdrop-blur-2xl rounded-[32px] border border-black/15 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-black/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/70 border border-black/15 shadow-sm flex items-center justify-center">
                <FileText size={18} className="text-slate-600" />
              </div>

              <div>
                <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">
                  Raw breakdown
                </h3>
                <p className="text-sm text-slate-500">
                  Last 7 days ({logs.length} logs)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
              <Clock size={14} />
              Weekly logs
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Wins */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h4 className="font-semibold text-emerald-700 text-sm tracking-tight">
                  Wins
                </h4>
              </div>

              <div className="space-y-3">
                {wins.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-2xl bg-white/70 border border-black/10 shadow-sm"
                  >
                    <p className="font-semibold text-slate-900 text-sm tracking-tight">
                      {log.title}
                    </p>
                    <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                      {log.impact}
                    </p>
                  </div>
                ))}

                {wins.length === 0 && (
                  <p className="text-slate-400 text-sm italic">
                    No completed wins logged yet.
                  </p>
                )}
              </div>
            </section>

            {/* In Progress */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <h4 className="font-semibold text-sky-700 text-sm tracking-tight">
                  In progress
                </h4>
              </div>

              <div className="space-y-3">
                {ongoing.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-2xl bg-white/70 border border-black/10 shadow-sm"
                  >
                    <p className="font-semibold text-slate-900 text-sm tracking-tight">
                      {log.title}
                    </p>
                    <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                      {log.impact}
                    </p>
                  </div>
                ))}

                {ongoing.length === 0 && (
                  <p className="text-slate-400 text-sm italic">
                    No ongoing work logged.
                  </p>
                )}
              </div>
            </section>

            {/* Blockers */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h4 className="font-semibold text-rose-700 text-sm tracking-tight">
                  Blockers
                </h4>
              </div>

              <div className="space-y-3">
                {blockers.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-2xl bg-white/70 border border-black/10 shadow-sm"
                  >
                    <p className="font-semibold text-slate-900 text-sm tracking-tight">
                      {log.title}
                    </p>
                    <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                      {log.impact}
                    </p>
                  </div>
                ))}

                {blockers.length === 0 && (
                  <p className="text-slate-400 text-sm italic">
                    No blockers reported.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* RIGHT */}
        <div className="bg-white/60 backdrop-blur-2xl rounded-[32px] border border-black/15 shadow-sm flex flex-col relative overflow-hidden">
          <div
            className="absolute top-0 right-0 w-[800px] h-[950px] rounded-full blur-3xl opacity-25 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${accentColor} 0%, rgba(255,255,255,0) 70%)`,
            }}
          />

          <div className="p-6 border-b border-black/10 flex items-center justify-between relative z-10">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/70 border border-black/15 shadow-sm flex items-center justify-center">
                <Sparkles size={18} style={{ color: accentColor }} />
              </div>

              <div>
                <h3 className="font-semibold tracking-tight text-[15px] text-slate-900">
                  Smart summary
                </h3>
                <p className="text-sm text-slate-500">
                  Generated by Gemini from your logs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
              <Clock size={14} />
              Last 7 days
            </div>
          </div>

          <div className="flex-1 relative z-10 overflow-y-auto p-6">
            {reportText ? (
              <div className="text-[15px] text-slate-700 leading-[24px] space-y-2">
                {formattedReport.split('\n').map((line, idx) => {
                  const trimmed = line.trim();
                  if (!trimmed) return null;

                  if (isHeading(trimmed)) {
                    return (
                      <div
                        key={idx}
                        className="text-slate-900 font-bold text-[16px] pt-4"
                      >
                        {trimmed}
                      </div>
                    );
                  }

                  if (trimmed.startsWith('•')) {
                    return (
                      <div key={idx} className="flex gap-3">
                        <div className="text-slate-400 font-bold">•</div>
                        <div>{trimmed.slice(1).trim()}</div>
                      </div>
                    );
                  }

                  return <div key={idx}>{trimmed}</div>;
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <h4 className="font-semibold text-slate-900 text-lg tracking-tight">
                  Ready when you are.
                </h4>

                {logs.length < 3 && (
                  <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-amber-700 px-4 py-2 rounded-full bg-amber-50/80 border border-amber-100">
                    <AlertTriangle size={14} />
                    Log at least 3 items for best results
                  </div>
                )}
              </div>
            )}
          </div>

          {reportText && (
            <div className="px-6 py-4 border-t border-black/10 text-xs text-slate-500 flex justify-between items-center relative z-10">
              <span className="font-semibold">Generated with Gemini</span>
              <span className="font-medium">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
