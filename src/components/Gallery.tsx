import { h } from "preact";
import { useState, useEffect, useCallback } from "preact/hooks";
import { Lightbox } from "./Lightbox";

function saveAs(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface Photo {
  name: string;
  thumb: string;
  full: string;
}

interface Props {
  albumId: string;
  albumName: string;
}

export function Gallery({ albumId, albumName }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    fetch(`/api/photos?albumId=${albumId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load photos");
        return r.json();
      })
      .then((data) => setPhotos(data.photos))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [albumId]);

  const toggleSelect = useCallback((name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(photos.map((p) => p.name)));
  }, [photos]);

  const deselectAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  const downloadSingle = useCallback((photo: Photo) => {
    const a = document.createElement("a");
    a.href = photo.full + "?download";
    a.download = photo.name;
    a.click();
  }, []);

  const downloadBatch = useCallback(async () => {
    if (selected.size === 0) return;
    setDownloading(true);
    setDownloadProgress(0);

    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const selectedPhotos = photos.filter((p) => selected.has(p.name));
      let done = 0;

      await Promise.all(
        selectedPhotos.map(async (photo) => {
          const res = await fetch(photo.full);
          const blob = await res.blob();
          zip.file(photo.name, blob);
          done++;
          setDownloadProgress(Math.round((done / selectedPhotos.length) * 100));
        }),
      );

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `${albumName}-photos.zip`);
    } catch {
      alert("Download failed. Please try again.");
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  }, [selected, photos, albumName]);

  if (loading) {
    return (
      <div class="gallery-container">
        <header class="gallery-header">
          <h1>{albumName}</h1>
        </header>
        <div class="gallery-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} class="skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div class="gallery-container">
        <div class="gallery-error">{error}</div>
      </div>
    );
  }

  return (
    <div class="gallery-container">
      <header class="gallery-header">
        <h1>{albumName}</h1>
        <div class="gallery-actions">
          {photos.length > 0 && (
            <button class="btn btn-ghost" onClick={selected.size === photos.length ? deselectAll : selectAll}>
              {selected.size === photos.length ? "Deselect All" : "Select All"}
            </button>
          )}
          {selected.size > 0 && (
            <button class="btn btn-primary" onClick={downloadBatch} disabled={downloading}>
              {downloading
                ? `Zipping… ${downloadProgress}%`
                : `Download ${selected.size} Photo${selected.size === 1 ? "" : "s"}`}
            </button>
          )}
        </div>
      </header>

      <div class="gallery-grid">
        {photos.map((photo, index) => (
          <div
            key={photo.name}
            class={`gallery-item ${selected.has(photo.name) ? "selected" : ""}`}
          >
            <label class="checkbox-wrapper">
              <input
                type="checkbox"
                checked={selected.has(photo.name)}
                onChange={() => toggleSelect(photo.name)}
              />
              <span class="checkmark" />
            </label>
            <img
              src={photo.thumb}
              alt={photo.name}
              loading="lazy"
              decoding="async"
              onClick={() => setLightboxIndex(index)}
            />
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
          onDownload={downloadSingle}
        />
      )}
    </div>
  );
}
