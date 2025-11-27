from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('current-user/', views.current_user_view, name='current_user'),
    path('csrf-token/', views.get_csrf_token, name='csrf_token'),
]