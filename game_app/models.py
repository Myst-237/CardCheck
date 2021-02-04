from django.db import models
from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.shortcuts import reverse
from django.utils import timezone
from django.contrib.auth.models import User
from datetime import datetime, timedelta
import random
from django.db.models import JSONField
from django.urls import reverse,resolve


def get_deck():
    deck = ["AH", "AC", "AD", "AS", "2H", "2C", "2D", "2S", "3H", "3C", "3D", "3S", "4H", "4C", "4D", "4S", "5H", "5C",
            "5D", "5S",
            "6H", "6C", "6D", "6S", "7H", "7C", "7D", "7S", "8H", "8C", "8D", "8S", "9H", "9C", "9D", "9S", "10H",
            "10C",
            "10D", "10S",
            "JH", "JC", "JD", "JS", "QH", "QC", "QD", "QS", "KH", "KC", "KD", "KS", "RL", "BL"]
    return deck


class CheckGameSession(models.Model):
    name = models.CharField(max_length=100, null=True)

    def __str__(self):
        return self.name
    
    def reset(self):
        player1 = self.player_set.get(div = 'player-1')
        player2 = self.player_set.get(div = 'player-2')
        playboard = self.playboard_set.all()[0]
        dealboard = self.dealboard_set.all()[0]
        player1.initialize()
        player2.initialize()
        playboard.initialize()
        dealboard.initialize()
        dealboard.deal_to_player(player1,5)
        dealboard.deal_to_player(player2,5)
        player2.hasPlayed = True
        player2.save()
        player1.hasPlayed = False
        player1.hasPicked = False
        player1.save()
        dealboard.deal_to_playboard(playboard,1)
        self.save()
         
         
class Player(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    score = models.IntegerField(default=0)
    cards = ArrayField(ArrayField(models.CharField(max_length=3)), default=list)
    hasPlayed = models.BooleanField(default=False)
    hasPicked = models.BooleanField(default=False)
    div = models.CharField(max_length=30, null=True)
    game_session = models.ForeignKey(CheckGameSession, on_delete=models.CASCADE, null=True)

    def __str__(self):
        return self.user.username
    
    def initialize(self):
        self.cards = []
        self.save()
     

class PlayBoard(models.Model):
    name = models.CharField(max_length=30, default='playboard')
    card_dict = JSONField(default=list)
    div = models.CharField(max_length=30, default='#board')
    game_session = models.ForeignKey(CheckGameSession, on_delete=models.CASCADE, null=True)

    def __str__(self):
        return self.name
    
    def initialize(self):
        self.card_dict = []
        self.save()


class DealBoard(models.Model):
    name = models.CharField(max_length=30, default='dealboard')
    cards = ArrayField(ArrayField(models.CharField(max_length=3)), default=get_deck)
    div = models.CharField(max_length=30, default='dealboard-deck')
    game_session = models.ForeignKey(CheckGameSession, on_delete=models.CASCADE, null=True)

    def __str__(self):
        return self.name
    
    def deal_to_player(self,player, num):
        if num <= len(self.cards) and len(self.cards) != 0:
            for i in range(0,num):
                cardy = self.random_card()
                player.cards.append(cardy)
                player.save()
                self.remove(cardy)
                self.save()
        else:
            j = len(self.cards)
            k = num - len(self.cards)
            if j != 0:
                self.deal_to_player(player,j)
            game_session = self.game_session
            playboard = game_session.playboard_set.all()[0]
            n = len(playboard.card_dict)-2
            for i in range(0,n):
                if playboard.card_dict[i]["played_by"] != 'command':
                    self.cards.append(playboard.card_dict[i]["card"])
            self.save()
            playboard.card_dict = playboard.card_dict[n:]
            playboard.save()
            self.deal_to_player(player, k)
            
    def deal_to_playboard(self,playboard, num):
        for i in range(0,num):
            cardy = self.random_card()
            while cardy in ["AH", "AC", "AD", "AS", "7H", "7C", "7D", "7S", "RL", "BL"]:
                cardy = self.random_card()
            playboard.card_dict.append({'card':cardy,'played_by':'dealboard'})
            playboard.save()
            self.remove(cardy)
            self.save()
    
    def random_card(self):
        random_index = random.randint(0, len(self.cards)-1)
        card = self.cards[random_index]
        return card
    
    def remove(self, card):
        temp = []
        for item in self.cards:
            if item not in card:
                temp.append(item)
        self.cards = temp
        self.save()     
        
    def initialize(self):
        self.cards = []
        self.cards = get_deck()
        self.save()

class Requests(models.Model):
    created = models.TimeField(auto_now_add=True)
    send_to = models.CharField(max_length=30)
    recieved_from = models.CharField(max_length=30)
    is_replied = models.BooleanField(default=False)
    is_rejected = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = 'Requests'
        verbose_name_plural = 'Requests'
    
    def recent(self):
        return self.created >= timezone.now() - datetime.timedelta(minutes=2)
    
    def __str__(self):
        return 'from ' + self.recieved_from + ' to ' + self.send_to
    

 
    