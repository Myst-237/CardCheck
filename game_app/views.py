from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.sessions.models import Session
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from .models import Player, DealBoard, PlayBoard, CheckGameSession, Requests
from .forms import Choice
from django.http import JsonResponse
import json
from django.core import serializers
from django.urls import reverse,resolve
from django.contrib import messages


# function to get the users that are currently login to the website
def get_current_users():
    active_sessions = Session.objects.filter(expire_date__gte=timezone.now())
    user_id_list = []
    for session in active_sessions:
        data = session.get_decoded() 
        user_id_list.append(data.get('_auth_user_id', None))
    # Query all logged in users based on id list
    return User.objects.filter(id__in=user_id_list)

# the home display view
def home(request):
    online_users = get_current_users()
    recieved = Requests.objects.filter(recieved_from = request.user.username)
    if recieved:
        for item in recieved:
            if item.is_rejected:
                item.delete()
                
    game_session = CheckGameSession.objects.filter(name__icontains = request.user.username)
    if game_session:
        messages.info(request, 'You are in a game session')
    context = {
        'users': online_users
    }
    return render(request, 'game_app/home.html', context)


# function to send play request
@login_required
def play_request(request):
    if request.POST and request.POST.get('selected_user') is not None:
        request_to = request.POST.get('selected_user')
        request_from = request.user.username
        game_sessions = CheckGameSession.objects.filter(name__icontains = request_to)
        if game_sessions:
            messages.info(request, request_to + ' is already in a game session')
            return redirect('/')
        else:
            Requests.objects.create(send_to = request_to, recieved_from = request_from)
            return render(request, 'game_app/waiting.html')
        
    request_list = json.loads(serializers.serialize('json',Requests.objects.all()))
    
    return JsonResponse(request_list, safe=False)
        
   
       

# creating the game session 
@login_required
def handle_requests(request):
    #saving the request reply
    if request.POST.get('option')[:3] == 'yes' :
        recieved_from = request.POST.get('option')[4:]
        requested = Requests.objects.filter(recieved_from = recieved_from, send_to = request.user.username)
        for item in requested:
            item.is_replied = True
            item.save()
        
        games = CheckGameSession.objects.filter(name__icontains = request.user.username)
        if games:
            return redirect('/')
        else:
            #getting the players
            player1_user = request.user
            player1 = player1_user.username
            player2 = request.POST.get('option')[4:]
            player2_user = User.objects.get(username=player2)
            
            #creating the game session
            gaming_session = CheckGameSession.objects.create()
            gameplayer1 = Player.objects.create(user=player1_user, div="player-1", game_session=gaming_session)
            gameplayer2 = Player.objects.create(user=player2_user, div="player-2", hasPlayed = True, game_session=gaming_session)
        
            # naming the game session
            gaming_session.name = player1 + ' ' + str(gaming_session.pk) + ' ' + player2
            gaming_session.save()
            # creating the playboard and dealboard
            playboard = PlayBoard.objects.create(name=str(gaming_session.pk) + ' playboard',
                                                game_session=gaming_session)
            dealboard = DealBoard.objects.create(name=str(gaming_session.pk)  + ' dealboard',
                                                game_session=gaming_session)
            
            #setting initials
            dealboard.deal_to_player(gameplayer1,5)
            dealboard.deal_to_player(gameplayer2,5)
            dealboard.deal_to_playboard(playboard,1)
            
            return render(request, 'game_app/creating.html')
    
    if request.POST.get('option')[:2] == 'no':
        recieved_from = request.POST.get('option')[3:]
        requested = Requests.objects.filter(recieved_from = recieved_from, send_to = request.user.username)
        for item in requested:
            item.is_replied = True
            item.is_rejected = True
            item.save()
        return redirect('/')
    
    return redirect('/')

#the main game session view  where the game is played
@login_required
def game_session(request):
    user = request.user
    if Player.objects.filter(user=user):
        player = Player.objects.get(user=user)
        gaming_session = player.game_session
        player1 = gaming_session.player_set.get(div='player-1')
        player2 =  gaming_session.player_set.get(div='player-2')
        recieved = Requests.objects.filter(recieved_from = player.user.username)
        if recieved:
            for item in recieved:
                if item.is_replied:
                    item.delete()
        playboard = PlayBoard.objects.get(game_session = gaming_session)
        dealboard = DealBoard.objects.get(game_session = gaming_session)
        
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            card = json.load(request)['card']
            if card in player.cards:
                player.cards.remove(card)
                player.hasPicked = False
                player.save()
                playboard.card_dict.append({'card':card,'played_by':player.div})
                playboard.save()
                player1 = gaming_session.player_set.get(div='player-1')
                player2 =  gaming_session.player_set.get(div='player-2')
                if '7' in card:
                    if player == player1:
                        dealboard.deal_to_player(player2,2)
                        player2.save()
                    if player == player2:
                        dealboard.deal_to_player(player1,2)
                        player1.save()
                if 'L' in card:
                    if player == player1:
                        dealboard.deal_to_player(player2,4)
                        player2.save()
                    if player == player2:
                        dealboard.deal_to_player(player1,4)
                        player1.save()
                make_play_change(player,player1,player2)
            if card == 'R':
                gaming_session.reset()
            if card in ['H','C','D','S']:
                playboard.card_dict.append({'card':card,'played_by':'command'})
                playboard.save()
            if len(player.cards) == 0 and card != 'R':
                player.score = player.score + 1
                player.save()
            data = {
                'user_cards': player.cards,
                'playboard_cards': playboard.card_dict,
                'hasPlayed':player.hasPlayed,
                'hasPicked':player.hasPicked,
                'score':player.score
            }
            return JsonResponse(data)
        
    else:
        return redirect('/')
    
    
     # handling the leave session form
    if request.method == 'POST':
        form = Choice(request.POST)
        if form.is_valid():
            if form.cleaned_data['choice'] == '1':
                player = Player.objects.get(user=user)
                delete_game = player.game_session
                delete_game.delete()
            return redirect('/')
    else:
        form = Choice()

    context = {
        'player1': player1,
        'player2': player2,
        'playboard': playboard,
        'dealboard':dealboard,
        'form': form
    }
    return render(request, 'game_app/play.html', context)


#get the list of card of the check game objects
@login_required
def get_cardings(request):
    user = request.user
    player = Player.objects.get(user=user)
    gaming_session = player.game_session
    playboard = PlayBoard.objects.get(game_session = gaming_session)
    dealboard = DealBoard.objects.get(game_session = gaming_session)
    player1 = gaming_session.player_set.get(div='player-1')
    player2 =  gaming_session.player_set.get(div='player-2')
    if player == player1:
        other_player = player2
    if player == player2:
        other_player = player1
    data = {
        'cards1':player.cards,
        'cards2':playboard.card_dict,
        'cards3':dealboard.cards,
        'divi':player.div,
        'hasPlayed':player.hasPlayed,
        'hasPicked':player.hasPicked,
        'score':player.score,
        'name':player.user.username,
        'otherPlayer_hasPicked':other_player.hasPicked,
        'otherPlayer_hasPlayed':other_player.hasPlayed,
        'otherPlayer_numcards':len(other_player.cards),
        'otherPlayer_score':other_player.score
        }
        
    return JsonResponse(data)
        
#pick a card by the player
@login_required
def pick(request):
    user = request.user
    player = Player.objects.get(user=user)
    game = player.game_session
    dealboard = DealBoard.objects.get(game_session=game)
    dealboard.deal_to_player(player,1)
    player.hasPicked = True
    player.save()
    player1 = game.player_set.get(div='player-1')
    player2 =  game.player_set.get(div='player-2')
    make_play_change(player,player1,player2)
    data = {
        'cards1':player.cards,
        'cards3':dealboard.cards,
        'divi':player.div,
        'hasPlayed':player.hasPlayed,
        'hasPicked':player.hasPicked
        }
        
    return JsonResponse(data)

def make_play_change(player,player1,player2):
    if player == player1:
        player1.hasPlayed = True
        player1.save()
        player2.hasPlayed = False
        player2.save()
    if player == player2:
        player2.hasPlayed = True
        player2.save()
        player1.hasPlayed = False
        player1.save()
