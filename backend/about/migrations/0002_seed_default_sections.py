from django.db import migrations

SECTIONS = [
    {
        'section_type': 'MISSION',
        'title': 'Our Mission',
        'body': (
            'To provide a platform for student computer engineers to nurture '
            'technical skills, professional integrity, and academic excellence, '
            'preparing them for industrial challenges and global leadership.'
        ),
        'display_order': 0,
    },
    {
        'section_type': 'VISION',
        'title': 'Our Vision',
        'body': (
            'To be the premier student organization producing innovative, '
            'ethically responsible, and globally competent computer engineering '
            'practitioners who drive technological advancements for community '
            'welfare.'
        ),
        'display_order': 1,
    },
    {
        'section_type': 'CUSTOM',
        'title': 'Core Values',
        'body': (
            'Innovation & Creativity\n'
            'Professional Integrity\n'
            'Collaborative Unity\n'
            'Social Responsibility'
        ),
        'display_order': 2,
    },
]


def seed_about_sections(apps, schema_editor):
    AboutSection = apps.get_model('about', 'AboutSection')
    if not AboutSection.objects.exists():
        AboutSection.objects.bulk_create(
            AboutSection(
                section_type=item['section_type'],
                title=item['title'],
                body=item['body'],
                display_order=item['display_order'],
                is_published=True,
            )
            for item in SECTIONS
        )


def remove_about_sections(apps, schema_editor):
    AboutSection = apps.get_model('about', 'AboutSection')
    AboutSection.objects.filter(section_type__in=[i['section_type'] for i in SECTIONS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('about', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_about_sections, remove_about_sections),
    ]