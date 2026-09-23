const Button = ({ 
  children, 
  variant = 'primary',
  type = 'button',
  disabled = false,
  className = '',
  onClick
}) => {
  const baseStyles = "h-[50px] min-h-[44px] px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation";
  const variants = {
    primary: "bg-theme-accent text-white hover:bg-theme-accent2 shadow-[0_4px_14px_rgba(var(--theme-accent),0.3)]",
    secondary: "bg-theme-panel text-theme-text hover:bg-theme-border border border-theme-border",
    danger: "bg-theme-err text-shnoor-danger border border-theme-border hover:brightness-95",
    outline: "bg-transparent text-shnoor-navy border border-shnoor-light hover:bg-shnoor-lavender dark:text-white dark:border-shnoor-light/20 dark:hover:bg-shnoor-lavender/10"
  };

  const disabledStyles = "bg-theme-panel text-theme-muted cursor-not-allowed shadow-none border border-theme-border";

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${disabled ? disabledStyles : variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;