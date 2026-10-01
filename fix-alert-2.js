const fs = require('fs');
const path = 'c:/assessment/frontend/src/components/admin/CreateTestSection.jsx';
let content = fs.readFileSync(path, 'utf-8');

// Insert state and showToast function
if (!content.includes('toastMessage')) {
    const hookStr = "const [step, setStep] = useState('init');";
    const stateToInject = `
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage((current) => current === msg ? '' : current);
        }, 3000);
    };
`;
    // Find the line containing the hookStr and inject after it
    content = content.replace(/(const \[step, setStep\] = useState\('init'\);.*)/, '$1\\n' + stateToInject);
}

// Replace alert with showToast
content = content.replace(/\balert\(/g, 'showToast(');

// Add the Toast UI
if (!content.includes('toastMessage && (')) {
    const returnStr = 'return (\\n        <div className="space-y-6">';
    const toastUi = `
    return (
        <div className="space-y-6 relative">
            {toastMessage && (
                <div className="fixed top-20 right-4 z-[99999] bg-gray-900 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 transition-all duration-300 transform scale-100 opacity-100 border border-gray-700">
                    <AlertCircle size={24} className="text-red-400 flex-shrink-0" />
                    <span className="font-medium text-base">{toastMessage}</span>
                </div>
            )}`;
    content = content.replace(/(return \(\n\s*<div className="space-y-6">)/, toastUi);
}

fs.writeFileSync(path, content, 'utf-8');
console.log('Done!');
