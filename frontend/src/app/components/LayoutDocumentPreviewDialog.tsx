import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  url: string | null;
};

const isImageUrl = (url: string) => {
  const clean = url.split('?')[0].toLowerCase();
  return (
    clean.endsWith('.png') ||
    clean.endsWith('.jpg') ||
    clean.endsWith('.jpeg') ||
    clean.endsWith('.gif') ||
    clean.endsWith('.webp')
  );
};

const isPdfUrl = (url: string) => {
  const clean = url.split('?')[0].toLowerCase();
  return clean.endsWith('.pdf');
};

const friendlyNameFromUrl = (url: string) => {
  try {
    const path = url.split('?')[0];
    const last = path.split('/').filter(Boolean).pop() || path;
    return decodeURIComponent(last);
  } catch {
    return url;
  }
};

const toSameOriginMediaUrl = (url: string) => {
  // If backend returns an absolute URL to a Django media file, rewrite it to same-origin
  // so the Vite dev proxy (/media -> backend) can serve it without cross-origin iframe issues.
  try {
    const parsed = new URL(url);
    const mediaIndex = parsed.pathname.indexOf('/media/');
    if (mediaIndex >= 0) {
      const mediaPath = parsed.pathname.slice(mediaIndex);
      return `${mediaPath}${parsed.search || ''}${parsed.hash || ''}`;
    }
  } catch {
    // ignore
  }
  return url;
};

export function LayoutDocumentPreviewDialog({ open, onOpenChange, title, url }: Props) {
  const effectiveUrl = url ? toSameOriginMediaUrl(url) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Preview layout document</DialogDescription>
        </DialogHeader>

        {!effectiveUrl ? (
          <div className="text-sm text-gray-600">No layout document available.</div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-end">
              <a
                href={effectiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 underline"
              >
                {friendlyNameFromUrl(effectiveUrl)}
              </a>
            </div>

            {isImageUrl(effectiveUrl) ? (
              <div className="w-full border rounded overflow-hidden bg-white">
                <img src={effectiveUrl} alt={title} className="w-full max-h-[70vh] object-contain" />
              </div>
            ) : (
              <div className="w-full border rounded overflow-hidden bg-white">
                <iframe
                  src={effectiveUrl}
                  title={title}
                  className="w-full h-[70vh]"
                />
                {!isPdfUrl(effectiveUrl) && (
                  <div className="p-3 text-xs text-gray-600">
                    If this document type cannot be previewed in your browser, use the link above to download/open it.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
