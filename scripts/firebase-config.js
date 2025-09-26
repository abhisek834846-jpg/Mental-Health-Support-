// Firebase configuration placeholder
// Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyDRPMoOjGPxA7ABPmAiskEJLO6ne4ficTA",
  authDomain: "my-app-98b36.firebaseapp.com",
  projectId: "my-app-98b36",
  storageBucket: "my-app-98b36.firebasestorage.app",
  messagingSenderId: "417670873061",
  appId: "1:417670873061:web:15b04865583684c176f90c",
  measurementId: "G-NX0SBTBETP"
};

firebase.initializeApp(firebaseConfig);
const firebaseAuth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence()
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.log('Persistence failed: Multiple tabs open');
    } else if (err.code == 'unimplemented') {
      // The current browser does not support persistence
      console.log('Persistence not supported by browser');
    }
  });

async function addResource() {
    await db.collection("resources").add({
      type: "audio",
      title: "Mindfulness Meditation",
      description: "A guided meditation video for stress relief.",
      url: "https://youtube.com/abc123",
      duration: "15 min",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    

  };
// addResource();
async function addResources() {
  const db = firebase.firestore();

  const resources = [
    {
      type: "video",
      title: "Mindfulness Meditation",
      description: "Guided meditation for stress relief.",
      url: "https://youtube.com/abc123",
      duration: "15 min"
    },
    {
      type: "audio",
      title: "Relaxing Music",
      description: "Instrumental music for focus.",
      url: "https://example.com/music.mp3",
      duration: "30 min"
    }
  ];
async function addSampleGame() {
    await resourcesManager.addResource({
        type: "game",
        title: "T-Rex Runner",
        description: "Classic Google Chrome dinosaur game 🦖",
        url: "https://trex-runner.com/",   // link to the game
        duration: "Play anytime"
    });
}


  for (let res of resources) {
    await db.collection("resources").add({
      ...res,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  console.log("All resources added!");
}

//addResources();


