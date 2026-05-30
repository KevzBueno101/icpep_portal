from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_add_position'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='term_start',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='is_delegated',
            field=models.BooleanField(
                default=False,
                help_text='If True and position=SECRETARY, can assign Treasurer/Secretary roles.',
            ),
        ),
    ]