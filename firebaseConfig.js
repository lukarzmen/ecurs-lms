// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDXw5AQW6xKl0Kf7Cotuow--46bHxCO5Y8",
    authDomain: "ecurs-5ba46.firebaseapp.com",
    projectId: "ecurs-5ba46",
    storageBucket: "ecurs-5ba46.firebasestorage.app",
    messagingSenderId: "482477263960",
    appId: "1:482477263960:web:8c04a5aa01b3be19fc4e2d",
    measurementId: "G-Z0ELL27W2X"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };