import React, { useContext, useState } from 'react'
import { auth } from '../firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, User } from "firebase/auth";
import { FirebaseError } from 'firebase/app';
import { useNavigate } from "react-router-dom";

const AuthContext = React.createContext<User>(null);

export function useAuth() {
    return useContext(AuthContext);
}

export function login(email, password) {
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log('user = ',user);
            console.log('userCredential = ',userCredential);
            // setCurrentUser(user);
        })
        .catch((error: FirebaseError) => {
            const errorCode = error.code;
            const errorMensage = error.message;

            console.log('errorCode = ', errorCode);
            console.log('errorMensage = ', errorMensage);
        })
}
export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState<User>();

    onAuthStateChanged(auth, (user) => {
        console.log(user);
        if (user) {
            // User is signed in, see docs for a list of available properties
            // https://firebase.google.com/docs/reference/js/auth.user
            // const uid = user.uid;
            setCurrentUser(user);

            // ...
        } else {
            // User is signed out
            // ...
        }
    });


    return (
        <AuthContext.Provider value={currentUser}>
            {children}
        </AuthContext.Provider>
    )
}
