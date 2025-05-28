/**
 * Firebase Configuration for Precious Meals & Bakes
 * This file initializes the Firebase app and exports references to Firestore database
 */

// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc, orderBy, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAPK6cVmWAw-c55-npz1R5_VGGyFKYQ3gw",
  authDomain: "preciousmeals-a7d59.firebaseapp.com",
  projectId: "preciousmeals-a7d59",
  storageBucket: "preciousmeals-a7d59.firebasestorage.app",
  messagingSenderId: "464759516900",
  appId: "1:464759516900:web:9a600a65fb1363f2b6c6f1",
  measurementId: "G-L0YMPEQ520"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Export Firebase services for use in other files
export { 
  db, 
  auth, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  deleteDoc, 
  updateDoc, 
  orderBy, 
  getDoc,
  setDoc,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut
};
