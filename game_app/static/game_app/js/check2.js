//jshint esversion:8
//check game javascript files

//initialization of the "objects" used
/*
-the user object is the game player on the DOM from where the script is loaded
-the playboard is the game playboard
-the dealbaord is the game dealbaord
-the user2 is this player's opponent
... the attributes are self discriptive
*/

var user = {
    name:'',
    score:0,
    div:"",
    cards:[],
    hasPlayed:false,
    hasPicked:false
};

var playboard = {
    div: '#board',
    cards:[]
};

var dealboard = {
    div: '#dealboard-deck',
    cards:[]
};

var user2 = {
    score:0,
    hasPlayed:false,
    hasPicked:false,
    numcards:0,
    div: "#oponent_cards"
};

class sound {
    constructor(src) {
        this.sound = document.createElement("audio");
        this.sound.src = src;
        this.sound.setAttribute("preload", "auto");
        this.sound.setAttribute("controls", "none");
        this.sound.style.display = "none";
        document.body.appendChild(this.sound);
        this.play = function () {
            this.sound.play();
        };
        this.stop = function () {
            this.sound.pause();
            this.currentTime = 0;
        };
    }
}


//getting buttons and setting their event listeners, assigning global variables
document.querySelector('#pick-btn').addEventListener('click',pick);
document.getElementById('start-btn').style.visibility = "hidden";
document.querySelector('#start-btn').addEventListener('click', start);
/*
-tapped: global variable to check if a player has tapped their cards after receiving a tap 2 or a tap 4
-alerted: global variable to check if a player has been alerted after loosing
-alerted_user: "                                                 after winning
-tapped_card: a tap card at the top of the playboard
-flipColor: the color of the back side of the cards
*/
var tapped = false;
var alerted;
var alerted_user;
var tapped_card = ' ';
var flipColor = 'red_back';
var play_timer = true;
var pick_timer = true;
var playsound = new sound("/static/game_app/sounds/playcard.wav");
var tapsound = new sound("/static/game_app/sounds/draw.wav");
var errorsound = new sound("/static/game_app/sounds/error.wav");


//function to make a pick request from the server
async function make_pick(){
    let url = '/pick/';
    let response = await fetch(url);
    if (response.ok) { 
        let data = await response.json();
        //assigning the response data
        user.cards = data.cards1;
        user.hasPlayed = data.hasPlayed;
        user.hasPicked = data.hasPicked;
        dealboard.cards = data.cards3;
        user.div = "#"+data.divi;

        //displaying this player cards after pick
        display_cards_to_player_board(user);
        display_dealboard_num_of_cards();

      } else {
        console.log("HTTP-Error: " + response.status);
      }
    }


//function to get this player's cards from the server
let get_player_cardy = async () =>{
    let url = '/get_cardlist/';
    let response = await fetch(url);
    if (response.ok) { 
        let data = await response.json();
        //assigning the response data
        user.cards = data.cards1;
        user.div = "#"+data.divi;
        user.hasPlayed = data.hasPlayed;
        user.hasPicked = data.hasPicked;
        user.score = data.score;
        user.name = data.name;
        playboard.cards = data.cards2;
        dealboard.cards = data.cards3;
        user2.numcards = data.otherPlayer_numcards;
        user2.score = data.otherPlayer_score;

        //in case this function is called when starting a new game, display the player's cards and update scores
        if (user2.numcards != 0){
            displayslow_cards_to_player_board(user);
            update_scores();
            document.getElementById('pick-btn').style.visibility = "visible";
            document.getElementById('start-btn').style.visibility = "hidden";
        }
    
      } else {
        console.log("HTTP-Error: " + response.status);
      }
    };

//getting the player's cards when entering the play page
get_player_cardy();

//function to get the cards and attributes of all checkgame objects
let get_cardy = async () =>{
    let url = '/get_cardlist/';
    let response = await fetch(url);
    if (response.ok) { 
        let data = await response.json();
        //assigning response data
        user.cards = data.cards1;
        user.div = "#"+data.divi;
        playboard.cards = data.cards2;
        dealboard.cards = data.cards3;
        user.hasPlayed = data.hasPlayed;
        user.hasPicked = data.hasPicked;
        user2.hasPicked = data.otherPlayer_hasPicked;
        user2.hasPlayed = data.otherPlayer_hasPlayed;
        user2.numcards = data.otherPlayer_numcards;
        user.score = data.score;
        user2.score = data.otherPlayer_score;

        //incase the card played to the playboard is a tap card, refresh the player's board
        if((playboard.cards[playboard.cards.length - 1].card.includes('7')
            || playboard.cards[playboard.cards.length - 1].card.includes('L'))
            && (!tapped
            || playboard.cards[playboard.cards.length - 1].card != tapped_card)){
                if(playboard.cards[playboard.cards.length - 1].played_by != user.div.slice(1)){
                    display_cards_to_player_board(user);
                    tapped = true;
                    tapped_card = playboard.cards[playboard.cards.length - 1].card;
                }
        }
        if(!(playboard.cards[playboard.cards.length - 1].card.includes('7')
        || playboard.cards[playboard.cards.length - 1].card.includes('L'))){
            tapped = false;
        }

        //incase the opponent has won, notify this player
        if(user2.numcards == 0){
            if(!alerted){
                alert("YOU LOSE  Press Start to continue...");
                document.querySelector(user.div).innerHTML = '';
                document.getElementById('pick-btn').style.visibility = "hidden";
                document.getElementById('start-btn').style.visibility = "visible";
            }
            alerted = true;
        }

        //incase this player has won notify his opponent
        if(user.cards.length == 0){
            if(!alerted_user){
                alert("YOU WIN, Press Start to continue...");
                document.getElementById('pick-btn').style.visibility = "hidden";
                document.getElementById('start-btn').style.visibility = "visible";
            }
            alerted_user = true;
        }

        //incase of a command notify the players
        if(playboard.cards.length > 2){
            if(playboard.cards[playboard.cards.length - 2].card.includes('J')){
                $("#commanded_card").text("Command: " + suit_of(playboard.cards[playboard.cards.length - 1].card));
            }else{
                $("#commanded_card").text(" ");
            }
        }
       
        //incase the opponent is left with one card check this player
        if(user2.numcards == 1){
            $("#checkme").text("CHECK ME BITCH");
        }else{
            $("#checkme").text(" ");
        }

        //after getting the game objects, notify the boards for any changes and notify the player's status
        display_playboard_card(playboard);
        fill_dealboard();
        display_oponent_cards();
        show_play_status();
        update_scores();

      } else {
        console.log("HTTP-Error: " + response.status);
      }
    };

// function to show play status ie if a player can play or not
function show_play_status(){
    let player;
    if(user.div == "#player-1"){
        player = 'player-1';
    }else{
        player = 'player-2';
    }

    if(player_can_play(player) || can_pick(player)){
        $("#play_status").prop("checked", true);
     }else{
        $("#play_status").prop("checked", false);
     }
}

//function to run get_cardy after 2 seconds ie we make our checks for any changes in the server after 2 seconds
function foo() {
    get_cardy();
    setTimeout(foo, 2000);
}
foo();

//function to update scores
function update_scores(){
    if(user.div == '#player-1'){
        document.getElementById('player1-score').innerHTML = ' ' + user.score;
        document.getElementById('player2-score').innerHTML = ' ' + user2.score;
    }
    if(user.div == '#player-2'){
        document.getElementById('player2-score').innerHTML = ' ' + user.score;
        document.getElementById('player1-score').innerHTML = ' ' + user2.score;
    }
}

//function to post the card played to the server
let make_play = async (card_played) =>{
    let url = '/play/';
    //incase we are making a command wait for 1 second.
    //this is done so that we don't saturate the server with simultaneous requests.
    if(card_played.card.length == 1 && card_played.card != 'R'){
        await sleep(1000);
    }
    let response = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json; charset=UTF-8',
            'X-CSRFToken': csrftoken,
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(card_played)
      });
    if (response.ok) { 
        let data = await response.json();
        //assigning response data
        user.cards = data.user_cards;
        user.hasPlayed = data.hasPlayed;
        user.hasPicked = data.hasPicked;
        user.score = data.score;
        playboard.cards = data.playboard_cards;

        //refresh the player's board and the playboard when a succesful play is made
        display_cards_to_player_board(user);
        display_playboard_card(playboard);

      } else {
        console.log("HTTP-Error: " + response.status);
      }
    };

    //function to get the csrftoken
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
const csrftoken = getCookie('csrftoken');

//function to start after a player wins
async function start(){
    //only the winner can start the game, and at any moment we want to start a new game the winner's number 
    //of cards is always 0
    if(user.cards.length == 0){
        //the server knows we want to start a new game when it recieves a play with card R
        let reset_card = {
            card: 'R'
        };
        make_play(reset_card);
        await sleep(2000);
        get_player_cardy();
        //hide the start button and show the pick button
        document.getElementById('pick-btn').style.visibility = "visible";
        document.getElementById('start-btn').style.visibility = "hidden";
    }
    //the looser only uses this function to refresh his board after the new game has been started
    if(user.cards.length != 0){
        get_player_cardy();
    }
}

//play function 
async function play(cardEvent){
    if(play_timer){
        var player = get_player(cardEvent);
    let card_played = cardEvent.target.name;
    if(player_can_play(player)){
        if(card_can_be_played(card_played)){
            playsound.play();
            //dictionary consisting of the card to send to the server
            let send_card = {
                card: card_played
            };
            //given that a player has played, then he can still now be alerted if he looses or wins
            alerted = false;
            alerted_user = false;
            
            //in case the card played is a command card, get the command
            if(card_played.includes('J')){
                 let command_div = document.querySelector("#command");

                 //rendering the options dynamically
                let codeBlock =  '<div class="form-check form-check-inline">' +
                '<input class="form-check-input" type="radio" name="choice" id="hearts" value="H">' +
                '<label class="form-check-label" for="hearts">H</label>' +
            '</div>' +
              '<div class="form-check form-check-inline">' +
                '<input class="form-check-input" type="radio" name="choice" id="spades" value="S">' +
                '<label class="form-check-label" for="spades">S</label>' +
              '</div>' +
              '<div class="form-check form-check-inline">' +
                '<input class="form-check-input" type="radio" name="choice" id="diamonds" value="D">' +
                '<label class="form-check-label" for="diamonds">D</label>' +
              '</div>' +
              '<div class="form-check form-check-inline">' +
                '<input class="form-check-input" type="radio" name="choice" id="clubs" value="C">' +
                '<label class="form-check-label" for="clubs">C</label>' +
              '</div>' +
              '<button id="command-btn" class="btn btn-primary btn-sm">Command</button>';

              command_div.innerHTML = codeBlock;

                 $("#command-btn").click(function(){
                     const suit = document.querySelector('input[name="choice"]:checked').value;
                     let command_suit = {
                         card: suit
                     };
                     make_play(send_card);
                     make_play(command_suit);

                command_div.innerHTML = ' ';
                 });
              }else{
                //incase the card is not a J just make a play request
                make_play(send_card);
              }
         }else{
            alertify.notify('Play a card of same suit or value as '+ playboard.cards[playboard.cards.length - 1].card, 'error', 3);
            errorsound.play();
         }
         play_timer = false;
         await sleep(3000);
         play_timer = true;
     }
    }
}

//function to sleep
function sleep(time){
    let promise = new Promise(function(resolve){
        setTimeout(resolve,time);
    });
    return promise;
}

//function to check if a player can play, on the event of a card click
//these are the rules of the game
function player_can_play(player){
    if((playboard.cards[playboard.cards.length - 1].card.includes('A')
        || playboard.cards[playboard.cards.length - 1].card.includes('7')
        || playboard.cards[playboard.cards.length - 1].card.includes('L'))
         && playboard.cards[playboard.cards.length - 1].played_by != player
         && user.hasPlayed){
            return false;
    }else if((playboard.cards[playboard.cards.length - 1].card.includes('A')
        || playboard.cards[playboard.cards.length - 1].card.includes('7')
        || playboard.cards[playboard.cards.length - 1].card.includes('L'))
         && playboard.cards[playboard.cards.length - 1].played_by != player){
            return user2.hasPicked;
    }else if((playboard.cards[playboard.cards.length - 1].card.includes('A')
        || playboard.cards[playboard.cards.length - 1].card.includes('7')
        || playboard.cards[playboard.cards.length - 1].card.includes('L'))
         && playboard.cards[playboard.cards.length - 1].played_by == player
         && !user.hasPicked){
        return true;
    }else if(user.hasPlayed){
        return false;
    }else{
        return true;
    }
}

//function to get a player on the occur of an event (that is a click event) on a card
function get_player(cardEvent){
    if(cardEvent.target.parentNode.id === "player-1"){
        return 'player-1';
    }else if(cardEvent.target.parentNode.id === "player-2"){
        return 'player-2';
    }
}


//function to allow a player to pick a card on the event of pick-btn click
async function pick(){
    if(pick_timer){
        var player = user.div.slice(1);
    if(can_pick(player)){
        alerted = false;
        alerted_user = false;
        tapsound.play();
        make_pick();
    }
    pick_timer = false;
    await sleep(3000);
    pick_timer = true;
    }
}

//function to determine if a player can pick a card
//these are the rules of the game
function can_pick(player){
    if((playboard.cards[playboard.cards.length - 1].card.includes('A')
        || playboard.cards[playboard.cards.length - 1].card.includes('7')
        || playboard.cards[playboard.cards.length - 1].card.includes('L'))
         && playboard.cards[playboard.cards.length - 1].played_by == player
         && !user.hasPicked){
        return true;
    }else if((playboard.cards[playboard.cards.length - 1].card.includes('A')
        || playboard.cards[playboard.cards.length - 1].card.includes('7')
        || playboard.cards[playboard.cards.length - 1].card.includes('L'))
        && playboard.cards[playboard.cards.length - 1].played_by != player
        && user2.hasPicked
        && (!user.hasPicked || !user.hasPlayed)){
         return true;
    }else if((playboard.cards[playboard.cards.length - 1].card.includes('A')
        || playboard.cards[playboard.cards.length - 1].card.includes('7')
        || playboard.cards[playboard.cards.length - 1].card.includes('L'))
        && playboard.cards[playboard.cards.length - 1].played_by != player){
         return false;
    }else if(user.hasPlayed){
        return false;
    }else{
        return true;
    }
}

// display cards to player board
// the function takes in a the card to show, the player to display it to and the position of the card in his stack
function showcard_to_player(card, player, j){
    let cardImage = document.createElement('img');
        cardImage.src = `/static/game_app/images/cards/${card}.png`;
        cardImage.className = `card-${j}`;
        cardImage.setAttribute("name",card);
        if(j<17){
            document.querySelector(player.div).appendChild(cardImage);
        }
        //assigning an event listener to each card, setting the callback to play
        $(cardImage).click(play);
}

//function to display card to player board, takes in the player, as an object
function display_cards_to_player_board(player){
    document.querySelector(player.div).innerHTML = '';
    let i = 1;
    if(player.cards.length != 0){
        for(let item of player.cards){
            showcard_to_player(item,player,i);
            i++;
        }
    }
}

//function to display card to player board slowly, takes in the player, as an object 
async function displayslow_cards_to_player_board(player){
    document.querySelector(player.div).innerHTML = '';
    let i = 1;
    if(player.cards.length != 0){
        for(let item of player.cards){
            await sleep(100);
            showcard_to_player(item,player,i);
            i++;
        }
    }
}

//function to display cards to oponent
function display_oponent_cards(){
    document.querySelector(user2.div).innerHTML = '';
    let i = 1;
    if(user2.numcards != 0){
        for(let j=0 ; j < user2.numcards ; j++){
            showcard_to_player(flipColor,user2,i);
            i++;
        }
    }
}

// fill the deal board function
/*
 this function fills the deal board after the start of a new game
*/
function fill_dealboard(){
    document.getElementById('dealboard-deck').innerHTML = '';
    let deck = document.createElement('img');
    deck.src = `/static/game_app/images/cards/${flipColor}.png`;
    document.getElementById('dealboard-deck').appendChild(deck);
    display_dealboard_num_of_cards();
}

//to display the dealboard number of card in the html section
function display_dealboard_num_of_cards(){
    document.getElementById('dealbaord-card').innerHTML = dealboard.cards.length;
}


//function to display card to playboard
function display_playboard_card(playBoard){
    document.querySelector('#board').innerHTML = " ";
    if(playBoard.cards.length != 0 ){
        //get the last card on the playboard, but if this card is a command card ie its length is 1
        //continue to the next until we get one which is not.
        let card = playBoard.cards[playBoard.cards.length - 1].card;
        let i = 2;
        while(card.length == 1){
            card =  playBoard.cards[playBoard.cards.length - i].card;
            i = i + 1;
        }
            let img = document.createElement('img');
            img.src = `/static/game_app/images/cards/${card}.png`;
            img.className = 'board-card';
            document.querySelector('#board').appendChild(img);
    }
}

//function to test if card be played
//these are the rules of the game
function card_can_be_played(card){
    let playingBoardCard = playboard.cards[playboard.cards.length - 1].card;
    if(have_same_suit(card,playingBoardCard)){
        return true;
    }else if(have_same_number(card,playingBoardCard)){
        return true;
    }else if(card.includes('J')){
        return true;
    }else if((card.includes('BL') && color_of(playingBoardCard) == 'Black')
            || (playingBoardCard == 'BL' && color_of(card) == 'Black')){
            return true;
    }else if(card.includes('RL') && color_of(playingBoardCard) == 'Red'
             || (playingBoardCard == 'RL' && color_of(card) == 'Red')){
            return true;
    }

}

//function to test if 2 card have thesame suit
function have_same_suit(card1,card2){
    return (suit_of(card1) === suit_of(card2));
}

//function to determine if two cards have thesame numerical value
function have_same_number(card1,card2){
    return (number_of(card1) === number_of(card2));
}

//function to determine the suit of a card
function suit_of(card){
    if(card.includes('H')){
        return 'Hearts';
    }else if(card.includes('C')){
        return 'Clubs';
    }else if(card.includes('S')){
        return 'Spades';
    }else if(card.includes('D')){
        return 'Dimonds';
    }else{
        return 'Joker';
    }
}

//function to determine the color of a card
function color_of(card){
    if(suit_of(card) == 'Hearts' || suit_of(card) == 'Dimonds'){
        return 'Red';
    }else if(suit_of(card) == 'Clubs' || suit_of(card) == 'Spades'){
        return 'Black';
    }else if(suit_of(card) == 'Joker'){
       if(card.includes('RL')){
           return 'Red';
       }
       if(card.includes('BL')){
        return 'Black';
    }
    }
}

//function to determine numerical value of a card
function number_of(card){
    number = card.charAt(0)
    switch(number){
        case 'A':
            return 1;
            break;
        case '2':
            return 2;
            break;
        case '3':
            return 3;
            break;
        case '4':
            return 4;
            break;
        case '5':
            return 5;
            break;
        case '6':
            return 6;
            break;
        case '7':
            return 7;
            break;
        case '8':
            return 8;
            break;
        case '9':
            return 9;
            break;
        case '1':
            return 10;
            break;
        case 'J':
            return 'J';
            break;
        case 'Q':
            return 'Q';
            break;
         case 'K':
            return 'K';
            break;
        case 'B':
            return 'BL';
            break;
        case 'R':
            return 'RL';
    }
}