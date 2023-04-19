import { storePathMap } from "@/models/path";
import { createCollectionRefFactory } from "@/models/util";
import { initializeApp } from "@firebase/app";
import { doc, initializeFirestore } from "@firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyByvvP8Rb_uQZnx5cb2BpZj8OvyUxuE2Rc",
  authDomain: "gagagaga-dev.firebaseapp.com",
  projectId: "gagagaga-dev",
  storageBucket: "gagagaga-dev.appspot.com",
  messagingSenderId: "442174624660",
  appId: "1:442174624660:web:c860937debeaf770b4b581",
  measurementId: "G-LS63C7GJ1T",
});

export const store = initializeFirestore(app, {});

export const appNameSpace = doc(store, "/chatgpt-trpg/v1");

export const getCollectionRef = createCollectionRefFactory(appNameSpace, storePathMap);
