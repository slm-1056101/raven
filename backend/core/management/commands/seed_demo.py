from django.core.management.base import BaseCommand

from core.models import Company, CompanyMembership, User


class Command(BaseCommand):
    help = 'Seed demo data for the suwokono UI (companies + users).'

    def handle(self, *args, **options):
        demo_password = 'suwokono123'

        # delka, _ = Company.objects.get_or_create(
        #     name='Delka',
        #     defaults={
        #         'description': 'Demo company',
        #         'logo': '🏢',
        #         'primary_color': '#2563EB',
        #         'status': Company.Status.ACTIVE,
        #         'contact_email': 'info@delka.test',
        #     },
        # )

        super_user, _ = User.objects.get_or_create(
            email='superadmin@suwokono.com',
            defaults={
                'name': 'System Administrator',
                'role': User.Role.SUPER_ADMIN,
                'status': User.Status.ACTIVE,
                'is_staff': True,
                'is_superuser': True,
            },
        )
        super_user.set_password(demo_password)
        super_user.save(update_fields=['password'])

        # admin_user, _ = User.objects.get_or_create(
        #     email='admin@delka.com',
        #     defaults={
        #         'name': 'Delka Admin',
        #         'role': User.Role.ADMIN,
        #         'status': User.Status.ACTIVE,
        #         'company': delka,
        #     },
        # )
        # admin_user.company = delka
        # admin_user.set_password(demo_password)
        # admin_user.save(update_fields=['company', 'password'])
        # CompanyMembership.objects.get_or_create(user=admin_user, company=delka)

        # client_user, _ = User.objects.get_or_create(
        #     email='client@delka.test',
        #     defaults={
        #         'name': 'Delka Client',
        #         'role': User.Role.CLIENT,
        #         'status': User.Status.ACTIVE,
        #         'company': delka,
        #     },
        # )
        # client_user.company = delka
        # client_user.set_password(demo_password)
        # client_user.save(update_fields=['company', 'password'])
        # CompanyMembership.objects.get_or_create(user=client_user, company=delka)

        self.stdout.write(self.style.SUCCESS('Seeded demo data.'))
        self.stdout.write(self.style.SUCCESS(f'Demo password: {demo_password}'))
