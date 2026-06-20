from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0010_user_academic_year_user_department'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='position',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
    ]