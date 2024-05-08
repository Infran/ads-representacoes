import React, { useContext, useState } from 'react'
import { auth } from "../firebase"
import { signInWithEmailAndPassword } from "firebase/auth";

const AuthContext = React.createContext(auth);

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState();

  function login(email,password){
    signInWithEmailAndPassword(auth,email,password)
  }

  const value = {
    currentUser,
  }

  return (
    <AuthContext.Provider value={value}>
        { children }
    </AuthContext.Provider>
  )
}
