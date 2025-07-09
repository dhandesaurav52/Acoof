
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { looks, lookCategories } from "@/lib/data";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, Loader2, AlertCircle, Camera, RefreshCw } from 'lucide-react';
import { generateOutfitIdeas } from '@/ai/flows/generate-outfit-image';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { OutfitCard } from '@/components/OutfitCard';

export default function LookbookPage() {
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [showCamera, setShowCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedIdeas, setGeneratedIdeas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stop video stream when component unmounts
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const activateCamera = async () => {
    setShowCamera(true);
    setHasCameraPermission(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
            variant: 'destructive',
            title: 'Camera Not Supported',
            description: 'Your browser does not support camera access.',
        });
        setShowCamera(false);
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
      setShowCamera(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings to use this feature.',
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
        
        const dataUri = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUri);

        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
    }
  };
  
  useEffect(() => {
    if (!capturedImage) return;

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setGeneratedIdeas([]);
        try {
            const result = await generateOutfitIdeas(capturedImage);
            if (result.ideas && result.ideas.length === 3) {
                setGeneratedIdeas(result.ideas);
            } else {
                throw new Error('The AI did not return the expected number of ideas. Please try again.');
            }
        } catch (err: any) {
            console.error(err);
            let friendlyError = err.message || 'An unknown error occurred while generating ideas.';
            if (friendlyError.includes('API key expired')) {
                friendlyError = 'Your Google AI API key has expired. Please go to Google AI Studio to generate a new one and update your .env file.';
            } else if (friendlyError.includes('API key not valid')) {
                friendlyError = 'Your Google AI API key is not valid. Please check your .env file.';
            } else if (friendlyError.includes('permission to access')) {
                friendlyError = "The AI service is not enabled. Please go to your Google Cloud project and enable the 'Vertex AI API'.";
            } else if (friendlyError.includes('flow/outfitIdeasFlow not found')) {
                friendlyError = "The AI feature isn't ready yet. This can happen during development if the server is restarting. Please try again in a moment.";
            } else if (friendlyError.includes(`Must supply a \`model\` to \`generate()\` calls`)){
                friendlyError = "The AI model wasn't specified correctly in the code. This is an application error."
            }
            setError(friendlyError);
            toast({
                variant: 'destructive',
                title: 'Idea Generation Failed',
                description: friendlyError,
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    handleGenerate();
  }, [capturedImage, toast]);

  const resetStylist = () => {
    setCapturedImage(null);
    setGeneratedIdeas([]);
    setError(null);
    setIsLoading(false);
    setShowCamera(false);
    setHasCameraPermission(null);
  };

  const looksByCategory = lookCategories.map(category => ({
    category,
    looks: looks.filter(look => look.category === category)
  })).filter(group => group.looks.length > 0);

  const renderInitialState = () => (
    <div className="text-center p-6 flex flex-col items-center justify-center h-full min-h-[300px]">
      <Wand2 className="h-12 w-12 text-primary mb-4" />
      <h3 className="text-lg font-semibold">AI Stylist</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Use your camera to generate new outfit ideas instantly.
      </p>
      <Button onClick={activateCamera}>
        <Camera className="mr-2 h-4 w-4" />
        Activate AI Stylist
      </Button>
    </div>
  );

  const renderCameraState = () => (
    <div className="space-y-4 p-6">
        <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden -scale-x-100">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
            
            {hasCameraPermission === false && (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Camera Access Required</AlertTitle>
                        <AlertDescription>
                            Please allow camera access to use this feature.
                        </AlertDescription>
                    </Alert>
                </div>
            )}
            {showCamera && hasCameraPermission === null && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
            )}
        </div>
        <Button onClick={handleTakePicture} disabled={!hasCameraPermission} className="w-full">
            <Camera className="mr-2 h-4 w-4" />
            Take Picture & Get Ideas
        </Button>
    </div>
  );

  const renderResultState = () => (
    <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            <div className="space-y-2 text-center md:text-left md:col-span-1">
                <h3 className="font-semibold">Your Photo</h3>
                <div className="relative aspect-[4/5] w-full rounded-lg overflow-hidden border-4 border-primary">
                    <Image src={capturedImage!} alt="Your captured photo" fill className="object-cover"/>
                </div>
            </div>
            <div className="md:col-span-3 space-y-4">
              <h3 className="font-semibold">AI-Generated Outfit Ideas</h3>
              {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-24 w-full" />
                  ))
              ) : error ? (
                  <Alert variant="destructive" className="h-full flex flex-col justify-center">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Generation Failed</AlertTitle>
                      <AlertDescription>
                          {error}
                      </AlertDescription>
                  </Alert>
              ) : (
                  generatedIdeas.map((idea, index) => (
                    <Card key={index} className="bg-secondary/50">
                      <CardHeader>
                        <CardTitle className="text-base">Outfit Idea #{index + 1}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{idea}</p>
                      </CardContent>
                    </Card>
                  ))
              )}
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
          <Card className="max-w-4xl mx-auto">
            {capturedImage ? renderResultState() : (showCamera ? renderCameraState() : renderInitialState())}
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
