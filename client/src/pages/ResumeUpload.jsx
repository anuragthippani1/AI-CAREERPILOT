import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { resumeAPI } from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export default function ResumeUpload() {
  const navigate = useNavigate();
  const [userId] = useState(1);
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a resume file to analyze');
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
      
      // Auto-navigate to skills after successful analysis
      setTimeout(() => {
        navigate('/skills');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze resume');
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
                  Upload Resume (PDF, TXT, DOC)
                </label>
                <div className="border border-dashed border-white/15 rounded-xl p-8 text-center hover:border-white/25 transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileChange}
                    accept=".pdf,.txt,.doc,.docx"
                    className="hidden"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {file ? (
                      <div className="space-y-2">
                        <FileText className="w-12 h-12 text-primary-300 mx-auto" />
                        <p className="text-white font-medium">{file.name}</p>
                        <p className="text-sm text-white/60">Click to change file</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-12 h-12 text-white/40 mx-auto" />
                        <p className="text-white/70">Click to upload (PDF, TXT, DOC)</p>
                        <p className="text-sm text-white/50">Tip: include impact and metrics for strongest results.</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

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
                <p className="text-sm text-white/70">Next: Skill Gap Analysis (redirecting shortly)…</p>
              </div>
            </div>

            {result.data?.data?.analysis && (
              <Card>
                <CardContent className="pt-6">
                <h2 className="text-xl font-semibold text-white mb-6">Summary</h2>
                
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                    <p className="text-sm text-white/70 mb-2">ATS score</p>
                    <p className="text-4xl font-semibold text-white">
                      {Math.round(result.data.data.analysis.atsScore || 0)}%
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                    <p className="text-sm text-white/70 mb-2">Skills extracted</p>
                    <p className="text-4xl font-semibold text-white">
                      {result.data.data.analysis.skills?.length || 0}
                    </p>
                  </div>
                </div>

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
                    <h3 className="font-semibold text-white mb-2">Improvements</h3>
                    <ul className="list-disc list-inside space-y-1 text-white/75">
                      {result.data.data.analysis.improvements?.map((improvement, i) => (
                        <li key={i}>{improvement}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white mb-2">Assessment</h3>
                    <p className="text-white/75">{result.data.data.analysis.overallAssessment}</p>
                  </div>
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


