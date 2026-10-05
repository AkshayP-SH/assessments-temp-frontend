const InputField = ({
    label,
    type = 'text',
    placeholder,
    id,
    required = false,
    ...props
}) => {
    return (
        <div className="flex flex-col w-full mb-4">
            {label && (
                <label
                    htmlFor={id}
                    className="text-[11px] font-semibold text-theme-text mb-1.5 uppercase tracking-wide flex items-center gap-1"
                >
                    {label}
                    {required && <span className="text-shnoor-danger">*</span>}
                </label>
            )}

            <input
                id={id}
                type={type}
                placeholder={placeholder}
                required={required}
                className="w-full h-[50px] px-4 rounded-lg border border-theme-border bg-theme-card text-theme-text placeholder:text-theme-muted focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-colors"
                {...props}
            />
        </div>
    );
};

export default InputField;