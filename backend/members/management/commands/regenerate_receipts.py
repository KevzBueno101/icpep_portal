from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from members.models import PaymentTransaction
from members.receipt_generator import generate_receipt_png


class Command(BaseCommand):
    help = 'Regenerate stored e-receipt PNGs with the current receipt layout'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show which receipts would be regenerated without overwriting',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        transactions = PaymentTransaction.objects.filter(receipt_image__isnull=False)
        success = 0
        failed = 0

        for txn in transactions:
            try:
                if dry_run:
                    self.stdout.write(f"[DRY-RUN] Would regenerate {txn.reference_number}")
                    success += 1
                    continue

                bytes_ = generate_receipt_png(txn, txn.member)
                txn.receipt_image.save(
                    f"receipt_{txn.reference_number}.png",
                    ContentFile(bytes_),
                    save=True,
                )
                success += 1
            except Exception as e:
                failed += 1
                self.stderr.write(f"Failed {txn.reference_number}: {e}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Regenerated: {success}, Failed: {failed}"
            )
        )