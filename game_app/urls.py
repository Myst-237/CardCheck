from django.urls import path
from .views import home, handle_requests,play_request,game_session,get_cardings,pick

app_name = 'game_app'
urlpatterns = [
    path('', home, name="home"),
    path('handle/', handle_requests, name="handle_requests"),
    path('play/', game_session, name="game_session"),
    path('send_request/', play_request, name="play_request"),
    path('get_cardlist/', get_cardings, name="get_cardings"),
    path('pick/', pick, name="pick")
    
]
