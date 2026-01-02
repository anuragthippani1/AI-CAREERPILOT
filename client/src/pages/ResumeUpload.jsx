import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { resumeAPI } from '../services/api';

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
    <div className="min-h-screen">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Resume Analysis</h1>
        {!result ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Role (Optional)
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Resume (PDF, TXT, DOC)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
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
                        <FileText className="w-12 h-12 text-blue-600 mx-auto" />
                        <p className="text-gray-900 font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">Click to change file</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                        <p className="text-gray-600">Click to upload or drag and drop</p>
                        <p className="text-sm text-gray-500">PDF, TXT, DOC up to 10MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !file}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
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
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Analysis Complete!</h3>
                <p className="text-sm text-green-700">Redirecting to Skill Gap Analysis...</p>
              </div>
            </div>

            {result.data?.data?.analysis && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Resume Analysis Results</h2>
                
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <p className="text-sm text-gray-600 mb-2">ATS Score</p>
                    <p className="text-4xl font-bold text-blue-600">
                      {Math.round(result.data.data.analysis.atsScore || 0)}%
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6">
                    <p className="text-sm text-gray-600 mb-2">Skills Extracted</p>
                    <p className="text-4xl font-bold text-green-600">
                      {result.data.data.analysis.skills?.length || 0}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Strengths</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {result.data.data.analysis.strengths?.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Areas for Improvement</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {result.data.data.analysis.improvements?.map((improvement, i) => (
                        <li key={i}>{improvement}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Overall Assessment</h3>
                    <p className="text-gray-700">{result.data.data.analysis.overallAssessment}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}


