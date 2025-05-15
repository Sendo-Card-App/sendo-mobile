import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  //apiKey: "TON_API_KEY",
  authDomain: "sendo-60b20.firebaseapp.com",
  projectId: "sendo-60b20",
  storageBucket: "sendo-60b20.firebasestorage.app",
  messagingSenderId: "TON_SENDER_ID",
  appId: "1:45218785658:android:59543fbf50890ed7878ec3",
};

const app = initializeApp(firebaseConfig);

export default app;