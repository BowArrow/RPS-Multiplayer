$.fn.rpsMulti = function () {
    var t = this;
    t.choice = "choice";
    t.username = "user";
    t.wins = 0;
    t.loses = 0;
    t.ready = false;

    t.game = function (choice1, choice2) {
        if (choice1 === "paper") {
            if (choice2 === "rock") {
                users[t.username].wins++;
            } else if (choice2 === "scissor") {
                users[t.username].loses++;
            }
        }
        if (choice1 === "scissor") {
            if (choice2 === "rock") {
                users[t.username].loses++;
            } else if (choice2 === "paper") {
                users[t.username].wins++;
            }
        }
        if (choice1 === "rock") {
            if (choice2 === "scissor") {
                users[t.username].wins++;
            } else if (choice2 === "paper") {
                users[t.username].loses++;
            }
        }
        if (choice1 === choice2) {
            return "draw";
        }

    }

    t.getInput = function () {
        $("#username").val().trim();
        $("#message").val().trim();
    }

    t.writeUserData = function (userId, name, password) {
        firebase.database().ref('users/' + userId).set({
            userId: userId,
            username: name,
            password: password

        });
    }

    t.makeChoice = function (userId, choice) {
        firebase.database().ref('users/' + userId).set({
            choice: choice
        })
    };

    t.checkReady = function () {
        if (t.username !== "user" && t.choice !== "choice") {
            $("#ready").removeClass("disabled");
        }
    }

    return t;
}

$(document).ready(function () {
    var rps = $(window).rpsMulti();
    if (rps.username === "user") {
        $("#ready").addClass("disabled");
    }
    config = {
        apiKey: "AIzaSyDA2oCBDmOzEl138x0wHmFNoY92beJVKVM",
        authDomain: "berkley-test-casey.firebaseapp.com",
        databaseURL: "https://berkley-test-casey.firebaseio.com",
        projectId: "berkley-test-casey",
        storageBucket: "berkley-test-casey.appspot.com",
        messagingSenderId: "701310724079"
    };
    firebase.initializeApp(config);
    var database = firebase.database();
    var auth = firebase.auth();
    //Rework goes here
    //functions
    function submitCreateAccount() {
        var displayName = $("#username");
        var email = $("#email");
        var password = $("#password");

        auth.createUserWithEmailAndPassword(email.val(), password.val())
            .then(function (user) {
                user.updateProfile({ displayName: displayName.val() });
            });
    }

    function signInWithEmailandPassword() {
        var email = $("#email");
        var password = $("#password");

        auth.signInWithEmailAndPassword(email.val(), password.val())
    }

    function googleSignin(googleUser) {
        var credential = firebase.auth.GoogleAuthProvider.credential({
            'idToken': googleUser.getAuthResponse().id_token
        });
        auth.signInWithCredential(credential);
    }

    function sendChatMessage() {
        ref = database.ref("/chat").limit(500)
        messageField = $("#message");

        ref.push().set({
            name: auth.currentUser.displayName,
            message: messageField.val()
        })
    }

    function addChatMessage(arg1, arg2) {
        var messageDisplay = $("#text");
        var p = $("<p>");
        p.text(arg1 + ": " + arg2);
        messageDisplay.append(p);
    }
    chatRef = database.ref("/chat");

    chatRef.on("child_added", function (snapshot) {
        var message = snapshot.val()
        addChatMessage(message.name, message.message)
    })
    chatRef.on("child_removed", function(snapshot) {
        var messageDisplay = $("#text");
        messageDisplay.removeChild(messageDisplay.childNodes[0]);
    })
    //buttons
    var signUpS = $("#signUpSelect");
    var signInS = $("#signInSelect");
    var dnameC = $("#dname-control");
    var signIn = $("#signIn");
    var signUp = $("#signUp");

    $("body").on("click", "#signUpSelect", function (e) {
        e.preventDefault();
        signInS.removeClass("disabled");
        signUpS.addClass("disabled");
        dnameC.removeClass("d-none");
        signIn.addClass("d-none");
        signUp.removeClass("d-none");
    })

    $("body").on("click", "#signInSelect", function (e) {
        e.preventDefault();
        signInS.addClass("disabled");
        signUpS.removeClass("disabled")
        dnameC.addClass("d-none");
        signIn.removeClass("d-none");
        signUp.addClass("d-none");
    })

    $("body").on("click", "#signIn", function (e) {
        e.preventDefault();
        signInWithEmailandPassword();
        var username = auth.currentUser.displayName;
        $("#loginBtn").html(username).addClass("disabled");
        $("#login").modal("toggle");
        rps.checkReady();
    })

    $("body").on("click", "#signUp", function (e) {
        e.preventDefault();
        submitCreateAccount();
        var username = auth.currentUser.displayName;
        $("#loginBtn").html(username).addClass("disabled");
        $("#login").modal("toggle");
        rps.checkReady();

    })

    $("body").on("click", "#sendIt", function (e) {
        e.preventDefault();
        sendChatMessage();
        $("#message").val("");
        $("#display").animate({
            scrollTop:
                $("#display").prop("scrollHeight")
        }, 500);
    })

    //Reworking

    $("#choices").on("click", "div", function () {
        $("#choices div").attr("data-selected", "false").css("opacity", "0.8")
        $(this).attr("data-selected", "true").css("opacity", "1.0");
        rps.choice = $(this).attr("id");
        console.log(rps.choice);
        rps.checkReady();
    })

    // $(".modal").on("click", "#signIn", function (e) {
    //     e.preventDefault();
    // var user = $("#username");
    // var username = $("#username").val().trim();
    // if (username.length > 0) {
    //     $("#loginBtn").html(username).addClass("disabled");
    //     $("#login").modal("toggle");
    //     rps.username = username;
    //     var users = database.ref("/users/").child(rps.username);

    //     rps.checkReady();

    //     var thisUserRef = database.ref("/users/" + rps.username);

    //     thisUserRef.on("value", function (snapshot) {
    //         $("#userStats").text("Wins: " + snapshot.val().wins + "\n" + "Losses: " + snapshot.val().loses);
    //     })
    // } else {
    //     user.attr("placeholder", "Please enter username!");
    // }
    // });
    //firebase
    var listRef = database.ref("/presence/");
    var userRef = listRef.push();
    var presenceRef = database.ref("/.info/connected");


    presenceRef.on("value", function (snapshot) {
        if (snapshot.val()) {
            userRef.onDisconnect().remove();

            userRef.set(true);
        }
    });

    listRef.on("value", function (snapshot) {
        $("#data-online").html(snapshot.numChildren());
    });



    $("#ready").on("click", function (e) {
        e.preventDefault();
        var users = database.ref("/users/").child();
        var choiceDiv = $("#userChoice-display");
        choiceDiv.html("");

        var img = $("<img>");
        var nameDiv = $("#username-display");

        img.attr({
            "src": `assets/images/${rps.choice}.png`,
            "class": "img-fluid"
        });

        choiceDiv.append(img);

        nameDiv.text(rps.username);

        $("#ready").addClass("disabled");

    })




    //Give these eyes the power to pierce the veil. 
    //Give these hands the ability to shape fate.
    //Give this mind the wisdom to guide both righteously.

});