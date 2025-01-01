// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAHjYlP64nW1Z8zTeO7izUE6wRedFPFxbI",
  authDomain: "quizz-3a0a2.firebaseapp.com",
  projectId: "quizz-3a0a2",
  storageBucket: "quizz-3a0a2.firebasestorage.app",
  messagingSenderId: "580571265294",
  appId: "1:580571265294:web:03cc66dca394dfdf3a3f5f",
  databaseURL: "https://quizz-3a0a2-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db }; 
