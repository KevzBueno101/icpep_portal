from django.db import migrations


def backfill_officer_ids(apps, schema_editor):
    User = apps.get_model('users', 'User')
    prefix = 'ICPEP-'
    max_num = 0
    existing = User.objects.filter(officer_id__startswith=prefix).values_list('officer_id', flat=True)
    for oid in existing:
        try:
            num = int(oid[len(prefix):])
            if num > max_num:
                max_num = num
        except (ValueError, IndexError):
            pass

    next_num = max_num + 1
    users_to_update = list(User.objects.filter(officer_id__isnull=True).order_by('id'))
    for user in users_to_update:
        user.officer_id = f'{prefix}{next_num:04d}'
        next_num += 1

    User.objects.bulk_update(users_to_update, fields=['officer_id'])


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0013_user_officer_id'),
    ]

    operations = [
        migrations.RunPython(backfill_officer_ids, reverse_code=migrations.RunPython.noop),
    ]
