import { useRef, useState } from 'react';
import { RotateCcw, UploadCloud } from 'lucide-react';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import useTenantBranding from '../../contexts/useTenantBranding';
import { API_URL } from '../../config/api';
import OrganizationLogo from '../OrganizationLogo';
import Card from '../Card';
import Button from '../Button';

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const ClientBrandingTab = () => {
  const { clientUser } = useClientAuth();
  const { branding, loading: isLoading, updateBranding } = useTenantBranding();
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [message, setMessage] = useState(null);
  const isDefaultOrganization = Number(clientUser?.clientId) === 1 || branding?.canCustomizeLogo === false;

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setMessage({ type: 'error', text: 'Choose a PNG, JPEG, or WebP image.' });
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      setMessage({ type: 'error', text: 'The logo must be 2 MB or smaller.' });
      return;
    }

    setIsUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const response = await fetch(`${API_URL}/api/client/auth/branding/logo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('clientToken')}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to upload organization logo');
      }
      updateBranding(data.branding);
      setMessage({ type: 'success', text: 'Organization logo saved.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload organization logo.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_URL}/api/client/auth/branding/logo`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('clientToken')}` },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to remove organization logo');
      }
      updateBranding(data.branding);
      setMessage({ type: 'success', text: 'Custom logo removed. Shnoor logo will be shown.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to remove organization logo.' });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Organization Logo</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Upload the logo shown in your organization’s authenticated admin and student areas.
        </p>
      </div>

      <Card className="p-5 sm:p-6 bg-white dark:bg-[#1A1A32] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        {isDefaultOrganization ? (
          <div className="text-sm text-slate-600 dark:text-slate-300">
            The default organization uses Shnoor branding and its logo is managed by Shnoor.
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700">
                <OrganizationLogo className="h-full w-full object-contain" alt="Current organization logo" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white">Current logo</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  PNG, JPEG, or WebP; maximum file size 2 MB. Your logo is saved for this organization and shared with its users.
                </p>
                {!branding?.logoUrl && !isLoading && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    No organization logo has been uploaded yet; the Shnoor logo is currently shown.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleUpload}
                disabled={isUploading || isRemoving}
              />
              <Button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isUploading || isRemoving || isLoading}
                className="inline-flex items-center gap-2"
              >
                <UploadCloud size={16} />
                {isUploading ? 'Uploading…' : branding?.logoUrl ? 'Replace logo' : 'Upload logo'}
              </Button>
              {branding?.logoUrl && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleRemove}
                  disabled={isUploading || isRemoving}
                  className="inline-flex items-center gap-2"
                >
                  <RotateCcw size={16} />
                  {isRemoving ? 'Removing…' : 'Remove logo'}
                </Button>
              )}
            </div>
          </>
        )}
      </Card>

      {message && (
        <div
          role={message.type === 'error' ? 'alert' : 'status'}
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
};

export default ClientBrandingTab;
