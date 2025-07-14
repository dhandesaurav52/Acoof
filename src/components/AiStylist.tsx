
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Camera, RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';
import { generateOutfitImages } from '@/ai/flows/generate-outfit-image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function AiStylist() {
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [cameraState, setCameraState] = useState<'off' | 'starting' | 'on' | 'error'>('off');
  const [height, setHeight] = useState('');
  const [bodyType, setBodyType] = useState('none');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (cameraState !== 'off') return;

    setCameraState('starting');
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
      streamRef.current = stream;
      const videoNode = videoRef.current;
      if (videoNode) {
        videoNode.srcObject = stream;
        // The play logic is now handled by the useEffect hook watching the ref
      } else {
        throw new Error("Video element not found");
      }
    } catch (err) {
      console.error('Error starting camera stream:', err);
      let errorMessage = 'Could not access the camera. Please ensure it is not in use by another application.';
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          errorMessage = 'Camera access was denied. Please enable permissions in your browser settings.';
        }
      }
      setError(errorMessage);
      setCameraState('error');
      stopCameraStream();
    }
  }, [facingMode, cameraState, stopCameraStream]);

  // This effect correctly handles playing the video when the stream is ready
  useEffect(() => {
    const videoNode = videoRef.current;
    if (videoNode && videoNode.srcObject && cameraState === 'starting') {
      const handleCanPlay = async () => {
        try {
          await videoNode.play();
          setCameraState('on');
        } catch (playError) {
          console.error("Video play failed:", playError);
          setError("Could not start video playback.");
          setCameraState('error');
          stopCameraStream();
        }
      };

      videoNode.addEventListener('canplay', handleCanPlay);
      return () => {
        videoNode.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [cameraState, stopCameraStream]);
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && cameraState === 'on') {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        if (facingMode === 'user') {
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        setPhotoDataUri(dataUri);
        stopCameraStream();
        setCameraState('off');
      }
    } else {
        toast({
            variant: "destructive",
            title: "Camera Not Ready",
            description: "Please wait a moment for the camera feed to start before capturing.",
        })
    }
  };
  
  const handleGenerate = useCallback(async () => {
    if (!photoDataUri) return;
    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);
    try {
      const result = await generateOutfitImages({
        photoDataUri,
        height,
        bodyType: bodyType === 'none' ? '' : bodyType,
      });
      if (result.images.length < 3) {
        setError("The AI was unable to generate all outfits. This can happen if the photo is unclear or triggers a safety filter. Please try again with a different photo.");
        setGeneratedImages(result.images);
      } else {
        setGeneratedImages(result.images);
      }
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      let errorMessage = "The AI failed to generate outfits. Please try again.";
      if (err.message?.includes('400') && err.message?.includes('Unsupported MIME type')) {
        errorMessage = "There was an issue with the captured photo format. Please try again.";
      } else if (err.message?.includes('429')) {
        errorMessage = "The service is busy. Please wait a moment and try again.";
      } else if (err.message?.includes('key')) {
        errorMessage = "The AI service is not configured correctly. Please check the API key.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [photoDataUri, height, bodyType]);

  const handleNewPhoto = () => {
    setPhotoDataUri(null);
    setGeneratedImages([]);
    setError(null);
    setCameraState('off');
  };

  const handleToggleCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    stopCameraStream();
    setCameraState('off'); // Reset state to allow `startCamera` to re-trigger
  };
  
  useEffect(() => {
    if (photoDataUri && generatedImages.length === 0 && !isLoading && !error) {
      handleGenerate();
    }
  }, [photoDataUri, generatedImages.length, isLoading, error, handleGenerate]);
  
  return (
     <div className="max-w-7xl mx-auto mb-20">
        {photoDataUri ? (
            <div className="flex flex-col items-center gap-8">
                <div className="w-full max-w-sm space-y-4">
                    <h3 className="text-xl font-bold font-headline text-center">Your Photo</h3>
                    <Card className="overflow-hidden">
                        <div className="relative aspect-[4/5] w-full">
                            <Image src={photoDataUri} alt="Your captured photo" fill className="object-cover" sizes="(max-width: 640px) 100vw, 448px" />
                        </div>
                    </Card>
                    <div className="flex gap-2">
                        <Button onClick={handleNewPhoto} variant="outline" size="sm" className="w-full">
                            <Camera className="mr-2 h-4 w-4" /> Start Over
                        </Button>
                        <Button onClick={handleGenerate} disabled={isLoading} size="sm" className="w-full">
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            {isLoading ? 'Generating...' : 'Try Again'}
                        </Button>
                    </div>
                </div>
                
                <Separator className="my-4" />

                <div className="w-full">
                    <h3 className="text-xl font-bold font-headline text-center mb-6">AI-Styled Outfits</h3>
                    {error ? (
                        <div className="max-w-2xl mx-auto">
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Generation Failed</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {isLoading || (photoDataUri && generatedImages.length === 0) ? (
                                <>
                                    {Array.from({ length: 3 }).map((_, index) => (
                                        <Card key={index} className="overflow-hidden">
                                            <div className="relative aspect-[4/5] w-full bg-muted animate-pulse flex items-center justify-center">
                                                <Sparkles className="h-8 w-8 text-muted-foreground/50" />
                                            </div>
                                        </Card>
                                    ))}
                                </>
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
                                                    sizes="(max-width: 639px) 100vw, (max-width: 768px) 50vw, 33vw"
                                                />
                                            </div>
                                        </Card>
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        ) : (
            <div className="max-w-md mx-auto">
                <Card className="overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                        <div className="space-y-4">
                            <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden bg-muted flex items-center justify-center">
                                <video 
                                    ref={videoRef} 
                                    className={cn(
                                        "w-full h-full object-cover transition-opacity duration-300",
                                        facingMode === 'user' && "transform -scale-x-100",
                                        cameraState === 'on' ? "opacity-100" : "opacity-0"
                                    )}
                                    muted 
                                    playsInline 
                                />
                                <canvas ref={canvasRef} className="hidden" />

                                {cameraState !== 'on' && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                                        <div className="p-3 bg-primary/10 rounded-full mb-4">
                                            {cameraState === 'starting' ? <Loader2 className="h-6 w-6 text-primary animate-spin" /> : <Camera className="h-6 w-6 text-primary" />}
                                        </div>
                                        <h3 className="text-lg font-bold font-headline">Ready for your close-up?</h3>
                                        <p className="text-muted-foreground max-w-xs mt-2 mb-4">
                                            Turn on your camera to get started with the AI Stylist.
                                        </p>
                                        <Button onClick={startCamera} disabled={cameraState === 'starting'}>
                                            {cameraState === 'starting' ? 'Starting...' : 'Turn on Camera'}
                                        </Button>
                                    </div>
                                )}
                                
                                {error && cameraState === 'error' && (
                                    <Alert variant="destructive" className="absolute bottom-4 left-4 right-4 text-left max-w-sm mx-auto">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>Camera Error</AlertTitle>
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                {cameraState === 'on' && (
                                    <Button onClick={handleToggleCamera} variant="outline" size="icon" className="absolute top-2 right-2 z-10 bg-background/50 backdrop-blur-sm rounded-full">
                                        <RefreshCw className="h-5 w-5" />
                                        <span className="sr-only">Flip Camera</span>
                                    </Button>
                                )}
                            </div>

                            <div className={cn("transition-opacity", cameraState === 'on' ? 'opacity-100' : 'opacity-50 pointer-events-none')}>
                                <Button onClick={handleCapture} className="w-full" disabled={cameraState !== 'on'}>
                                    <Camera className="mr-2 h-5 w-5" />
                                    Capture Photo
                                </Button>
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <div>
                                        <Label htmlFor="height" className="text-sm">Height (Optional)</Label>
                                        <Input id="height" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 5'10&quot;" />
                                    </div>
                                    <div>
                                        <Label htmlFor="bodyType" className="text-sm">Body Type (Optional)</Label>
                                        <Select value={bodyType} onValueChange={setBodyType}>
                                            <SelectTrigger id="bodyType">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                <SelectItem value="Slim">Slim</SelectItem>
                                                <SelectItem value="Fit">Fit</SelectItem>
                                                <SelectItem value="Healthy">Healthy</SelectItem>
                                                <SelectItem value="Fat">Fat</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}
      </div>
  );
}
