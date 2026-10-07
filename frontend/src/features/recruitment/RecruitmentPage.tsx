import React, { useState, useEffect } from 'react';
import {
  Briefcase, Users, PlusCircle, Calendar, ArrowRight, UserPlus,
  CheckCircle2, AlertCircle, Phone, Mail, Clock, X, DollarSign
} from 'lucide-react';
import { api } from '../../services/api';
import { User, JobOpening, Candidate, Department, Designation } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDate } from '../../utils/formatters';

interface RecruitmentPageProps {
  currentUser: User;
}

export const RecruitmentPage: React.FC<RecruitmentPageProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'candidates'>('jobs');
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Job Modal
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDeptId, setJobDeptId] = useState('');
  const [jobDesigId, setJobDesigId] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobReqs, setJobReqs] = useState('');
  const [jobOpeningsCount, setJobOpeningsCount] = useState(1);
  const [isSavingJob, setIsSavingJob] = useState(false);

  // Candidate Status Modal
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [candStatus, setCandStatus] = useState('INTERVIEW');
  const [candInterviewDate, setCandInterviewDate] = useState('');
  const [candNotes, setCandNotes] = useState('');
  const [isUpdatingCand, setIsUpdatingCand] = useState(false);

  // Convert to Employee Modal
  const [convertCandidate, setConvertCandidate] = useState<Candidate | null>(null);
  const [empCode, setEmpCode] = useState('');
  const [empDob, setEmpDob] = useState('1995-01-01');
  const [empDoj, setEmpDoj] = useState(new Date().toISOString().split('T')[0]);
  const [empSalary, setEmpSalary] = useState(60000);
  const [empDefaultPass, setEmpDefaultPass] = useState('Mponline@123');
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [jobList, candList, deptList, desigList] = await Promise.all([
        api.getJobs(),
        api.getCandidates(),
        api.getDepartments(),
        api.getDesignations(),
      ]);
      setJobs(jobList);
      setCandidates(candList);
      setDepartments(deptList);
      setDesignations(desigList);
      if (deptList.length > 0 && !jobDeptId) setJobDeptId(deptList[0].id);
      if (desigList.length > 0 && !jobDesigId) setJobDesigId(desigList[0].id);
    } catch (err) {
      console.error('Failed to load recruitment data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingJob(true);
    try {
      await api.createJob({
        title: jobTitle,
        department_id: jobDeptId,
        designation_id: jobDesigId,
        description: jobDesc,
        requirements: jobReqs,
        openings_count: jobOpeningsCount,
        status: 'OPEN',
      });
      setShowJobModal(false);
      setJobTitle('');
      setJobDesc('');
      setJobReqs('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create job opening');
    } finally {
      setIsSavingJob(false);
    }
  };

  const handleUpdateCandidateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    setIsUpdatingCand(true);
    try {
      await api.updateCandidateStatus(
        selectedCandidate.id,
        candStatus,
        candInterviewDate ? new Date(candInterviewDate).toISOString() : undefined,
        candNotes || undefined
      );
      setSelectedCandidate(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update candidate');
    } finally {
      setIsUpdatingCand(false);
    }
  };

  const handleExecuteConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertCandidate) return;
    setIsConverting(true);
    try {
      await api.convertCandidateToEmployee(convertCandidate.id, {
        employee_code: empCode,
        date_of_birth: empDob,
        gender: 'OTHER',
        date_of_joining: empDoj,
        employment_type: 'FULL_TIME',
        basic_salary: empSalary,
        default_password: empDefaultPass,
      });
      alert(`Candidate ${convertCandidate.first_name} ${convertCandidate.last_name} successfully onboarded as Employee ${empCode}!`);
      setConvertCandidate(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to convert candidate to employee');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Recruitment & Talent Acquisition</h2>
          <p className="text-sm text-slate-500">
            Manage open requisitions, interview stages, candidate evaluations, and 1-click hiring onboarding
          </p>
        </div>

        <Button variant="primary" size="lg" onClick={() => setShowJobModal(true)}>
          <PlusCircle className="w-5 h-5 mr-2" />
          Create Job Opening
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`py-3 px-5 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'jobs' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Job Openings ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('candidates')}
          className={`py-3 px-5 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'candidates' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Candidate Pipeline ({candidates.length})
        </button>
      </div>

      {/* JOB OPENINGS TAB */}
      {activeTab === 'jobs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <Card key={job.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700">
                    {job.department?.name}
                  </span>
                  <StatusBadge status={job.status} />
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{job.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{job.designation?.name} • {job.openings_count} opening(s)</p>
                <p className="text-xs text-slate-600 mt-3 line-clamp-2">{job.description || 'No description provided.'}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Posted {formatDate(job.posted_date)}</span>
                <button
                  onClick={() => {
                    setActiveTab('candidates');
                  }}
                  className="font-semibold text-brand-600 hover:text-brand-700 flex items-center"
                >
                  View Applicants <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CANDIDATE PIPELINE TAB */}
      {activeTab === 'candidates' && (
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Job Opening</th>
                  <th className="py-3 px-4">Experience</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Interview Schedule</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map((cand) => (
                  <tr key={cand.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{cand.first_name} {cand.last_name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{cand.email}</span> • <span>{cand.phone}</span>
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-700 text-xs font-medium">
                      {cand.job_opening?.title || 'General Application'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{cand.experience_years} yrs</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={cand.status} />
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {cand.interview_date ? formatDate(cand.interview_date) : 'Not scheduled'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCandidate(cand);
                          setCandStatus(cand.status);
                          setCandInterviewDate(cand.interview_date ? cand.interview_date.substring(0, 16) : '');
                          setCandNotes(cand.interview_notes || '');
                        }}
                      >
                        Update Stage
                      </Button>
                      {cand.status === 'SELECTED' || cand.status === 'OFFERED' ? (
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-500"
                          onClick={() => {
                            setConvertCandidate(cand);
                            setEmpCode(`Emp-${Math.floor(1000 + Math.random() * 9000)}`);
                          }}
                        >
                          <UserPlus className="w-3.5 h-3.5 mr-1" /> Onboard
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Job Opening Modal */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Create New Job Opening</h3>
              <button onClick={() => setShowJobModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <Input
                label="Job Title"
                placeholder="e.g. Lead React Developer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                  <select
                    value={jobDeptId}
                    onChange={(e) => setJobDeptId(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Designation</label>
                  <select
                    value={jobDesigId}
                    onChange={(e) => setJobDesigId(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                  >
                    {designations.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Job Description</label>
                <textarea
                  rows={3}
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                  placeholder="Key responsibilities and expectations..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Requirements</label>
                <textarea
                  rows={2}
                  value={jobReqs}
                  onChange={(e) => setJobReqs(e.target.value)}
                  placeholder="Required skills, certifications, experience..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="w-1/2" onClick={() => setShowJobModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="w-1/2" isLoading={isSavingJob}>
                  Publish Requisition
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Candidate Stage Update Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Update Candidate Stage</h3>
              <button onClick={() => setSelectedCandidate(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCandidateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Stage / Decision</label>
                <select
                  value={candStatus}
                  onChange={(e) => setCandStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                >
                  <option value="APPLIED">APPLIED</option>
                  <option value="SCREENING">SCREENING</option>
                  <option value="INTERVIEW">INTERVIEW</option>
                  <option value="SELECTED">SELECTED</option>
                  <option value="OFFERED">OFFERED</option>
                  <option value="HIRED">HIRED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <Input
                label="Interview Date & Time"
                type="datetime-local"
                value={candInterviewDate}
                onChange={(e) => setCandInterviewDate(e.target.value)}
              />

              <Input
                label="Interview Notes / Feedback"
                placeholder="Evaluation comments..."
                value={candNotes}
                onChange={(e) => setCandNotes(e.target.value)}
              />

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="w-1/2" onClick={() => setSelectedCandidate(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="w-1/2" isLoading={isUpdatingCand}>
                  Save Stage
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert Candidate to Employee Onboarding Modal */}
      {convertCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Convert to Employee Profile</h3>
                <p className="text-xs text-slate-400">Onboarding: {convertCandidate.first_name} {convertCandidate.last_name}</p>
              </div>
              <button onClick={() => setConvertCandidate(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteConversion} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Assign Employee ID"
                  placeholder="e.g. Emp-0006"
                  value={empCode}
                  onChange={(e) => setEmpCode(e.target.value)}
                  required
                />
                <Input
                  label="Monthly Basic Pay (INR)"
                  type="number"
                  value={empSalary}
                  onChange={(e) => setEmpSalary(Number(e.target.value))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Date of Birth"
                  type="date"
                  value={empDob}
                  onChange={(e) => setEmpDob(e.target.value)}
                  required
                />
                <Input
                  label="Joining Date"
                  type="date"
                  value={empDoj}
                  onChange={(e) => setEmpDoj(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Temporary Default Password"
                value={empDefaultPass}
                onChange={(e) => setEmpDefaultPass(e.target.value)}
                required
              />

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="w-1/2" onClick={() => setConvertCandidate(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="w-1/2 bg-emerald-600 hover:bg-emerald-500" isLoading={isConverting}>
                  Complete Onboarding
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
