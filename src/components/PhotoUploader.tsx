import React, { useState, useRef } from "react";
import { Upload, Camera, Sun, Image as ImageIcon, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PhotoUploaderProps {
  bucketName: string;
  folderPath: string;
  onUploadSuccess: (url: string) => void;
  currentPhotoUrl?: string;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  bucketName,
  folderPath,
  onUploadSuccess,
  currentPhotoUrl
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // Local preview immediately
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Simple compression/resize on client side could go here using canvas
      // For MVP, we upload directly
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${folderPath}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      onUploadSuccess(publicUrl);
    } catch (error: any) {
      console.error("Erro no upload da foto:", error);
      // Revert preview on error
      setPreview(currentPhotoUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative w-full overflow-hidden rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-6 transition-all cursor-pointer bg-white/5 group
          ${preview ? 'border-emerald-500/30 min-h-[200px]' : 'border-[rgba(241,216,110,0.3)] hover:border-[rgba(241,216,110,0.6)] hover:bg-white/10 min-h-[240px]'}
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />

        {preview && !isUploading ? (
          <>
            <img src={preview} alt="Espaço" className="absolute inset-0 w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="relative z-10 flex flex-col items-center mt-auto pb-2">
              <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-300 px-4 py-2 rounded-full flex items-center gap-2 font-bold text-sm shadow-xl">
                <Sparkles size={16} />
                <span>Visual impecável!</span>
              </div>
            </div>
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={20} className="text-white" />
            </div>
          </>
        ) : isUploading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 size={32} className="text-[rgba(241,216,110,1)] animate-spin" />
            <p className="text-white/60 text-sm font-bold animate-pulse">Preparando foto...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-[rgba(241,216,110,0.1)] text-[rgba(241,216,110,1)] rounded-full flex items-center justify-center mb-2">
              <Upload size={28} />
            </div>
            <h3 className="text-white font-bold text-lg">Dê vida ao seu espaço</h3>
            <p className="text-white/50 text-sm max-w-[280px]">
              Fotos reais da quadra valorizam o condomínio e aumentam a adesão dos vizinhos.
            </p>
          </div>
        )}
      </div>

      {!preview && !isUploading && (
        <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-3">
          <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2 ml-1">📸 Dicas Visuais</p>
          
          <div className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl">
            <div className="bg-[rgba(241,216,110,0.2)] p-1.5 rounded-lg">
              <Sun size={16} className="text-[rgba(241,216,110,1)]" />
            </div>
            <span className="text-white/70 text-sm">Prefira luz do dia ou holofotes acesos</span>
          </div>
          
          <div className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl">
            <div className="bg-[rgba(241,216,110,0.2)] p-1.5 rounded-lg">
              <ImageIcon size={16} className="text-[rgba(241,216,110,1)]" />
            </div>
            <span className="text-white/70 text-sm">Enquadre na horizontal (deitada)</span>
          </div>

          <div className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl">
            <div className="bg-[rgba(241,216,110,0.2)] p-1.5 rounded-lg">
              <CheckCircle2 size={16} className="text-[rgba(241,216,110,1)]" />
            </div>
            <span className="text-white/70 text-sm">Mostre a quadra limpa e completa</span>
          </div>
        </div>
      )}
    </div>
  );
};
