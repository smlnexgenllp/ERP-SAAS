from django.core.management.base import BaseCommand
from apps.subscriptions.models import Module, OrganizationModule
from apps.organizations.models import Organization

class Command(BaseCommand):
    help = "Assign all modules to all organizations based on plan tier"

    def handle(self, *args, **options):
        self.stdout.write("🔄 Assigning modules to organizations...")

        orgs = Organization.objects.all()
        modules = Module.objects.filter(is_active=True)

        for org in orgs:
            self.stdout.write(f"\n🏢 Processing organization: {org.name} (Plan: {org.plan_tier})")

            for module in modules:
                # Only assign if the module is available in this org's plan
                if org.plan_tier in module.available_in_plans:
                    org_module, created = OrganizationModule.objects.get_or_create(
                        organization=org,
                        module=module,
                        defaults={'is_active': True}
                    )
                    if created:
                        self.stdout.write(f"✅ Assigned module: {module.name}")
                    else:
                        # Update is_active if necessary
                        if not org_module.is_active:
                            org_module.is_active = True
                            org_module.save()
                            self.stdout.write(f"♻️ Reactivated module: {module.name}")
                else:
                    self.stdout.write(f"⚠️ Skipped module (plan mismatch): {module.name}")

        self.stdout.write(self.style.SUCCESS("\n🎉 All organizations processed!"))
