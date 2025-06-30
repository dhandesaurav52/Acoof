
'use client';

import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, updateEmail, UserCredential } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<UserCredential | undefined>;
  loginWithEmail: (email:string, password:string) => Promise<any>;
  signupWithEmail: (email: string, password: string, firstName: string, lastName: string) => Promise<any>;
  logout: () => void;
  uploadProfilePicture: (file: File) => Promise<void>;
  updateUserProfile: (data: { name: string; email: string }) => Promise<void>;
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
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const loginWithGoogle = async () => {
    if (!auth) throw NOT_CONFIGURED_ERROR;
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      return result;
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
    if (userCredential.user) {
      const displayName = `${firstName} ${lastName}`;
      await updateProfile(userCredential.user, { displayName });
      // Manually update state to ensure UI reflects new user name immediately
      setUser(JSON.parse(JSON.stringify(userCredential.user)));
    }
    return userCredential;
  }

  const updateUserProfile = async (data: { name: string; email: string; }) => {
    const currentUser = auth?.currentUser;
    if (!auth || !currentUser) {
        throw new Error("Firebase not configured or user not logged in.");
    }

    const updates: Promise<void>[] = [];
    if (data.name && data.name !== currentUser.displayName) {
        updates.push(updateProfile(currentUser, { displayName: data.name }));
    }
    if (data.email && data.email !== currentUser.email) {
        updates.push(updateEmail(currentUser, data.email));
    }

    if (updates.length > 0) {
        await Promise.all(updates);
        // Manually trigger a state update because onAuthStateChanged might not fire for profile updates.
        if (auth.currentUser) {
          setUser(JSON.parse(JSON.stringify(auth.currentUser)));
        }
    }
  };

  const uploadProfilePicture = async (file: File) => {
    const currentUser = auth?.currentUser;
    if (!auth || !storage || !currentUser) {
        throw new Error("Firebase not configured or user not logged in.");
    }
    const fileRef = ref(storage, `profile-pictures/${currentUser.uid}`);
    
    await uploadBytes(fileRef, file);
    const photoURL = await getDownloadURL(fileRef);
    
    await updateProfile(currentUser, { photoURL });
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser(JSON.parse(JSON.stringify(auth.currentUser)));
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

  const value = { user, loading, loginWithGoogle, loginWithEmail, signupWithEmail, logout, uploadProfilePicture, updateUserProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
