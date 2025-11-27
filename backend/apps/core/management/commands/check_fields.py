from django.core.management.base import BaseCommand
from django.apps import apps

class Command(BaseCommand):
    help = 'Check fields in User model'
    
    def handle(self, *args, **options):
        try:
            User = apps.get_model('accounts', 'User')
            self.stdout.write("User model fields:")
            for field in User._meta.get_fields():
                self.stdout.write(f"  - {field.name} ({field.__class__.__name__})")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error: {e}"))