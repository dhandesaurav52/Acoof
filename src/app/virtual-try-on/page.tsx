
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Camera, RefreshCw, Sparkles, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();

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
        // Draw the image without flipping
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
    if (photoDataUri) {
      handleGenerate();
    }
  }, [photoDataUri]);

  const renderContent = () => {
    if (hasCameraPermission === null) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 text-center h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Checking camera permissions...</p>
            </div>
        );
    }
    
    if (!hasCameraPermission) {
        return (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                {error || 'Please enable camera permissions in your browser settings and refresh the page to use this feature.'}
              </AlertDescription>
            </Alert>
        );
    }

    if (!photoDataUri) {
      return (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                <canvas ref={canvasRef} className="hidden" />
            </div>
            <Button onClick={handleCapture} className="w-full" size="lg">
              <Camera className="mr-2 h-5 w-5" />
              Capture Photo
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 text-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h3 className="text-2xl font-semibold">Generating Your Look...</h3>
            <p className="text-muted-foreground max-w-sm">Our AI stylist is creating some outfits for you. This might take a moment.</p>
        </div>
      );
    }
    
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 text-center h-96">
                <XCircle className="h-12 w-12 text-destructive" />
                <h3 className="text-2xl font-semibold">Generation Failed</h3>
                <p className="text-muted-foreground max-w-sm">{error}</p>
                <div className="flex gap-4 mt-4">
                    <Button onClick={handleGenerate} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                    </Button>
                     <Button onClick={handleStartOver}>
                        <Camera className="mr-2 h-4 w-4" />
                        Take New Photo
                    </Button>
                </div>
            </div>
        );
    }

    if (generatedImages.length > 0) {
      return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {generatedImages.map((src, index) => (
                    <Card key={index} className="overflow-hidden group">
                        <div className="relative aspect-[4/5] w-full bg-muted">
                            <Image
                                src={src}
                                alt={`Generated Outfit ${index + 1}`}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, 33vw"
                            />
                        </div>
                    </Card>
                ))}
            </div>
             <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={handleGenerate} size="lg">
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Try Again
                </Button>
                <Button onClick={handleStartOver} variant="outline" size="lg">
                    <Camera className="mr-2 h-5 w-5" />
                    Start Over
                </Button>
            </div>
        </div>
      );
    }
    
    return null; // Should not be reached
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline flex items-center justify-center gap-4">
            <Sparkles className="h-10 w-10 text-primary" />
            AI Stylist
        </h1>
        <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">
          Take a clear, well-lit photo of your face, and our AI will generate outfits for you to try on.
        </p>
      </div>
      <div className="max-w-5xl mx-auto">
        {renderContent()}
      </div>
    </div>
  );
}
