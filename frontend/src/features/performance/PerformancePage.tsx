import React, { useState, useEffect } from 'react';
import {
  Award, Target, CheckCircle2, Clock, PlusCircle, Star,
  Edit3, ArrowRight, X, MessageSquare, ShieldCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { User, PerformanceCycle, PerformanceGoal, PerformanceReview } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDate } from '../../utils/formatters';

interface PerformancePageProps {
  currentUser: User;
}

export const PerformancePage: React.FC<PerformancePageProps> = ({ currentUser }) => {
  const isHR = currentUser.role === 'HR';
  const [activeTab, setActiveTab] = useState<'goals' | 'reviews' | 'cycles'>('goals');
  const [cycles, setCycles] = useState<PerformanceCycle[]>([]);
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Goal Modal
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDesc, setGoalDesc] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('2026-12-31');
  const [goalCycleId, setGoalCycleId] = useState('');
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  // Self / Reviewer Evaluation Modal
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [reviewMode, setReviewMode] = useState<'SELF' | 'REVIEWER'>('SELF');
  const [evalRating, setEvalRating] = useState(4);
  const [evalFeedback, setEvalFeedback] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    loadPerformanceData();
  }, [activeTab, currentUser]);

  const loadPerformanceData = async () => {
    setIsLoading(true);
    try {
      const [cycleList, goalList, reviewList] = await Promise.all([
        api.getPerformanceCycles(),
        api.getGoals(),
        api.getReviews(),
      ]);
      setCycles(cycleList);
      setGoals(goalList);
      setReviews(reviewList);
      if (cycleList.length > 0 && !goalCycleId) {
        setGoalCycleId(cycleList[0].id);
      }
    } catch (err) {
      console.error('Failed to load performance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalCycleId) return;
    setIsSavingGoal(true);
    try {
      await api.createGoal({
        performance_cycle_id: goalCycleId,
        employee_id: currentUser.employee_id,
        title: goalTitle,
        description: goalDesc,
        target_date: goalTargetDate,
        progress: 0,
        status: 'IN_PROGRESS',
      });
      setShowGoalModal(false);
      setGoalTitle('');
      setGoalDesc('');
      loadPerformanceData();
    } catch (err: any) {
      alert(err.message || 'Failed to create goal');
    } finally {
      setIsSavingGoal(false);
    }
  };

  const handleUpdateGoalProgress = async (goalId: string, progress: number) => {
    try {
      await api.updateGoal(goalId, { progress });
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, progress, status: progress === 100 ? 'COMPLETED' : 'IN_PROGRESS' } : g))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update goal progress');
    }
  };

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;
    setIsSubmittingReview(true);
    try {
      if (reviewMode === 'SELF') {
        await api.submitSelfReview(selectedReview.id, evalRating, evalFeedback);
      } else {
        await api.submitReviewerReview(selectedReview.id, evalRating, evalFeedback);
      }
      setSelectedReview(null);
      loadPerformanceData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit evaluation');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Performance & Growth</h2>
          <p className="text-sm text-slate-500">
            {isHR
              ? 'Oversee corporate review cycles, employee milestones, self-assessments, and 360 evaluations'
              : 'Track your quarterly performance goals, submit review assessments, and view supervisor feedback'}
          </p>
        </div>

        <Button variant="primary" size="lg" onClick={() => setShowGoalModal(true)}>
          <PlusCircle className="w-5 h-5 mr-2" />
          Add Performance Goal
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('goals')}
          className={`py-3 px-5 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'goals' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Key Goals & Milestones ({goals.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`py-3 px-5 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'reviews' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Review Assessments ({reviews.length})
        </button>
        {isHR && (
          <button
            onClick={() => setActiveTab('cycles')}
            className={`py-3 px-5 font-semibold text-sm border-b-2 transition-colors ${
              activeTab === 'cycles' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Review Cycles ({cycles.length})
          </button>
        )}
      </div>

      {/* GOALS TAB */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          {goals.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400">
              No performance goals configured for this period. Click "Add Performance Goal" to start.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {goals.map((g) => (
                <Card key={g.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        Due: {formatDate(g.target_date)}
                      </span>
                      <StatusBadge status={g.status} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{g.title}</h3>
                    <p className="text-xs text-slate-600 mt-1">{g.description || 'No detailed description.'}</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Progress</span>
                      <span className="font-bold text-brand-600">{g.progress}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={g.progress}
                      onChange={(e) => handleUpdateGoalProgress(g.id, Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REVIEWS TAB */}
      {activeTab === 'reviews' && (
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Cycle</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Self Rating</th>
                  <th className="py-3 px-4">Supervisor Rating</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-semibold text-slate-900">{rev.cycle?.title || 'Cycle'}</td>
                    <td className="py-3 px-4">
                      {rev.employee?.first_name} {rev.employee?.last_name}
                    </td>
                    <td className="py-3 px-4">
                      {rev.self_rating ? (
                        <span className="flex items-center text-amber-500 font-bold text-xs">
                          <Star className="w-3.5 h-3.5 fill-current mr-1" /> {rev.self_rating} / 5
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      {rev.reviewer_rating ? (
                        <span className="flex items-center text-amber-500 font-bold text-xs">
                          <Star className="w-3.5 h-3.5 fill-current mr-1" /> {rev.reviewer_rating} / 5
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={rev.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {rev.employee_id === currentUser.employee_id && rev.status === 'PENDING' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedReview(rev);
                            setReviewMode('SELF');
                            setEvalRating(rev.self_rating || 4);
                            setEvalFeedback(rev.self_feedback || '');
                          }}
                        >
                          Submit Self Review
                        </Button>
                      )}

                      {(isHR || rev.reviewer_id === currentUser.employee_id) && rev.status === 'SUBMITTED' && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-500"
                          onClick={() => {
                            setSelectedReview(rev);
                            setReviewMode('REVIEWER');
                            setEvalRating(rev.reviewer_rating || 5);
                            setEvalFeedback(rev.reviewer_feedback || '');
                          }}
                        >
                          Supervisor Review
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CYCLES TAB (HR ONLY) */}
      {isHR && activeTab === 'cycles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cycles.map((c) => (
            <Card key={c.id} className="p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-slate-900">{c.title}</h3>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-xs text-slate-500">
                  {formatDate(c.start_date)} to {formatDate(c.end_date)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Add Performance Goal</h3>
              <button onClick={() => setShowGoalModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Review Cycle</label>
                <select
                  value={goalCycleId}
                  onChange={(e) => setGoalCycleId(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                  required
                >
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Goal Title"
                placeholder="e.g. Optimize SQL Server indexes"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Key metrics and deliverables..."
                  value={goalDesc}
                  onChange={(e) => setGoalDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <Input
                label="Target Completion Date"
                type="date"
                value={goalTargetDate}
                onChange={(e) => setGoalTargetDate(e.target.value)}
                required
              />

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="w-1/2" onClick={() => setShowGoalModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="w-1/2" isLoading={isSavingGoal}>
                  Save Goal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evaluation Assessment Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                {reviewMode === 'SELF' ? 'Submit Self Evaluation' : 'Supervisor Assessment'}
              </h3>
              <button onClick={() => setSelectedReview(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEvaluation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Rating (1 to 5 Stars)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEvalRating(star)}
                      className={`p-2 rounded-xl flex-1 flex justify-center items-center border transition-all ${
                        evalRating >= star ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-slate-900 border-slate-700 text-slate-500'
                      }`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {reviewMode === 'SELF' ? 'Self-Assessment Summary' : 'Manager Feedback'}
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Key accomplishments, leadership contributions, and areas of growth..."
                  value={evalFeedback}
                  onChange={(e) => setEvalFeedback(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="w-1/2" onClick={() => setSelectedReview(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="w-1/2" isLoading={isSubmittingReview}>
                  Submit Review
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
