const fs = require('fs');

const reactSelectStyles = `                        styles={{
                          control: (base) => ({
                            ...base,
                            backgroundColor: 'rgb(var(--theme-card))',
                            borderColor: 'rgb(var(--theme-border))',
                            color: 'rgb(var(--theme-text))',
                            boxShadow: 'none',
                            '&:hover': {
                              borderColor: 'rgb(var(--theme-accent))'
                            }
                          }),
                          menu: (base) => ({
                            ...base,
                            backgroundColor: 'rgb(var(--theme-card))',
                            border: '1px solid rgb(var(--theme-border))',
                            zIndex: 50
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isSelected 
                              ? 'rgb(var(--theme-accent))' 
                              : state.isFocused 
                                ? 'rgb(var(--theme-panel))' 
                                : 'transparent',
                            color: state.isSelected ? '#fff' : 'rgb(var(--theme-text))',
                            '&:active': {
                              backgroundColor: 'rgb(var(--theme-accent))',
                              color: '#fff'
                            },
                            cursor: 'pointer'
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
                            color: 'rgba(var(--theme-text-rgb, 120, 120, 130), 0.5)'
                          })
                        }}`;

// Fix AdminDashboard.jsx Select styles
let dashboard = fs.readFileSync('c:/assessment/frontend/src/pages/admin/AdminDashboard.jsx', 'utf8');
dashboard = dashboard.replace(/styles=\{\{[\s\S]*?\}\}\s*\/>/m, reactSelectStyles + '\n                      />');

// Fix 4 buttons in AdminDashboard.jsx
const btnTests = /className="py-2 px-3 bg-shnoor-lavender text-shnoor-indigo hover:bg-shnoor-indigo hover:text-white rounded-lg text-sm font-medium transition-colors"/g;
const btnStudents = /className="py-2 px-3 bg-shnoor-successLight text-shnoor-success hover:bg-shnoor-success hover:text-white rounded-lg text-sm font-medium transition-colors"/g;
const btnDelete = /className="py-2 px-3 bg-shnoor-lavender text-shnoor-danger hover:bg-shnoor-danger hover:text-white rounded-lg transition-colors text-sm font-medium"/g;

const unifiedClass = 'className="py-2 px-3 bg-theme-panel hover:bg-theme-accent text-theme-text hover:text-white rounded-lg text-sm font-medium transition-colors border border-theme-border"';
const unifiedDeleteClass = 'className="py-2 px-3 bg-theme-panel hover:bg-shnoor-danger text-shnoor-danger hover:text-white rounded-lg text-sm font-medium transition-colors border border-theme-border"';

dashboard = dashboard.replace(btnTests, unifiedClass);
dashboard = dashboard.replace(btnStudents, unifiedClass);
dashboard = dashboard.replace(btnDelete, unifiedDeleteClass);
fs.writeFileSync('c:/assessment/frontend/src/pages/admin/AdminDashboard.jsx', dashboard);

// Fix InterviewsList.jsx Select styles
let interviews = fs.readFileSync('c:/assessment/frontend/src/pages/admin/InterviewsList.jsx', 'utf8');
// For InterviewsList, the indentation is slightly different but we can just use the same string for styles since it's an AST-like replacement (well, string replacement). We just need to make sure we don't break JSX.
const reactSelectStylesInterviews = reactSelectStyles.replace(/                        styles/g, '                styles');
interviews = interviews.replace(/styles=\{\{[\s\S]*?\}\}\s*\/>/m, reactSelectStylesInterviews + '\n              />');
fs.writeFileSync('c:/assessment/frontend/src/pages/admin/InterviewsList.jsx', interviews);

// Fix BulkStudentUpload.jsx
let upload = fs.readFileSync('c:/assessment/frontend/src/components/admin/BulkStudentUpload.jsx', 'utf8');
upload = upload.replace(/bg-white/g, 'bg-theme-card');
upload = upload.replace(/file:bg-shnoor-lavender/g, 'file:bg-theme-panel');
upload = upload.replace(/file:text-shnoor-indigo/g, 'file:text-theme-text');
upload = upload.replace(/hover:file:bg-\[#e0e0ef\]/g, 'hover:file:bg-theme-accent');
upload = upload.replace(/className="block w-full text-sm text-shnoor-navy font-medium/g, 'className="block w-full text-sm text-theme-text font-medium');
fs.writeFileSync('c:/assessment/frontend/src/components/admin/BulkStudentUpload.jsx', upload);

console.log('UI fixes applied successfully!');
