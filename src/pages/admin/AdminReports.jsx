import { useState, useEffect } from 'react';
import Select from 'react-select';
import { AlertCircle, Download, Loader2 } from 'lucide-react';
import { apiFetch } from '../../config/api';

const AdminReports = () => {
    const [institutes, setInstitutes] = useState([]);
    const [selectedInstitutes, setSelectedInstitutes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchInstitutes();
    }, []);

    const fetchInstitutes = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await apiFetch('api/export/institutes', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (data.success) {
                const options = data.institutes.map(i => ({ value: i, label: i }));
                if (!options.some(opt => opt.value === 'Others')) {
                    options.unshift({ value: 'Others', label: 'Others' });
                }
                setInstitutes(options);
            } else {
                setError('Failed to load institutes');
            }
        } catch (err) {
            console.error('Error fetching institutes:', err);
            setError('Error loading institute list');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        setError('');
        try {
            let queryParams = '';

            if (selectedInstitutes.length > 0) {
                const values = selectedInstitutes.map(i => i.value).join('|');
                queryParams = `?institutes=${encodeURIComponent(values)}`;
            } else {
                queryParams = '?institutes=ALL';
            }

            const token = localStorage.getItem('adminToken');
            const response = await apiFetch(`api/export/students${queryParams}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Student_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (err) {
            console.error('Download error:', err);
            setError('Failed to download report. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="section-header">
                <div>
                    <h2 className="section-title">Student Reports</h2>
                    <p className="section-subtitle">Download candidate details in Excel format</p>
                </div>
            </div>

            {/* Reports Card */}
            <div className="surface-card p-6 sm:p-8">
                <div className="space-y-6 max-w-2xl">
                    <div>
                        <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2.5">
                            Filter by Institute
                            <span className="text-slate-400 dark:text-slate-500 font-normal ml-2 text-xs">
                                (Leave empty to download all students)
                            </span>
                        </label>
                        <Select
                            isMulti
                            options={institutes.filter(inst => !selectedInstitutes.find(s => s.value === inst.value))}
                            value={selectedInstitutes}
                            onChange={setSelectedInstitutes}
                            className="basic-multi-select"
                            classNamePrefix="select"
                            placeholder={isLoading ? "Loading institutes..." : "Select institutes..."}
                            isDisabled={isLoading}
                            isSearchable={true}
                            isClearable={true}
                            closeMenuOnSelect={true}
                            menuPosition="fixed"
                            menuPlacement="auto"
                            filterOption={(option, inputValue) => {
                                return option.label.toLowerCase().includes(inputValue.toLowerCase());
                            }}
                            styles={{
                                control: (base, state) => ({
                                    ...base,
                                    minHeight: '44px',
                                    borderRadius: '0.75rem',
                                    backgroundColor: 'rgb(var(--theme-card))',
                                    borderColor: state.isFocused ? '#403f75' : 'rgb(var(--theme-shell-stroke))',
                                    boxShadow: state.isFocused ? '0 0 0 2px rgba(64, 63, 117, 0.15)' : 'none',
                                    padding: '2px 4px',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        borderColor: '#403f75'
                                    }
                                }),
                                valueContainer: (base) => ({
                                    ...base,
                                    padding: '2px 8px',
                                    gap: '4px',
                                }),
                                singleValue: (base) => ({
                                    ...base,
                                    color: 'rgb(var(--theme-text))',
                                }),
                                input: (base) => ({
                                    ...base,
                                    color: 'rgb(var(--theme-text))',
                                    margin: '0 4px',
                                    padding: 0,
                                }),
                                placeholder: (base) => ({
                                    ...base,
                                    color: 'rgb(var(--theme-text-muted))',
                                    fontSize: '0.875rem',
                                    marginLeft: '4px',
                                    marginRight: '4px',
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
                                menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999,
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
                                multiValue: (base) => ({
                                    ...base,
                                    backgroundColor: 'rgb(var(--theme-panel))',
                                    borderRadius: '0.5rem',
                                }),
                                multiValueLabel: (base) => ({
                                    ...base,
                                    color: 'rgb(var(--theme-text))',
                                    fontWeight: 500,
                                }),
                                multiValueRemove: (base) => ({
                                    ...base,
                                    color: 'rgb(var(--theme-text))',
                                    ':hover': {
                                        backgroundColor: 'rgb(var(--theme-border))',
                                        color: 'rgb(var(--theme-text))',
                                    },
                                }),
                            }}
                            menuPortalTarget={document.body}
                        />
                    </div>

                    {error && (
                        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-900/60 flex items-center text-sm">
                            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading || isLoading}
                            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#403f75] hover:bg-[#343360] dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-xs hover:shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {isDownloading ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <Download size={16} />
                                    <span>Download Excel Report</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReports;