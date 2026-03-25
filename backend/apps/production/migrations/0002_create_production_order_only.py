from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('production', '0001_initial'),
        ('inventory', '0012_alter_machine_code'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProductionOrder',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),

                ('quantity', models.PositiveIntegerField()),

                ('operation_name', models.CharField(
                    max_length=200,
                    help_text='e.g., Turning, Welding, Assembly'
                )),

                ('run_time_per_unit_hours', models.DecimalField(
                    decimal_places=4,
                    max_digits=8,
                    default=0
                )),

                ('planned_start', models.DateTimeField(null=True, blank=True)),
                ('planned_end', models.DateTimeField(null=True, blank=True)),

                ('status', models.CharField(
                    max_length=20,
                    default='pending'
                )),

                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),

                ('item', models.ForeignKey(
                    to='inventory.item',
                    on_delete=django.db.models.deletion.PROTECT
                )),

                ('machine', models.ForeignKey(
                    to='inventory.machine',
                    null=True,
                    blank=True,
                    on_delete=django.db.models.deletion.SET_NULL
                )),

                ('production_plan', models.ForeignKey(
                    to='production.productionplan',
                    on_delete=django.db.models.deletion.CASCADE
                )),
            ],
        ),
    ]