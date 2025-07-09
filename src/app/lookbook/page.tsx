
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { looks, lookCategories } from "@/lib/data";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wand2, Loader2, AlertCircle, Camera, RefreshCw } from 'lucide-react';
import { generateOutfitImages } from '@/ai/flows/generate-outfit-image';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { OutfitCard } from '@/components/OutfitCard';

export default function LookbookPage() {
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [view, setView] = useState<'initial' | 'camera' | 'result'>('initial');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stop video stream when component unmounts or view changes
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const activateCamera = async () => {
    setView('camera');
    setHasCameraPermission(null); // Reset permission state
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
            variant: 'destructive',
            title: 'Camera Not Supported',
            description: 'Your browser does not support camera access.',
        });
        setView('initial');
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
      setView('initial');
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings.',
      });
    }
  };

  const handleTakePicture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const MAX_WIDTH = 512;
    const scale = MAX_WIDTH / video.videoWidth;
    canvas.width = MAX_WIDTH;
    canvas.height = video.videoHeight * scale;
    
    const context = canvas.getContext('2d');
    if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Compress the image as a JPEG
        const dataUri = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUri);
        setView('result');

        // Stop the camera stream
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
    }
  };
  
  useEffect(() => {
    if (view !== 'result' || !capturedImage) return;

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setGeneratedImages([]);
        try {
            const result = await generateOutfitImages(capturedImage);
            if (result.images && result.images.length === 3) {
                setGeneratedImages(result.images);
            } else {
                throw new Error('The AI did not return the expected number of images.');
            }
        } catch (err: any) {
            console.error(err);
            let friendlyError = err.message || 'An unknown error occurred while generating the image.';
            
            if (friendlyError.includes('API key not valid') || friendlyError.includes('API_KEY_INVALID')) {
                friendlyError = 'Your Google AI API key is not valid or has expired. Please check your .env file.';
            } else if (friendlyError.includes('permission to access') || friendlyError.includes('PERMISSION_DENIED')) {
                friendlyError = "The AI service is not enabled. Please go to your Google Cloud project and enable the 'Vertex AI API'.";
            } else if (friendlyError.includes('flow/outfitImagesFlow not found')) {
                friendlyError = "The AI feature isn't ready yet. This can happen during development if the server is restarting. Please try again in a moment.";
            } else if (friendlyError.includes('Model not found')) {
                friendlyError = "The AI model for image generation is not available. This might be a temporary issue or a configuration problem.";
            }
            
            setError(friendlyError);
            toast({
                variant: 'destructive',
                title: 'Image Generation Failed',
                description: friendlyError,
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    handleGenerate();
  }, [view, capturedImage, toast]);

  const resetStylist = () => {
    setCapturedImage(null);
    setGeneratedImages([]);
    setError(null);
    setIsLoading(false);
    setView('initial');
    setHasCameraPermission(null);
  };

  const looksByCategory = lookCategories.map(category => ({
    category,
    looks: looks.filter(look => look.category === category)
  })).filter(group => group.looks.length > 0);

  const renderInitialState = () => (
    <div className="text-center p-8 flex flex-col items-center justify-center h-full min-h-[400px]">
      <Wand2 className="h-12 w-12 text-primary mb-4" />
      <h3 className="text-2xl font-bold font-headline">AI Stylist</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Use your camera to get three new AI-generated outfits tailored to your style.
      </p>
      <Button onClick={activateCamera} size="lg">
        <Camera className="mr-2 h-4 w-4" />
        Activate AI Stylist
      </Button>
    </div>
  );

  const renderCameraState = () => (
    <div className="space-y-4 p-4 sm:p-6">
        <div className="relative aspect-[4/5] w-full bg-muted rounded-lg overflow-hidden border">
            {/* The -scale-x-100 flips the video to create a mirror effect */}
            <video ref={videoRef} className="w-full h-full object-cover -scale-x-100" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
            
            {hasCameraPermission === false && (
                <div className="absolute inset-0 flex items-center justify-center p-4 bg-background/80">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Camera Access Required</AlertTitle>
                        <AlertDescription>
                            Please allow camera access in your browser to use this feature.
                        </AlertDescription>
                    </Alert>
                </div>
            )}
            {hasCameraPermission === null && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
            )}
        </div>
        <Button onClick={handleTakePicture} disabled={!hasCameraPermission} className="w-full" size="lg">
            <Camera className="mr-2 h-4 w-4" />
            Take Picture & Get Ideas
        </Button>
    </div>
  );

  const renderResultState = () => (
    <div className="space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start">
            <div className="space-y-2 col-span-2 md:col-span-1">
                <h3 className="font-semibold text-center text-sm">Your Photo</h3>
                <div className="relative aspect-[4/5] w-full rounded-lg overflow-hidden border-2 border-primary shadow-lg">
                    <Image src={capturedImage!} alt="Your captured photo" fill className="object-cover"/>
                </div>
            </div>
            <div className="col-span-2 md:col-span-3">
              <h3 className="font-semibold text-center text-sm mb-2">AI-Generated Outfits</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="aspect-[4/5] w-full">
                        <Skeleton className="h-full w-full" />
                    </div>
                  ))
              ) : error ? (
                  <div className="sm:col-span-3">
                    <Alert variant="destructive" className="h-full flex flex-col justify-center text-center items-center p-6">
                        <AlertCircle className="h-6 w-6 mb-2" />
                        <AlertTitle>Generation Failed</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </div>
              ) : (
                  generatedImages.map((image, index) => (
                    <div key={index} className="relative aspect-[4/5] w-full rounded-lg overflow-hidden border">
                        <Image src={image} alt={`Generated outfit ${index + 1}`} fill className="object-cover" />
                    </div>
                  ))
              )}
              </div>
            </div>
        </div>
        <Button onClick={resetStylist} variant="outline" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Start Over
        </Button>
    </div>
  );
  
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline">The Lookbook</h1>
        <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">
          Get inspired by our curated looks or create your own with the AI Stylist.
        </p>
      </div>

      <section className="mb-16">
          <Card className="max-w-5xl mx-auto overflow-hidden">
            {view === 'initial' && renderInitialState()}
            {view === 'camera' && renderCameraState()}
            {view === 'result' && renderResultState()}
          </Card>
      </section>

      <div className="space-y-16">
        <section>
          <div className="space-y-12">
            {looksByCategory.map(({ category, looks }) => (
              <div key={category}>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl font-headline mb-8 text-center">
                  {category}
                </h2>
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
