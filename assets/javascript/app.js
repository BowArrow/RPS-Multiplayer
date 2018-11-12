$.fn.rpsMulti = function () {
    var t = this;
    t.choice = "choice";
    t.username;
    t.creatorWins;
    t.joinerWins;

    t.game = function (player1, player2) {
        if (player1.choice === "paper") {
            if (player2.choice === "rock") {
                creatorWins = true;
            } else if (player2.choice === "scissor") {
                joinerWins = true;
            }
        }
        if (player1.choice === "scissor") {
            if (player2.choice === "rock") {
                joinerWins = true;
            } else if (player2.choice === "paper") {
                creatorWins = true;
            }
        }
        if (player1.choice === "rock") {
            if (player2.choice === "scissor") {
                creatorWins = true;
            } else if (player2.choice === "paper") {
                joinerWins = true;
            }
        }
        if (player1.choice === player2.choice) {
            creatorWins = true;
            joinerWins = true
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
    //Rework goes hered

    //code


    chatRef = database.ref("/chat");

    chatRef.on("child_added", function (snapshot) {
        var message = snapshot.val()
        addChatMessage(message.name, message.message)
    })
    chatRef.on("child_removed", function () {
        var messageDisplay = $("#text");
        messageDisplay.removeChild(messageDisplay.childNodes[0]);
    })

    gameRef = database.ref("/games");

    var STATE = { OPEN: 1, JOINED: 2, CHOICE_MADE: 3, DECIDE_WINNER: 4, COUNTDOWN: 5, COMPLETE: 6 }
    var openGames = gameRef.orderByChild("state").equalTo(STATE.OPEN);

    openGames.on("child_added", function (snapshot) {
        var data = snapshot.val();
        if (data.creator.uid != auth.currentUser.uid) {
            addJoinGameButton(snapshot.key, data);
        }
    });

    openGames.on("child_removed", function (snapshot) {
        var item = $("#" + snapshot.key);
        if (item) {
            item.remove();
        }
    })

    //functions
    function submitCreateAccount() {
        var displayName = $("#username").val();
        var email = $("#email").val();
        var password = $("#password").val();

        auth.createUserWithEmailAndPassword(email, password).then(function (user) {
            user.updateProfile({ displayName: displayName });
        });
    }

    function signInWithEmailandPassword() {
        var email = $("#email");
        var password = $("#password");

        auth.signInWithEmailAndPassword(email.val(), password.val())
    }

    function signOutUser() {
        firebase.auth().signOut().then(function () {
            console.log("Sign-out successful.")
        }, function (error) {
            console.log(error)
        });
    }
    function googleSignin(googleUser) {
        var credential = firebase.auth.GoogleAuthProvider.credential({
            'idToken': googleUser.getAuthResponse().id_token
        });
        auth.signInWithCredential(credential);
    }

    function sendChatMessage() {
        ref = database.ref("/chat");
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

    function createGame() {
        console.log("creating a game!");
        enableCreateGame(false);

        var user = firebase.auth().currentUser;
        var currentGame = {
            creator: {
                uid: user.uid,
                displayName: user.displayName
            },
            state: STATE.OPEN
        };

        var key = gameRef.push();
        key.set(currentGame, function (error) {
            if (error) {
                console.log("Uh oh, error creating game.", error);
                UI.snackbar({ message: "Error creating game" });
            } else {
                //disable access to joining other games
                console.log("I created a game!", key);
                //drop this game, if I disconnect
                key.onDisconnect().remove();
                gameList.style.display = "none";
                watchGame(key.key);
            }
        })
    }

    function joinGame(key) {
        console.log("Attempting to join game: ", key);
        var user = firebase.auth().currentUser;
        gameRef.child(key).transaction(function (game) {
            //only join if someone else hasn't
            if (!game.joiner) {
                game.state = STATE.JOINED;
                game.joiner = {
                    uid: user.uid,
                    displayName: user.displayName
                }
            }
            return game;
        }, function (error, committed, snapshot) {
            if (committed) {
                if (snapshot.val().joiner.uid == user.uid) {
                    enableCreateGame(false);
                    watchGame(key);
                } else {
                    UI.snackbar({ message: "Game already joined. Please choose another." });
                }
            } else {
                console.log("Could not commit when trying to join game", error);
                UI.snackbar({ message: "Error joining game" });
            }
        });
    }

    function addJoinGameButton(arg1, arg2) {
        var btn = $("<button>");
        btn.attr({
            class: "btn btn-info btn-sm",
            id: arg1,
            value: arg2.creator.displayName

        }).text(arg2.creator.displayName).css({
            "text-align": "center",
            "width": "97%"
        })
        $("#matchRooms").append(btn);

    }

    function countdownToDisplay() {
        var count = 3;
        var myCount = setInterval(intervalFunction, 1000);
        function intervalFunction() {
            var display = $("oppChoice-display");
            display.html("");
            var div = $("<div>");
            div.text(count).attr({
                class: "display-1"
            }).css({
                "font-family": "'Permanent Marker', cursive;"
            });
            display.append(div);
            count--;
        }
        if (count === 0) {
            clearInterval(myCount);
            display.html("")
            break
        }

    }
    function addChoiceToGame(gameRefKey, game, choice) {
        var data = { state: STATE.CHOICE_MADE };
        if (game.creator.uid == auth.currentUser.uid) {
            data["creator/choice"] = choice;
        } else {
            data["joiner/choice"] = choice;
        }

    }

    function showWinner(gameRefKey, game) {
        var display = $("oppChoice-display");
        display.html("");
        var img = $("<img>");
        img.attr({
            "src": `assets/images/${game.joiner.choice}.png`,
            "class": "img-fluid animated bounceIn fast"
        })
        display.append(img);
 

        rps.game(game.creator.choice, game.joiner.choice)

        gameRefKey.update({
            state: STATE.COMPLETE,
            "creator/wins": rps.creatorWins,
            "joiner/wins": rps.joinerWins
        })
        if (rps.creatorWins === true) {
            var display = $("oppChoice-display");
            display.html("");
            var div = $("<div>");
            div.text("Winner").attr({
                class: "display-1"
            }).css({
                "font-family": "'Permanent Marker', cursive;"
            });
            display.append(div);
        } else {
            var display = $("oppChoice-display");
            display.html("");
            var div = $("<div>");
            div.text("You lose!").attr({
                class: "display-1"
            }).css({
                "font-family": "'Permanent Marker', cursive;"
            });
            display.append(div);
        }

    }

    function watchGame(key) {
        var gameRefKey = gameRef.child(key);
        gameRefKey.on("value", function (snapshot) {
            var game = snapshot.val();
            switch (game.state) {
                case STATE.JOINED: joinedGame(gameRefKey, game); break;
                case STATE.CHOICE_MADE: addChoiceToGame(gameRefKey, game, rps.choice); break;
                case STATE.COUNTDOWN: countdownToDisplay(); break;
                case STATE.COMPLETE: showWinner(gameRefKey); break;
            }
        })
    }

    //buttons
    var signUpS = $("#signUpSelect");
    var signInS = $("#signInSelect");
    var dnameC = $("#dname-control");
    var signIn = $("#signIn");
    var signUp = $("#signUp");
    var ready = $("#ready");
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
        rps.username = auth.currentUser.displayName;
        setTimeout(function () {
            $("#loginBtn").html(rps.username).addClass("disabled");
            ready.removeClass("disabled");
            $("#login").modal("toggle");
        }, 500)
    })

    $("body").on("click", "#signUp", function (e) {
        e.preventDefault();
        submitCreateAccount();
        setTimeout(function () {
            var username = auth.currentUser.displayName;
            $("#loginBtn").html(username).addClass("disabled");
            ready.removeClass("disabled")
            $("#login").modal("toggle");
        }, 500)

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

    $("body").on("click", "#createMatch", function (e) {
        e.preventDefault();
        createGame();
    })

    $("#matchRooms").on("click", "button", function (e) {
        e.preventDefault();
        joinGame($(this).attr("id"));
        $("#match").modal("toggle");
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
            userRef.onDisconnect(function () {
                signOutUser();
            })
            userRef.set(true);
        }
    });

    listRef.on("value", function (snapshot) {
        $("#data-online").html(snapshot.numChildren());
    });



    $("#ready").on("click", function (e) {
        e.preventDefault();

        var choiceDiv = $("#userChoice-display");
        choiceDiv.html("");

        var img = $("<img>");
        var nameDiv = $("#username-display");

        img.attr({
            "src": `assets/images/${rps.choice}.png`,
            "class": "img-fluid animated bounceIn fast"
        });
        choiceDiv.append(img);
        nameDiv.text(auth.currentUser.displayName);

        $("#ready").addClass("disabled");

    })




    //Give these eyes the power to pierce the veil. 
    //Give these hands the ability to shape fate.
    //Give this mind the wisdom to guide both righteously.

});