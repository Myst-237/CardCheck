from django.contrib import admin
from .models import Player, CheckGameSession, DealBoard, PlayBoard, Requests

class PlayBoardAdmin(admin.ModelAdmin): 
    list_display = ('name', 'content') 
  
    def content(self, obj): 
        return len(obj.card_dict)

admin.site.register(Player)
admin.site.register(CheckGameSession)
admin.site.register(DealBoard)
admin.site.register(PlayBoard, PlayBoardAdmin)
admin.site.register(Requests)


