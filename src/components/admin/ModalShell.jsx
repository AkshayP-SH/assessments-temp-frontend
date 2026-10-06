import { X, Loader2 } from 'lucide-react';
import PropTypes from 'prop-types';


const WIDTHS = {
  sm: 'max-w-[640px]',
  md: 'max-w-[760px]',
  lg: 'max-w-[1040px]'
};

export const modalInputClass =
  'w-full h-10 px-3 rounded-lg border border-shnoor-mist bg-white text-sm text-shnoor-navy placeholder:text-gray-400 transition-colors focus:outline-none focus:border-shnoor-indigo focus:ring-2 focus:ring-shnoor-indigo/20';

export const modalTextareaClass =
  'w-full px-3 py-2 rounded-lg border border-shnoor-mist bg-white text-sm text-shnoor-navy placeholder:text-gray-400 transition-colors resize-y focus:outline-none focus:border-shnoor-indigo focus:ring-2 focus:ring-shnoor-indigo/20';

export const FieldLabel = ({ children, required, htmlFor, className = '' }) => (
  <label htmlFor={htmlFor} className={`block text-[13px] font-medium text-shnoor-navy mb-1.5 ${className}`}>
    {children}
    {required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

export const SectionTitle = ({ children, action }) => (
  <div className="flex items-center justify-between mb-3">
    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{children}</h4>
    {action}
  </div>
);

const BUTTON_VARIANTS = {
  primary: 'bg-shnoor-indigo text-white enabled:hover:bg-shnoor-navyLight shadow-sm',
  secondary: 'bg-shnoor-lavender text-shnoor-indigo enabled:hover:bg-shnoor-mist',
  outline: 'bg-white text-shnoor-navy border border-shnoor-mist enabled:hover:bg-gray-50'
};

export const ModalButton = ({
  variant = 'primary',
  icon: Icon,
  loading = false,
  disabled = false,
  className = '',
  children,
  ...rest
}) => (
  <button
    type="button"
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${BUTTON_VARIANTS[variant]} ${className}`}
    {...rest}
  >
    {loading ? <Loader2 size={16} className="animate-spin" /> : Icon && <Icon size={16} />}
    {children}
  </button>
);

const ModalShell = ({
  icon: Icon,
  title,
  titleAddon,
  subtitle,
  onClose,
  size = 'md',
  fullHeight = false,
  zIndexClass = 'z-50',
  toolbar,
  footerStart,
  footerActions,
  bodyClassName = 'p-6 space-y-5',
  children
}) => (
  <div className={`fixed inset-0 ${zIndexClass} bg-black/50 flex items-center justify-center p-4`}>
    <div
      role="dialog"
      aria-modal="true"
      className={`bg-white w-full ${WIDTHS[size]} max-h-[90vh] ${fullHeight ? 'lg:h-[90vh]' : ''} rounded-2xl shadow-2xl flex flex-col overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-shnoor-mist flex-shrink-0">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-shnoor-lavender text-shnoor-indigo flex items-center justify-center flex-shrink-0">
            <Icon size={20} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-lg font-semibold text-shnoor-navy truncate">{title}</h3>
            {titleAddon}
          </div>
          {subtitle && <p className="text-[13px] text-gray-500 truncate">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="p-2 -mr-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-shnoor-navy transition-colors flex-shrink-0"
        >
          <X size={20} />
        </button>
      </div>

      {toolbar && (
        <div className="px-6 py-4 border-b border-shnoor-mist bg-gray-50 flex-shrink-0">{toolbar}</div>
      )}

      {/* Body */}
      <div className={`flex-1 min-h-0 overflow-y-auto ${bodyClassName}`}>{children}</div>

      {/* Footer */}
      {(footerStart || footerActions) && (
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-shnoor-mist bg-gray-50 flex-shrink-0">
          <div className="min-w-0 text-[13px] text-gray-500 truncate">{footerStart}</div>
          <div className="flex items-center gap-2 flex-shrink-0">{footerActions}</div>
        </div>
      )}
    </div>
  </div>
);

ModalShell.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.node.isRequired,
  titleAddon: PropTypes.node,
  subtitle: PropTypes.node,
  onClose: PropTypes.func.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullHeight: PropTypes.bool,
  zIndexClass: PropTypes.string,
  toolbar: PropTypes.node,
  footerStart: PropTypes.node,
  footerActions: PropTypes.node,
  bodyClassName: PropTypes.string,
  children: PropTypes.node
};

export default ModalShell;
