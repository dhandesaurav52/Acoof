
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Camera, RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';
import { generateOutfitImages } from '@/ai/flows/generate-outfit-image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function VirtualTryOnPage() {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (typeof window === 'undefined' || !navigator.mediaDevices) {
          setHasCameraPermission(false);
          setError("This browser does not support camera access.");
          return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setHasCameraPermission(false);
        setError('Camera access was denied. Please enable camera permissions in your browser settings to use this feature.');
      }
    };

    if (!photoDataUri) {
        getCameraPermission();
    }
    
    // Cleanup function to stop the video stream
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [photoDataUri]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        setPhotoDataUri(dataUri);
      }
    }
  };
  
  const handleGenerate = async () => {
    if (!photoDataUri) return;
    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);
    try {
      const result = await generateOutfitImages(photoDataUri);
      setGeneratedImages(result.images);
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      let errorMessage = "The AI failed to generate outfits. Please try again.";
      if (err.message?.includes('429')) {
        errorMessage = "The service is busy. Please wait a moment and try again.";
      } else if (err.message?.includes('key')) {
        errorMessage = "The AI service is not configured correctly. Please check the API key.";
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    setPhotoDataUri(null);
    setGeneratedImages([]);
    setError(null);
  };

  // Automatically trigger generation once a photo is captured
  useEffect(() => {
    if (photoDataUri && generatedImages.length === 0) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoDataUri]);

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline flex items-center justify-center gap-4">
            <Sparkles className="h-10 w-10 text-primary" />
            AI Stylist
        </h1>
        <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">
          Take a clear, well-lit photo of yourself, and our AI will generate new outfits for you to try on.
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        {hasCameraPermission === null && (
          <div className="flex flex-col items-center justify-center gap-4 text-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Checking camera permissions...</p>
          </div>
        )}

        {hasCameraPermission === false && (
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                {error || 'Please enable camera permissions in your browser settings and refresh the page.'}
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        {hasCameraPermission && !photoDataUri && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden bg-muted">
                  {/* Mirrored preview for natural user experience */}
                  <video ref={videoRef} className="w-full h-full object-cover transform -scale-x-100" autoPlay muted playsInline />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <Button onClick={handleCapture} className="w-full" size="lg">
                  <Camera className="mr-2 h-5 w-5" />
                  Capture Photo
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {hasCameraPermission && photoDataUri && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column: User Photo & Controls */}
            <div className="space-y-4 lg:sticky lg:top-24">
              <h2 className="text-2xl font-bold font-headline">Your Photo</h2>
              <Card className="overflow-hidden">
                <div className="relative aspect-[4/5] w-full">
                  <Image src={photoDataUri} alt="Your captured photo" fill className="object-cover" sizes="50vw" />
                </div>
              </Card>
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={handleStartOver} variant="outline" size="lg">
                  <Camera className="mr-2 h-4 w-4" /> New Photo
                </Button>
                <Button onClick={handleGenerate} size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {isLoading ? 'Generating...' : 'Regenerate'}
                </Button>
              </div>
            </div>

            {/* Right Column: AI Results */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold font-headline">AI-Styled Outfits</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {isLoading ? (
                  <>
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Card key={index} className="overflow-hidden">
                        <div className="relative aspect-[4/5] w-full bg-muted animate-pulse" />
                      </Card>
                    ))}
                  </>
                ) : error ? (
                  <div className="sm:col-span-2">
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Generation Failed</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </div>
                ) : generatedImages.length > 0 ? (
                  <>
                    {generatedImages.map((src, index) => (
                      <Card key={index} className="overflow-hidden group">
                        <div className="relative aspect-[4/5] w-full bg-muted">
                          <Image
                            src={src}
                            alt={`Generated Outfit ${index + 1}`}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          />
                        </div>
                      </Card>
                    ))}
                  </>
                ) : (
                    <div className="sm:col-span-2 h-96 flex items-center justify-center bg-muted rounded-lg text-muted-foreground">
                        <p>Click "Regenerate" to see your new outfits.</p>
                    </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
