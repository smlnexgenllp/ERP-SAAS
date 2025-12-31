from django.urls import path
from .employee_login_view import EmployeeLoginView

urlpatterns = [
    path("employee-login/", EmployeeLoginView.as_view()),

]
