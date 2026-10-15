from django.db import migrations, models


def _migrate_signatories(apps, schema_editor):
    CertificateDesign = apps.get_model('certificates', 'CertificateDesign')
    for design in CertificateDesign.objects.all():
        signatories = []
        if design.signatory_name or design.signatory_position:
            signatories.append({
                'name': design.signatory_name or '',
                'position': design.signatory_position or '',
                'signature_url': design.signature_image.url if design.signature_image else '',
            })
        if design.second_signatory_name or design.second_signatory_position:
            signatories.append({
                'name': design.second_signatory_name or '',
                'position': design.second_signatory_position or '',
                'signature_url': '',
            })
        if signatories:
            design.signatories = signatories
            design.save(update_fields=['signatories'])


class Migration(migrations.Migration):

    dependencies = [
        ("certificates", "0003_certificatedesign_header_college_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="certificatedesign",
            name="signatories",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text="List of {name, position, signature_url} signatory entries.",
            ),
        ),
        migrations.RunPython(_migrate_signatories, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="certificatedesign",
            name="second_signatory_name",
        ),
        migrations.RemoveField(
            model_name="certificatedesign",
            name="second_signatory_position",
        ),
        migrations.RemoveField(
            model_name="certificatedesign",
            name="signatory_name",
        ),
        migrations.RemoveField(
            model_name="certificatedesign",
            name="signatory_position",
        ),
        migrations.RemoveField(
            model_name="certificatedesign",
            name="signature_image",
        ),
    ]
