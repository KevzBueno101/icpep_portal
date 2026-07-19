import logging
from datetime import date

from django.core.management.base import BaseCommand

from members.models import MemberProfile, PaymentTransaction

logger = logging.getLogger(__name__)


def get_current_academic_year():
    today = date.today()
    if today.month >= 8:
        return f"{today.year}-{today.year + 1}"
    return f"{today.year - 1}-{today.year}"


def generate_ref_number():
    year = date.today().year
    prefix = f"ICPEP-{year}-"
    last_txn = PaymentTransaction.objects.filter(
        reference_number__startswith=prefix
    ).order_by('-reference_number').first()
    if last_txn:
        last_seq = int(last_txn.reference_number.split('-')[-1])
        next_seq = last_seq + 1
    else:
        next_seq = 1
    return f"{prefix}{next_seq:04d}"


class Command(BaseCommand):
    help = 'Backfill PaymentTransaction records for existing members'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be created without actually creating',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        members = MemberProfile.objects.all()
        created_count = 0
        skipped_count = 0

        for member in members:
            existing = PaymentTransaction.objects.filter(member=member).first()
            if existing:
                skipped_count += 1
                continue

            if member.membership_status == MemberProfile.Status.APPROVED:
                transaction_type = 'REGISTRATION'
                status = 'VERIFIED'
            elif member.membership_status in (
                MemberProfile.Status.PENDING,
                MemberProfile.Status.REJECTED,
                MemberProfile.Status.EXPIRED,
            ):
                transaction_type = 'REGISTRATION'
                status = 'PENDING'
            else:
                skipped_count += 1
                continue

            ref_number = generate_ref_number() if not dry_run else f"DRY-RUN-{member.id}"

            if dry_run:
                self.stdout.write(
                    f"[DRY-RUN] Would create {status} {transaction_type} "
                    f"for {member.first_name} {member.last_name} "
                    f"(ref: {ref_number})"
                )
                created_count += 1
                continue

            PaymentTransaction.objects.create(
                member=member,
                transaction_type=transaction_type,
                payment_method=member.payment_method or 'ON_HAND',
                status=status,
                reference_number=ref_number,
                academic_year=get_current_academic_year(),
                approved_by_name='System Backfill',
            )
            created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Created: {created_count}, Skipped (already exists): {skipped_count}"
            )
        )
