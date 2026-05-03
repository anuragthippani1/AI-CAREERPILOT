import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, Loader, Sparkles, ArrowRight, X, CloudUpload } from 'lucide-react';
import { resumeAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import ResumeMetricCard from '../components/resume/ResumeMetricCard';

function getExtension(name = '') {
  const safe = String(name || '');
  const idx = safe.lastIndexOf('.');
  if (idx === -1) return '';
  return safe.slice(idx + 1).toLowerCase();
}

function isSupportedResumeFile(file) {
  if (!file) return false;
  const ext = getExtension(file.name);
  return ext === 'pdf' || ext === 'txt' || ext === 'doc' || ext === 'docx';
}

export default function ResumeUpload() {
  const navigate = useNavigate();
  const { push: pushToast } = useToast();
  const [userId] = useState(1);
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');

  const fileLabel = useMemo(() => {
    if (!file) return 'PDF, TXT, DOC, DOCX';
    const sizeMb = file.size ? (file.size / (1024 * 1024)) : 0;
    return `${file.name}${sizeMb ? ` · ${sizeMb.toFixed(sizeMb >= 10 ? 0 : 1)} MB` : ''}`;
  }, [file]);

  useEffect(() => {
    if (pdfPreviewUrl) {
      return () => URL.revokeObjectURL(pdfPreviewUrl);
    }
    return undefined;
  }, [pdfPreviewUrl]);

  useEffect(() => {
    if (file && getExtension(file.name) === 'pdf') {
      const nextUrl = URL.createObjectURL(file);
      setPdfPreviewUrl(nextUrl);
      return;
    }

    setPdfPreviewUrl('');
  }, [file]);

  const setSelectedFile = (nextFile) => {
    if (!nextFile) return;
    if (!isSupportedResumeFile(nextFile)) {
      setFile(null);
      setError('Unsupported file type. Please upload a PDF, TXT, DOC, or DOCX resume.');
      return;
    }
    // 12MB soft limit to avoid large uploads on free tiers.
    if (nextFile.size && nextFile.size > 12 * 1024 * 1024) {
      setFile(null);
      setError('File is too large. Please upload a resume under 12MB.');
      return;
    }
    setFile(nextFile);
    setError(null);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setSelectedFile(selectedFile);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPdfPreviewUrl('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    const dropped = event.dataTransfer?.files?.[0];
    if (dropped) setSelectedFile(dropped);
  };

  const onDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const onDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a resume file to analyze');
      pushToast({ variant: 'error', title: 'Upload required', message: 'Please choose a resume file to analyze.' });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('userId', userId);
      if (file) {
        formData.append('resume', file);
      }
      if (targetRole) {
        formData.append('targetRole', targetRole);
      }

      const response = await resumeAPI.analyze(formData);
      setResult(response.data);
      pushToast({ variant: 'success', title: 'Resume analyzed', message: 'Your resume intelligence report is ready.' });
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to analyze resume';
      setError(msg);
      pushToast({ variant: 'error', title: 'Resume analysis failed', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cp-page">
      <main className="cp-page-inner max-w-4xl">
        <PageHeader
          title="Resume analysis"
          description="Upload your resume to get ATS signals, strengths, and a clear next-step plan."
        />
        {!result ? (
          <Card className="mt-6">
            <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Target Role (Optional)
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Backend Software Engineer"
                  className="cp-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Upload resume ({'PDF, TXT, DOC, DOCX'})
                </label>
                <div
                  className={`border border-dashed rounded-xl p-8 text-center transition-colors ${
                    isDragOver
                      ? 'border-primary-300/60 bg-primary-500/10'
                      : 'border-white/15 hover:border-white/25'
                  }`}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragEnter={onDragOver}
                  onDragLeave={onDragLeave}
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click?.()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click?.();
                    }
                  }}
                  aria-label="Upload resume"
                >
                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileChange}
                    accept=".pdf,.txt,.doc,.docx"
                    className="hidden"
                    ref={fileInputRef}
                  />
                  {file ? (
                    <div className="space-y-2">
                      <FileText className="w-12 h-12 text-primary-300 mx-auto" />
                      <p className="text-white font-medium">{fileLabel}</p>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <Button type="button" variant="secondary" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click?.(); }}>
                          <CloudUpload className="w-4 h-4" />
                          Change file
                        </Button>
                        <Button type="button" variant="secondary" onClick={(e) => { e.stopPropagation(); clearFile(); }}>
                          <X className="w-4 h-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 text-white/40 mx-auto" />
                      <p className="text-white/80 font-medium">Drag & drop your resume here</p>
                      <p className="text-sm text-white/60">or click to browse ({'PDF, TXT, DOC, DOCX'})</p>
                      <p className="text-sm text-white/50">Tip: include impact and metrics for strongest results.</p>
                    </div>
                  )}
                </div>
              </div>

              {file && getExtension(file.name) === 'pdf' ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">PDF preview</div>
                        <div className="text-xs text-white/60 mt-1">
                          Quick check before analyzing.
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 overflow-hidden h-[520px]">
                      {pdfPreviewUrl ? (
                        <iframe
                          title="Resume PDF preview"
                          src={pdfPreviewUrl}
                          className="w-full h-full"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-sm text-white/60">
                          Generating preview…
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {error && (
                <div className="bg-red-500/10 border border-red-500/25 rounded-lg p-4 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-300 mt-0.5" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              <Button type="submit" disabled={loading || !file} className="w-full">
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Analyzing Resume...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    Analyze Resume
                  </>
                )}
              </Button>
            </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="glass-card border border-green-500/25 rounded-xl p-6 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-300" />
              <div>
                <h3 className="font-semibold text-white">Analysis complete</h3>
                <p className="text-sm text-white/70">Review the extracted signals below, then continue into skill gap analysis.</p>
              </div>
            </div>

            {result.data?.data?.analysis && (
              <Card>
                <CardContent className="pt-6">
                <h2 className="text-xl font-semibold text-white mb-6">Resume intelligence report</h2>
                
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <ResumeMetricCard
                    label="ATS score"
                    value={`${Math.round(result.data.data.analysis.atsScore || 0)}%`}
                    hint="How well your resume is structured for screening systems."
                  />
                  <ResumeMetricCard
                    label="Career readiness"
                    value={`${Math.round(result.data.data.analysis.careerReadinessScore || 0)}%`}
                    hint="A directional readiness estimate for your target role."
                  />
                  <ResumeMetricCard
                    label="Skills extracted"
                    value={result.data.data.analysis.skills?.length || 0}
                    hint="Parsed from projects, experience, and education."
                  />
                </div>

                <div className="rounded-xl border border-primary-400/20 bg-primary-500/10 p-5 mb-6">
                  <div className="flex items-center gap-2 text-primary-100">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-semibold">Improved summary</span>
                  </div>
                  <p className="mt-3 text-sm text-white/80">
                    {result.data.data.analysis.improvedSummary || 'No rewritten summary available.'}
                  </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-white mb-2">Strengths</h3>
                      <ul className="list-disc list-inside space-y-1 text-white/75">
                        {result.data.data.analysis.strengths?.map((strength, i) => (
                          <li key={i}>{strength}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-white mb-2">Weaknesses</h3>
                      <ul className="list-disc list-inside space-y-1 text-white/75">
                        {result.data.data.analysis.weaknesses?.map((weakness, i) => (
                          <li key={i}>{weakness}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-white mb-2">Improvements</h3>
                      <ul className="list-disc list-inside space-y-1 text-white/75">
                        {result.data.data.analysis.improvements?.map((improvement, i) => (
                          <li key={i}>{improvement}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-white mb-2">Missing keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {(result.data.data.analysis.missingKeywords || []).map((keyword) => (
                          <span
                            key={keyword}
                            className="px-3 py-1 rounded-full border border-amber-400/25 bg-amber-400/10 text-sm text-amber-100"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-white mb-2">Projects</h3>
                      <div className="space-y-3">
                        {(result.data.data.analysis.projects || []).length > 0 ? (
                          result.data.data.analysis.projects.map((project, i) => (
                            <div key={`${project.name}-${i}`} className="rounded-xl border border-white/10 bg-white/5 p-4">
                              <div className="font-medium text-white">{project.name}</div>
                              <p className="mt-1 text-sm text-white/70">{project.impact}</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {(project.technologies || []).map((tech) => (
                                  <span key={tech} className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-white/65">
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-white/60">No portfolio-grade projects were confidently extracted.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-white mb-2">Certifications</h3>
                      <div className="space-y-2">
                        {(result.data.data.analysis.certifications || []).length > 0 ? (
                          result.data.data.analysis.certifications.map((cert, i) => (
                            <div key={`${cert.name}-${i}`} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                              <span className="font-medium text-white">{cert.name}</span>
                              {cert.issuer ? ` · ${cert.issuer}` : ''}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-white/60">No certifications detected.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-white mb-2">Assessment</h3>
                      <p className="text-white/75">{result.data.data.analysis.overallAssessment}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Button onClick={() => navigate('/skills')} className="sm:flex-1">
                    Continue to skill gap analysis
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button variant="secondary" onClick={() => navigate('/dashboard')} className="sm:flex-1">
                    Return to dashboard
                  </Button>
                </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

