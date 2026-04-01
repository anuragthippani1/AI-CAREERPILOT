import { useMemo, useState } from 'react';
import {
  BookOpen,
  Briefcase,
  CalendarClock,
  FolderKanban,
  GraduationCap,
  Loader,
  Route,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { roadmapAPI } from '../services/api';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function parseSkills(skillsInput) {
  return skillsInput
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function extractRoadmap(responseBody) {
  if (!responseBody?.success) return null;
  return (
    responseBody?.data?.data?.roadmap ||
    responseBody?.data?.roadmap ||
    responseBody?.roadmap ||
    null
  );
}

function fallbackTimelineFromMilestones(roadmap) {
  const short = asArray(roadmap?.shortTerm).map((m) => m?.title).filter(Boolean);
  const medium = asArray(roadmap?.mediumTerm).map((m) => m?.title).filter(Boolean);
  const long = asArray(roadmap?.longTerm).map((m) => m?.title).filter(Boolean);
  return {
    days30: short.slice(0, 3),
    months3: [...short.slice(3), ...medium].slice(0, 4),
    months6: [...medium, ...long].slice(0, 5),
    summary: roadmap?.overallTimeline || 'Roadmap generated based on your profile.',
  };
}

function TimelineColumn({ title, progress, items }) {
  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <span className="text-xs text-white/60">{progress}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-white/10 border border-white/10 overflow-hidden">
          <div className="h-2 bg-primary-500/80 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <ul className="mt-4 space-y-2">
          {items.length > 0 ? (
            items.map((item, i) => (
              <li key={`${title}-${i}`} className="text-sm text-white/80 leading-relaxed">
                - {item}
              </li>
            ))
          ) : (
            <li className="text-sm text-white/60">No milestones yet.</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function AIRoadmapGenerator() {
  const [form, setForm] = useState({
    currentRoleOrEducation: '',
    dreamRole: '',
    currentSkills: '',
    experienceLevel: 'intermediate',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(null);

  const timeline = useMemo(() => {
    if (!generated) return null;
    return generated.finalTimeline || fallbackTimelineFromMilestones(generated);
  }, [generated]);

  const onChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        currentRoleOrEducation: form.currentRoleOrEducation.trim(),
        dreamRole: form.dreamRole.trim(),
        targetRole: form.dreamRole.trim(),
        currentSkills: parseSkills(form.currentSkills),
        experienceLevel: form.experienceLevel,
      };

      const response = await roadmapAPI.generate(payload);
      const roadmap = extractRoadmap(response?.data);

      if (!roadmap) {
        throw new Error(response?.data?.error || 'Unable to generate roadmap right now.');
      }

      setGenerated(roadmap);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          'Failed to generate roadmap. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const currentPosition = generated?.currentPositionAnalysis || {};
  const skillGap = generated?.skillGap || {};
  const learningPath = asArray(generated?.recommendedLearningPath);
  const projects = asArray(generated?.suggestedProjects);
  const certs = asArray(generated?.certificationsAndResources);

  return (
    <div className="cp-page">
      <main className="cp-page-inner max-w-6xl space-y-6">
        <PageHeader
          title="AI Career Roadmap Generator"
          description="Get a personalized roadmap with skill gap analysis, learning path, projects, certifications, and a 30-day to 6-month timeline."
        />

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleGenerate} className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="current-role" className="block text-sm text-white/80 mb-2">
                  Current role or education
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" aria-hidden="true" />
                  <input
                    id="current-role"
                    className="cp-input pl-9"
                    placeholder="e.g., Final-year CS student / Frontend Developer"
                    value={form.currentRoleOrEducation}
                    onChange={onChange('currentRoleOrEducation')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="dream-role" className="block text-sm text-white/80 mb-2">
                  Dream role
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" aria-hidden="true" />
                  <input
                    id="dream-role"
                    className="cp-input pl-9"
                    placeholder="e.g., Senior Backend Engineer"
                    value={form.dreamRole}
                    onChange={onChange('dreamRole')}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="experience-level" className="block text-sm text-white/80 mb-2">
                  Experience level
                </label>
                <select
                  id="experience-level"
                  className="cp-input"
                  value={form.experienceLevel}
                  onChange={onChange('experienceLevel')}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="current-skills" className="block text-sm text-white/80 mb-2">
                  Current skills (comma-separated)
                </label>
                <textarea
                  id="current-skills"
                  rows={3}
                  className="cp-input"
                  placeholder="JavaScript, React, Node.js, SQL"
                  value={form.currentSkills}
                  onChange={onChange('currentSkills')}
                />
              </div>

              {error ? (
                <div role="alert" className="md:col-span-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <div className="md:col-span-2">
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" aria-hidden="true" />
                      Generating roadmap...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" aria-hidden="true" />
                      Generate AI Roadmap
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {generated ? (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Route className="w-5 h-5 text-primary-300" aria-hidden="true" />
                    1. Current Position Analysis
                  </h2>
                  <p className="text-sm text-white/80 mt-3">{currentPosition.summary || 'No summary available.'}</p>
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-white">Strengths</h3>
                    <ul className="mt-2 space-y-1 text-sm text-white/75">
                      {asArray(currentPosition.strengths).length > 0 ? (
                        asArray(currentPosition.strengths).map((s, i) => <li key={`strength-${i}`}>- {s}</li>)
                      ) : (
                        <li>- No strengths listed.</li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary-300" aria-hidden="true" />
                    2. Skill Gap
                  </h2>
                  {[
                    ['Critical', asArray(skillGap.critical)],
                    ['Important', asArray(skillGap.important)],
                    ['Foundational', asArray(skillGap.foundational)],
                  ].map(([title, items]) => (
                    <div className="mt-4" key={title}>
                      <h3 className="text-sm font-semibold text-white">{title}</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {items.length > 0 ? (
                          items.map((item, i) => (
                            <span key={`${title}-${i}`} className="text-xs px-2 py-1 rounded-md border border-white/15 bg-white/5 text-white/80">
                              {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-white/60">No items listed.</span>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary-300" aria-hidden="true" />
                  3. Recommended Learning Path
                </h2>
                <div className="mt-4 grid md:grid-cols-3 gap-4">
                  {learningPath.length > 0 ? (
                    learningPath.map((item, i) => (
                      <div key={`learning-${i}`} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                        <p className="text-sm text-white/75 mt-2">{item.focus}</p>
                        <p className="text-xs text-primary-200 mt-2">{item.estimatedDuration}</p>
                        <ul className="mt-2 space-y-1 text-xs text-white/70">
                          {asArray(item.resources).slice(0, 4).map((r, j) => (
                            <li key={`learning-resource-${i}-${j}`}>- {r}</li>
                          ))}
                        </ul>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/60">No learning path items returned.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FolderKanban className="w-5 h-5 text-primary-300" aria-hidden="true" />
                    4. Suggested Projects
                  </h2>
                  <div className="mt-4 space-y-3">
                    {projects.length > 0 ? (
                      projects.map((project, i) => (
                        <div key={`project-${i}`} className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <h3 className="text-sm font-semibold text-white">{project.title}</h3>
                          <p className="text-sm text-white/75 mt-1">{project.description}</p>
                          <p className="text-xs text-primary-200 mt-2">
                            {project.difficulty} • {project.timeline}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-white/60">No project suggestions returned.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary-300" aria-hidden="true" />
                    5. Certifications and Resources
                  </h2>
                  <div className="mt-4 space-y-3">
                    {certs.length > 0 ? (
                      certs.map((cert, i) => (
                        <div key={`cert-${i}`} className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <h3 className="text-sm font-semibold text-white">{cert.name}</h3>
                          <p className="text-xs text-primary-200 mt-1">{cert.provider}</p>
                          <p className="text-sm text-white/75 mt-2">{cert.reason}</p>
                          <p className="text-xs text-white/60 mt-2">{cert.timeline}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-white/60">No certification suggestions returned.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-primary-300" aria-hidden="true" />
                  6. Final Timeline
                </h2>
                <p className="text-sm text-white/75 mt-2">{timeline?.summary || 'Timeline generated successfully.'}</p>
                <div className="mt-4 grid md:grid-cols-3 gap-4">
                  <TimelineColumn title="30 days" progress={30} items={asArray(timeline?.days30)} />
                  <TimelineColumn title="3 months" progress={60} items={asArray(timeline?.months3)} />
                  <TimelineColumn title="6 months" progress={100} items={asArray(timeline?.months6)} />
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </main>
    </div>
  );
}

