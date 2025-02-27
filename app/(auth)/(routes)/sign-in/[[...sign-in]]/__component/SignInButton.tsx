// components/GoogleSignInButton.js
//import { auth } from '@/firebaseConfig';
//import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const SignInButton = () => {
    const handleSignIn = async () => {
      //const provider = new GoogleAuthProvider();
      try {
        //await signInWithPopup(auth, provider);
        console.log('User signed in');
      } catch (error) {
        console.error('Error signing in:', error);
      }
    };
  
    return (
      <button onClick={handleSignIn}>
        Sign in
      </button>
    );
  };
  
  export default SignInButton;
  