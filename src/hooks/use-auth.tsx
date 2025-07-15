
'use client';

import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, updateEmail, UserCredential } from 'firebase/auth';
import { ref as storageDbRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage, database } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { ref as dbRef, set, get, update } from "firebase/database";

export type AppUser = User & {
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
};

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  loginWithEmail: (email:string, password:string) => Promise<any>;
  signupWithEmail: (email: string, password: string, firstName: string, lastName: string) => Promise<any>;
  logout: () => void;
  uploadProfilePicture: (file: File) => Promise<void>;
  updateUserProfile: (data: Partial<Omit<AppUser, 'uid' | 'photoURL' | 'emailVerified' | 'isAnonymous' | 'metadata' | 'providerData' | 'providerId' | 'tenantId' | 'delete' | 'getIdToken' | 'getIdTokenResult' | 'reload' | 'toJSON'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const NOT_CONFIGURED_ERROR = new Error("Firebase is not configured. Please add your Firebase credentials to the .env file.");

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
        setLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (!database) {
            setUser(user);
            setLoading(false);
            return;
        }
        const userDbRef = dbRef(database, `users/${user.uid}`);
        try {
            const snapshot = await get(userDbRef);
            const appUser: AppUser = { ...user } as AppUser; 
            if (snapshot.exists()) {
              const dbProfile = snapshot.val();
              Object.assign(appUser, dbProfile); 
            } else {
              const initialProfile = {
                  email: user.email,
                  displayName: user.displayName,
              };
              await set(userDbRef, initialProfile);
              Object.assign(appUser, initialProfile);
            }
            setUser(appUser);
        } catch (error: any) {
            setUser(user);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const loginWithEmail = async (email: string, password: string) => {
    if (!auth) throw NOT_CONFIGURED_ERROR;
    return signInWithEmailAndPassword(auth, email, password);
  }

  const signupWithEmail = async (email: string, password: string, firstName: string, lastName: string) => {
    if (!auth || !database) throw NOT_CONFIGURED_ERROR;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
            try {
                const displayName = `${firstName} ${lastName}`;
                await updateProfile(userCredential.user, { displayName });
                const userDbRef = dbRef(database, `users/${userCredential.user.uid}`);
                await set(userDbRef, {
                    email: userCredential.user.email,
                    displayName: displayName,
                });
            } catch (dbError) {
                console.error("Database error during sign up:", dbError);
            }
        }
        return userCredential;
    } catch (error) {
        throw error;
    }
  }

  const updateUserProfile = async (data: Partial<Omit<AppUser, 'uid' | 'photoURL' | 'emailVerified' | 'isAnonymous' | 'metadata' | 'providerData' | 'providerId' | 'tenantId' | 'delete' | 'getIdToken' | 'getIdTokenResult' | 'reload' | 'toJSON'>>) => {
    const currentUser = auth?.currentUser;
    if (!auth || !currentUser || !database) {
        throw new Error("Firebase not configured or user not logged in.");
    }

    try {
        const authUpdates: Promise<void>[] = [];
        if (data.displayName && data.displayName !== currentUser.displayName) {
            authUpdates.push(updateProfile(currentUser, { displayName: data.displayName }));
        }
        if (data.email && data.email !== currentUser.email) {
            authUpdates.push(updateEmail(currentUser, data.email));
        }

        if (authUpdates.length > 0) {
            await Promise.all(authUpdates);
        }
        
        const userDbRef = dbRef(database, `users/${currentUser.uid}`);
        
        const dbUpdates: any = {};
        if (data.displayName) dbUpdates.displayName = data.displayName;
        if (data.email) dbUpdates.email = data.email;
        if (data.phone !== undefined) dbUpdates.phone = data.phone;
        if (data.address !== undefined) dbUpdates.address = data.address;
        if (data.city !== undefined) dbUpdates.city = data.city;
        if (data.state !== undefined) dbUpdates.state = data.state;
        if (data.pincode !== undefined) dbUpdates.pincode = data.pincode;


        if (Object.keys(dbUpdates).length > 0) {
            await update(userDbRef, dbUpdates);
        }

        await currentUser.reload();
        const reloadedUser = auth.currentUser;
        if (reloadedUser) {
            const finalSnapshot = await get(userDbRef);
            const dbProfile = finalSnapshot.exists() ? finalSnapshot.val() : {};
            const appUser: AppUser = { ...reloadedUser } as AppUser;
            Object.assign(appUser, dbProfile);
            setUser(appUser);
        } else {
            setUser(null);
        }
    } catch (error: any) {
        if (error.code === 'PERMISSION_DENIED' || error.message?.includes('permission_denied')) {
             throw new Error("Permission Denied: Please check your Firebase Realtime Database security rules to allow users to read/write their own profile data.");
        }
        if (error.code === 'auth/requires-recent-login') {
            throw new Error("This action is sensitive and requires recent authentication. Please log out and log back in to update your email.");
        }
        throw error;
    }
  };

  const uploadProfilePicture = async (file: File) => {
    const currentUser = auth?.currentUser;
    if (!auth || !storage || !database || !currentUser) {
        throw new Error("Firebase not configured or user not logged in.");
    }
    
    try {
      const fileRef = storageDbRef(storage, `profile-pictures/${currentUser.uid}`);
      await uploadBytes(fileRef, file);
      const photoURL = await getDownloadURL(fileRef);
      
      await updateProfile(currentUser, { photoURL });
      await currentUser.reload();
      const reloadedUser = auth.currentUser;
      if (reloadedUser) {
        const userDbRef = dbRef(database, `users/${reloadedUser.uid}`);
        const snapshot = await get(userDbRef);
        const appUser: AppUser = { ...reloadedUser } as AppUser;
        if (snapshot.exists()) {
            Object.assign(appUser, snapshot.val());
        }
        setUser(appUser);
      } else {
        setUser(null);
      }
    } catch (error: any) {
      if (error.code === 'storage/unauthorized') {
          throw new Error("You don't have permission to upload this file. Please check your Firebase Storage security rules.");
      }
      if (error.code === 'storage/object-not-found') {
            throw new Error("File not found. The upload may have been interrupted.");
      }
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

  const value = { user, loading, loginWithEmail, signupWithEmail, logout, uploadProfilePicture, updateUserProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
