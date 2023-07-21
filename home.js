import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  deleteDoc,
  getDoc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyADYZM0ILQLhD678Apb9-b5QFZPfpl1Z9Y",
  authDomain: "social-thread-app.firebaseapp.com",
  projectId: "social-thread-app",
  storageBucket: "social-thread-app.appspot.com",
  messagingSenderId: "903513698594",
  appId: "1:903513698594:web:7e978dd1fee6df4f35f57b"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

const clickForm = document.querySelector("#clickForm");
clickForm.addEventListener("click", () => {
  document.querySelector("#createPostForm").style.display = "flex";
  clickForm.style.display = "none";
});

const form = document.querySelector("#form");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  document.querySelector("#createPostForm").style.display = "none";
  clickForm.style.display = "flex";
  const textInput = document.querySelector("#textInput").value;
  const auth = getAuth();
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user
      const uid = user.uid;
      const userName = sessionStorage.getItem("currentUserName");
      // console.log(userName);

      try {
        const docRef = await addDoc(collection(db, "thread"), {
          text: textInput,
          createdAt: serverTimestamp(),
          userUid: uid,
          currentUserName: userName,
          likeIncrement: 0,
          heartIncrement: 0,
          likeArray: [],
          heartArray: [],
        });
        form.reset();

        console.log("Document written with ID: ", docRef.id);
        displayAlert("Posted Successfully", "green");
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    } else {
      // User is signed out
      // ...
    }
  });
});
window.addEventListener("load", () => {
  const q = query(collection(db, "thread"), orderBy("createdAt", "desc"));
  const postSection = document.querySelector("#postSection");
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    postSection.innerHTML = "";
    querySnapshot.forEach((doc) => {
      const post = document.createElement("div");
      post.classList.add("post");
      const head = document.createElement("div");
      head.classList.add("head");
      const userInfo = document.createElement("div");
      userInfo.classList.add("userInfo");
      const userImgSpan = document.createElement("span");
      userImgSpan.innerHTML = `<i class="bi bi-person-fill"></i>`;
      userImgSpan.classList.add("userImgSpan");
      const userNameSpan = document.createElement("span");
      userNameSpan.classList.add("userNameSpan");
      userNameSpan.innerText = `${
        doc.data().currentUserName ? doc.data().currentUserName : "username"
      }`;
      userInfo.appendChild(userImgSpan);
      userInfo.appendChild(userNameSpan);
      const postDeleteBtn = document.createElement("button");
      postDeleteBtn.classList.add("postDeleteBtn");
      postDeleteBtn.id = `${doc.id}`;
      postDeleteBtn.innerText = "Delete Post";
      head.appendChild(userInfo);
      head.appendChild(postDeleteBtn);

      const postText = document.createElement("div");
      postText.classList.add("postText");
      postText.innerText = `${doc.data().text}`;

      const reactIconsDiv = document.createElement("div");
      reactIconsDiv.classList.add("reactIconsDiv");

      const likeDiv = document.createElement("div");
      likeDiv.classList.add("likeDiv");
      const likeSpan = document.createElement("span");
      likeSpan.classList.add("reactIcon");
      likeSpan.id = "likeReactIcon";
      likeSpan.innerHTML = `<i class="bi bi-hand-thumbs-up"></i>`;
      const likeNumbersSpan = document.createElement("span");
      likeNumbersSpan.classList.add("numbers");
      likeNumbersSpan.id = "likeNumbers";
      if (doc.data().likeIncrement < 2) {
        likeNumbersSpan.innerText = `${doc.data().likeIncrement} Like`;
      } else {
        likeNumbersSpan.innerText = `${doc.data().likeIncrement} Likes`;
      }
      likeDiv.appendChild(likeSpan);
      likeDiv.appendChild(likeNumbersSpan);
      const heartDiv = document.createElement("div");
      heartDiv.classList.add("likeDiv");
      const heartSpan = document.createElement("span");
      heartSpan.classList.add("reactIcon");
      heartSpan.id = "heartReactIcon";
      // heartSpan.innerHTML = `<i class="bi bi-heart"></i>`;
      const heartNumbersSpan = document.createElement("span");
      heartNumbersSpan.classList.add("numbers");
      if (doc.data().heartIncrement < 2) {
        heartNumbersSpan.innerText = `${doc.data().heartIncrement} heart`;
      } else {
        heartNumbersSpan.innerText = `${doc.data().heartIncrement} hearts`;
      }
      heartNumbersSpan.id = "heartNumbers";
      heartDiv.appendChild(heartSpan);
      heartDiv.appendChild(heartNumbersSpan);

      reactIconsDiv.appendChild(likeDiv);
      reactIconsDiv.appendChild(heartDiv);

      post.appendChild(head);
      post.appendChild(postText);
      post.appendChild(reactIconsDiv);
      postSection.appendChild(post);

      postDeleteBtn.addEventListener("click", () => deletePostFunc(doc.id));
      likeSpan.addEventListener("click", () =>
        likeIncrement(doc.id, doc.data())
      );
      heartSpan.addEventListener("click", () =>
        heartIncrement(doc.id, doc.data())
      );
      if (doc.data().likeIncrement === 0) {
        likeNumbersSpan.style.display = "none";
      }
      if (doc.data().heartIncrement === 0) {
        heartNumbersSpan.style.display = "none";
      }
    });
  });
});
// Retrieve the UID from session storage
const currentUserUID = sessionStorage.getItem("currentUserUID");

const deletePostFunc = async (id) => {
  const postDocRef = doc(db, "thread", id);

  try {
    const postSnapshot = await getDoc(postDocRef);
    const postData = postSnapshot.data();

    // Check if the current user is the owner of the post
    if (postData.userUid === currentUserUID) {
      await deleteDoc(postDocRef);
      displayAlert(" Your Post is Deleted", "green");
    } else {
      displayAlert("You are not authorized to delete this post", "red");
    }
  } catch (error) {
    console.error("Error deleting post: ", error);
  }
};

const logout = document.querySelector("#logout");
logout.addEventListener("click", () => {
  displayAlert("Logout Successfully", "black");
  const auth = getAuth();
  signOut(auth)
    .then(() => {
      // Sign-out successful.
      setTimeout(() => {
        sessionStorage.removeItem("currentUserName");
        location.replace("../login.html");
      }, 2000);
    })
    .catch((error) => {
      // An error happened.
    });
});
const userNameHead = sessionStorage.getItem("currentUserName");
document.querySelector("#userName").innerText = userNameHead;

const user = document.querySelector("#user");
user.addEventListener("mouseover", () => {
  document.querySelector("#logout").style.display = "block";
});
document.querySelector("body").addEventListener("click", () => {
  document.querySelector("#logout").style.display = "none";
});

const likeIncrement = async (id, value) => {
  const uid = sessionStorage.getItem("currentUserUID");
  const washingtonRef = doc(db, "thread", id);
  if (value.likeArray.includes(uid)) {
    await updateDoc(washingtonRef, {
      likeIncrement: increment(-1),
    });
    await updateDoc(washingtonRef, {
      likeArray: arrayRemove(uid),
    });
    document.querySelector("#likeReactIcon").style.color = "black";
    displayAlert("Unliked", "black");
  } else {
    await updateDoc(washingtonRef, {
      likeIncrement: increment(1),
    });
    await updateDoc(washingtonRef, {
      likeArray: arrayUnion(uid),
    });
    document.querySelector("#likeReactIcon").style.color = "blue";
    displayAlert("Liked", "blue");
  }
};
const heartIncrement = async (id, value) => {
  const uid = sessionStorage.getItem("currentUserUID");
  const washingtonRef = doc(db, "thread", id);
  if (value.heartArray.includes(uid)) {
    await updateDoc(washingtonRef, {
      heartIncrement: increment(-1),
    });
    await updateDoc(washingtonRef, {
      heartArray: arrayRemove(uid),
    });
    document.querySelector("#heartReactIcon").style.color = "black";
  } else {
    await updateDoc(washingtonRef, {
      heartIncrement: increment(1),
    });
    await updateDoc(washingtonRef, {
      heartArray: arrayUnion(uid),
    });
    document.querySelector("#heartReactIcon").style.color = "red";
    displayAlert("Love", "red");
  }
};
const alertBox = document.querySelector("#alertBox");
const displayAlert = (txt, clss) => {
  alertBox.textContent = txt;
  alertBox.classList.add(clss);
  // remove alert
  setTimeout(() => {
    alertBox.textContent = "";
    alertBox.classList.remove(clss);
  }, 2000);
};
