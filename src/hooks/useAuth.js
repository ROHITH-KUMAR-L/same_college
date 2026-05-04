import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set, get, onValue, serverTimestamp, runTransaction } from 'firebase/database';
import { auth, googleProvider, database } from '../firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.info("Same College Auth: Initializing high-reliability session check...");

    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.info("Same College Auth: Successfully resolved redirect credentials.");
          setUser(result.user);
        }
      } catch (error) {
        if (error.code !== 'auth/popup-closed-by-user') {
          console.error("Same College Auth: Redirect resolution anomaly:", error);
        }
      }
    };
    handleRedirect();

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Set basic user info first
          setUser(firebaseUser);
          
          const userRef = ref(database, `users/${firebaseUser.uid}`);
          const snapshot = await get(userRef);
          const existingData = snapshot.val() || {};
          
          // Determine initial role
          let role = "STUDENT";
          const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
          
          // Check privileged list first
          const privilegedRef = ref(database, `privileged_emails/${firebaseUser.email.replace(/\./g, '_')}`);
          const privilegedSnap = await get(privilegedRef);
          
          if (firebaseUser.email === adminEmail || 
              ['rohithkumarl2006@gmail.com', 'vivekvernekar02@gmail.com', 'contactus.techastra@gmail.com'].includes(firebaseUser.email)) {
            role = "ADMIN";
          } else if (privilegedSnap.exists()) {
            role = privilegedSnap.val();
          } else if (existingData.role) {
            role = existingData.role;
          }

          if (!existingData.createdAt) {
            const statsRef = ref(database, 'stats/totalVerifiedUsers');
            runTransaction(statsRef, (count) => (count || 0) + 1).catch(err => console.error('Verification metric error:', err));
          }

          const userData = {
            ...existingData,
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.email}&background=random`,
            emailVerified: firebaseUser.emailVerified || false,
            lastLoginAt: serverTimestamp(),
            role: role,
            ...(existingData.createdAt ? {} : { createdAt: serverTimestamp() }),
          };

          await set(userRef, userData);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth sync error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Real-time role sync
  useEffect(() => {
    if (!user?.uid) return;

    const userRef = ref(database, `users/${user.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.role !== user.role) {
        setUser(prev => ({ 
          ...prev, 
          role: data.role || "STUDENT",
          profile: data.profile || {}
        }));
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const loginWithGoogle = async () => {
    try {
      console.info("Same College Auth: Initiating secure Google handshake...");
      try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
      } catch (popupError) {
        if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/cancelled-popup-request') {
          console.info("Same College Auth: Popup restricted. Transitioning to secure redirect flow.");
          await signInWithRedirect(auth, googleProvider);
        } else {
          throw popupError;
        }
      }
    } catch (error) {
      console.error('Same College Auth: Handshake failed:', error);
      throw error;
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      console.error('Email login error:', error);
      throw error;
    }
  };

  const registerWithEmail = async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      console.error('Email registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return { user, loading, loginWithGoogle, loginWithEmail, registerWithEmail, logout };
}

