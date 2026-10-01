import { useState, useEffect } from 'react';
import { Upload, FileText, Plus, Save, Trash2, ArrowLeft, CheckCircle, AlertCircle, Loader2, Pencil, X, Eye, AlignLeft, List, Code } from 'lucide-react';
import * as XLSX from 'xlsx';
import { apiFetch } from '../../config/api';
import CodingQuestionSelector from './CodingQuestionSelector';
import MCQBankSelector from './MCQBankSelector';

// DISABLED: Code execution feature
const ENABLE_CODE_EXECUTION = true;

const CreateTestSection = ({ onComplete, onSaved, editingTest, clientId }) => {
    const FALLBACK_DEFAULT_JOB_ROLE = 'General Assessment Candidate';
    const FALLBACK_DEFAULT_JOB_DESCRIPTION = 'This assessment evaluates candidate readiness across core technical and problem-solving skills relevant to the role.';
    const [step, setStep] = useState('init'); // init, manual, bulk, success
    const [testTitle, setTestTitle] = useState('');
    const [jobRoles, setJobRoles] = useState([{ job_role: '', job_description: '' }]);
    const [defaultJobConfig, setDefaultJobConfig] = useState({
        job_role: FALLBACK_DEFAULT_JOB_ROLE,
        job_description: FALLBACK_DEFAULT_JOB_DESCRIPTION
    });
    const [duration, setDuration] = useState(60);
    const [maxAttempts, setMaxAttempts] = useState(1);
    const [passingPercentage, setPassingPercentage] = useState(50);
    const [startDateTime, setStartDateTime] = useState('');
    const [endDateTime, setEndDateTime] = useState('');
    const [questions, setQuestions] = useState([]);
    // DISABLED: Coding questions feature
    const [codingQuestions, setCodingQuestions] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedTestId, setUploadedTestId] = useState(null);
    const [uploadedTestName, setUploadedTestName] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [isLoadingTest, setIsLoadingTest] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [viewMode, setViewMode] = useState(false); // New state for view mode

    // Name availability checker state
    const [nameAvailability, setNameAvailability] = useState({
        checking: false,
        available: null,
        message: ''
    });

    // Manual Question Logic
    const [currentQuestion, setCurrentQuestion] = useState({
        text: '',
        options: ['', '', '', ''],
        correctOption: null, // 0, 1, 2, 3
        format: 'paragraph' // 'paragraph', 'line', 'code'
    });

    // DISABLED: Coding Question Logic
    const [showCodingModal, setShowCodingModal] = useState(false);
    const [showCodingViewModal, setShowCodingViewModal] = useState(false);
    const [showCodingSelector, setShowCodingSelector] = useState(false);
    const [questionInputMode, setQuestionInputMode] = useState('type'); // 'type' | 'bank'
    const [bankSelectorKey, setBankSelectorKey] = useState(0);
    const [viewingCodingQuestion, setViewingCodingQuestion] = useState(null);
    const [editingCodingQuestionId, setEditingCodingQuestionId] = useState(null);
    const [currentCodingQuestion, setCurrentCodingQuestion] = useState({
        title: '',
        description: '',
        publicTestCases: [{ input: '', output: '', explanation: '' }],
        hiddenTestCases: [{ input: '', output: '' }],
        timeLimit: 2,
        memoryLimit: 256,
        marks: 10
    });

    // Load test data when editing
    useEffect(() => {
        const fetchDefaultJobConfig = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const response = await apiFetch('api/settings', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();
                if (response.ok && data.success && data.settings) {
                    const configuredRole = (data.settings.default_test_job_role || '').trim();
                    const configuredDescription = (data.settings.default_test_job_description || '').trim();

                    const nextDefaults = {
                        job_role: configuredRole || FALLBACK_DEFAULT_JOB_ROLE,
                        job_description: configuredDescription || FALLBACK_DEFAULT_JOB_DESCRIPTION
                    };

                    setDefaultJobConfig(nextDefaults);

                    // In create mode, prefill first role so admin can edit directly at creation time.
                    if (!editingTest) {
                        setJobRoles((prev) => {
                            if (!Array.isArray(prev) || prev.length !== 1) return prev;
                            const first = prev[0] || { job_role: '', job_description: '' };
                            const isEmpty = !first.job_role?.trim() && !first.job_description?.trim();
                            if (!isEmpty) return prev;
                            return [{
                                job_role: nextDefaults.job_role,
                                job_description: nextDefaults.job_description
                            }];
                        });
                    }
                }
            } catch (error) {
                // Keep fallback defaults silently.
            }
        };

        fetchDefaultJobConfig();

        const loadTestData = async () => {
            if (!editingTest) {
                setIsEditMode(false);
                setViewMode(false);
                return;
            }

            setIsEditMode(true);
            setViewMode(true); // Start in view mode when editing
            setIsLoadingTest(true);

            try {
                const token = localStorage.getItem('adminToken');
                const response = await apiFetch(`api/tests/${editingTest.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    const test = data.test;
                    setTestTitle(test.title);
                    setDuration(test.duration || 60);
                    setMaxAttempts(test.max_attempts || 1);
                    setPassingPercentage(test.passing_percentage || 50);

                    // Format datetime for input (convert to Asia/Kolkata timezone)
                    if (test.start_datetime) {
                        const date = new Date(test.start_datetime);
                        // Convert to Asia/Kolkata timezone
                        const istDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                        const year = istDate.getFullYear();
                        const month = String(istDate.getMonth() + 1).padStart(2, '0');
                        const day = String(istDate.getDate()).padStart(2, '0');
                        const hours = String(istDate.getHours()).padStart(2, '0');
                        const minutes = String(istDate.getMinutes()).padStart(2, '0');
                        setStartDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
                    } else {
                        setStartDateTime('');
                    }

                    if (test.end_datetime) {
                        const date = new Date(test.end_datetime);
                        // Convert to Asia/Kolkata timezone
                        const istDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                        const year = istDate.getFullYear();
                        const month = String(istDate.getMonth() + 1).padStart(2, '0');
                        const day = String(istDate.getDate()).padStart(2, '0');
                        const hours = String(istDate.getHours()).padStart(2, '0');
                        const minutes = String(istDate.getMinutes()).padStart(2, '0');
                        setEndDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
                    } else {
                        setEndDateTime('');
                    }

                    // Load job roles
                    if (test.jobRoles && test.jobRoles.length > 0) {
                        setJobRoles(test.jobRoles.map(r => ({
                            job_role: r.job_role,
                            job_description: r.job_description
                        })));
                    } else if (test.job_role) {
                        setJobRoles([{
                            job_role: test.job_role,
                            job_description: test.description || ''
                        }]);
                    }

                    // Load questions
                    if (test.questions && test.questions.length > 0) {
                        const loadedQuestions = test.questions.map((q, idx) => ({
                            id: q.id || Date.now() + idx,
                            text: q.question_text,
                            options: [q.option_a, q.option_b, q.option_c || '', q.option_d || ''],
                            correctOption: q.correct_option.charCodeAt(0) - 65 // Convert 'A', 'B', 'C', 'D' to 0, 1, 2, 3
                        }));
                        setQuestions(loadedQuestions);
                    }

                    // DISABLED: Load coding questions
                    if (test.codingQuestions && test.codingQuestions.length > 0) {
                        const loadedCodingQuestions = test.codingQuestions.map((q, idx) => ({
                            id: q.id || Date.now() + idx,
                            title: q.title,
                            description: q.description,
                            timeLimit: q.timeLimit || 2,
                            memoryLimit: q.memoryLimit || 256,
                            marks: q.marks || 10,
                            publicTestCases: q.publicTestCases || [{ input: '', output: '', explanation: '' }],
                            hiddenTestCases: q.hiddenTestCases || [{ input: '', output: '' }]
                        }));
                        setCodingQuestions(loadedCodingQuestions);
                    }

                    setUploadedTestId(test.id);
                    setNameAvailability({ checking: false, available: true, message: 'Current test name' });

                    // Stay on init step to allow editing test details first
                    setStep('init');
                } else {
                    alert(data.message || 'Failed to load test data');
                    if (onComplete) onComplete();
                }
            } catch (error) {
                console.error('Error loading test:', error);
                alert('Failed to load test data');
                if (onComplete) onComplete();
            } finally {
                setIsLoadingTest(false);
            }
        };

        loadTestData();
    }, [editingTest]);

    // Check name availability when title changes (skip if editing and name hasn't changed)
    useEffect(() => {
        const checkNameAvailability = async () => {
            if (!testTitle.trim()) {
                setNameAvailability({ checking: false, available: null, message: '' });
                return;
            }

            // Skip check if editing and name hasn't changed
            if (isEditMode && editingTest && testTitle === editingTest.name) {
                setNameAvailability({ checking: false, available: true, message: 'Current test name' });
                return;
            }

            setNameAvailability({ checking: true, available: null, message: '' });

            try {
                const token = localStorage.getItem('adminToken');
                const response = await apiFetch(`api/tests/check-name/${encodeURIComponent(testTitle)}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    setNameAvailability({
                        checking: false,
                        available: data.available,
                        message: data.message
                    });
                }
            } catch (error) {
                console.error('Error checking name availability:', error);
                setNameAvailability({ checking: false, available: null, message: '' });
            }
        };

        // Debounce the API call
        const timeoutId = setTimeout(checkNameAvailability, 500);
        return () => clearTimeout(timeoutId);
    }, [testTitle, isEditMode, editingTest]);

    const handleStart = (mode) => {
        if (!testTitle.trim()) {
            alert('Please enter a test title first');
            return;
        }
        if (nameAvailability.available === false) {
            alert('This test name is already taken. Please choose a different name.');
            return;
        }
        setStep(mode);
    };

    const handleAddJobRole = () => {
        setJobRoles([...jobRoles, { job_role: '', job_description: '' }]);
    };

    const handleRemoveJobRole = (index) => {
        const newJobRoles = jobRoles.filter((_, i) => i !== index);
        setJobRoles(newJobRoles);
    };

    const handleJobRoleChange = (index, field, value) => {
        const newJobRoles = [...jobRoles];
        newJobRoles[index][field] = value;
        setJobRoles(newJobRoles);
    };

    const handleAddQuestion = () => {
        if (!currentQuestion.text || currentQuestion.options.some(opt => !opt) || currentQuestion.correctOption === null) {
            alert('Please fill in all fields and select a correct answer');
            return;
        }
        setQuestions([...questions, { ...currentQuestion, id: Date.now() }]);
        setCurrentQuestion({
            text: '',
            options: ['', '', '', ''],
            correctOption: null
        });
    };

    const handleRemoveQuestion = (id) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handleSelectMcqFromBank = (selectedBankQuestions) => {
        const existingBankIds = new Set(questions.filter((q) => q.bankId).map((q) => q.bankId));
        const converted = selectedBankQuestions
            .filter((q) => !existingBankIds.has(q.id))
            .map((q) => {
                const correctLetter = (q.correct_option || 'A').toUpperCase();
                const correctIdx = Math.max(0, 'ABCD'.indexOf(correctLetter));
                return {
                    id: Date.now() + Math.random(),
                    bankId: q.id,
                    fromBank: true,
                    text: q.question_text,
                    options: [q.option_a, q.option_b, q.option_c || '', q.option_d || ''],
                    correctOption: correctIdx,
                    marks: q.marks || 1,
                    format: 'paragraph'
                };
            });

        if (converted.length === 0) {
            alert('These questions are already in your test list (see panel on the right).');
            return;
        }

        setQuestions([...questions, ...converted]);
        setBankSelectorKey((k) => k + 1);

        if (converted.length < selectedBankQuestions.length) {
            alert(`Added ${converted.length} question(s) to the list. ${selectedBankQuestions.length - converted.length} duplicate(s) skipped.`);
        }
    };

    // Coding Question Handlers

    const handleAddPublicTestCase = () => {
        setCurrentCodingQuestion({
            ...currentCodingQuestion,
            publicTestCases: [...currentCodingQuestion.publicTestCases, { input: '', output: '', explanation: '' }]
        });
    };

    const handleRemovePublicTestCase = (index) => {
        const newTestCases = currentCodingQuestion.publicTestCases.filter((_, i) => i !== index);
        setCurrentCodingQuestion({
            ...currentCodingQuestion,
            publicTestCases: newTestCases.length > 0 ? newTestCases : [{ input: '', output: '', explanation: '' }]
        });
    };

    const handleAddHiddenTestCase = () => {
        setCurrentCodingQuestion({
            ...currentCodingQuestion,
            hiddenTestCases: [...currentCodingQuestion.hiddenTestCases, { input: '', output: '' }]
        });
    };

    const handleRemoveHiddenTestCase = (index) => {
        const newTestCases = currentCodingQuestion.hiddenTestCases.filter((_, i) => i !== index);
        setCurrentCodingQuestion({
            ...currentCodingQuestion,
            hiddenTestCases: newTestCases.length > 0 ? newTestCases : [{ input: '', output: '' }]
        });
    };

    // DISABLED: Coding question handlers
    const handleSaveCodingQuestion = () => {
        if (!currentCodingQuestion.title || !currentCodingQuestion.description) {
            alert('Please fill in title and description');
            return;
        }
        if (currentCodingQuestion.publicTestCases.some(tc => !tc.input || !tc.output)) {
            alert('Please fill in all public test cases');
            return;
        }
        if (currentCodingQuestion.hiddenTestCases.some(tc => !tc.input || !tc.output)) {
            alert('Please fill in all hidden test cases');
            return;
        }

        if (editingCodingQuestionId) {
            // Update existing question
            setCodingQuestions(codingQuestions.map(q => 
                q.id === editingCodingQuestionId ? { ...currentCodingQuestion, id: editingCodingQuestionId } : q
            ));
            setEditingCodingQuestionId(null);
        } else {
            // Add new question
            setCodingQuestions([...codingQuestions, { ...currentCodingQuestion, id: Date.now() }]);
        }

        setCurrentCodingQuestion({
            title: '',
            description: '',
            publicTestCases: [{ input: '', output: '', explanation: '' }],
            hiddenTestCases: [{ input: '', output: '' }],
            timeLimit: 2,
            memoryLimit: 256,
            marks: 10
        });
        setShowCodingModal(false);
    };

    const handleRemoveCodingQuestion = (id) => {
        setCodingQuestions(codingQuestions.filter(q => q.id !== id));
    };

    const handleViewCodingQuestion = (question) => {
        setViewingCodingQuestion(question);
        setShowCodingViewModal(true);
    };

    const handleEditCodingQuestion = (question) => {
        setCurrentCodingQuestion({
            title: question.title,
            description: question.description,
            publicTestCases: [...question.publicTestCases],
            hiddenTestCases: [...question.hiddenTestCases],
            timeLimit: question.timeLimit,
            memoryLimit: question.memoryLimit,
            marks: question.marks || 10
        });
        setEditingCodingQuestionId(question.id);
        setShowCodingModal(true);
    };

    const handleSelectFromBank = (selectedQuestions) => {
        const existingBankIds = new Set(codingQuestions.filter((q) => q.bankId).map((q) => q.bankId));
        const newSelections = selectedQuestions.filter((q) => !existingBankIds.has(q.id));

        if (newSelections.length === 0) {
            alert('Selected questions are already added to this test.');
            return;
        }

        if (newSelections.length < selectedQuestions.length) {
            alert(`${selectedQuestions.length - newSelections.length} duplicate question(s) were skipped.`);
        }

        // Fetch full details including test cases for each question
        const fetchQuestionDetails = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const detailedQuestions = await Promise.all(
                    newSelections.map(async (q) => {
                        const response = await apiFetch(`api/question-bank/coding/${q.id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const data = await response.json();
                        if (data.success && data.question.testCases) {
                            const publicTestCases = data.question.testCases
                                .filter(tc => !tc.is_hidden)
                                .map(tc => ({
                                    input: tc.input,
                                    output: tc.output,
                                    explanation: tc.explanation || ''
                                }));
                            
                            const hiddenTestCases = data.question.testCases
                                .filter(tc => tc.is_hidden)
                                .map(tc => ({
                                    input: tc.input,
                                    output: tc.output
                                }));

                            return {
                                id: Date.now() + Math.random(),
                                bankId: q.id,
                                title: q.title,
                                description: q.description,
                                timeLimit: q.time_limit,
                                memoryLimit: q.memory_limit,
                                marks: q.marks,
                                publicTestCases: publicTestCases.length > 0 ? publicTestCases : [{ input: '', output: '', explanation: '' }],
                                hiddenTestCases: hiddenTestCases.length > 0 ? hiddenTestCases : [{ input: '', output: '' }],
                                fromBank: true
                            };
                        }
                        return null;
                    })
                );

                const validQuestions = detailedQuestions.filter(q => q !== null);
                setCodingQuestions([...codingQuestions, ...validQuestions]);
            } catch (error) {
                console.error('Error fetching question details:', error);
                alert('Failed to load some question details');
            }
        };

        fetchQuestionDetails();
    };


    const convertISTToUTC = (dateTimeString) => {
        if (!dateTimeString) return null;
        // Parse the datetime-local value as IST and convert to UTC
        const [datePart, timePart] = dateTimeString.split('T');
        const [year, month, day] = datePart.split('-');
        const [hours, minutes] = timePart.split(':');

        // Create date string in IST format
        const istDateString = `${year}-${month}-${day}T${hours}:${minutes}:00+05:30`;
        const date = new Date(istDateString);

        return date.toISOString();
    };

    const handleManualSubmit = async () => {
        // DISABLED: Coding questions check
        if (questions.length === 0 && codingQuestions.length === 0) {
        // if (questions.length === 0) {
            alert('Please add at least one question');
            return;
        }

        setIsUploading(true);

        try {
            const token = localStorage.getItem('adminToken');

            // Prepare question data
            const questionData = questions.map(q => ({
                question_text: q.text,
                options: q.options,
                correctOption: q.correctOption,
                question: q.text,
                optiona: q.options[0],
                optionb: q.options[1],
                optionc: q.options[2],
                optiond: q.options[3],
                correct_option: String.fromCharCode(65 + q.correctOption),
                correctoption: String.fromCharCode(65 + q.correctOption),
                marks: q.marks || 1
            }));

            let response, data;

            if (isEditMode && uploadedTestId) {
                // Update existing test
                response = await apiFetch(`api/tests/${uploadedTestId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        testName: testTitle,
                        jobRoles: jobRoles,
                        duration: duration,
                        maxAttempts: maxAttempts,
                        passingPercentage: passingPercentage,
                        startDateTime: convertISTToUTC(startDateTime),
                        endDateTime: convertISTToUTC(endDateTime),
                        questions: questionData
                    })
                });

                data = await response.json();

                if (response.ok && data.success) {
                    // CODE EXECUTION FEATURE - TEMPORARILY DISABLED
                    if (ENABLE_CODE_EXECUTION) {
                        // ALWAYS save coding questions (even if empty, to clear old ones)
                        console.log('[UPDATE TEST] Saving coding questions:', codingQuestions.length);
                        console.log('[UPDATE TEST] Coding questions data:', JSON.stringify(codingQuestions, null, 2));
                        
                        const codingResponse = await apiFetch(`api/coding-questions/test/${uploadedTestId}`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                codingQuestions: codingQuestions
                            })
                        });
                    
                        const codingData = await codingResponse.json();
                        if (!codingResponse.ok || !codingData.success) {
                            console.error('[UPDATE TEST] Failed to save coding questions:', codingData);
                            alert('Test updated but failed to save coding questions: ' + codingData.message);
                            setIsUploading(false);
                            return;
                        }
                        console.log('[UPDATE TEST] Coding questions saved successfully');
                    }

                    alert('Test updated successfully!');
                    // Go back to view mode instead of dashboard
                    setViewMode(true);
                    setStep('init');
                } else {
                    alert(data.message || 'Failed to update test');
                }
            } else {
                // Create new test
                response = await apiFetch('api/upload/manual', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        testName: testTitle,
                        jobRoles: jobRoles,
                        duration: duration,
                        maxAttempts: maxAttempts,
                        passingPercentage: passingPercentage,
                        startDateTime: convertISTToUTC(startDateTime),
                        endDateTime: convertISTToUTC(endDateTime),
                        status: 'draft', // Save as draft initially
                        questions: questionData,
                        codingQuestionsCount: codingQuestions.length,
                        ...(clientId ? { client_id: clientId } : {})
                    })
                });

                data = await response.json();

                if (response.ok && data.success) {
                    const testId = data.testId;

                    // CODE EXECUTION FEATURE Enabled
                    if (ENABLE_CODE_EXECUTION) {
                        // ALWAYS save coding questions (even if empty, to ensure consistency)
                        console.log('[CREATE TEST] Saving coding questions for new test:', codingQuestions.length);
                        console.log('[CREATE TEST] Coding questions data:', JSON.stringify(codingQuestions, null, 2));
                        
                        const codingResponse = await apiFetch(`api/coding-questions/test/${testId}`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                codingQuestions: codingQuestions
                            })
                        });
                    
                        const codingData = await codingResponse.json();
                        if (!codingResponse.ok || !codingData.success) {
                            console.error('[CREATE TEST] Failed to save coding questions:', codingData);
                            alert('Test created but failed to save coding questions: ' + codingData.message);
                            setIsUploading(false);
                            return;
                        }
                        console.log('[CREATE TEST] Coding questions saved successfully');
                    }

                    setUploadedTestId(testId);
                    setUploadedTestName(testTitle);
                    if (onSaved) onSaved();
                    setStep('success');
                } else {
                    alert(data.message || 'Failed to create test');
                }
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('Failed to save test. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    // Mirrors the backend bulk-upload row parsing (routes/upload.js buildBulkQuestionInsert)
    const parseQuestionsFile = async (file) => {
        const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = sheet ? XLSX.utils.sheet_to_json(sheet) : [];

        return rows
            .map((row, idx) => {
                const getVal = (...keys) => {
                    for (const key of keys) {
                        const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
                        for (const k of Object.keys(row)) {
                            if (k.toLowerCase().replace(/\s+/g, '') === normalizedKey) return row[k];
                        }
                    }
                    return undefined;
                };

                const text = getVal('question');
                const options = [
                    getVal('optiona', 'option1'),
                    getVal('optionb', 'option2'),
                    getVal('optionc', 'option3'),
                    getVal('optiond', 'option4')
                ].map((opt) => (opt === undefined || opt === null ? '' : String(opt)));
                const rawCorrect = String(getVal('correctoption') ?? '').trim().toUpperCase();
                const correctOption = /^[1-4]$/.test(rawCorrect)
                    ? parseInt(rawCorrect, 10) - 1
                    : 'ABCD'.indexOf(rawCorrect.replace(/[^A-D]/g, '').charAt(0));

                if (!text || !options[0] || !options[1] || correctOption < 0) return null;

                return {
                    id: Date.now() + idx + Math.random(),
                    fromUpload: true,
                    text: String(text),
                    options,
                    correctOption,
                    marks: parseInt(getVal('marks'), 10) || 1,
                    format: 'paragraph'
                };
            })
            .filter(Boolean);
    };

    const handleBulkUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Confirm replacement if in edit mode
        if (isEditMode && questions.length > 0) {
            const confirmed = confirm(
                `⚠️ Warning: This will delete all ${questions.length} existing question${questions.length !== 1 ? 's' : ''} and replace them with the questions from the uploaded file.\n\nAre you sure you want to continue?`
            );
            if (!confirmed) {
                e.target.value = ''; // Reset file input
                return;
            }
        }

        setIsUploading(true);

        try {
            const token = localStorage.getItem('adminToken');
            const cleanBaseUrl = import.meta.env.VITE_API_URL.endsWith('/')
                ? import.meta.env.VITE_API_URL.slice(0, -1)
                : import.meta.env.VITE_API_URL;

            if (isEditMode && uploadedTestId) {
                // Edit mode: Update existing test with new questions from file
                const formData = new FormData();
                formData.append('file', file);
                formData.append('testName', testTitle);
                formData.append('jobRoles', JSON.stringify(jobRoles));
                formData.append('testDescription', jobRoles[0]?.job_description || '');
                formData.append('duration', duration);
                formData.append('maxAttempts', maxAttempts);
                formData.append('passingPercentage', passingPercentage);
                formData.append('startDateTime', convertISTToUTC(startDateTime) || '');
                formData.append('endDateTime', convertISTToUTC(endDateTime) || '');
                formData.append('testId', uploadedTestId);
                if (clientId) formData.append('client_id', clientId);

                // FIX: Use native fetch instead of apiFetch to preserve FormData boundaries
                const response = await fetch(`${cleanBaseUrl}/api/upload/questions/${uploadedTestId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                        // DO NOT put Content-Type here!
                    },
                    body: formData
                });

                // Catch HTML error pages from CloudFront/Express before they break JSON parsing
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") === -1) {
                    throw new Error("Server returned HTML. The endpoint /api/upload/questions might be incorrect or missing on the backend.");
                }

                const data = await response.json();

                if (response.ok && data.success) {
                    // CODE EXECUTION FEATURE 
                    if (ENABLE_CODE_EXECUTION) {
                        // Save coding questions after bulk upload in edit mode
                        console.log('[BULK UPLOAD EDIT] Saving coding questions:', codingQuestions.length);
                        console.log('[BULK UPLOAD EDIT] Coding questions data:', JSON.stringify(codingQuestions, null, 2));
                        
                        const codingResponse = await apiFetch(`api/coding-questions/test/${uploadedTestId}`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                codingQuestions: codingQuestions
                            })
                        });
                    
                        const codingData = await codingResponse.json();
                        if (!codingResponse.ok || !codingData.success) {
                            console.error('[BULK UPLOAD EDIT] Failed to save coding questions:', codingData);
                            alert('Questions uploaded but failed to save coding questions: ' + codingData.message);
                            setIsUploading(false);
                            return;
                        }
                        console.log('[BULK UPLOAD EDIT] Coding questions saved successfully');
                    }

                    alert(`Questions uploaded successfully! ${data.questionsCount} questions added. Click "Save Changes" to save.`);

                    // Reload test data to show new questions (Use native fetch here too to be safe)
                    const testResponse = await fetch(`${cleanBaseUrl}/api/tests/${uploadedTestId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    const testData = await testResponse.json();
                    if (testResponse.ok && testData.success && testData.test.questions) {
                        const loadedQuestions = testData.test.questions.map((q, idx) => ({
                            id: q.id || Date.now() + idx,
                            text: q.question_text,
                            options: [q.option_a, q.option_b, q.option_c || '', q.option_d || ''],
                            correctOption: q.correct_option.charCodeAt(0) - 65
                        }));
                        setQuestions(loadedQuestions);
                    }
                    setStep('init');
                } else {
                    alert(data.message || 'Failed to upload questions');
                }
            } else {
                // Create mode: parse the file locally and add its questions to the list.
                // The test itself is created later by the Save button (handleManualSubmit).
                const parsed = await parseQuestionsFile(file);

                if (parsed.length === 0) {
                    alert('No valid questions found in the file. Each row needs Question, OptionA, OptionB and CorrectOption.');
                    return;
                }

                setQuestions((prev) => [...prev, ...parsed]);
                setStep('init');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert(error.message || 'Failed to upload test. Please try again.');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await apiFetch(`api/tests/${uploadedTestId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'published' })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert(`Test "${uploadedTestName}" published successfully! Students can now see it.`);
                resetForm();
                if (onComplete) onComplete(data.test);
            } else {
                alert(data.message || 'Failed to publish test');
            }
        } catch (error) {
            console.error('Publish error:', error);
            alert('Failed to publish test. Please try again.');
        } finally {
            setIsPublishing(false);
        }
    };

    const resetForm = () => {
        setStep('init');
        setTestTitle('');
        setJobRoles([{
            job_role: defaultJobConfig.job_role,
            job_description: defaultJobConfig.job_description
        }]);
        setDuration(60);
        setMaxAttempts(1);
        setPassingPercentage(50);
        setStartDateTime('');
        setEndDateTime('');
        setQuestions([]);
        setCodingQuestions([]);
        setUploadedTestId(null);
        setUploadedTestName('');
    };

    return (
        <div className="space-y-6">
            {/* Step 1: Initialization (stays mounted under the Manual Entry / Bulk Upload modals) */}
            {(step === 'init' || step === 'manual' || step === 'bulk') && (
                <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-light p-8 max-w-3xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-shnoor-navy">{isEditMode ? (viewMode ? 'View Assessment' : 'Edit Assessment') : 'Create New Assessment'}</h2>
                        {viewMode && (
                            <button
                                onClick={() => setViewMode(false)}
                                className="px-4 py-2 bg-shnoor-indigo text-white rounded-lg hover:bg-shnoor-indigo transition-colors font-medium flex items-center space-x-2"
                            >
                                <Pencil size={18} />
                                <span>Edit</span>
                            </button>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Test Title */}
                        <div>
                            <label className="block text-sm font-bold text-shnoor-navy mb-2">Test Title *</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={testTitle}
                                    onChange={(e) => setTestTitle(e.target.value)}
                                    disabled={viewMode}
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:border-shnoor-indigo focus:ring-shnoor-indigo/20 transition-all font-medium text-shnoor-navy shadow-sm pr-10 ${viewMode ? 'bg-shnoor-light opacity-50 cursor-not-allowed border-shnoor-light' :
                                        nameAvailability.available === false
                                            ? 'border-shnoor-danger bg-shnoor-dangerLight'
                                            : nameAvailability.available === true
                                                ? 'border-shnoor-success bg-white'
                                                : 'border-shnoor-light bg-white'
                                        }`}
                                    placeholder="e.g., Java Fundamentals - Batch A"
                                    required
                                />
                                {nameAvailability.checking && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <Loader2 className="w-5 h-5 text-shnoor-navy animate-spin" />
                                    </div>
                                )}
                                {!nameAvailability.checking && nameAvailability.available === true && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <CheckCircle className="w-5 h-5 text-shnoor-success" />
                                    </div>
                                )}
                                {!nameAvailability.checking && nameAvailability.available === false && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <AlertCircle className="w-5 h-5 text-shnoor-danger" />
                                    </div>
                                )}
                            </div>
                            {nameAvailability.message && (
                                <p className={`mt-2 text-sm ${nameAvailability.available
                                    ? 'text-shnoor-success'
                                    : 'text-shnoor-danger'
                                    }`}>
                                    {nameAvailability.message}
                                </p>
                            )}
                        </div>

                        {/* Job Roles Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-bold text-shnoor-navy">Job Roles & Descriptions</label>
                                {!viewMode && (
                                    <button
                                        type="button"
                                        onClick={handleAddJobRole}
                                        className="flex items-center space-x-1 px-3 py-1.5 bg-white text-shnoor-indigo hover:text-shnoor-navy rounded-lg hover:bg-shnoor-light/30 border border-shnoor-light transition-colors text-sm font-medium"
                                    >
                                        <Plus size={16} />
                                        <span>Add Role</span>
                                    </button>
                                )}
                            </div>

                            {jobRoles.map((role, index) => (
                                <div key={index} className="p-5 border border-shnoor-light rounded-xl space-y-3 bg-white shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-shnoor-navy">
                                            Role {index + 1} {index === 0 && <span className="text-shnoor-indigo ml-2 px-2 py-1 bg-shnoor-lavender rounded-md text-xs">(Default)</span>}
                                        </span>
                                        {!viewMode && jobRoles.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveJobRole(index)}
                                                className="text-shnoor-danger hover:text-shnoor-danger p-1"
                                                title="Remove this role"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>

                                    <div>
                                        <input
                                            type="text"
                                            value={role.job_role}
                                            onChange={(e) => handleJobRoleChange(index, 'job_role', e.target.value)}
                                            disabled={viewMode}
                                            className={`w-full px-4 py-3 border-2 border-shnoor-light rounded-xl focus:ring-4 focus:ring-shnoor-indigo/20 focus:border-shnoor-indigo transition-all font-medium text-shnoor-navy ${viewMode ? 'bg-shnoor-light opacity-50 cursor-not-allowed' : 'bg-white'}`}
                                            placeholder="e.g., Senior Software Engineer, Junior Developer"
                                        />
                                    </div>

                                    <div>
                                        <textarea
                                            value={role.job_description}
                                            onChange={(e) => handleJobRoleChange(index, 'job_description', e.target.value)}
                                            rows={4}
                                            disabled={viewMode}
                                            className={`w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent resize-y ${viewMode ? 'bg-shnoor-lavender cursor-not-allowed' : ''}`}
                                            placeholder="Enter job description, requirements, responsibilities..."
                                        />
                                    </div>
                                </div>
                            ))}
                            <p className="text-xs text-shnoor-navy">Students will be able to select a role and view its description before taking the test</p>
                        </div>

                        {/* Duration and Max Attempts */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-shnoor-navy mb-2">Duration (minutes) *</label>
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                                    min="1"
                                    disabled={viewMode}
                                    className={`w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent ${viewMode ? 'bg-shnoor-lavender cursor-not-allowed' : ''}`}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-shnoor-navy mb-2">Max Attempts *</label>
                                <input
                                    type="number"
                                    value={maxAttempts}
                                    onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
                                    min="1"
                                    disabled={viewMode}
                                    className={`w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent ${viewMode ? 'bg-shnoor-lavender cursor-not-allowed' : ''}`}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-shnoor-navy mb-2">Passing % *</label>
                                <input
                                    type="number"
                                    value={passingPercentage}
                                    onChange={(e) => setPassingPercentage(parseInt(e.target.value) || 50)}
                                    disabled={viewMode}
                                    className={`w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent ${viewMode ? 'bg-shnoor-lavender cursor-not-allowed' : ''}`}
                                    min="0"
                                    max="100"
                                    required
                                />
                            </div>
                        </div>

                        {/* Start and End DateTime */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-shnoor-navy mb-2">Start Date & Time (Optional)</label>
                                <input
                                    type="datetime-local"
                                    value={startDateTime}
                                    onChange={(e) => setStartDateTime(e.target.value)}
                                    disabled={viewMode}
                                    className={`w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent ${viewMode ? 'bg-shnoor-lavender cursor-not-allowed' : ''}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-shnoor-navy mb-2">End Date & Time (Optional)</label>
                                <input
                                    type="datetime-local"
                                    value={endDateTime}
                                    onChange={(e) => setEndDateTime(e.target.value)}
                                    disabled={viewMode}
                                    className={`w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent ${viewMode ? 'bg-shnoor-lavender cursor-not-allowed' : ''}`}
                                />
                            </div>
                        </div>

                        {/* Add Coding Question Button */}
                         {!viewMode && (
                            <div className="pt-4 border-t border-shnoor-mist">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <button
                                        onClick={() => {
                                            setEditingCodingQuestionId(null);
                                            setCurrentCodingQuestion({
                                                title: '',
                                                description: '',
                                                publicTestCases: [{ input: '', output: '', explanation: '' }],
                                                hiddenTestCases: [{ input: '', output: '' }],
                                                timeLimit: 2,
                                                memoryLimit: 256,
                                                marks: 10
                                            });
                                            setShowCodingModal(true);
                                        }}
                                        className="py-3 bg-white border-2 border-shnoor-mist hover:border-shnoor-indigo text-shnoor-navy hover:text-shnoor-indigo font-semibold rounded-lg transition-all flex items-center justify-center space-x-2"
                                    >
                                        <Plus size={20} />
                                        <span>Create New Coding Question</span>
                                    </button>
                                    <button
                                        onClick={() => setShowCodingSelector(true)}
                                        className="py-3 bg-shnoor-indigo hover:bg-shnoor-navy text-white font-semibold rounded-lg transition-all flex items-center justify-center space-x-2"
                                    >
                                        <List size={20} />
                                        <span>Select from Question Bank</span>
                                    </button>
                                </div>
                            </div>
                        )} 

                        {/* Coding Questions List (edit mode; create mode renders the combined list below the entry options) */}
                         {isEditMode && codingQuestions.length > 0 && (
                            <div className="pt-4 space-y-3">
                                <h4 className="font-semibold text-shnoor-navy mb-3">Coding Questions ({codingQuestions.length})</h4>
                                {codingQuestions.map((q, idx) => (
                                    <div key={q.id} className="bg-white border-2 border-shnoor-mist rounded-lg p-4 hover:border-shnoor-mist transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-shnoor-lavender rounded-lg flex items-center justify-center">
                                                    <Code className="w-5 h-5 text-shnoor-navy" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-shnoor-navy">Coding Question {idx + 1}</h4>
                                                    <p className="text-sm text-shnoor-navy">{q.title}</p>
                                                    <p className="text-xs text-shnoor-indigo mt-1">Marks: {q.marks || 10}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleViewCodingQuestion(q)}
                                                    className="p-2 bg-shnoor-lavender hover:bg-shnoor-lavender text-shnoor-navy rounded-lg transition-colors"
                                                    title="View question"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {!viewMode && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEditCodingQuestion(q)}
                                                            className="p-2 bg-shnoor-lavender hover:bg-shnoor-lavender text-shnoor-indigo rounded-lg transition-colors"
                                                            title="Edit question"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveCodingQuestion(q.id)}
                                                            className="p-2 bg-shnoor-dangerLight hover:bg-shnoor-dangerLight text-shnoor-danger rounded-lg transition-colors"
                                                            title="Delete question"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )} 

                        {isEditMode ? (
                            /* Edit Mode: Show options to edit manually or upload new file */
                            <div className="pt-6">
                                <div className="bg-shnoor-lavender border-2 border-shnoor-mist rounded-xl p-6 mb-6">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-10 h-10 bg-shnoor-indigo rounded-full flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-shnoor-navy">Current Questions</h3>
                                            <p className="text-sm text-shnoor-navy">{questions.length} question{questions.length !== 1 ? 's' : ''} loaded</p>
                                        </div>
                                    </div>
                                    {!viewMode && (
                                        <p className="text-sm text-shnoor-navy">
                                            Choose how you want to update the questions for this test.
                                        </p>
                                    )}
                                </div>

                                {!viewMode && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <button
                                                onClick={() => handleStart('manual')}
                                                className="p-6 border-2 border-shnoor-mist rounded-xl text-left transition-all hover:border-shnoor-indigo hover:shadow-lg group bg-white"
                                            >
                                                <div className="w-12 h-12 bg-shnoor-lavender rounded-full flex items-center justify-center mb-4 group-hover:bg-shnoor-indigo transition-colors">
                                                    <FileText className="w-6 h-6 text-shnoor-indigo group-hover:text-white" />
                                                </div>
                                                <h3 className="font-bold text-shnoor-navy mb-2">Edit Questions Manually</h3>
                                                <p className="text-sm text-shnoor-navy mb-3">Edit existing questions, add new ones, or remove questions individually.</p>
                                                <div className="flex items-center text-xs text-shnoor-indigo font-medium">
                                                    <span>Edit {questions.length} question{questions.length !== 1 ? 's' : ''}</span>
                                                    <ArrowLeft size={14} className="ml-1 rotate-180" />
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => handleStart('bulk')}
                                                className="p-6 border-2 border-shnoor-mist rounded-xl text-left transition-all hover:border-shnoor-danger hover:shadow-lg group bg-white"
                                            >
                                                <div className="w-12 h-12 bg-shnoor-dangerLight rounded-full flex items-center justify-center mb-4 group-hover:bg-shnoor-danger transition-colors">
                                                    <Upload className="w-6 h-6 text-shnoor-danger group-hover:text-white" />
                                                </div>
                                                <h3 className="font-bold text-shnoor-navy mb-2">Upload New Questions File</h3>
                                                <p className="text-sm text-shnoor-navy mb-3">Replace all existing questions by uploading a new CSV/Excel file.</p>
                                                <div className="flex items-center text-xs text-shnoor-danger font-medium">
                                                    <AlertCircle size={14} className="mr-1" />
                                                    <span>Will replace {questions.length} question{questions.length !== 1 ? 's' : ''}</span>
                                                </div>
                                            </button>
                                        </div>

                                        <div className="bg-shnoor-warningLight border-2 border-shnoor-warningLight rounded-xl p-4 flex items-start space-x-3 mb-6">
                                            <AlertCircle className="w-5 h-5 text-shnoor-warning flex-shrink-0 mt-0.5" />
                                            <div className="text-sm text-shnoor-warning">
                                                <p className="font-semibold mb-1">Important:</p>
                                                <ul className="list-disc list-inside space-y-1">
                                                    <li>Review test details above before proceeding</li>
                                                    <li>Uploading a new file will <strong>delete all existing questions</strong></li>
                                                    <li>Changes will be saved when you click "Save Changes"</li>
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Save Changes and Cancel Buttons */}
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                                            <button
                                                onClick={handleManualSubmit}
                                                disabled={isUploading}
                                                className="flex-1 py-4 bg-shnoor-indigo hover:bg-shnoor-indigo text-white font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                        <span>Saving...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save size={20} />
                                                        <span>Save Changes</span>
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setViewMode(true)}
                                                disabled={isUploading}
                                                className="px-6 py-4 bg-shnoor-lavender hover:bg-shnoor-lavender text-shnoor-navy font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            /* Create Mode: Show manual and bulk upload options */
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                <button
                                    onClick={() => handleStart('manual')}
                                    className={`p-6 border-2 border-shnoor-mist rounded-xl text-left transition-all hover:border-shnoor-indigo group bg-white ${!testTitle || nameAvailability.available === false || nameAvailability.checking
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:shadow-md'
                                        }`}
                                    disabled={!testTitle || nameAvailability.available === false || nameAvailability.checking}
                                >
                                    <div className="w-12 h-12 bg-shnoor-lavender rounded-full flex items-center justify-center mb-4 group-hover:bg-shnoor-indigo transition-colors">
                                        <Plus className="w-6 h-6 text-shnoor-indigo group-hover:text-white" />
                                    </div>
                                    <h3 className="font-bold text-shnoor-navy mb-1">Manual Entry</h3>
                                    <p className="text-sm text-shnoor-navy">Add questions one by one with a simple form interface.</p>
                                </button>

                                <button
                                    onClick={() => handleStart('bulk')}
                                    className={`p-6 border-2 border-shnoor-mist rounded-xl text-left transition-all hover:border-shnoor-indigo group bg-white ${!testTitle || nameAvailability.available === false || nameAvailability.checking
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:shadow-md'
                                        }`}
                                    disabled={!testTitle || nameAvailability.available === false || nameAvailability.checking}
                                >
                                    <div className="w-12 h-12 bg-shnoor-lavender rounded-full flex items-center justify-center mb-4 group-hover:bg-shnoor-indigo transition-colors">
                                        <Upload className="w-6 h-6 text-shnoor-indigo group-hover:text-white" />
                                    </div>
                                    <h3 className="font-bold text-shnoor-navy mb-1">Bulk Upload</h3>
                                    <p className="text-sm text-shnoor-navy">Upload an Excel or CSV file containing multiple questions.</p>
                                </button>
                            </div>
                        )}

                        {/* Questions List + Save (create mode) */}
                        {!isEditMode && (
                            <div className="pt-4">
                                <h4 className="font-semibold text-shnoor-navy mb-3">Questions ({questions.length + codingQuestions.length})</h4>
                                {questions.length + codingQuestions.length === 0 ? (
                                    <div className="text-center py-8 text-shnoor-navy border-2 border-dashed border-shnoor-mist rounded-lg">
                                        <FileText className="mx-auto h-10 w-10 mb-2 opacity-50" />
                                        <p>No questions added yet</p>
                                    </div>
                                ) : (
                                    <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
                                        {codingQuestions.map((q, idx) => (
                                            <div key={q.id} className="bg-white border-2 border-shnoor-mist rounded-lg p-4 hover:border-shnoor-mist transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 bg-shnoor-lavender rounded-lg flex items-center justify-center">
                                                            <Code className="w-5 h-5 text-shnoor-navy" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-shnoor-navy">Coding Question {idx + 1}</h4>
                                                            <p className="text-sm text-shnoor-navy">{q.title}</p>
                                                            <p className="text-xs text-shnoor-indigo mt-1">Marks: {q.marks || 10}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => handleViewCodingQuestion(q)}
                                                            className="p-2 bg-shnoor-lavender hover:bg-shnoor-lavender text-shnoor-navy rounded-lg transition-colors"
                                                            title="View question"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditCodingQuestion(q)}
                                                            className="p-2 bg-shnoor-lavender hover:bg-shnoor-lavender text-shnoor-indigo rounded-lg transition-colors"
                                                            title="Edit question"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveCodingQuestion(q.id)}
                                                            className="p-2 bg-shnoor-dangerLight hover:bg-shnoor-dangerLight text-shnoor-danger rounded-lg transition-colors"
                                                            title="Delete question"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {questions.map((q, idx) => (
                                            <div key={q.id} className="bg-white border-2 border-shnoor-mist rounded-lg p-4 hover:border-shnoor-mist transition-colors">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center space-x-3 min-w-0">
                                                        <div className="w-10 h-10 bg-shnoor-lavender rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <FileText className="w-5 h-5 text-shnoor-navy" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                <h4 className="font-semibold text-shnoor-navy">MCQ Question {idx + 1}</h4>
                                                                {q.fromBank && (
                                                                    <span className="text-xs text-shnoor-indigo bg-shnoor-lavender px-2 py-0.5 rounded">Bank</span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-shnoor-navy line-clamp-1">{q.text}</p>
                                                            <p className="text-xs text-shnoor-indigo mt-1">Marks: {q.marks || 1}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                                        <button
                                                            onClick={() => handleRemoveQuestion(q.id)}
                                                            className="p-2 bg-shnoor-dangerLight hover:bg-shnoor-dangerLight text-shnoor-danger rounded-lg transition-colors"
                                                            title="Delete question"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Sticky Save button */}
                                <div className="sticky bottom-0 z-10 bg-white pt-4 pb-2 mt-2">
                                    <button
                                        onClick={handleManualSubmit}
                                        disabled={questions.length + codingQuestions.length === 0 || isUploading || !testTitle.trim() || nameAvailability.available === false}
                                        className="w-full py-4 bg-shnoor-indigo hover:bg-shnoor-indigo text-white font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isUploading ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        ) : (
                                            <>
                                                <Save size={20} />
                                                <span>Save ({questions.length + codingQuestions.length} Questions)</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Manual Entry Modal */}
            {step === 'manual' && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 z-10 bg-white border-b border-shnoor-mist p-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-shnoor-navy">{testTitle}</h3>
                            <p className="text-sm text-shnoor-navy">Adding questions manually</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2 bg-shnoor-lavender px-4 py-2 rounded-lg">
                                <span className="text-shnoor-indigo font-bold">{questions.length}</span>
                                <span className="text-shnoor-indigo text-sm">Questions Added</span>
                            </div>
                            <button
                                onClick={() => setStep('init')}
                                className="p-2 hover:bg-shnoor-lavender rounded-lg transition-colors"
                            >
                                <X size={20} className="text-shnoor-navy" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Form Side */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex rounded-lg border border-shnoor-mist p-1 bg-shnoor-lavender">
                                <button
                                    type="button"
                                    onClick={() => setQuestionInputMode('type')}
                                    className={`flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                                        questionInputMode === 'type'
                                            ? 'bg-white text-shnoor-indigo shadow-sm'
                                            : 'text-shnoor-navy hover:text-shnoor-indigo'
                                    }`}
                                >
                                    <FileText size={16} />
                                    Type Manually
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setQuestionInputMode('bank')}
                                    className={`flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                                        questionInputMode === 'bank'
                                            ? 'bg-white text-shnoor-indigo shadow-sm'
                                            : 'text-shnoor-navy hover:text-shnoor-indigo'
                                    }`}
                                >
                                    <List size={16} />
                                    From Question Bank
                                </button>
                            </div>

                            {questionInputMode === 'bank' ? (
                                <MCQBankSelector
                                    key={bankSelectorKey}
                                    variant="inline"
                                    onSelect={handleSelectMcqFromBank}
                                    selectedQuestionIds={questions.filter((q) => q.bankId).map((q) => q.bankId)}
                                    selectedRoles={jobRoles}
                                />
                            ) : (
                            <>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-shnoor-navy">Question Text</label>
                                    <div className="flex items-center space-x-1 bg-shnoor-lavender rounded-lg p-1">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentQuestion({ ...currentQuestion, format: 'paragraph' })}
                                            className={`p-2 rounded transition-colors ${currentQuestion.format === 'paragraph'
                                                ? 'bg-shnoor-indigo text-white'
                                                : 'text-shnoor-navy hover:bg-white'
                                                }`}
                                            title="Paragraph format (Markdown supported)"
                                        >
                                            <AlignLeft size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentQuestion({ ...currentQuestion, format: 'line' })}
                                            className={`p-2 rounded transition-colors ${currentQuestion.format === 'line'
                                                ? 'bg-shnoor-indigo text-white'
                                                : 'text-shnoor-navy hover:bg-white'
                                                }`}
                                            title="Line format (preserves line breaks)"
                                        >
                                            <List size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentQuestion({ ...currentQuestion, format: 'code' })}
                                            className={`p-2 rounded transition-colors ${currentQuestion.format === 'code'
                                                ? 'bg-shnoor-indigo text-white'
                                                : 'text-shnoor-navy hover:bg-white'
                                                }`}
                                            title="Code format (monospace, syntax highlighting)"
                                        >
                                            <Code size={16} />
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    value={currentQuestion.text}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                                    rows={6}
                                    className={`w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent text-sm ${currentQuestion.format === 'code' ? 'font-mono' : ''
                                        }`}
                                    placeholder="Enter Question here"
                                    style={{ whiteSpace: 'pre-wrap' }}
                                />
                                <p className="text-xs text-shnoor-indigoMedium mt-1">
                                    {currentQuestion.format === 'paragraph' && '📝 Paragraph: Supports Markdown formatting (**bold**, *italic*, `code`, lists)'}
                                    {currentQuestion.format === 'line' && '📄 Line: Preserves line breaks and spacing'}
                                    {currentQuestion.format === 'code' && '💻 Code: Monospace font with syntax highlighting'}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-shnoor-navy">Options</label>
                                {currentQuestion.options.map((opt, idx) => (
                                    <div key={idx} className="flex items-center space-x-3">
                                        <span className="w-6 text-sm text-shnoor-navy font-medium">{String.fromCharCode(65 + idx)}</span>
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => {
                                                const newOptions = [...currentQuestion.options];
                                                newOptions[idx] = e.target.value;
                                                setCurrentQuestion({ ...currentQuestion, options: newOptions });
                                            }}
                                            className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent ${currentQuestion.correctOption === idx ? 'border-shnoor-success bg-shnoor-successLight' : 'border-shnoor-mist'}`}
                                            placeholder={`Option ${idx + 1}`}
                                        />
                                        <button
                                            onClick={() => setCurrentQuestion({ ...currentQuestion, correctOption: idx })}
                                            className={`p-2 rounded-full transition-colors ${currentQuestion.correctOption === idx ? 'bg-shnoor-successLight text-shnoor-success' : 'bg-shnoor-lavender text-shnoor-navy hover:bg-shnoor-lavender'}`}
                                            title="Mark as correct answer"
                                        >
                                            <CheckCircle size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={handleAddQuestion}
                                className="w-full py-3 bg-theme-accent hover:bg-theme-accent2 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
                            >
                                <Plus size={20} />
                                <span>Add Question to Test</span>
                            </button>
                            </>
                            )}

                            <div className="pt-6 border-t border-shnoor-mist">
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                                    <button
                                        // Create mode: return to the Create New Assessment page; the test is saved from there
                                        onClick={isEditMode ? handleManualSubmit : () => setStep('init')}
                                        disabled={questions.length === 0 || isUploading}
                                        className={`flex-1 py-4 bg-shnoor-indigo hover:bg-shnoor-indigo text-white font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center space-x-2 ${questions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isUploading ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        ) : (
                                            <>
                                                <Save size={20} />
                                                <span>{isEditMode ? 'Save Changes' : 'Save'} ({questions.length} Questions)</span>
                                            </>
                                        )}
                                    </button>
                                    {isEditMode && (
                                        <button
                                            onClick={() => {
                                                setStep('init');
                                                setViewMode(true);
                                            }}
                                            disabled={isUploading}
                                            className="px-6 py-4 bg-shnoor-lavender hover:bg-shnoor-lavender text-shnoor-navy font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Preview Side */}
                        <div className="bg-shnoor-lavender rounded-xl p-4 h-fit max-h-[600px] overflow-y-auto border border-shnoor-mist">
                            <h3 className="font-bold text-shnoor-navy mb-1">Added Questions</h3>
                            <p className="text-xs text-shnoor-navy mb-4">Questions you add appear here. Remove any with the trash icon before saving the test.</p>
                            {questions.length === 0 ? (
                                <div className="text-center py-8 text-shnoor-navy">
                                    <FileText className="mx-auto h-10 w-10 mb-2 opacity-50" />
                                    <p>No questions added yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {questions.map((q, idx) => (
                                        <div key={q.id} className="bg-white p-4 rounded-lg border border-shnoor-mist shadow-sm">
                                            <div className="flex justify-between items-start mb-2 gap-2">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className="font-bold text-xs text-shnoor-navy bg-shnoor-lavender px-2 py-1 rounded">Q{idx + 1}</span>
                                                    {q.fromBank && (
                                                        <span className="text-xs text-shnoor-indigo bg-shnoor-lavender px-2 py-0.5 rounded">Bank</span>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveQuestion(q.id)}
                                                    className="p-1.5 text-shnoor-danger hover:bg-shnoor-dangerLight rounded-lg flex-shrink-0"
                                                    title="Remove question"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <p className="text-sm font-medium text-shnoor-navy mb-2 line-clamp-2">{q.text}</p>
                                            <div className="space-y-1">
                                                {q.options.map((opt, i) => (
                                                    <div key={i} className={`text-xs px-2 py-1 rounded ${q.correctOption === i ? 'bg-shnoor-successLight text-shnoor-success font-medium' : 'text-shnoor-navy'}`}>
                                                        {opt}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    </div>
                    </div>
                </div>
            )}

            {/* Bulk Upload Modal */}
            {step === 'bulk' && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 z-10 bg-white border-b border-shnoor-mist p-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-shnoor-navy">{testTitle}</h3>
                            <p className="text-sm text-shnoor-navy">Bulk Upload via Excel/CSV</p>
                        </div>
                        <button
                            onClick={() => setStep('init')}
                            className="p-2 hover:bg-shnoor-lavender rounded-lg transition-colors"
                        >
                            <X size={20} className="text-shnoor-navy" />
                        </button>
                    </div>

                    <div className="p-6">
                    <div className="border-2 border-dashed border-shnoor-mist rounded-lg p-12 text-center hover:border-shnoor-indigo transition-colors relative">
                        {isUploading && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shnoor-indigo"></div>
                            </div>
                        )}

                        <div className="w-16 h-16 bg-shnoor-lavender rounded-full flex items-center justify-center mx-auto mb-4">
                            <Upload className="w-8 h-8 text-shnoor-navy" />
                        </div>
                        <p className="text-shnoor-navy mb-2">Drag and drop your Excel/CSV file here</p>
                        <p className="text-sm text-shnoor-navy mb-6">Supported formats: .csv, .xlsx, .xls</p>

                        <label className="inline-flex items-center px-6 py-3 bg-shnoor-indigo hover:bg-shnoor-indigo text-white font-semibold rounded-lg cursor-pointer transition-colors shadow-sm">
                            <Upload size={18} className="mr-2" />
                            Select File
                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                className="hidden"
                                onChange={handleBulkUpload}
                                disabled={isUploading}
                            />
                        </label>
                    </div>

                    <div className="mt-8 bg-shnoor-lavender p-4 rounded-lg flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            <FileText className="h-5 w-5 text-shnoor-indigo" />
                        </div>
                        <div className="text-sm text-shnoor-indigo">
                            <p className="font-bold mb-1">CSV Template Format:</p>
                            <p>Question, Option1, Option2, Option3, Option4, CorrectOption(1-4), Marks, Tags</p>
                        </div>
                    </div>
                    </div>
                    </div>
                </div>
            )}

            {/* Step 3: Success Screen */}
            {step === 'success' && (
                <div className="bg-white rounded-xl shadow-sm border border-shnoor-mist p-8 max-w-2xl mx-auto">
                    <div className="text-center">
                        {/* Success Icon */}
                        <div className="w-20 h-20 bg-shnoor-successLight rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-shnoor-success" />
                        </div>

                        {/* Success Message */}
                        <h2 className="text-3xl font-bold text-shnoor-navy mb-3">Test Saved as Draft!</h2>
                        <p className="text-lg text-shnoor-navy mb-2">"{uploadedTestName}"</p>
                        <p className="text-sm text-shnoor-navy mb-8">Your test has been saved as a draft. You can publish it now or later from the dashboard.</p>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={handlePublish}
                                disabled={isPublishing}
                                className="w-full py-4 bg-shnoor-indigo hover:bg-shnoor-indigo text-white font-bold rounded-lg transition-colors shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPublishing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Publishing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={20} />
                                        <span>Publish Test Now</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => {
                                    resetForm();
                                    if (onComplete) onComplete();
                                }}
                                className="w-full py-4 bg-shnoor-lavender hover:bg-shnoor-lavender text-shnoor-navy font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
                            >
                                <ArrowLeft size={20} />
                                <span>Save as Draft & Return to Dashboard</span>
                            </button>
                        </div>

                        {/* Info Box */}
                        <div className="mt-8 bg-shnoor-lavender p-4 rounded-lg text-left">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <FileText className="h-5 w-5 text-shnoor-indigo" />
                                </div>
                                <div className="text-sm text-shnoor-indigo">
                                    <p className="font-bold mb-1">What's the difference?</p>
                                    <ul className="text-shnoor-indigo space-y-1 list-disc list-inside">
                                        <li><span className="font-semibold">Draft:</span> Test is saved but not visible to students</li>
                                        <li><span className="font-semibold">Published:</span> Students can immediately see and take the test</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Coding Question Modal */}
            {showCodingModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-shnoor-mist p-6 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-shnoor-navy">
                                {editingCodingQuestionId ? 'Edit Coding Question' : 'Add Coding Question'}
                            </h3>
                            <button
                                onClick={() => setShowCodingModal(false)}
                                className="p-2 hover:bg-shnoor-lavender rounded-lg transition-colors"
                            >
                                <X size={20} className="text-shnoor-navy" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-shnoor-navy mb-2">Question Title *</label>
                                <input
                                    type="text"
                                    value={currentCodingQuestion.title}
                                    onChange={(e) => setCurrentCodingQuestion({ ...currentCodingQuestion, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent"
                                    placeholder="e.g., Two Sum Problem"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-shnoor-navy mb-2">Problem Description *</label>
                                <textarea
                                    value={currentCodingQuestion.description}
                                    onChange={(e) => setCurrentCodingQuestion({ ...currentCodingQuestion, description: e.target.value })}
                                    rows={6}
                                    className="w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent resize-y"
                                    placeholder="Describe the problem, constraints, and requirements..."
                                />
                            </div>

                            {/* Marks, Time Limit, Memory Limit */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-shnoor-navy mb-2">Marks *</label>
                                    <input
                                        type="number"
                                        value={currentCodingQuestion.marks}
                                        onChange={(e) => setCurrentCodingQuestion({ ...currentCodingQuestion, marks: parseInt(e.target.value) || 10 })}
                                        min="1"
                                        className="w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-shnoor-navy mb-2">Time Limit (sec) *</label>
                                    <input
                                        type="number"
                                        value={currentCodingQuestion.timeLimit}
                                        onChange={(e) => setCurrentCodingQuestion({ ...currentCodingQuestion, timeLimit: parseFloat(e.target.value) || 2 })}
                                        step="0.1"
                                        min="0.1"
                                        className="w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-shnoor-navy mb-2">Memory Limit (MB) *</label>
                                    <input
                                        type="number"
                                        value={currentCodingQuestion.memoryLimit}
                                        onChange={(e) => setCurrentCodingQuestion({ ...currentCodingQuestion, memoryLimit: parseInt(e.target.value) || 256 })}
                                        min="1"
                                        className="w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Public Test Cases */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-medium text-shnoor-navy">Public Test Cases *</label>
                                    <button
                                        onClick={handleAddPublicTestCase}
                                        className="flex items-center space-x-1 px-3 py-1.5 bg-shnoor-lavender text-shnoor-indigo rounded-lg hover:bg-shnoor-indigo hover:text-white transition-colors text-sm font-medium"
                                    >
                                        <Plus size={16} />
                                        <span>Add Test Case</span>
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {currentCodingQuestion.publicTestCases.map((tc, idx) => (
                                        <div key={idx} className="p-4 border border-shnoor-mist rounded-lg space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-shnoor-navy">Test Case {idx + 1}</span>
                                                {currentCodingQuestion.publicTestCases.length > 1 && (
                                                    <button
                                                        onClick={() => handleRemovePublicTestCase(idx)}
                                                        className="text-shnoor-danger hover:text-shnoor-danger p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs text-shnoor-navy mb-1">Input</label>
                                                    <textarea
                                                        value={tc.input}
                                                        onChange={(e) => {
                                                            const newTestCases = [...currentCodingQuestion.publicTestCases];
                                                            newTestCases[idx].input = e.target.value;
                                                            setCurrentCodingQuestion({ ...currentCodingQuestion, publicTestCases: newTestCases });
                                                        }}
                                                        rows={2}
                                                        className="w-full px-3 py-2 border border-shnoor-mist rounded-lg text-sm focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent resize-y"
                                                        placeholder="Input data"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-shnoor-navy mb-1">Expected Output</label>
                                                    <textarea
                                                        value={tc.output}
                                                        onChange={(e) => {
                                                            const newTestCases = [...currentCodingQuestion.publicTestCases];
                                                            newTestCases[idx].output = e.target.value;
                                                            setCurrentCodingQuestion({ ...currentCodingQuestion, publicTestCases: newTestCases });
                                                        }}
                                                        rows={2}
                                                        className="w-full px-3 py-2 border border-shnoor-mist rounded-lg text-sm focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent resize-y"
                                                        placeholder="Expected output"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-shnoor-navy mb-1">Explanation (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={tc.explanation}
                                                    onChange={(e) => {
                                                        const newTestCases = [...currentCodingQuestion.publicTestCases];
                                                        newTestCases[idx].explanation = e.target.value;
                                                        setCurrentCodingQuestion({ ...currentCodingQuestion, publicTestCases: newTestCases });
                                                    }}
                                                    className="w-full px-3 py-2 border border-shnoor-mist rounded-lg text-sm focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent"
                                                    placeholder="Explain this test case"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Hidden Test Cases */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-medium text-shnoor-navy">Hidden Test Cases *</label>
                                    <button
                                        onClick={handleAddHiddenTestCase}
                                        className="flex items-center space-x-1 px-3 py-1.5 bg-shnoor-lavender text-shnoor-indigo rounded-lg hover:bg-shnoor-indigo hover:text-white transition-colors text-sm font-medium"
                                    >
                                        <Plus size={16} />
                                        <span>Add Test Case</span>
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {currentCodingQuestion.hiddenTestCases.map((tc, idx) => (
                                        <div key={idx} className="p-4 border border-shnoor-mist rounded-lg space-y-3 bg-shnoor-lavender/30">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-shnoor-navy">Hidden Test Case {idx + 1}</span>
                                                {currentCodingQuestion.hiddenTestCases.length > 1 && (
                                                    <button
                                                        onClick={() => handleRemoveHiddenTestCase(idx)}
                                                        className="text-shnoor-danger hover:text-shnoor-danger p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs text-shnoor-navy mb-1">Input</label>
                                                    <textarea
                                                        value={tc.input}
                                                        onChange={(e) => {
                                                            const newTestCases = [...currentCodingQuestion.hiddenTestCases];
                                                            newTestCases[idx].input = e.target.value;
                                                            setCurrentCodingQuestion({ ...currentCodingQuestion, hiddenTestCases: newTestCases });
                                                        }}
                                                        rows={2}
                                                        className="w-full px-3 py-2 border border-shnoor-mist rounded-lg text-sm focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent resize-y"
                                                        placeholder="Input data"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-shnoor-navy mb-1">Expected Output</label>
                                                    <textarea
                                                        value={tc.output}
                                                        onChange={(e) => {
                                                            const newTestCases = [...currentCodingQuestion.hiddenTestCases];
                                                            newTestCases[idx].output = e.target.value;
                                                            setCurrentCodingQuestion({ ...currentCodingQuestion, hiddenTestCases: newTestCases });
                                                        }}
                                                        rows={2}
                                                        className="w-full px-3 py-2 border border-shnoor-mist rounded-lg text-sm focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent resize-y"
                                                        placeholder="Expected output"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-shnoor-mist">
                                <button
                                    onClick={() => setShowCodingModal(false)}
                                    className="px-6 py-3 bg-shnoor-lavender text-shnoor-navy font-semibold rounded-lg hover:bg-shnoor-mist transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveCodingQuestion}
                                    className="px-6 py-3 bg-shnoor-indigo text-white font-semibold rounded-lg hover:bg-shnoor-navy transition-colors flex items-center space-x-2"
                                >
                                    <Save size={18} />
                                    <span>{editingCodingQuestionId ? 'Update Question' : 'Add Question'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Coding Question View Modal */}
            {showCodingViewModal && viewingCodingQuestion && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-shnoor-mist p-6 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-shnoor-navy">View Coding Question</h3>
                            <button
                                onClick={() => setShowCodingViewModal(false)}
                                className="p-2 hover:bg-shnoor-lavender rounded-lg transition-colors"
                            >
                                <X size={20} className="text-shnoor-navy" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <h4 className="text-lg font-bold text-shnoor-navy mb-2">{viewingCodingQuestion.title}</h4>
                                <p className="text-shnoor-navy whitespace-pre-wrap">{viewingCodingQuestion.description}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4 p-4 bg-shnoor-lavender rounded-lg">
                                <div>
                                    <span className="text-sm text-shnoor-navy">Marks:</span>
                                    <p className="font-semibold text-shnoor-navy">{viewingCodingQuestion.marks}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-shnoor-navy">Time Limit:</span>
                                    <p className="font-semibold text-shnoor-navy">{viewingCodingQuestion.timeLimit}s</p>
                                </div>
                                <div>
                                    <span className="text-sm text-shnoor-navy">Memory Limit:</span>
                                    <p className="font-semibold text-shnoor-navy">{viewingCodingQuestion.memoryLimit}MB</p>
                                </div>
                            </div>

                            <div>
                                <h5 className="font-semibold text-shnoor-navy mb-3">Public Test Cases</h5>
                                <div className="space-y-3">
                                    {viewingCodingQuestion.publicTestCases.map((tc, idx) => (
                                        <div key={idx} className="p-4 border border-shnoor-mist rounded-lg">
                                            <p className="text-sm font-medium text-shnoor-navy mb-2">Test Case {idx + 1}</p>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <span className="text-shnoor-navy font-medium">Input:</span>
                                                    <pre className="mt-1 p-2 bg-shnoor-lavender rounded text-shnoor-navy">{tc.input}</pre>
                                                </div>
                                                <div>
                                                    <span className="text-shnoor-navy font-medium">Output:</span>
                                                    <pre className="mt-1 p-2 bg-shnoor-lavender rounded text-shnoor-navy">{tc.output}</pre>
                                                </div>
                                            </div>
                                            {tc.explanation && (
                                                <p className="mt-2 text-sm text-shnoor-navy"><strong>Explanation:</strong> {tc.explanation}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h5 className="font-semibold text-shnoor-navy mb-3">Hidden Test Cases</h5>
                                <div className="space-y-3">
                                    {viewingCodingQuestion.hiddenTestCases.map((tc, idx) => (
                                        <div key={idx} className="p-4 border border-shnoor-mist rounded-lg bg-shnoor-lavender/30">
                                            <p className="text-sm font-medium text-shnoor-navy mb-2">Hidden Test Case {idx + 1}</p>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <span className="text-shnoor-navy font-medium">Input:</span>
                                                    <pre className="mt-1 p-2 bg-white rounded text-shnoor-navy">{tc.input}</pre>
                                                </div>
                                                <div>
                                                    <span className="text-shnoor-navy font-medium">Output:</span>
                                                    <pre className="mt-1 p-2 bg-white rounded text-shnoor-navy">{tc.output}</pre>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-end pt-4 border-t border-shnoor-mist">
                                <button
                                    onClick={() => setShowCodingViewModal(false)}
                                    className="px-6 py-3 bg-shnoor-indigo text-white font-semibold rounded-lg hover:bg-shnoor-navy transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Coding Question Selector Modal */}
            {showCodingSelector && (
                <CodingQuestionSelector
                    onClose={() => setShowCodingSelector(false)}
                    onSelect={handleSelectFromBank}
                    selectedQuestionIds={codingQuestions.filter(q => q.bankId).map(q => q.bankId)}
                    selectedRoles={jobRoles}
                />
            )}

        </div>
    );
};

export default CreateTestSection;