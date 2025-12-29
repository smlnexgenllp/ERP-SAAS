"""
ASGI config for ERP project.

It exposes the ASGI callable as a module-level variable named ``application``.
"""

import os
from django.core.asgi import get_asgi_application

# Set the settings and load the ASGI application FIRST
# This initializes Django, loads all apps, models, etc.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ERP.settings')
application = get_asgi_application()  # ← MUST be called before importing routing/consumers

# NOW it's safe to import routing and consumers
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import apps.hr.routing  # Safe now

# Re-define the full application with WebSocket support
application = ProtocolTypeRouter({
    "http": application,  # Use the already-loaded Django ASGI app
    "websocket": AuthMiddlewareStack(
        URLRouter(
            apps.hr.routing.websocket_urlpatterns
        )
    ),
})