from django.urls import path
from .employee_login_view import EmployeeLoginView,EmployeeLogoutView

urlpatterns = [
    path("employee-login/", EmployeeLoginView.as_view()),
    path('auth/employee-logout/', EmployeeLogoutView.as_view(), name='employee-logout'),

]
