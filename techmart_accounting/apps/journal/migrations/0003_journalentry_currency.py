# Generated migration for adding currency field to JournalEntry model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('journal', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='journalentry',
            name='currency',
            field=models.CharField(
                choices=[('UZS', 'Uzbek Som'), ('RUB', 'Russian Ruble'), ('USD', 'US Dollar')],
                default='UZS',
                help_text='Currency for this journal entry (UZS, RUB, USD).',
                max_length=3
            ),
        ),
    ]
