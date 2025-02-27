

// components/GoogleSignInButton.js
import { auth } from '@/firebaseConfig';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useRouter, useSearchParams } from "next/navigation";

const GoogleSignInButton = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirectUrl');

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      console.log('Signed in!');
      if (redirectUrl) {
        router.push(redirectUrl as string);
        return;
      }
      return router.push('/');
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

export default GoogleSignInButton;
