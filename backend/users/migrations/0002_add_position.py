from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='position',
            field=models.CharField(
                choices=[
                    ('NONE',      'None'),
                    ('PRESIDENT', 'President'),
                    ('TREASURER', 'Treasurer'),
                    ('SECRETARY', 'Secretary'),
                ],
                default='NONE',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
    ]