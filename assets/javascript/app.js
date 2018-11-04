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
    database = firebase.database();

    $("#choices").on("click", "div", function () {
        $("#choices div").attr("data-selected", "false").css("opacity", "0.8")
        $(this).attr("data-selected", "true").css("opacity", "1.0");
        rps.choice = $(this).attr("id");
        console.log(rps.choice);
        rps.checkReady();
    })

    $(".modal").on("click", "#signIn", function (e) {
        e.preventDefault();
        var user = $("#username");
        var username = $("#username").val().trim();
        if (username.length > 0) {
            $("#loginBtn").html(username).addClass("disabled");
            $("#login").modal("toggle");
            rps.username = username;
            var users = database.ref("/users/").child(rps.username);
           
            rps.checkReady();
        
            console.log(rps.loses);
        } else {
            user.attr("placeholder", "Please enter username!");
        }
    });
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
        var users = database.ref("/users/").child(rps.username);
        var choiceDiv = $("#userChoice-display");
        choiceDiv.html("");
        users.set({
            choice: rps.choice,
            wins: rps.wins,
            loses: rps.loses,
            ready: true
        });
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