import AppRouter from "./Router"

// import firebase from 'firebase/compat/app'
// import 'firebase/firestore'
// import 'firebase/auths'

// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyCUf-nZCWhIY1R2ndjqz9sF-x9RMp0kCU4",
//   authDomain: "ads-representacoes.firebaseapp.com",
//   projectId: "ads-representacoes",
//   storageBucket: "ads-representacoes.appspot.com",
//   messagingSenderId: "644600567256",
//   appId: "1:644600567256:web:8966b1d587f0a147958ead",
//   measurementId: "G-KLL6D4YG6V"
// };

// firebase.initializeApp(firebaseConfig);

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

function App() {
  return <AppRouter />
}

export default App
