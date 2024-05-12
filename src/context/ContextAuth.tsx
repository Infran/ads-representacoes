import React, { useContext, useState, useEffect } from 'react'
import { auth } from '../firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, updateProfile, signOut, User, UserCredential } from "firebase/auth";
import { FirebaseError } from 'firebase/app';
import { useNavigate } from "react-router-dom";

const AuthContext = React.createContext<AuthContextReturn>(null);

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState<User>();
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    function login(email: string, password: string) {
        return signInWithEmailAndPassword(auth, email, password)
            // .then((userCredential) => {
            //     const user = userCredential.user;
            //     console.log('user = ',user);
            //     console.log('userCredential = ',userCredential);
            //     // setCurrentUser(user);
            // })
            .catch((error: FirebaseError) => {
                const errorCode = error.code;
                const errorMensage = error.message;

                console.log('errorCode = ', errorCode);
                console.log('errorMensage = ', errorMensage);
            })
    }

    function logout() {
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setLoading(true)
            if (user) {
                console.log(user);
                // User is signed in, see docs for a list of available properties
                // https://firebase.google.com/docs/reference/js/auth.user
                // const uid = user.uid;
                setCurrentUser(user);
                setLoading(false);

                // ...
            } else {
                console.log('User is signed out');
                setCurrentUser(null);
                navigate("/Login");
                // User is signed out
                // ...
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    function update(){
        updateProfile(auth.currentUser, {
            displayName: "Jane Q. User", photoURL: "https://example.com/jane-q-user/profile.jpg"
          }).then(() => {
            // Profile updated!
            // ...
          }).catch((error) => {
            // An error occurred
            // ...
          });
    }

    const value: AuthContextReturn = {
        currentUser,
        login,
        logout,
        loading
    }


    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

//TODO: move to own file
export interface AuthContextReturn {
    currentUser: User,
    login: (email: string, password: string) => Promise<void | UserCredential>,
    logout: () => Promise<void>,
    loading: boolean,

}