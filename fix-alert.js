const fs = require('fs');
const path = 'c:/assessment/frontend/src/components/admin/CreateTestSection.jsx';
let content = fs.readFileSync(path, 'utf-8');

// Insert state and showToast function
if (!content.includes('toastMessage')) {
    const hookStr = "const [step, setStep] = useState('init'); // init, manual, bulk, success";
    const stateToInject = `
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage((current) => current === msg ? '' : current);
        }, 3000);
    };
`;
    content = content.replace(hookStr, hookStr + '\\n' + stateToInject);
}

// Replace alert with showToast
content = content.replace(/\balert\(/g, 'showToast(');

// Add the Toast UI
if (!content.includes('toastMessage && (')) {
    const returnStr = 'return (\\n        <div className="space-y-6">';
    const toastUi = `
            {toastMessage && (
                <div className="fixed top-20 right-4 z-[9999] bg-shnoor-navy text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-all duration-300 transform translate-y-0 opacity-100">
                    <AlertCircle size={20} className="text-red-400" />
                    <span className="font-medium">{toastMessage}</span>
                </div>
            )}`;
    content = content.replace(returnStr, returnStr + toastUi);
}

fs.writeFileSync(path, content, 'utf-8');
console.log('Done!');
