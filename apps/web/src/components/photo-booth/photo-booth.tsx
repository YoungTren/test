'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateImage } from '@/lib/api';
import { captureVideoFrame, downloadImage, validateImageFile } from '@/lib/image-utils';
import { ROLE_OPTIONS, type Role } from '@/types/role';

export const PhotoBooth = () => {
  const [consentGiven, setConsentGiven] = useState(false);
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraOpen(false);
  }, []);

  const setSourcePhoto = useCallback((file: File) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSourceImage(file);
    setActiveRole(null);
    setHasResult(false);

    const previewUrl = URL.createObjectURL(file);
    setSourcePreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return previewUrl;
    });
    setDisplayUrl(previewUrl);
  }, []);

  const openCamera = async () => {
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch {
      setError('Не удалось открыть камеру. Загрузите фото вручную.');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const file = captureVideoFrame(video);
      setSourcePhoto(file);
      stopCamera();
    } catch {
      setError('Не удалось сделать снимок. Попробуйте ещё раз.');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSourcePhoto(file);
    event.target.value = '';
  };

  const handleGenerate = async (role: Role) => {
    if (!sourceImage) return;

    setIsGenerating(true);
    setError(null);
    setActiveRole(role);

    try {
      const result = await generateImage(sourceImage, role);
      setDisplayUrl(result.imageUrl);
      setHasResult(true);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : 'Не удалось создать образ. Попробуйте ещё раз.',
      );
      setDisplayUrl(sourcePreviewUrl);
      setHasResult(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!displayUrl || !hasResult) return;

    const roleLabel = ROLE_OPTIONS.find((option) => option.value === activeRole)?.label ?? 'result';
    await downloadImage(displayUrl, `ai-photo-booth-${roleLabel}.jpg`);
  };

  useEffect(() => {
    if (!isCameraOpen || !videoRef.current || !streamRef.current) return;

    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play();
  }, [isCameraOpen]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
    };
  }, [sourcePreviewUrl, stopCamera]);

  const actionsDisabled = !consentGiven || isGenerating;
  const roleButtonsVisible = Boolean(sourceImage);
  const saveVisible = hasResult && !isGenerating;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 p-6">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">AI Photo Booth</h1>
        <p className="text-sm text-muted-foreground">
          Преобразуй своё фото в профессиональный образ
        </p>
      </header>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground">
        <input
          type="checkbox"
          checked={consentGiven}
          onChange={(event) => setConsentGiven(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-primary"
        />
        <span className="text-sm leading-relaxed">
          Я согласен на использование моей фотографии для генерации образа
        </span>
      </label>

      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={actionsDisabled} onClick={() => void openCamera()}>
          Сделать фото
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={actionsDisabled}
          onClick={() => fileInputRef.current?.click()}
        >
          Загрузить фото
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      <div className="relative flex min-h-80 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30">
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayUrl}
            alt={hasResult ? 'Сгенерированный образ' : 'Исходное фото'}
            className="max-h-[480px] w-full object-contain"
          />
        ) : (
          <p className="px-6 text-center text-sm text-muted-foreground">
            Сделайте фото или загрузите изображение
          </p>
        )}

        {isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Генерация...</p>
          </div>
        )}
      </div>

      {roleButtonsVisible && (
        <div className="flex flex-wrap gap-3">
          {ROLE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={activeRole === option.value && hasResult ? 'default' : 'secondary'}
              disabled={!consentGiven || isGenerating}
              onClick={() => void handleGenerate(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {saveVisible && (
        <Button type="button" className="w-full" onClick={() => void handleSave()}>
          Сохранить изображение
        </Button>
      )}

      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="flex w-full max-w-lg flex-col gap-4 rounded-xl bg-card p-4 text-card-foreground">
            <video ref={videoRef} autoPlay playsInline muted className="aspect-[4/3] w-full rounded-lg bg-black object-cover" />
            <div className="flex gap-3">
              <Button type="button" size="lg" className="flex-1" onClick={capturePhoto}>
                Снять
              </Button>
              <Button type="button" variant="secondary" size="lg" className="flex-1" onClick={stopCamera}>
                Отмена
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
