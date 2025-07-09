'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { OutfitCard } from "@/components/OutfitCard";
import { looks, lookCategories } from "@/lib/data";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, Loader2, AlertCircle, Camera, RefreshCw } from 'lucide-react';
import { generateOutfitImage } from '@/ai/flows/generate-outfit-image';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function LookbookPage() {
  const { toast } = useToast();

  // Camera states
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  // AI states
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Camera permission logic
  useEffect(() => {
    // Only run on client
    const getCameraPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setHasCameraPermission(true);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            setHasCameraPermission(false);
            toast({
                variant: 'destructive',
                title: 'Camera Access Denied',
                description: 'Please enable camera permissions in your browser settings to use this feature.',
            });
        }
    };

    getCameraPermission();

    // Cleanup function to stop video stream
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            try {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            } catch(e) {
                console.error("Error stopping video stream:", e)
            }
        }
    };
  }, [toast]);

  const handleTakePicture = () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUri = canvas.toDataURL('image/jpeg');
          setCapturedImage(dataUri);
      }
  };
  
  // Trigger AI generation when an image is captured
  useEffect(() => {
      if (!capturedImage) return;

      const handleGenerate = async () => {
          setIsLoading(true);
          setError(null);
          setGeneratedImageUrls([]);

          try {
              const result = await generateOutfitImage(capturedImage);
              if (result.imageUrls && result.imageUrls.length === 3) {
                  setGeneratedImageUrls(result.imageUrls);
              } else {
                  throw new Error('The AI did not return the expected number of images. Please try again.');
              }
          } catch (err: any) {
              console.error(err);
              let friendlyError = err.message || 'An unknown error occurred while generating the image.';
              
              if (friendlyError.includes('API key not valid')) {
                  friendlyError = 'Your Google AI API key is not valid. Please check your .env file.';
              } else if (friendlyError.includes('permission to access')) {
                  friendlyError = "The AI service is not enabled. Please go to your Google Cloud project and enable the 'Vertex AI API'.";
              } else if (friendlyError.includes('flow/generateOutfitImageFlow not found')) {
                  friendlyError = "The AI feature isn't ready yet. This can happen during development if the server is restarting. Please try again in a moment.";
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
  }, [capturedImage, toast]);

  const resetStylist = () => {
      setCapturedImage(null);
      setGeneratedImageUrls([]);
      setError(null);
      setIsLoading(false);
  };

  const looksByCategory = lookCategories.map(category => ({
    category,
    looks: looks.filter(look => look.category === category)
  })).filter(group => group.looks.length > 0);

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline">The Lookbook</h1>
        <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">
          Get inspired by our curated looks or create your own with the AI Stylist.
        </p>
      </div>

      {/* AI Stylist Section */}
      <section className="mb-16">
          <Card className="max-w-4xl mx-auto">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <Wand2 className="h-6 w-6 text-primary"/>
                      AI Stylist
                  </CardTitle>
                  <CardDescription>
                      Use your camera to take a picture of yourself, and our AI will generate three new outfit concepts for you.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  {!capturedImage ? (
                      // Camera View
                      <div className="space-y-4">
                          <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden">
                              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                              <canvas ref={canvasRef} className="hidden" />
                              
                              {hasCameraPermission === false && (
                                  <div className="absolute inset-0 flex items-center justify-center p-4">
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
                                  <div className="absolute inset-0 flex items-center justify-center">
                                      <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                  </div>
                              )}
                          </div>
                          <Button onClick={handleTakePicture} disabled={!hasCameraPermission} className="w-full">
                              <Camera className="mr-2 h-4 w-4" />
                              Take Picture
                          </Button>
                      </div>
                  ) : (
                      // Results View
                      <div className="space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-start">
                              <div className="space-y-2 text-center md:text-left">
                                  <h3 className="font-semibold">Your Photo</h3>
                                  <div className="relative aspect-[4/5] w-full rounded-lg overflow-hidden border-4 border-primary">
                                      <Image src={capturedImage} alt="Your captured photo" fill className="object-cover"/>
                                  </div>
                              </div>
                              {isLoading ? (
                                  Array.from({ length: 3 }).map((_, index) => (
                                      <div key={index} className="space-y-2">
                                          <h3 className="font-semibold text-muted-foreground invisible">Look {index + 1}</h3>
                                          <Skeleton className="aspect-[4/5] w-full" />
                                      </div>
                                  ))
                              ) : error ? (
                                  <div className="md:col-span-3">
                                      <Alert variant="destructive" className="h-full flex flex-col justify-center">
                                          <AlertCircle className="h-4 w-4" />
                                          <AlertTitle>Generation Failed</AlertTitle>
                                          <AlertDescription>
                                              {error}
                                          </AlertDescription>
                                      </Alert>
                                  </div>
                              ) : (
                                  generatedImageUrls.map((url, index) => (
                                      <div key={index} className="space-y-2">
                                            <h3 className="font-semibold text-muted-foreground">Look {index + 1}</h3>
                                          <div className="relative aspect-[4/5] w-full rounded-lg overflow-hidden">
                                              <Image src={url} alt={`Generated look ${index + 1}`} fill className="object-cover" data-ai-hint="fashion model" />
                                          </div>
                                      </div>
                                  ))
                              )}
                          </div>
                          <Button onClick={resetStylist} variant="outline" className="w-full">
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Start Over
                          </Button>
                      </div>
                  )}
              </CardContent>
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
