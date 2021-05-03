import { fb } from './firebase_init.js'

window.addEventListener("load", async () => {
    firebase.analytics();

    // Initialize the FirebaseUI Widget using Firebase.
    let ui = new firebaseui.auth.AuthUI(firebase.auth());

    // ui.start('#firebaseui-auth-container', {
    //     signInOptions: [
    //         firebase.auth.EmailAuthProvider.PROVIDER_ID
    //     ],
    //     // Other config options...
    // });

    // https://firebase.google.com/docs/auth/web/firebaseui?authuser=0
    let uiConfig = {
        callbacks: {
            signInSuccessWithAuthResult: function (authResult, redirectUrl) {
                // User successfully signed in.
                // Return type determines whether we continue the redirect automatically
                // or whether we leave that to developer to handle.
                return true;
            },
            uiShown: function () {
                // The widget is rendered.
                // Hide the loader.
                document.getElementById('loader').style.display = 'none';
            }
        },
        signInFlow: 'popup',
        signInSuccessUrl: 'jeopardy.html',
        signInOptions: [
            firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            firebase.auth.EmailAuthProvider.PROVIDER_ID,
        ],
    };

    // The start method will wait until the DOM is loaded.
    ui.start('#firebaseui-auth-container', uiConfig);
});