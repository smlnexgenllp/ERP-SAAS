from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/organizations/', include('apps.organizations.urls')),
    path('api/auth/', include('apps.accounts.urls')),
    path("api/hr/", include("apps.hr.urls")),
    path("api/auth/", include("apps.authentication.urls")),
    path("api/finance/", include("apps.finance.urls")),
    path("api/inventory/", include("apps.inventory.urls")),
    path('api/stock/', include('apps.stocks.urls')),
    path('api/crm/', include('apps.crm.urls')),
    # path('api/sale/', include('apps.sales.urls')),

]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)



 