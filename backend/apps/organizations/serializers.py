from rest_framework import serializers
from apps.organizations.models import Organization,OrganizationUser
from django.contrib.auth import get_user_model
from apps.modules.models import Module
from django.db import transaction


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

class SubOrganizationCreationSerializer(serializers.Serializer):
    """Serializer for sub-organization creation"""
    # Organization Details
    name = serializers.CharField(max_length=255)
    subdomain = serializers.CharField(max_length=100)
    plan_tier = serializers.CharField(max_length=50, required=False, default='basic')
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    admin_email = serializers.EmailField()
    admin_password = serializers.CharField(write_only=True, min_length=8)
    admin_first_name = serializers.CharField(max_length=100)
    admin_last_name = serializers.CharField(max_length=100, required=False, allow_blank=True)    
    module_access = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        default=list
    )
    
    def validate(self, data):
        """Validate the sub-organization creation data"""
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
    
class OrganizationUserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, required=True)
    modules = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=True
    )

    class Meta:
        model = OrganizationUser
        fields = ['id', 'email', 'first_name', 'last_name', 'password', 'role', 'organization', 'modules']

    def create(self, validated_data):
        email = validated_data.pop('email')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        password = validated_data.pop('password')
        module_codes = validated_data.pop('modules')
        organization = validated_data.get('organization')
        role = validated_data.get('role')

        # Create user
        user = User.objects.create(
            email=email,
            first_name=first_name,
            last_name=last_name,
        )
        user.set_password(password)
        user.save()

        # Assign organization and role
        org_user = OrganizationUser.objects.create(
            user=user,
            organization=organization,
            role=role
        )

        # Assign modules to the user
        # We'll use a simple ManyToMany style mapping, for simplicity store module codes
        # (In production, you can create a separate UserModule table)
        user.profile_modules = module_codes  # or use JSONField on User
        user.save()

        return org_user
    
# serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

SUB_ORG_ROLES = ["Admin", "HR Manager", "Employee"]

class SubOrgUserCreateSerializer(serializers.ModelSerializer):
    modules = serializers.ListField(child=serializers.CharField(), required=False)
    role = serializers.ChoiceField(choices=SUB_ORG_ROLES)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'password', 'role', 'modules']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists")
        return value

    def create(self, validated_data):
        modules = validated_data.pop('modules', [])
        password = validated_data.pop('password')

        # Map sub-org role to your User.role
        role_map = {
            "Admin": User.SUB_ORG_ADMIN,
            "HR Manager": User.USER,
            "Employee": User.USER
        }
        role = validated_data.pop('role')
        validated_data['role'] = role_map.get(role, User.USER)

        # Auto-generate username
        base_username = validated_data['email'].split("@")[0].lower()
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        validated_data['username'] = username

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        # Save module info somewhere if needed
        # user.modules = modules
        # user.save()

        return user
# apps/organizations/serializers.py

from rest_framework import serializers
from .models import TrainingVideo


class TrainingVideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingVideo
        fields = "__all__"
        read_only_fields = ("organization", "uploaded_by")
