"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Import your Firebase config

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

import { ReactNode } from 'react';
interface AuthProviderProps {
  children: ReactNode;
}
interface AuthContextType {
  currentUser: User | null;
  signIn: () => void;
  signOut: () => void;
}
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("useEffect called");  
    console.log("auth", auth);
    if(!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const currentUser = user;
      console.log("currentUser", currentUser);  
      setCurrentUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);


  return (
    <AuthContext.Provider value={{ currentUser, signIn: () => {}, signOut: () => {} }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
