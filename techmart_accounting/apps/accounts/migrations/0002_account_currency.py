# Generated migration for adding currency field to Account model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='account',
            name='currency',
            field=models.CharField(
                choices=[('UZS', 'Uzbek Som'), ('RUB', 'Russian Ruble'), ('USD', 'US Dollar')],
                default='UZS',
                help_text='Currency for this account (UZS, RUB, USD).',
                max_length=3
            ),
        ),
    ]
