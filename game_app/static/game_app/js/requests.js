//jshint esversion:8
//this js file is used to wait for response after sending a request.
var user = $("#username").text();
var seen = false;
let read = async () =>{
    let url = '/send_request/';
    let response = await fetch(url);
    if (response.ok) { 
        let data = await response.json();
        for( var request of data ){
            if(request.fields.recieved_from == user){
                if(request.fields.is_replied && !request.fields.is_rejected){
                    document.querySelector("#sent").classList.remove("invisible");
                    seen = true;
                }
                if(request.fields.is_replied && request.fields.is_rejected){
                    document.querySelector("#rejected").classList.remove("invisible");
                    seen = true;
                }
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