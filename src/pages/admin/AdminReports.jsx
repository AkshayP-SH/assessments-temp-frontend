import { useState, useEffect } from 'react';
import Select from 'react-select';
import { FileSpreadsheet, AlertCircle, Download } from 'lucide-react';
import { apiFetch } from '../../config/api';
import Card from '../../components/Card';
import Button from '../../components/Button';

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
                // Use pipe separator instead of comma to avoid conflicts with institute names containing commas
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

            // Handle file download
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
            <Card className="overflow-hidden" noPadding>
                <div className="p-4 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-shnoor-light">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-shnoor-navy mb-2 flex items-center">
                                <FileSpreadsheet className="mr-2 sm:mr-3 text-shnoor-indigo h-6 w-6 sm:h-8 sm:w-8" />
                                Student Reports
                            </h2>
                            <p className="text-sm sm:text-base text-shnoor-indigoMedium ml-8 sm:ml-11">Download candidate details in Excel format</p>
                        </div>
                    </div>

                    <div className="space-y-8 max-w-3xl">
                        <div>
                            <label className="block text-sm font-bold text-shnoor-navy mb-3">
                                Filter by Institute
                                <span className="text-shnoor-soft font-normal ml-2 text-xs">(Leave empty to download all students)</span>
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
                                    // Case-insensitive filtering
                                    return option.label.toLowerCase().includes(inputValue.toLowerCase());
                                }}
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
                                        borderRadius: '0.75rem',
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
                            <div className="p-4 bg-shnoor-dangerLight text-shnoor-danger rounded-xl border border-shnoor-dangerLight flex items-center mb-4">
                                <AlertCircle className="w-5 h-5 mr-2" />
                                {error}
                            </div>
                        )}

                        <div className="pt-4">
                            <Button
                                onClick={handleDownload}
                                disabled={isDownloading || isLoading}
                                variant="primary"
                                className="w-full sm:w-auto min-w-[200px]"
                            >
                                {isDownloading ? (
                                    <>
                                        <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Download size={24} />
                                        Download Excel Report
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AdminReports;