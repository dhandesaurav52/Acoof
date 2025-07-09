
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Camera, RefreshCw, Sparkles, AlertTriangle, Video } from 'lucide-react';
import { generateOutfitImages } from '@/ai/flows/generate-outfit-image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

import { looks, lookCategories } from "@/lib/data";
import { OutfitCard } from '@/components/OutfitCard';

export default function LookbookPage() {
  // AI STYLIST STATE AND LOGIC
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // This effect handles turning the stream on and off
    if (isCameraOn) {
      const enableStream = async () => {
        setIsStartingCamera(true);
        setError(null);
        if (typeof window === 'undefined' || !navigator.mediaDevices) {
            setError("This browser does not support camera access.");
            setHasCameraPermission(false);
            setIsStartingCamera(false);
            setIsCameraOn(false);
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
          setError('Camera access was denied. Please enable permissions in your browser settings.');
          setHasCameraPermission(false);
          setIsCameraOn(false);
        } finally {
            setIsStartingCamera(false);
        }
      };
      enableStream();

      // Cleanup function to stop the stream
      return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const currentStream = videoRef.current.srcObject as MediaStream;
            currentStream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
      };
    }
  }, [isCameraOn]);


  const handleStartCamera = () => {
    setIsCameraOn(true);
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        // We flip the context horizontally to get the non-mirrored image
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        setPhotoDataUri(dataUri);
        setIsCameraOn(false); // Turn off camera after capture
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

  const handleNewPhoto = () => {
    setPhotoDataUri(null);
    setGeneratedImages([]);
    setError(null);
    setIsCameraOn(false); // Ensure camera is off
  };

  // Automatically trigger generation once a photo is captured
  useEffect(() => {
    if (photoDataUri && generatedImages.length === 0 && !isLoading && !error) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoDataUri, error, isLoading]);
  
  // LOOKBOOK LOGIC
  const looksByCategory = lookCategories.map(category => ({
    category,
    looks: looks.filter(look => look.category === category)
  })).filter(group => group.looks.length > 0);
  
  return (
    <div className="container mx-auto py-12 px-4">
      {/* AI STYLIST UI */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline flex items-center justify-center gap-4">
            <Sparkles className="h-10 w-10 text-primary" />
            AI Stylist
        </h1>
        <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">
          Take a clear, well-lit photo of yourself, and our AI will generate new outfits for you to try on.
        </p>
      </div>

      <div className="max-w-7xl mx-auto mb-20">
        {photoDataUri ? (
            // START: RESULTS VIEW (when photo is taken)
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-4 lg:sticky lg:top-24">
                <h2 className="text-2xl font-bold font-headline">Your Photo</h2>
                <Card className="overflow-hidden">
                  <div className="relative aspect-[4/5] w-full">
                    <Image src={photoDataUri} alt="Your captured photo" fill className="object-cover" sizes="50vw" />
                  </div>
                </Card>
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={handleNewPhoto} variant="outline">
                    <Camera className="mr-2 h-4 w-4" /> Start Over
                  </Button>
                  <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    {isLoading ? 'Generating...' : 'Try Again'}
                  </Button>
                </div>
              </div>
  
              <div className="space-y-4">
                <h2 className="text-2xl font-bold font-headline">AI-Styled Outfits</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {isLoading || (photoDataUri && generatedImages.length === 0) ? (
                    <>
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Card key={index} className="overflow-hidden">
                          <div className="relative aspect-[4/5] w-full bg-muted animate-pulse flex items-center justify-center">
                            <Sparkles className="h-10 w-10 text-muted-foreground/50" />
                          </div>
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
                  ) : (
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
                  )}
                </div>
              </div>
            </div>
            // END: RESULTS VIEW
        ) : (
            // START: INITIAL VIEW (before photo is taken)
            <div className="max-w-2xl mx-auto">
                <Card className="overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                        {isCameraOn ? (
                            // Camera is ON -> show video feed
                            <div className="space-y-4">
                                <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden bg-muted">
                                    <video ref={videoRef} className="w-full h-full object-cover transform -scale-x-100" autoPlay muted playsInline />
                                    <canvas ref={canvasRef} className="hidden" />
                                </div>
                                <Button onClick={handleCapture} className="w-full" size="lg">
                                    <Camera className="mr-2 h-5 w-5" />
                                    Capture Photo
                                </Button>
                            </div>
                        ) : (
                            // Camera is OFF -> show placeholder and "Turn On" button
                            <div className="flex flex-col items-center justify-center text-center rounded-lg bg-secondary/30 min-h-[450px] p-8">
                                <div className="p-4 bg-primary/10 rounded-full mb-4">
                                    <Camera className="h-10 w-10 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold font-headline">Ready for your close-up?</h3>
                                <p className="text-muted-foreground max-w-xs mt-2 mb-6">
                                    Turn on your camera to get started with the AI Stylist.
                                </p>
                                <Button onClick={handleStartCamera} size="lg" disabled={isStartingCamera}>
                                    {isStartingCamera ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Starting...
                                        </>
                                    ) : (
                                        <>
                                            <Video className="mr-2 h-4 w-4" />
                                            Turn on Camera
                                        </>
                                    )}
                                </Button>
                                {error && !isStartingCamera && (
                                    <Alert variant="destructive" className="mt-6 text-left max-w-sm">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>Camera Error</AlertTitle>
                                        <AlertDescription>
                                            {error}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            // END: INITIAL VIEW
        )}
      </div>

      <Separator className="my-16" />

      {/* CURATED LOOKBOOK UI */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline">The Lookbook</h2>
        <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">
          Get inspired by our curated looks from the world of modern menswear.
        </p>
      </div>

      <div className="space-y-16">
        <section>
          <div className="space-y-12">
            {looksByCategory.map(({ category, looks }) => (
              <div key={category}>
                <h3 className="text-3xl font-bold tracking-tighter md:text-4xl font-headline mb-8 text-center">
                  {category}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {looks.map((look) => (
                    <OutfitCard key={look.id} look={look} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
