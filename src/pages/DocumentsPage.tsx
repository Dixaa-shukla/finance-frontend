import { useCallback, useEffect, useMemo, useState } from 'react';
import { FolderOpen, HardDrive, Receipt, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageTabs } from '@/components/layout/PageTabs';
import { EXPENSE_TABS } from '@/config/pageTabs';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Toast, type ToastState } from '@/components/common/Toast';
import { ReceiptUploadCard } from '@/components/document/ReceiptUploadCard';
import { ReceiptResultModal } from '@/components/document/ReceiptResultModal';
import { DocumentList } from '@/components/document/DocumentList';
import { fileService } from '@/api/fileService';
import { extractErrorMessage, getCurrentUserId } from '@/api/axiosClient';
import { formatFileSize } from '@/types/file';
import type {
  ReceiptUploadResponse,
  StoredFileResponse,
} from '@/types/file';

type Status = 'loading' | 'success' | 'error';
type Tab = 'ALL' | 'RECEIPT' | 'PROFILE_IMAGE';

/**
 * Module 17 — File & Document Management.
 */
export default function DocumentsPage() {
  const userId = getCurrentUserId();

  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [files, setFiles] = useState<StoredFileResponse[]>([]);
  const [tab, setTab] = useState<Tab>('ALL');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ReceiptUploadResponse | null>(null);
  const [deleting, setDeleting] = useState<StoredFileResponse | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setFiles(await fileService.getByUserId(userId));
      setErrorMessage(null);
      setStatus('success');
    } catch (err) {
      setErrorMessage(extractErrorMessage(err, 'Could not load your files.'));
      setStatus('error');
    }
  }, [userId]);

  // Async IIFE, not a bare load() — see the note in useInvestments.
  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const receipts = useMemo(
    () => files.filter((file) => file.fileType === 'RECEIPT'),
    [files]
  );
  const visible = useMemo(
    () => (tab === 'ALL' ? files : files.filter((file) => file.fileType === tab)),
    [files, tab]
  );

  const totalBytes = files.reduce(
    (sum, file) => sum + (file.fileSizeBytes ?? 0),
    0
  );
  const autoSavedCount = receipts.filter(
    (file) => file.relatedEntityType === 'EXPENSE'
  ).length;

  async function handleUpload(file: File) {
    if (!userId) return;
    setUploading(true);
    try {
      const uploaded = await fileService.uploadReceipt(userId, file);
      setResult(uploaded);
      await load();
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not upload that receipt.'),
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await fileService.remove(deleting.id);
      setDeleting(null);
      await load();
      setToast({ type: 'success', message: 'File deleted' });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not delete that file.'),
      });
    } finally {
      setDeleteBusy(false);
    }
  }

  const tabs: { value: Tab; label: string; count: number }[] = [
    { value: 'ALL', label: 'All Files', count: files.length },
    { value: 'RECEIPT', label: 'Receipts', count: receipts.length },
    {
      value: 'PROFILE_IMAGE',
      label: 'Profile Images',
      count: files.length - receipts.length,
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <Header
          title="Receipts"
          subtitle="Receipts you have scanned, and every file stored against your account"
        />

        <PageTabs tabs={EXPENSE_TABS} />

        {!userId && (
          <EmptyState
            variant="error"
            title="Not signed in"
            description="You need to be signed in to manage your files."
          />
        )}

        {userId && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-1">
              <ReceiptUploadCard busy={uploading} onUpload={handleUpload} />
            </div>

            <div className="space-y-4 xl:col-span-2">
              {status === 'loading' && (
                <div className="space-y-4 animate-pulse">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="glass-card h-24" />
                    ))}
                  </div>
                  <div className="glass-card h-64" />
                </div>
              )}

              {status === 'error' && (
                <EmptyState
                  variant="error"
                  title="Something went wrong"
                  description={errorMessage ?? 'Please try again in a moment.'}
                  actionLabel="Retry"
                  onAction={load}
                />
              )}

              {status === 'success' && files.length === 0 && (
                <EmptyState
                  icon={<FolderOpen className="h-7 w-7 text-brand-blue" />}
                  title="No files yet"
                  description="Upload a receipt photo on the left and it will appear here, along with whatever Nova managed to read from it."
                />
              )}

              {status === 'success' && files.length > 0 && (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatTile
                      icon={<Receipt className="h-4 w-4" />}
                      label="Receipts"
                      value={String(receipts.length)}
                      tint="from-brand-purple to-brand-blue"
                    />
                    <StatTile
                      icon={<Sparkles className="h-4 w-4" />}
                      label="Auto-Filed"
                      value={String(autoSavedCount)}
                      note="became expenses"
                      tint="from-brand-green to-brand-cyan"
                    />
                    <StatTile
                      icon={<HardDrive className="h-4 w-4" />}
                      label="Stored"
                      value={formatFileSize(totalBytes)}
                      note={`${files.length} file${files.length === 1 ? '' : 's'}`}
                      tint="from-brand-cyan to-brand-blue"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {tabs.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setTab(item.value)}
                        aria-pressed={tab === item.value}
                        className={`rounded-pill px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                          tab === item.value
                            ? 'bg-gradient-to-r from-brand-blue to-brand-purple text-white shadow-soft'
                            : 'border border-sky-200 bg-white/70 text-navy-700 hover:bg-white'
                        }`}
                      >
                        {item.label}
                        <span
                          className={`ml-2 text-xs font-bold ${
                            tab === item.value
                              ? 'text-white/70'
                              : 'text-navy-700/40'
                          }`}
                        >
                          {item.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  <DocumentList
                    files={visible}
                    busy={deleteBusy}
                    onDelete={setDeleting}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {result && (
        <ReceiptResultModal result={result} onClose={() => setResult(null)} />
      )}

      {/*
        Worded from the controller's own note: deleting the file does not delete
        the expense a receipt created, so the user is told where that row stays.
      */}
      {deleting && (
        <ConfirmDialog
          title={`Delete "${deleting.originalFilename ?? `file ${deleting.id}`}"?`}
          message={
            deleting.relatedEntityType === 'EXPENSE'
              ? 'The image is removed from storage. The expense it created stays in your Expenses list — delete that separately if you want it gone.'
              : 'The image is removed from storage. This cannot be undone.'
          }
          loading={deleteBusy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

function StatTile({
  icon,
  label,
  value,
  note,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note?: string;
  tint: string;
}) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-navy-700/60">{label}</p>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tint} text-white shadow-soft`}
        >
          {icon}
        </div>
      </div>
      <p className="mt-2 truncate text-xl font-extrabold tracking-tight text-navy-900">
        {value}
      </p>
      {note && <p className="mt-0.5 truncate text-[11px] text-navy-700/50">{note}</p>}
    </div>
  );
}
