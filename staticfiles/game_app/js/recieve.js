//jshint esversion:8
//recieve js: this file is used to 'listen' to requests made by other players

//assigning variables for
/* 
-seen variable is to check if the request has been seen
-user variable is the player on the DOM and
*/
var seen = false;
var user = $("#username").text();

//the funciton read is used to read read reqeusts from the server that have been sent to the user
let read = async () =>{
    let url = '/send_request/';
    let response = await fetch(url);
    if (response.ok) { 
        let data = await response.json();
        for (var request of data){
            if(request.fields.send_to == user && !request.fields.is_rejected){
                let request_from = request.fields.recieved_from;
                document.querySelector("#requestBox").classList.remove("invisible");
                $("#sender").text(request_from);
                document.getElementById("inlineRadio1").setAttribute("value", 'yes-'+request_from);
                document.getElementById("inlineRadio2").setAttribute("value", 'no-'+request_from);
                seen = true;
            }
        }
      } else {
        alert("HTTP-Error: " + response.status);
      }
    if(seen){
        clearInterval(send);
    }
    };
var send = setInterval(read, 2000);


