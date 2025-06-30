
'use client';

import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email:string, password:string) => Promise<any>;
  signupWithEmail: (email: string, password: string, firstName: string, lastName: string) => Promise<any>;
  logout: () => void;
  uploadProfilePicture: (file: File) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const NOT_CONFIGURED_ERROR = new Error("Firebase is not configured. Please add your Firebase credentials to the .env file.");

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
        setLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const loginWithGoogle = async () => {
    if (!auth) throw NOT_CONFIGURED_ERROR;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard/user');
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error; // Re-throw the error to be caught by the UI
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    if (!auth) throw NOT_CONFIGURED_ERROR;
    return signInWithEmailAndPassword(auth, email, password);
  }

  const signupWithEmail = async (email: string, password: string, firstName: string, lastName: string) => {
    if (!auth) throw NOT_CONFIGURED_ERROR;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user && auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: `${firstName} ${lastName}`,
      });
      // This will trigger a state update in listeners
      setUser(auth.currentUser);
    }
    return userCredential;
  }

  const uploadProfilePicture = async (file: File) => {
    if (!auth || !storage || !user) {
        throw new Error("Firebase not configured or user not logged in.");
    }
    const fileRef = ref(storage, `profile-pictures/${user.uid}`);
    try {
      await uploadBytes(fileRef, file);
      const photoURL = await getDownloadURL(fileRef);
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL });
        // This will trigger a state update in listeners
        setUser(auth.currentUser);
      }
    } catch (error) {
      console.error("Error uploading profile picture", error);
      throw error;
    }
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const value = { user, loading, loginWithGoogle, loginWithEmail, signupWithEmail, logout, uploadProfilePicture };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
