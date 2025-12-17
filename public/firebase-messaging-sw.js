importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDvbYeHkySBuGB4wZQzJUSQblU_O3uW6IU",
  authDomain: "trading-fdee2.firebaseapp.com",
  projectId: "trading-fdee2",
  messagingSenderId: "765551311020",
  appId: "1:765551311020:web:c5628ac6a3f92ea4d8c709",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(
    payload.data?.title || "Notification",
    {
      body: payload.data?.body || "",
      icon: "/icon.png",
      data: payload.data || {},
    }
  );
});

