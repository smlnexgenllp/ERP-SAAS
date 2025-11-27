from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    MAIN_ORG_ADMIN = 'main_org_admin'
    SUB_ORG_ADMIN = 'sub_org_admin'
    USER = 'user'
    SUPER_ADMIN = 'super_admin'
    
    ROLE_CHOICES = [
        (SUPER_ADMIN, 'Super Admin'),
        (MAIN_ORG_ADMIN, 'Main Organization Admin'),
        (SUB_ORG_ADMIN, 'Sub Organization Admin'),
        (USER, 'User'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=USER)
    
    # Use string reference to avoid circular imports
    organization = models.ForeignKey(
        'organizations.Organization', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True
    )
    
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.email} ({self.role})"

    # Add this method to use email as username
    def get_username(self):
        return self.email