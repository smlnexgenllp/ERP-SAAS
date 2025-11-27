from rest_framework import serializers
from apps.organizations.models import Organization
from django.contrib.auth import get_user_model

User = get_user_model()

class OrganizationRegistrationSerializer(serializers.Serializer):
    """Serializer for organization registration"""
    # Organization Details
    name = serializers.CharField(max_length=255)
    subdomain = serializers.CharField(max_length=100)
    plan_tier = serializers.CharField(max_length=50, required=False, default='enterprise')
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    
    # Admin User Details
    admin_email = serializers.EmailField()
    admin_password = serializers.CharField(write_only=True, min_length=8)
    admin_first_name = serializers.CharField(max_length=100)
    admin_last_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    def validate(self, data):
        """Validate the entire registration data"""
        # Check subdomain uniqueness
        if Organization.objects.filter(subdomain=data['subdomain']).exists():
            raise serializers.ValidationError({
                'subdomain': ['Subdomain already exists']
            })
        
        # Check if admin email already exists
        if User.objects.filter(email=data['admin_email']).exists():
            raise serializers.ValidationError({
                'admin_email': ['Admin email already exists']
            })
        
        return data

    def create(self, validated_data):
        """This method is required but we'll handle creation in the view"""
        pass

class OrganizationSerializer(serializers.ModelSerializer):
    """Serializer for Organization model"""
    user_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'subdomain', 'organization_type', 'plan_tier', 
            'email', 'phone', 'address', 'created_at', 'updated_at', 'user_count',
            'parent_organization', 'created_by'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at', 'organization_type')
    
    def get_user_count(self, obj):
        return obj.user_set.count()

class ModuleAccessSerializer(serializers.Serializer):
    module_access = serializers.JSONField()
    
    def validate_module_access(self, value):
        """Validate module access data structure"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Module access must be a dictionary")
        
        for module_id, access_data in value.items():
            if not isinstance(access_data, dict):
                raise serializers.ValidationError(f"Access data for module {module_id} must be a dictionary")
            
            if 'is_active' not in access_data:
                raise serializers.ValidationError(f"is_active field required for module {module_id}")
            
            if not isinstance(access_data['is_active'], bool):
                raise serializers.ValidationError(f"is_active must be boolean for module {module_id}")
            
            if 'accessible_pages' in access_data and not isinstance(access_data['accessible_pages'], list):
                raise serializers.ValidationError(f"accessible_pages must be a list for module {module_id}")
        
        return value

class SubOrganizationSerializer(serializers.ModelSerializer):
    user_count = serializers.SerializerMethodField()
    active_modules_count = serializers.SerializerMethodField()
    subscription_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'subdomain', 'plan_tier', 'email', 'phone',
            'created_at', 'user_count', 'active_modules_count',
            'subscription_status'
        ]
    
    def get_user_count(self, obj):
        return obj.user_set.count()
    
    def get_active_modules_count(self, obj):
        # Import inside method to avoid circular imports
        from apps.subscriptions.models import OrganizationModule
        return OrganizationModule.objects.filter(organization=obj, is_active=True).count()
    
    def get_subscription_status(self, obj):
        # Import inside method to avoid circular imports
        from apps.subscriptions.models import Subscription
        try:
            subscription = Subscription.objects.get(organization=obj)
            return subscription.status
        except Subscription.DoesNotExist:
            return 'inactive'

class ModulePageSerializer(serializers.Serializer):
    page_id = serializers.UUIDField()
    name = serializers.CharField()
    code = serializers.CharField()
    path = serializers.CharField()
    description = serializers.CharField()
    icon = serializers.CharField()
    order = serializers.IntegerField()
    required_permission = serializers.CharField()

class ModuleSerializer(serializers.Serializer):
    module_id = serializers.UUIDField()
    name = serializers.CharField()
    code = serializers.CharField()
    description = serializers.CharField()
    icon = serializers.CharField()
    available_in_plans = serializers.ListField(child=serializers.CharField())
    pages = ModulePageSerializer(many=True)
class SubOrganizationCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    subdomain = serializers.CharField(max_length=100)
    plan_tier = serializers.CharField(max_length=50, default='basic')
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)

    admin_email = serializers.EmailField()
    admin_password = serializers.CharField(write_only=True, min_length=8)
    admin_first_name = serializers.CharField(max_length=100)
    admin_last_name = serializers.CharField(max_length=100, required=False, allow_blank=True)

    selected_modules = serializers.ListField(
        child=serializers.CharField(),  # module code
        required=False
    )

    def validate_subdomain(self, value):
        if Organization.objects.filter(subdomain=value).exists():
            raise serializers.ValidationError("Subdomain already exists")
        return value

    def validate_admin_email(self, value):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Admin email already exists")
        return value