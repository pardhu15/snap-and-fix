import React, { useContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "firebase/auth";

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMockMode, setIsMockMode] = useState(false);

    useEffect(() => {
        // Check if using standard placeholders
        const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
        if (!apiKey || apiKey.includes('your_api_key')) {
            console.warn("Using Mock Auth Mode due to missing API keys");
            setIsMockMode(true);
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    function signup(email, password) {
        if (isMockMode) {
            const mockUser = { uid: 'mock-user-123', email: email };
            setCurrentUser(mockUser);
            localStorage.setItem('mockUser', JSON.stringify(mockUser));
            return Promise.resolve(mockUser);
        }
        return createUserWithEmailAndPassword(auth, email, password);
    }

    function login(email, password) {
        if (isMockMode) {
            const mockUser = { uid: 'mock-user-123', email: email };
            setCurrentUser(mockUser);
            localStorage.setItem('mockUser', JSON.stringify(mockUser));
            return Promise.resolve(mockUser);
        }
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        if (isMockMode) {
            setCurrentUser(null);
            localStorage.removeItem('mockUser');
            return Promise.resolve();
        }
        return signOut(auth);
    }

    const value = {
        currentUser,
        signup,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
