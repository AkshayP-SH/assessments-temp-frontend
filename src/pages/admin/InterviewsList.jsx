import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Calendar, Clock, Users, Trash2, Edit2 } from 'lucide-react';
import Select from 'react-select';
import { apiFetch } from '../../config/api';
import Card from '../../components/Card';
import Button from '../../components/Button';

const InterviewsList = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
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
        alert('Interview deleted successfully');
        fetchInterviews(); // Refresh the list
      } else {
        alert(data.message || 'Failed to delete interview');
      }
    } catch (error) {
      console.error('Delete interview error:', error);
      alert('Failed to delete interview');
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
        alert('Interview rescheduled successfully');
        setEditing(null);
        fetchInterviews();
      } else {
        alert(data.message || 'Failed to reschedule interview');
      }
    } catch (error) {
      console.error('Reschedule interview error:', error);
      alert('Failed to reschedule interview');
    }
  };

  const formatDateTime = (datetime) => {
    // Format date and time in IST timezone (same as test scheduling)
    return new Date(datetime).toLocaleString('en-IN', {
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
        <div className="p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 sm:pb-6 border-b border-shnoor-light">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-shnoor-navy mb-2 flex items-center">
                <Video className="mr-2 sm:mr-3 text-shnoor-indigo h-6 w-6 sm:h-8 sm:w-8" />
                Interviews
              </h2>
              <p className="text-sm sm:text-base text-shnoor-indigoMedium ml-8 sm:ml-11">Manage and join scheduled interviews</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 md:items-end">
            <div className="w-full md:w-auto flex-1">
              <label className="block text-sm font-bold text-shnoor-navy mb-2">Date</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="date"
                  value={filter.date}
                  onChange={(e) => setFilter({ ...filter, date: e.target.value })}
                  disabled={showAllDates}
                  className="w-full sm:w-auto flex-1 px-4 py-3 border border-shnoor-light rounded-xl focus:outline-none focus:ring-4 focus:ring-shnoor-lavender focus:border-shnoor-indigo bg-white text-shnoor-navy font-medium disabled:bg-shnoor-lavender disabled:cursor-not-allowed transition-all"
                />
                <Button
                  onClick={() => setShowAllDates(!showAllDates)}
                  variant={showAllDates ? "primary" : "outline"}
                  className="w-full sm:w-auto !rounded-xl !h-[50px]"
                >
                  {showAllDates ? 'Show Today Only' : 'Show All Dates'}
                </Button>
              </div>
            </div>
            
            <div className="w-full md:w-64">
              <label className="block text-sm font-bold text-shnoor-navy mb-2">Status</label>
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
                        padding: '4px',
                        borderRadius: '1rem',
                        backgroundColor: 'rgb(var(--theme-card))',
                        borderColor: 'rgb(var(--theme-shell-stroke))',
                        boxShadow: 'none',
                        '&:hover': {
                            borderColor: 'rgb(var(--theme-accent))'
                        }
                    }),
                    singleValue: (base) => ({
                        ...base,
                        color: 'rgb(var(--theme-text))'
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
                        backgroundColor: state.isSelected
                            ? 'rgb(var(--theme-accent))'
                            : state.isFocused
                                ? 'rgb(var(--theme-panel))'
                                : 'rgb(var(--theme-card))',
                        color: state.isSelected ? 'white' : 'rgb(var(--theme-text))',
                        cursor: 'pointer',
                        padding: '10px 12px',
                    }),
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {interviews.length === 0 ? (
        <Card>
          <div className="text-center py-12 bg-shnoor-lavender rounded-xl border border-shnoor-light">
            <Calendar className="mx-auto h-12 w-12 text-shnoor-indigoMedium mb-3" />
            <p className="text-shnoor-navy font-medium">No interviews scheduled for this date</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {interviews.map((interview) => (
            <Card key={interview.id} className="hover:shadow-[0_8px_30px_rgba(14,14,39,0.12)] transition-shadow cursor-default" noPadding>
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start space-y-4 sm:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3 flex-wrap gap-y-2">
                      <h3 className="text-lg font-bold text-shnoor-navy break-words">
                        {interview.student_name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${getStatusColor(interview.status)}`}>
                        {interview.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-shnoor-indigoMedium font-medium">
                      <p className="flex items-center">
                        <Users className="w-4 h-4 mr-2 shrink-0 text-shnoor-indigo" />
                        <span className="truncate">{interview.institute_name || 'No Institute'}</span>
                      </p>
                      <p className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 shrink-0 text-shnoor-indigo" />
                        {formatDateTime(interview.scheduled_time)} ({interview.duration} min)
                      </p>
                      <p className="text-shnoor-soft truncate">{interview.student_email}</p>
                    </div>
                  </div>

                  <div className="flex items-center sm:justify-end space-x-3 w-full sm:w-auto mt-4 sm:mt-0">
                    {(interview.status === 'scheduled' || interview.status === 'in_progress') && (
                      <Button
                        onClick={() => joinInterview(interview.id)}
                        variant="primary"
                        className="flex-1 sm:flex-none flex items-center justify-center space-x-2 !rounded-xl"
                      >
                        <Video size={18} />
                        <span className="whitespace-nowrap">{interview.status === 'in_progress' ? 'Resume Call' : 'Call'}</span>
                      </Button>
                    )}
                    
                    <button
                      onClick={() => openEditModal(interview)}
                      className="p-3 flex items-center justify-center text-shnoor-indigo hover:bg-shnoor-lavender rounded-xl transition-colors shrink-0"
                      title="Edit schedule"
                    >
                      <Edit2 size={18} />
                    </button>
                    
                    <button
                      onClick={() => deleteInterview(interview.id, interview.student_name)}
                      className="p-3 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                      title="Delete interview"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md m-4 border border-shnoor-light">
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
