import { useState, useEffect } from 'react';
import { X, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import { getProjectDetails, getImageUrl, getThumbnailUrl } from '../../lib/navigatorApi';

interface ImageReplacerProps {
  projectId: string;
  currentImageId?: string;
  onSelect: (imageId: string, thumbUrl: string, imageUrl: string) => void;
  onClose: () => void;
}

interface ProjectImage {
  image_id: string;
  thumb_url: string;
  image_url: string;
}

export function ImageReplacer({
  projectId,
  currentImageId,
  onSelect,
  onClose,
}: ImageReplacerProps) {
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(currentImageId || null);

  useEffect(() => {
    async function fetchImages() {
      setIsLoading(true);
      setError(null);

      try {
        const project = await getProjectDetails(projectId);
        const imageIds = project.image_ids || [];

        const projectImages: ProjectImage[] = imageIds.map((id) => ({
          image_id: id,
          thumb_url: getThumbnailUrl(id),
          image_url: getImageUrl(id),
        }));

        setImages(projectImages);
      } catch (err) {
        console.error('Failed to fetch project images:', err);
        setError('Failed to load images');
      } finally {
        setIsLoading(false);
      }
    }

    fetchImages();
  }, [projectId]);

  const handleConfirm = () => {
    if (selectedId) {
      const image = images.find((img) => img.image_id === selectedId);
      if (image) {
        onSelect(image.image_id, image.thumb_url, image.image_url);
      }
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          width: '90%',
          maxWidth: '720px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '18px',
                fontWeight: 600,
                margin: 0,
              }}
            >
              Replace Image
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '13px',
                color: 'rgba(0,0,0,0.5)',
                margin: 0,
                marginTop: '4px',
              }}
            >
              Select a different image from this project
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
          }}
        >
          {isLoading ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px',
              }}
            >
              <Loader2
                size={32}
                style={{
                  color: 'var(--accent)',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <p
                style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '14px',
                  color: 'rgba(0,0,0,0.5)',
                  marginTop: '12px',
                }}
              >
                Loading images...
              </p>
            </div>
          ) : error ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '14px',
                  color: '#ef4444',
                }}
              >
                {error}
              </p>
            </div>
          ) : images.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px',
              }}
            >
              <ImageIcon size={48} style={{ color: 'rgba(0,0,0,0.2)', marginBottom: '12px' }} />
              <p
                style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '14px',
                  color: 'rgba(0,0,0,0.5)',
                }}
              >
                No images available for this project
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '12px',
              }}
            >
              {images.map((image) => (
                <button
                  key={image.image_id}
                  onClick={() => setSelectedId(image.image_id)}
                  style={{
                    position: 'relative',
                    aspectRatio: '4 / 3',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border:
                      selectedId === image.image_id
                        ? '3px solid var(--accent)'
                        : '3px solid transparent',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'border-color 150ms ease',
                  }}
                >
                  <img
                    src={image.thumb_url}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = image.image_url;
                    }}
                  />
                  {selectedId === image.image_id && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '24px',
                        height: '24px',
                        backgroundColor: 'var(--accent)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={14} style={{ color: 'white' }} />
                    </div>
                  )}
                  {currentImageId === image.image_id && selectedId !== image.image_id && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        padding: '4px 8px',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        borderRadius: '4px',
                        fontFamily: 'var(--font-secondary)',
                        fontSize: '10px',
                        color: 'white',
                      }}
                    >
                      Current
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(0,0,0,0.15)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'var(--font-secondary)',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedId || selectedId === currentImageId}
            style={{
              padding: '10px 20px',
              backgroundColor:
                !selectedId || selectedId === currentImageId ? 'rgba(0,0,0,0.1)' : 'var(--accent)',
              color: !selectedId || selectedId === currentImageId ? 'rgba(0,0,0,0.4)' : 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: !selectedId || selectedId === currentImageId ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-secondary)',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}

