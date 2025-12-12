import { Upload, X } from "lucide-react";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Header } from "../components/Header";
import { Input } from "../components/ui/input";

export function ImageSearchPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [contextText, setContextText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = () => {
    if (uploadedImage) {
      setLocation(`/results?type=image`);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header variant="minimal" />
      
      <main className="max-w-[var(--container-max)] mx-auto px-8 py-[var(--space-xl)]">
        <h1 className="heading-m text-center mb-[var(--space-l)]">SEARCH BY IMAGE</h1>
        
        <div className="max-w-[800px] mx-auto">
          {!uploadedImage ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full h-[480px] border-2 border-dashed bg-[var(--bg-neutral)] flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragging ? "border-[var(--accent)]" : "border-[var(--border-light)]"
              }`}
            >
              <Upload size={64} strokeWidth={1} className="text-[var(--text-secondary)]" />
              <h3 className="mt-6 body-l">
                Upload reference image
              </h3>
              <p className="mt-2 caption">
                Drag and drop, or click to browse
              </p>
              <p className="mt-2 caption" style={{ fontSize: "12px" }}>
                JPG, PNG (max 10MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative">
              <div className="relative w-full max-w-[700px] mx-auto border border-[var(--border-light)]">
                <img
                  src={uploadedImage}
                  alt="Uploaded reference"
                  className="w-full"
                  style={{ maxHeight: "600px", objectFit: "contain" }}
                />
                <button
                  onClick={() => setUploadedImage(null)}
                  className="absolute top-4 right-4 p-2 bg-white border border-[var(--border-light)] hover:bg-[var(--bg-neutral)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="mt-6 max-w-[600px] mx-auto">
                <Input
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                  placeholder="Add context (optional)…"
                  className="w-full h-12 border border-[var(--border-light)] px-4 body-m bg-transparent focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              
              <div className="mt-6 text-center">
                <button
                  onClick={handleSearch}
                  className="px-8 py-3 bg-[var(--text-primary)] text-white caption hover:opacity-80 transition-opacity"
                >
                  SEARCH
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
