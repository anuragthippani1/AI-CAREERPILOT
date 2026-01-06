import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  ChevronDown,
  Lock,
  Map as MapIcon,
  Target,
  Timer,
  TrendingUp,
} from 'lucide-react';
import {
  interviewAPI,
  practiceAPI,
  resumeAPI,
  roadmapAPI,
  skillsAPI,
} from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { PageSkeleton } from '../components/ui/Skeleton';

function getUserIdFromStorageOrUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('userId');
    const fromStorage =
      localStorage.getItem('careerpilot_user_id') ||
      localStorage.getItem('careerpilotUserId') ||
      localStorage.getItem('userId');

    const raw = (fromUrl || fromStorage || '').toString().trim();
    const id = parseInt(raw, 10);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

function taskKey(userId) {
  return `careerpilot_roadmap_tasks_v1_${userId}`;
}

function loadRoadmapTaskState(userId) {
  try {
    const raw = localStorage.getItem(taskKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveRoadmapTaskState(userId, state) {
  try {
    localStorage.setItem(taskKey(userId), JSON.stringify(state));
  } catch {
    // ignore
  }
}

function slugify(s) {
  return (s || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function percent(n) {
  if (!Number.isFinite(n)) return null;
  return clamp(Math.round(n), 0, 100);
}

function guessHrefFromText(title, description) {
  const t = `${title || ''} ${description || ''}`.toLowerCase();
  if (t.includes('resume')) return '/resume';
  if (t.includes('skill')) return '/skills';
  if (t.includes('coding') || t.includes('leetcode') || t.includes('dsa') || t.includes('algorithm')) return '/practice';
  if (t.includes('interview') || t.includes('system design') || t.includes('behavioral')) return '/interview';
  return null;
}

function parseEffortToWeeks(effort) {
  const raw = (effort || '').toString().toLowerCase();
  if (!raw) return { weeks: null, scale: 'unknown' };

  const hasMonth = /month/.test(raw);
  const hasWeek = /week/.test(raw);
  const hasDay = /day/.test(raw);
  const hasHour = /(hour|hrs?\b)/.test(raw);
  const hasMin = /(min|minutes)/.test(raw);

  const nums = raw.match(/\d+(\.\d+)?/g)?.map((n) => Number(n)).filter((n) => Number.isFinite(n)) || [];
  const min = nums.length > 0 ? Math.min(...nums) : null;
  const max = nums.length > 0 ? Math.max(...nums) : null;

  if (hasMonth) {
    const a = min != null ? min * 4 : null;
    const b = max != null ? max * 4 : null;
    return { weeks: a != null && b != null ? (a + b) / 2 : a ?? b, scale: 'months' };
  }
  if (hasWeek) {
    return { weeks: min != null && max != null ? (min + max) / 2 : min ?? max, scale: 'weeks' };
  }
  if (hasDay) {
    const a = min != null ? min / 7 : null;
    const b = max != null ? max / 7 : null;
    return { weeks: a != null && b != null ? (a + b) / 2 : a ?? b, scale: 'days' };
  }
  if (hasHour) return { weeks: 1 / 7, scale: 'hours' }; // normalize: ~1 day
  if (hasMin) return { weeks: 1 / 14, scale: 'minutes' }; // normalize: ~0.5 day
  return { weeks: null, scale: 'unknown' };
}

function formatEffortForPhase(phaseId, effort) {
  const raw = (effort || '').toString().trim();
  const parsed = parseEffortToWeeks(raw);

  // Foundations: minutes → weeks (no hours/months shown)
  if (phaseId === 'foundations') {
    if (parsed.scale === 'months') return raw.replace(/months?/gi, 'weeks').replace(/\b(\d+)\b/g, (n) => `${Number(n) * 4}`);
    if (parsed.scale === 'hours') return '1 day';
    return raw || '1–2 weeks';
  }

  // Problem Solving & Interview Readiness: weeks-scale only (avoid minutes/hours)
  if (phaseId === 'problem-solving' || phaseId === 'interview-readiness') {
    if (!raw) return '1 week';
    if (parsed.scale === 'weeks') return raw;
    if (parsed.scale === 'months') return raw.replace(/months?/gi, 'weeks').replace(/\b(\d+)\b/g, (n) => `${Number(n) * 4}`);
    return '1 week';
  }

  // Placement Execution: weeks/months ok, but avoid minutes/hours
  if (phaseId === 'placement-execution') {
    if (!raw) return '2–4 weeks';
    if (parsed.scale === 'minutes' || parsed.scale === 'hours') return '1–2 weeks';
    return raw;
  }

  return raw || '—';
}

function buildPhases({ roadmapJson, resume, skills, interviewSummary, practiceProgress, taskState }) {
  const phasesMeta = [
    {
      id: 'foundations',
      title: 'Foundations',
      purpose: 'Establish a baseline and remove the biggest blockers.',
    },
    {
      id: 'problem-solving',
      title: 'Problem Solving',
      purpose: 'Build DSA fluency and speed through consistent practice.',
    },
    {
      id: 'interview-readiness',
      title: 'Interview Readiness',
      purpose: 'Practice interviews and close feedback loops.',
    },
    {
      id: 'placement-execution',
      title: 'Placement Execution',
      purpose: 'Turn readiness into offers with focused execution.',
    },
  ];

  const buckets = {
    foundations: [],
    'problem-solving': [],
    'interview-readiness': [],
    'placement-execution': [],
  };

  const hasResume = !!resume;
  const hasSkills = Array.isArray(skills) && skills.length > 0;
  const hasInterview = (interviewSummary?.completed || 0) > 0;
  const hasPractice =
    (practiceProgress?.solvedCount || 0) > 0 || (practiceProgress?.totalAttempts || 0) > 0;

  const roadmapText = [
    ...((roadmapJson?.shortTerm || []).map((m) => `${m?.title || ''} ${m?.description || ''}`)),
    ...((roadmapJson?.mediumTerm || []).map((m) => `${m?.title || ''} ${m?.description || ''}`)),
    ...((roadmapJson?.longTerm || []).map((m) => `${m?.title || ''} ${m?.description || ''}`)),
  ]
    .join(' ')
    .toLowerCase();

  const roadmapHasDsaBasics =
    /(arrays|strings|hash|two pointers|sliding window|big[-\s]?o|complexity)/.test(roadmapText) ||
    /((dsa|data structure|algorithm).{0,40}(basic|basics|fundamental|foundation|core))/.test(roadmapText);

  const roadmapHasAiBasics =
    /((ai|machine learning|ml|llm|prompt).{0,40}(basic|basics|fundamental|foundation|core))/.test(roadmapText) ||
    /(llm|prompting|transformer|embedding|evaluation)/.test(roadmapText);

  // Required personalization (safe, existing data only)
  if (!hasResume) {
    buckets.foundations.push({
      id: 'core:upload-resume',
      title: 'Upload your resume',
      why: 'Personalization depends on your experience and skills signal.',
      effort: '5–10 min',
      outcome: 'Roadmap becomes tailored to your background and target role.',
      href: '/resume',
    });
  }

  // Foundations must stay "blocker removal": resume + skill-gap identification + core basics.
  if (!hasSkills) {
    buckets.foundations.push({
      id: 'core:run-skill-gap',
      title: 'Run skill gap analysis',
      why: 'Identifies the highest-leverage gaps for your target role.',
      effort: '10–15 min',
      outcome: 'A prioritized list of what to learn next.',
      href: '/skills',
    });
  } else {
    buckets.foundations.push({
      id: 'core:review-skill-gap',
      title: 'Review your top skill gaps',
      why: 'Keeps your roadmap anchored to the highest ROI gaps.',
      effort: '10 min',
      outcome: 'A clear priority list for the next phase.',
      href: '/skills',
    });
  }

  if (!roadmapHasDsaBasics || !hasPractice) {
    buckets.foundations.push({
      id: 'core:dsa-basics',
      title: 'Core DSA basics refresh',
      why: 'A strong foundation prevents avoidable mistakes later.',
      effort: '1–2 weeks',
      outcome: 'Confidence with arrays/strings/hashing and complexity basics.',
      href: '/practice',
    });
  }

  if (!roadmapHasAiBasics) {
    buckets.foundations.push({
      id: 'core:ai-basics',
      title: 'Core AI fundamentals (for interviews)',
      why: 'Helps you explain AI concepts clearly without overcomplicating.',
      effort: '1 week',
      outcome: 'You can articulate LLM basics, prompting, and tradeoffs.',
      href: '/interview',
    });
  }

  buckets['problem-solving'].push({
    id: 'core:practice-3',
    title: 'This week: solve 3 coding challenges',
    why: 'Consistency builds speed and pattern recognition.',
    effort: '1 week',
    outcome: 'Higher accuracy under time pressure.',
    href: '/practice',
  });

  buckets['interview-readiness'].push({
    id: 'core:mock-interview',
    title: 'This week: complete 1 mock interview',
    why: 'Practice speaking improves clarity and signal.',
    effort: '1 week',
    outcome: 'Actionable feedback and a tighter improvement loop.',
    href: '/interview',
  });

  if (hasInterview) {
    buckets['interview-readiness'].push({
      id: 'core:review-feedback',
      title: 'Review your last interview feedback',
      why: 'Your fastest gains come from repeating feedback patterns.',
      effort: '1 week',
      outcome: 'A short list of behaviors/skills to fix next.',
      href: '/interview',
    });
  }

  buckets['placement-execution'].push({
    id: 'core:resume-polish',
    title: 'Polish your resume for the target role',
    why: 'A sharper resume increases interview conversion rate.',
    effort: '1–2 weeks',
    outcome: 'Clearer impact and stronger ATS signals.',
    href: '/resume',
  });

  // Map roadmap milestones into phases with discipline:
  // - Foundations: ONLY resume/skill-gap/core basics (no long-horizon "land role"/advanced items)
  const inferPhase = (m, segment) => {
    const text = `${m?.title || ''} ${m?.description || ''} ${(m?.actionItems || []).join(' ')}`.toLowerCase();

    // Explicit corrections (avoid mis-bucketing)
    if (/land your target role/.test(text)) return 'placement-execution';
    if (/advanced ai/.test(text)) return 'interview-readiness';

    if (/(apply|offer|network|recruit|job|placement)/.test(text)) return 'placement-execution';
    if (/(interview|behavioral|system design|mock)/.test(text)) return 'interview-readiness';
    if (/(leetcode|dsa|algorithm|coding|problems|data structure)/.test(text)) return 'problem-solving';

    // Foundations: strict (resume/skills/basics only)
    if (/(resume|skill gap|skills?|portfolio)/.test(text)) return 'foundations';
    if (/(fundamental|foundation|core|basics)/.test(text)) return 'foundations';

    // Fallback by horizon segment
    if (segment === 'short') return 'foundations';
    if (segment === 'medium') return 'problem-solving';
    return 'interview-readiness';
  };

  const allowMilestoneInFoundations = (m) => {
    const text = `${m?.title || ''} ${m?.description || ''} ${(m?.actionItems || []).join(' ')}`.toLowerCase();
    // Foundations must not contain long-horizon goals or advanced labeling
    if (/(advanced|land your target role|offer|apply|network|job|placement)/.test(text)) return false;
    return /(resume|skill|portfolio|fundamental|foundation|core|basics|dsa|algorithm|data structure)/.test(text);
  };

  const addMilestones = (arr, segment) => {
    if (!Array.isArray(arr)) return;
    arr.slice(0, 5).forEach((m, idx) => {
      const phaseId = inferPhase(m, segment);
      if (phaseId === 'foundations' && !allowMilestoneInFoundations(m)) return;
      const outcome =
        Array.isArray(m?.successMetrics) && m.successMetrics.length > 0
          ? m.successMetrics[0]
          : 'Clear measurable progress on this milestone';
      buckets[phaseId].push({
        id: `milestone:${phaseId}:${segment}:${idx}:${slugify(m?.title || 'milestone')}`,
        title: m?.title || 'Milestone',
        why: m?.description || 'This milestone builds capability for your target role.',
        effort: formatEffortForPhase(
          phaseId,
          m?.timeline || (segment === 'short' ? '1–3 weeks' : segment === 'medium' ? '3–6 weeks' : '6–10 weeks')
        ),
        outcome,
        href: guessHrefFromText(m?.title, m?.description),
      });
    });
  };

  addMilestones(roadmapJson?.shortTerm, 'short');
  addMilestones(roadmapJson?.mediumTerm, 'medium');
  addMilestones(roadmapJson?.longTerm, 'long');

  const dedupeAndLimit = (tasks, limit = 6) => {
    const seen = new Set();
    const out = [];
    for (const t of tasks) {
      if (!t || !t.id) continue;
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      out.push(t);
    }
    return out.slice(0, limit);
  };

  const phases = phasesMeta.map((p) => {
    const tasks = dedupeAndLimit((buckets[p.id] || []).map((t) => ({ ...t, effort: formatEffortForPhase(p.id, t.effort) })));
    const completedCount = tasks.filter((t) => taskState[t.id]?.done).length;
    const totalCount = tasks.length;
    const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    return {
      ...p,
      tasks,
      completedCount,
      totalCount,
      progressLabel: totalCount === 0 ? '—' : `${pct}%`,
    };
  });

  // sequential lock/unlock (only one "active" phase by default)
  const withStatus = phases.map((p, idx) => {
    const prev = phases[idx - 1];
    const prevCompleted = !prev || (prev.totalCount > 0 && prev.completedCount === prev.totalCount) || prev.totalCount === 0;
    const completed = p.totalCount > 0 && p.completedCount === p.totalCount;
    const locked = idx > 0 && !prevCompleted;
    const status = locked ? 'locked' : completed ? 'completed' : 'in_progress';
    return { ...p, status };
  });

  const defaultOpenPhaseId = withStatus.find((p) => p.status === 'in_progress')?.id || withStatus[0]?.id;

  return { phases: withStatus, defaultOpenPhaseId };
}

function computeReadiness({ resume, skills, interviewSummary, practiceProgress }) {
  const hasResume = !!resume;
  const hasSkills = Array.isArray(skills) && skills.length > 0;
  const hasInterview = (interviewSummary?.completed || 0) > 0;
  const hasPractice =
    (practiceProgress?.solvedCount || 0) > 0 || (practiceProgress?.totalAttempts || 0) > 0;

  const any = [hasResume, hasSkills, hasInterview, hasPractice].some(Boolean);
  if (!any) return { readiness: null, level: '—' };

  let score = 12;
  if (hasResume) score += 22;
  if (hasPractice) score += Math.min(28, (practiceProgress?.solvedCount || 0) * 2);
  if (hasInterview && interviewSummary.avgScore != null) score += Math.min(28, Math.round(interviewSummary.avgScore * 0.28));
  if (hasSkills) score += 6;

  const readiness = percent(score);
  const level = readiness < 35 ? 'Beginner' : readiness < 70 ? 'Intermediate' : 'Advanced';
  return { readiness, level };
}

function PhaseStatusPill({ status }) {
  const map = {
    locked: { label: 'Locked', cls: 'bg-white/5 text-white/50 border-white/10' },
    in_progress: { label: 'In progress', cls: 'bg-primary-500/10 text-primary-200 border-primary-400/20' },
    completed: { label: 'Completed', cls: 'bg-green-500/10 text-green-200 border-green-500/20' },
  };
  const m = map[status] || map.locked;
  return <span className={`px-2 py-1 rounded-md border text-xs font-medium ${m.cls}`}>{m.label}</span>;
}

function SignalCard({ title, value, icon: Icon, muted = false }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-white/60">{title}</div>
          <div className={`text-xl font-semibold mt-1 ${muted ? 'text-white/50' : 'text-white'}`}>{value}</div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white/60" />
        </div>
      </div>
    </Card>
  );
}

function TaskRow({ task, done, onStart, onComplete }) {
  return (
    <div
      ref={task?.innerRef}
      className={`rounded-xl border p-4 ${done ? 'bg-white/3 border-white/8' : 'bg-white/5 border-white/10'}`}
      data-task-id={task?.id}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md border ${done ? 'border-green-500/30 bg-green-500/10' : 'border-white/10 bg-white/5'}`}>
              {done ? <CheckCircle className="w-4 h-4 text-green-300" /> : null}
            </span>
            <h4 className={`font-semibold ${done ? 'text-white/70 line-through' : 'text-white'}`}>{task.title}</h4>
          </div>
          <p className="text-sm text-white/70 mt-2">{task.why}</p>
          <div className="mt-3 grid sm:grid-cols-3 gap-3 text-xs text-white/60">
            <div><span className="text-white/40">Effort:</span> {task.effort}</div>
            <div className="sm:col-span-2"><span className="text-white/40">Outcome:</span> {task.outcome}</div>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <Button size="sm" onClick={onStart} disabled={done}>
            Start task
          </Button>
          <Button size="sm" variant="secondary" onClick={onComplete} disabled={done}>
            Mark as complete
          </Button>
        </div>
      </div>
    </div>
  );
}

function FocusPointerRow({ title, why, onGo }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-semibold text-white">{title}</div>
          <div className="text-sm text-white/70 mt-1 line-clamp-1">{why}</div>
        </div>
        <div className="flex-shrink-0">
          <Button size="sm" variant="secondary" onClick={onGo}>
            Go to task
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CareerRoadmap() {
  const [userId] = useState(() => getUserIdFromStorageOrUrl() ?? 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [roadmap, setRoadmap] = useState(null);
  const [resume, setResume] = useState(null);
  const [skills, setSkills] = useState([]);
  const [practiceProgress, setPracticeProgress] = useState(null);
  const [interviewSummary, setInterviewSummary] = useState({ completed: 0, avgScore: null });

  const [taskState, setTaskState] = useState(() => loadRoadmapTaskState(userId));
  const [openPhaseId, setOpenPhaseId] = useState(null);
  const navigate = useNavigate();
  const taskRefs = useRef({});

  useEffect(() => {
    setTaskState(loadRoadmapTaskState(userId));
  }, [userId]);

  const loadAll = async () => {
    try {
      setError(null);
      setLoading(true);

      const [roadmapRes, resumeRes, skillsRes, practiceRes, interviewRes] = await Promise.allSettled([
        roadmapAPI.get(userId),
        resumeAPI.get(userId),
        skillsAPI.get(userId),
        practiceAPI.getProgress(userId),
        interviewAPI.getSessions(userId),
      ]);

      if (roadmapRes.status === 'fulfilled' && roadmapRes.value?.data?.success) {
        setRoadmap(roadmapRes.value.data.data || null);
      }
      if (resumeRes.status === 'fulfilled' && resumeRes.value?.data?.success) {
        setResume(resumeRes.value.data.data || null);
      }
      if (skillsRes.status === 'fulfilled' && skillsRes.value?.data?.success) {
        setSkills(Array.isArray(skillsRes.value.data.data) ? skillsRes.value.data.data : []);
      }
      if (practiceRes.status === 'fulfilled' && practiceRes.value?.data?.success) {
        setPracticeProgress(practiceRes.value.data.data || null);
      }
      if (interviewRes.status === 'fulfilled' && interviewRes.value?.data?.success) {
        const sessions = Array.isArray(interviewRes.value.data.data) ? interviewRes.value.data.data : [];
        const completed = sessions.filter((s) => s.status === 'completed' && s.overall_score != null);
        const avg =
          completed.length > 0
            ? Math.round(completed.reduce((sum, s) => sum + (Number(s.overall_score) || 0), 0) / completed.length)
            : null;
        setInterviewSummary({ completed: completed.length, avgScore: avg });
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load roadmap');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const toggleTaskDone = (taskId, done) => {
    setTaskState((prev) => {
      const next = { ...prev, [taskId]: { ...(prev[taskId] || {}), done: !!done, doneAt: done ? Date.now() : null } };
      saveRoadmapTaskState(userId, next);
      return next;
    });
  };

  const startTask = (task) => {
    setTaskState((prev) => {
      const next = { ...prev, [task.id]: { ...(prev[task.id] || {}), startedAt: prev[task.id]?.startedAt || Date.now() } };
      saveRoadmapTaskState(userId, next);
      return next;
    });
    if (task.href) navigate(task.href);
  };

  const generateRoadmap = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get skill gap, but don't fail if it doesn't exist
      let skillGap = null;
      try {
        const skillGapRes = await skillsAPI.analyze({ userId });
        // Orchestrator response shape: { success, data: { success, data } }
        const gap = skillGapRes?.data?.data?.data;
        skillGap = gap || null;
      } catch {
        // safe fallback
        skillGap = null;
      }

      const response = await roadmapAPI.generate({
        userId,
        skillGap,
        targetRole: roadmap?.target_role || 'Software Engineer',
      });

      if (!response?.data?.success) {
        setError(response?.data?.error || 'Failed to generate roadmap');
        return;
      }

      await loadAll();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.data?.error || err?.message || 'Failed to generate roadmap';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const roadmapJson = roadmap?.roadmap_json || null;
  const { readiness, level } = useMemo(
    () => computeReadiness({ resume, skills, interviewSummary, practiceProgress }),
    [resume, skills, interviewSummary, practiceProgress]
  );

  const estimatedDuration =
    roadmapJson?.overallTimeline ||
    (roadmap?.timeline_months ? `${Math.max(1, roadmap.timeline_months - 1)}–${roadmap.timeline_months + 1} months` : resume ? '4–6 months' : '—');

  const phasesDerived = useMemo(() => {
    return buildPhases({
      roadmapJson,
      resume,
      skills,
      interviewSummary,
      practiceProgress,
      taskState,
    });
  }, [roadmapJson, resume, skills, interviewSummary, practiceProgress, taskState]);

  useEffect(() => {
    const open = openPhaseId ? phasesDerived.phases.find((p) => p.id === openPhaseId) : null;
    if (!openPhaseId || !open || open.status === 'locked') {
      if (phasesDerived.defaultOpenPhaseId) setOpenPhaseId(phasesDerived.defaultOpenPhaseId);
    }
  }, [openPhaseId, phasesDerived.defaultOpenPhaseId, phasesDerived.phases]);

  const targetRole = roadmap?.target_role || null;

  const noData = !resume && (!skills || skills.length === 0) && !roadmap && (interviewSummary?.completed || 0) === 0 && !practiceProgress;
  const showUploadFirst = !resume && !roadmap;

  const activePhase = phasesDerived.phases.find((p) => p.id === (openPhaseId || phasesDerived.defaultOpenPhaseId));
  const todaysFocus = (activePhase?.tasks || []).filter((t) => !taskState[t.id]?.done).slice(0, 3);
  const allTasks = phasesDerived.phases.flatMap((p) => p.tasks);
  const allDone = allTasks.length > 0 && allTasks.every((t) => taskState[t.id]?.done);

  const taskToPhase = useMemo(() => {
    const map = new globalThis.Map();
    phasesDerived.phases.forEach((p) => {
      p.tasks.forEach((t) => map.set(t.id, p.id));
    });
    return map;
  }, [phasesDerived.phases]);

  const goToTask = (taskId) => {
    const phaseId = taskToPhase.get(taskId);
    const phase = phasesDerived.phases.find((p) => p.id === phaseId);
    if (!phaseId || !phase || phase.status === 'locked') return;
    setOpenPhaseId(phaseId);
    setTimeout(() => {
      const el = taskRefs.current?.[taskId];
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ block: 'center' });
      }
    }, 0);
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="cp-page">
      <main className="cp-page-inner max-w-6xl space-y-6">
        <PageHeader
          title={`Your Career Roadmap${targetRole ? ` — ${targetRole}` : ''}`}
          description="Personalized based on your resume, skills, and interview performance"
          actions={
            <div className="flex flex-col items-end gap-1">
              <Button onClick={generateRoadmap}>
                <MapIcon className="w-4 h-4" />
                {roadmap ? 'Regenerate' : 'Generate'}
              </Button>
              {roadmap ? (
                <div className="text-xs text-white/50 max-w-xs text-right">
                  Regenerates roadmap using latest data. Your completed progress is preserved.
                </div>
              ) : null}
            </div>
          }
        />

        {/* Key signals */}
        <div className="grid sm:grid-cols-3 gap-4">
          <SignalCard title="Current level" value={level} icon={TrendingUp} muted={level === '—'} />
          <SignalCard title="Estimated duration" value={estimatedDuration || '—'} icon={Timer} muted={!estimatedDuration || estimatedDuration === '—'} />
          <SignalCard title="Placement readiness" value={readiness == null ? '—' : `${readiness}%`} icon={Target} muted={readiness == null} />
        </div>

        {error ? (
          <Card className="border border-red-500/25">
            <CardContent className="pt-6">
              <p className="text-red-200 text-sm">{error}</p>
              <div className="mt-4 flex gap-2">
                <Button onClick={loadAll}>Retry</Button>
                <Button variant="secondary" onClick={generateRoadmap}>Generate roadmap</Button>
              </div>
            </CardContent>
          </Card>
        ) : noData ? (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={MapIcon}
                title="Upload resume to personalize your roadmap"
                description="We’ll tailor phases and tasks to your current experience and target role."
                primaryAction={
                  <Link to="/resume">
                    <Button>Upload resume</Button>
                  </Link>
                }
              />
            </CardContent>
          </Card>
        ) : !roadmap && showUploadFirst ? (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={MapIcon}
                title="Upload resume to personalize your roadmap"
                description="Add your resume first so the roadmap matches your background."
                primaryAction={
                  <Link to="/resume">
                    <Button>Upload resume</Button>
                  </Link>
                }
                secondaryAction={
                  <Button variant="secondary" onClick={generateRoadmap}>Generate anyway</Button>
                }
              />
            </CardContent>
          </Card>
        ) : !roadmap ? (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={MapIcon}
                title="Generate your roadmap"
                description="We’ll create phases and tasks based on your current signals."
                primaryAction={
                  <Button onClick={generateRoadmap}>Generate roadmap</Button>
                }
                secondaryAction={
                  <Link to="/skills">
                    <Button variant="secondary">Run skill gap</Button>
                  </Link>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <>
            {allDone ? (
              <Card className="border border-green-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-white">Roadmap complete</h2>
                      <p className="text-sm text-white/70 mt-1">
                        You’ve completed all tracked tasks. Regenerate to refresh milestones or adjust your target role.
                      </p>
                    </div>
                    <Button onClick={generateRoadmap}>Regenerate</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold text-white">Today’s focus</h2>
                  <p className="text-sm text-white/70 mt-1">Pointers to the next 1–3 tasks. The task details live in the phases below.</p>
                  <div className="mt-4 space-y-3">
                    {todaysFocus.length === 0 ? (
                      <div className="text-sm text-white/60">You’re clear for today — pick a phase below to continue.</div>
                    ) : (
                      todaysFocus.map((t) => (
                        <FocusPointerRow
                          key={t.id}
                          title={t.title}
                          why={t.why}
                          onGo={() => goToTask(t.id)}
                        />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {phasesDerived.phases.map((phase) => {
                const isOpen = openPhaseId === phase.id;
                const isLocked = phase.status === 'locked';
                return (
                  <Card key={phase.id} className={isOpen ? 'ring-1 ring-primary-400/20' : ''}>
                    <CardContent className="pt-6">
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => {
                          if (isLocked) return;
                          setOpenPhaseId(isOpen ? null : phase.id);
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-semibold text-white">{phase.title}</h3>
                              {isLocked ? <Lock className="w-4 h-4 text-white/40" /> : null}
                            </div>
                            <p className="text-sm text-white/70 mt-1">{phase.purpose}</p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <PhaseStatusPill status={phase.status} />
                            <div className="text-right">
                              <div className="text-sm font-semibold text-white">
                                {phase.completedCount}/{phase.totalCount || 0}
                              </div>
                              <div className="text-xs text-white/50">{phase.progressLabel}</div>
                            </div>
                            <ChevronDown
                              className={`w-5 h-5 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            />
                          </div>
                        </div>
                      </button>

                      {isOpen && !isLocked ? (
                        <div className="mt-5 space-y-3">
                          {phase.tasks.length === 0 ? (
                            <div className="text-sm text-white/60">No tasks in this phase yet.</div>
                          ) : (
                            phase.tasks.map((t) => (
                              <TaskRow
                                key={t.id}
                                task={{
                                  ...t,
                                  innerRef: (el) => {
                                    if (el) taskRefs.current[t.id] = el;
                                  },
                                }}
                                done={!!taskState[t.id]?.done}
                                onStart={() => startTask(t)}
                                onComplete={() => toggleTaskDone(t.id, true)}
                              />
                            ))
                          )}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}


