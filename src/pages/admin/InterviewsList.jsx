import { formatDateTime } from '../../utils/dateTime';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Calendar, Clock, Users, Trash2, Edit2, Mail } from 'lucide-react';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { apiFetch } from '../../config/api';
import Card from '../../components/Card';
import Button from '../../components/Button';

const InterviewsList = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [filter, setFilter] = useState({
    status: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [showAllDates, setShowAllDates] = useState(false);
  const [editing, setEditing] = useState(null); // { id, scheduled_time, duration, student_name }

  const toDatetimeLocalIST = (datetime) => {
    if (!datetime) return '';
    const date = new Date(datetime);
    if (Number.isNaN(date.getTime())) return '';

    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(date);

    const get = (type) => parts.find(p => p.type === type)?.value;
    const yyyy = get('year');
    const mm = get('month');
    const dd = get('day');
    const hh = get('hour');
    const min = get('minute');
    if (!yyyy || !mm || !dd || !hh || !min) return '';
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };
// .....................
  useEffect(() => {
    fetchInterviews();
  }, [filter, showAllDates]);

  const fetchInterviews = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (!showAllDates && filter.date) params.append('date', filter.date);
      
      const response = await apiFetch(`api/interviews/list?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setInterviews(data.interviews);
      }
    } catch (error) {
      console.error('Fetch interviews error:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinInterview = (interviewId) => {
    navigate(`/admin/interview-room/${interviewId}`);
  };

  const deleteInterview = async (interviewId, studentName) => {
    if (!confirm(`Are you sure you want to delete the interview with ${studentName}?`)) {
      return;
    }

    try {
      const response = await apiFetch(`api/interviews/${interviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Interview deleted successfully');
        fetchInterviews(); // Refresh the list
      } else {
        toast.error(data.message || 'Failed to delete interview');
      }
    } catch (error) {
      console.error('Delete interview error:', error);
      toast.error('Failed to delete interview');
    }
  };

  const handleResendEmail = async (interviewId, targetLabel) => {
    try {
      setSendingEmailId(interviewId);
      const response = await apiFetch(`api/interviews/${interviewId}/resend-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message || `Interview email sent successfully to ${targetLabel}`);
      } else {
        toast.error(data.message || 'Failed to send interview email');
      }
    } catch (err) {
      console.error('Resend email error:', err);
      toast.error('Error sending interview email');
    } finally {
      setSendingEmailId(null);
    }
  };

  const openEditModal = (interview) => {
    setEditing({
      id: interview.id,
      student_name: interview.student_name,
      // Always edit in Asia/Kolkata wall-clock time
      scheduled_time: toDatetimeLocalIST(interview.scheduled_time),
      duration: interview.duration
    });
  };

  const handleEditChange = (field, value) => {
    setEditing(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const saveSchedule = async () => {
    if (!editing) return;
    try {
      const response = await apiFetch(`api/interviews/${editing.id}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          scheduled_time: editing.scheduled_time,
          duration: editing.duration
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Interview rescheduled successfully');
        setEditing(null);
        fetchInterviews();
      } else {
        toast.error(data.message || 'Failed to reschedule interview');
      }
    } catch (error) {
      console.error('Reschedule interview error:', error);
      toast.error('Failed to reschedule interview');
    }
  };

  const formatDateTime = (datetime) => {
    // Format date and time in IST timezone (same as test scheduling)
    return formatDateTime(datetime, 'en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-shnoor-indigo/10 text-shnoor-indigo',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-shnoor-lavender text-shnoor-navy',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-shnoor-lavender text-shnoor-soft';
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shnoor-indigo"></div>
        <span className="ml-3 text-shnoor-indigoMedium font-medium">Loading interviews...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card noPadding>
        <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-theme-panel flex items-center justify-center border border-theme-border">
              <Video className="h-5 w-5 text-theme-accent" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold text-theme-text">Interviews</h2>
                <span className="px-2 py-0.5 rounded-full bg-theme-panel text-theme-accent text-xs font-semibold border border-theme-border">
                  {interviews.length} {interviews.length === 1 ? 'interview' : 'interviews'}
                </span>
              </div>
              <p className="text-xs text-theme-muted">Manage and join scheduled interviews</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-theme-muted mb-1">Date</label>
              <div className={`relative flex items-center h-10 rounded-lg border border-theme-border bg-theme-card transition-opacity ${showAllDates ? 'opacity-50' : ''}`}>
                <Calendar className="absolute left-3 h-4 w-4 text-theme-muted pointer-events-none" />
                <input
                  type="date"
                  value={filter.date}
                  onChange={(e) => setFilter({ ...filter, date: e.target.value })}
                  disabled={showAllDates}
                  className="w-full sm:w-44 h-full pl-9 pr-3 bg-transparent rounded-lg text-sm font-medium text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent/20 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={showAllDates}
              onClick={() => setShowAllDates(!showAllDates)}
              className="flex items-center gap-2 h-10 self-start sm:self-auto cursor-pointer"
            >
              <span className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${showAllDates ? 'bg-theme-accent' : 'bg-theme-border dark:bg-slate-700'}`}>
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${showAllDates ? 'translate-x-5' : ''}`} />
              </span>
              <span className="text-sm font-medium text-theme-text whitespace-nowrap">All dates</span>
            </button>

            <div className="w-full sm:w-40">
              <label className="block text-xs font-medium text-theme-muted mb-1">Status</label>
              <Select
                value={[{ value: '', label: 'All' }, { value: 'scheduled', label: 'Scheduled' }, { value: 'in_progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' }].find(opt => opt.value === filter.status) || { value: '', label: 'All' }}
                onChange={(selectedOption) => setFilter({ ...filter, status: selectedOption ? selectedOption.value : '' })}
                options={[
                  { value: '', label: 'All' },
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' }
                ]}
                className="basic-single"
                classNamePrefix="select"
                isSearchable={false}
                menuPosition="fixed"
                menuPlacement="auto"
                styles={{
                    control: (base) => ({
                        ...base,
                        minHeight: '40px',
                        height: '40px',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        backgroundColor: 'rgb(var(--theme-card))',
                        borderColor: 'rgb(var(--theme-border))',
                        boxShadow: 'none',
                        '&:hover': {
                            borderColor: 'rgb(var(--theme-accent))'
                        }
                    }),
                    valueContainer: (base) => ({
                        ...base,
                        padding: '0 10px'
                    }),
                    indicatorsContainer: (base) => ({
                        ...base,
                        height: '38px'
                    }),
                    indicatorSeparator: () => ({
                        display: 'none'
                    }),
                    singleValue: (base) => ({
                        ...base,
                        color: 'rgb(var(--theme-text))',
                        fontWeight: 500
                    }),
                    input: (base) => ({
                        ...base,
                        color: 'rgb(var(--theme-text))'
                    }),
                    placeholder: (base) => ({
                        ...base,
                        color: 'rgb(var(--theme-text-muted))'
                    }),
                    menu: (base) => ({
                        ...base,
                        maxHeight: '300px',
                        borderRadius: '0.5rem',
                        backgroundColor: 'rgb(var(--theme-card))',
                        border: '1px solid rgb(var(--theme-border))',
                        zIndex: 9999,
                    }),
                    menuList: (base) => ({
                        ...base,
                        maxHeight: '300px',
                        overflowY: 'auto',
                        '::-webkit-scrollbar': {
                            width: '8px',
                        },
                        '::-webkit-scrollbar-track': {
                            background: 'rgb(var(--theme-panel))',
                            borderRadius: '10px',
                        },
                        '::-webkit-scrollbar-thumb': {
                            background: 'rgb(var(--theme-border))',
                            borderRadius: '10px',
                        },
                        '::-webkit-scrollbar-thumb:hover': {
                            background: 'rgb(var(--theme-accent))',
                        },
                    }),
                    option: (base, state) => ({
                        ...base,
                        fontSize: '0.875rem',
                        backgroundColor: state.isSelected
                            ? 'rgb(var(--theme-accent))'
                            : state.isFocused
                                ? 'rgb(var(--theme-panel))'
                                : 'rgb(var(--theme-card))',
                        color: state.isSelected ? 'white' : 'rgb(var(--theme-text))',
                        cursor: 'pointer',
                        padding: '8px 12px',
                    }),
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {interviews.length === 0 ? (
        <Card className="!p-4">
          <div className="flex flex-col items-center justify-center text-center py-12 rounded-lg border border-dashed border-theme-border bg-theme-panel/40">
            <div className="h-10 w-10 rounded-lg bg-theme-panel flex items-center justify-center mb-3 border border-theme-border">
              <Calendar className="h-5 w-5 text-theme-accent" />
            </div>
            <p className="text-sm font-medium text-theme-text">No interviews scheduled for this date</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {interviews.map((interview) => (
            <Card key={interview.id} className="hover:border-theme-accent/30 hover:shadow-md transition-all cursor-default" noPadding>
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-theme-panel text-theme-accent border border-theme-border flex items-center justify-center text-sm font-semibold">
                    {(interview.student_name || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-theme-text break-words">
                        {interview.student_name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${getStatusColor(interview.status)}`}>
                        {interview.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-theme-muted truncate">{interview.student_email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-theme-muted font-medium">
                      <span className="flex items-center min-w-0">
                        <Users className="w-3.5 h-3.5 mr-1.5 shrink-0 text-theme-accent" />
                        <span className="truncate">{interview.institute_name || 'No Institute'}</span>
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1.5 shrink-0 text-theme-accent" />
                        {formatDateTime(interview.scheduled_time)} ({interview.duration} min)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {(interview.status === 'scheduled' || interview.status === 'in_progress') && (
                    <button
                      onClick={() => joinInterview(interview.id)}
                      className="flex-1 sm:flex-none h-10 px-4 rounded-lg bg-theme-accent text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-theme-accent2 transition-colors cursor-pointer"
                    >
                      <Video size={16} />
                      <span className="whitespace-nowrap">{interview.status === 'in_progress' ? 'Resume Call' : 'Call'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => openEditModal(interview)}
                    className="h-10 w-10 flex items-center justify-center text-theme-accent border border-theme-border hover:bg-theme-panel rounded-lg transition-colors shrink-0 cursor-pointer"
                    title="Edit schedule"
                  >
                    <Edit2 size={16} />
                  </button>

                  <button
                    onClick={() => handleResendEmail(interview.id, interview.student_email || interview.student_name)}
                    disabled={sendingEmailId === interview.id}
                    className="h-10 w-10 flex items-center justify-center text-blue-600 border border-theme-border hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                    title="Resend email to candidate"
                  >
                    <Mail size={16} className={sendingEmailId === interview.id ? "animate-pulse" : ""} />
                  </button>

                  <button
                    onClick={() => deleteInterview(interview.id, interview.student_name)}
                    className="h-10 w-10 flex items-center justify-center text-red-500 border border-theme-border hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors shrink-0 cursor-pointer"
                    title="Delete interview"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto border border-shnoor-light">
            <h2 className="text-xl font-bold text-shnoor-navy mb-6">
              Reschedule Interview
              <span className="block text-sm font-medium text-shnoor-indigoMedium mt-1">{editing.student_name}</span>
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-shnoor-navy mb-2">
                  Interview Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  value={editing.scheduled_time || ''}
                  onChange={(e) => handleEditChange('scheduled_time', e.target.value)}
                  className="w-full px-4 py-3 border border-shnoor-light rounded-xl focus:outline-none focus:ring-4 focus:ring-shnoor-lavender focus:border-shnoor-indigo font-medium text-shnoor-navy bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-shnoor-navy mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  step="5"
                  value={editing.duration}
                  onChange={(e) => handleEditChange('duration', parseInt(e.target.value, 10) || 60)}
                  className="w-full px-4 py-3 border border-shnoor-light rounded-xl focus:outline-none focus:ring-4 focus:ring-shnoor-lavender focus:border-shnoor-indigo font-medium text-shnoor-navy bg-white transition-all"
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <Button
                onClick={() => setEditing(null)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={saveSchedule}
                variant="primary"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewsList;
