
'use client';

import { useState, useRef, useEffect, useCallback, type ChangeEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Camera, RefreshCw, Sparkles, AlertTriangle, Video, ArrowLeft } from 'lucide-react';
import { generateOutfitImages } from '@/ai/flows/generate-outfit-image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type CameraState = 'off' | 'starting' | 'on' | 'error';

export function AiStylist() {
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [height, setHeight] = useState('');
  const [bodyType, setBodyType] = useState('none');
  const [cameraState, setCameraState] = useState<CameraState>('off');
  
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

  const startCameraStream = useCallback(async () => {
    stopCameraStream(); // Ensure any existing stream is stopped
    setCameraState('starting');
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Camera access denied. Please allow camera permissions in your browser settings.");
      setCameraState('error');
    }
  }, [stopCameraStream]);

  // This is the key to fixing the black screen.
  // It waits for the video to be ready before changing the state to 'on'.
  const handleCanPlay = () => {
    videoRef.current?.play();
    setCameraState('on');
  };
  
  const handleCapture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const videoNode = videoRef.current;
      const canvasNode = canvasRef.current;
      canvasNode.width = videoNode.videoWidth;
      canvasNode.height = videoNode.videoHeight;
      const context = canvasNode.getContext('2d');
      if (context) {
        // Flip the context horizontally to match the mirrored video preview
        context.translate(videoNode.videoWidth, 0);
        context.scale(-1, 1);
        context.drawImage(videoNode, 0, 0, videoNode.videoWidth, videoNode.videoHeight);
      }
      const dataUri = canvasNode.toDataURL('image/jpeg');
      setPhotoDataUri(dataUri);
      stopCameraStream();
      setCameraState('off');
    }
  }, [stopCameraStream]);

  const handleGenerate = useCallback(async () => {
    if (!photoDataUri) return;
    setIsGenerating(true);
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
      if (err.message?.includes('429')) {
        errorMessage = "The service is busy. Please wait a moment and try again.";
      } else if (err.message?.includes('key')) {
        errorMessage = "The AI service is not configured correctly. Please check the API key.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [photoDataUri, height, bodyType]);

  useEffect(() => {
    if (photoDataUri && generatedImages.length === 0 && !isGenerating && !error) {
      handleGenerate();
    }
  }, [photoDataUri, generatedImages.length, isGenerating, error, handleGenerate]);
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  const handleRetake = () => {
    setPhotoDataUri(null);
    setGeneratedImages([]);
    setError(null);
  };
  
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
                        <Button onClick={handleRetake} variant="outline" size="sm" className="w-full">
                            <Camera className="mr-2 h-4 w-4" /> Retake Photo
                        </Button>
                        <Button onClick={handleGenerate} disabled={isGenerating} size="sm" className="w-full">
                            {isGenerating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            {isGenerating ? 'Generating...' : 'Regenerate'}
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
                            {isGenerating || (photoDataUri && generatedImages.length === 0) ? (
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
        ) : cameraState !== 'off' ? (
            <div className="max-w-md mx-auto">
                <Card>
                    <CardContent className="p-4 sm:p-6 space-y-4">
                        <div className="relative w-full aspect-[4/5] rounded-md overflow-hidden bg-black flex items-center justify-center">
                           <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              onCanPlay={handleCanPlay}
                              className={cn(
                                "w-full h-full object-cover -scale-x-100",
                                cameraState !== 'on' && 'hidden'
                              )}
                           />
                           {cameraState === 'starting' && (
                             <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
                               <Loader2 className="h-8 w-8 animate-spin" />
                               <p>Starting Camera...</p>
                             </div>
                           )}
                           {cameraState === 'error' && (
                             <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-destructive-foreground bg-destructive p-4">
                                <AlertTriangle className="h-8 w-8" />
                                <p className="text-center">{error}</p>
                             </div>
                           )}
                        </div>
                        <div className="flex gap-2">
                           <Button onClick={() => setCameraState('off')} variant="outline" className="w-full">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                           <Button onClick={handleCapture} className="w-full" disabled={cameraState !== 'on'}>
                                <Camera className="mr-2 h-4 w-4" />
                                Capture Photo
                           </Button>
                        </div>
                    </CardContent>
                </Card>
                <canvas ref={canvasRef} className="hidden" />
            </div>
        ) : (
            <div className="max-w-md mx-auto">
                <Card>
                    <CardContent className="p-4 sm:p-6">
                        <div className="space-y-4">
                            <Button 
                                onClick={startCameraStream} 
                                className="w-full h-32 text-lg"
                                variant="outline"
                            >
                                <Video className="mr-4 h-8 w-8" />
                                Use Camera
                            </Button>

                            <div className="grid grid-cols-2 gap-4 pt-2">
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
                    </CardContent>
                </Card>
            </div>
        )}
      </div>
  );
}
