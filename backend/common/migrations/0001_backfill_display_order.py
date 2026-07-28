from django.db import migrations


def backfill_announcement_order(apps, schema_editor):
    Announcement = apps.get_model('announcements', 'Announcement')
    for idx, a in enumerate(
        Announcement.objects.order_by('-created_at').values_list('id', flat=True)
    ):
        Announcement.objects.filter(pk=a).update(display_order=idx)


def backfill_milestone_order(apps, schema_editor):
    Milestone = apps.get_model('milestones', 'Milestone')
    for idx, m in enumerate(
        Milestone.objects.order_by('-date', '-created_at').values_list('id', flat=True)
    ):
        Milestone.objects.filter(pk=m).update(display_order=idx)


def backfill_user_order(apps, schema_editor):
    User = apps.get_model('users', 'User')
    for idx, u in enumerate(
        User.objects.filter(role__in=['OFFICER', 'ADMIN'])
        .exclude(position='')
        .exclude(position__iexact='NONE')
        .order_by('position', 'email')
        .values_list('id', flat=True)
    ):
        User.objects.filter(pk=u).update(display_order=idx)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('announcements', '0004_alter_announcement_options_and_more'),
        ('milestones', '0003_alter_milestone_options_milestone_display_order'),
        ('users', '0017_user_display_order'),
    ]

    operations = [
        migrations.RunPython(backfill_announcement_order, noop),
        migrations.RunPython(backfill_milestone_order, noop),
        migrations.RunPython(backfill_user_order, noop),
    ]
