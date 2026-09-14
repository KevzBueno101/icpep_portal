"""Re-host about documents as raw Cloudinary delivery assets.

The Cloudinary account has an ACL that blocks all direct delivery (signed or
unsigned), but the credentialed Admin API works. This command migrates each
existing document: it downloads the original bytes via the Admin Download API,
re-uploads them as a `raw/upload` asset with a proper file extension, and
updates the stored field name so the backend byte-proxy (which fetches through
the Admin API) can serve them.

The command is idempotent: a section whose stored name already ends with a
known document extension has already been migrated and is skipped.
"""

import io
import logging

import cloudinary.api
import cloudinary.uploader
import requests
from cloudinary.exceptions import Error as CloudinaryError
from django.conf import settings
from django.core.management.base import BaseCommand

from about.models import AboutSection

logger = logging.getLogger(__name__)

_KNOWN_EXTENSIONS = ('.pdf', '.png', '.jpg', '.jpeg')
_RESOURCE_TYPES = ('image', 'raw', 'video')

_DOWNLOAD_URL = 'https://api.cloudinary.com/v1_1/{cloud}/{resource_type}/download'


class Command(BaseCommand):
    help = 'Migrate about documents to raw Cloudinary storage with working delivery.'

    def handle(self, *args, **options):
        storage = getattr(settings, 'CLOUDINARY_STORAGE', None)
        if not storage:
            self.stdout.write('Cloudinary not configured — skipping about document migration.')
            return

        cloud_name = storage.get('CLOUD_NAME')
        api_key = storage.get('API_KEY')
        api_secret = storage.get('API_SECRET')
        if not all((cloud_name, api_key, api_secret)):
            self.stdout.write('Incomplete Cloudinary config — skipping about document migration.')
            return

        auth = (api_key, api_secret)
        sections = AboutSection.objects.exclude(document='')
        migrated = 0
        failed = 0
        skipped = 0

        for section in sections:
            public_id = section.document.name
            if not public_id:
                continue
            if public_id.lower().endswith(_KNOWN_EXTENSIONS):
                skipped += 1
                continue

            self.stdout.write(f'Migrating document on section {section.id} ({public_id})...')
            outcome = self._migrate_one(section, public_id, cloud_name, auth)
            if outcome is True:
                migrated += 1
            else:
                failed += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'About document migration complete: {migrated} migrated, {failed} failed, {skipped} already migrated.'
            )
        )

    def _migrate_one(self, section, public_id, cloud_name, auth):
        resource_type, asset_type, file_format = self._find_existing(public_id)
        if not resource_type:
            logger.warning('No existing asset found for %s — leaving as-is.', public_id)
            return False

        data = self._download(public_id, resource_type, cloud_name, auth)
        if data is None:
            return False

        base_name = public_id.rsplit('/', 1)[-1]
        extension = ''
        for ext in _KNOWN_EXTENSIONS:
            if base_name.lower().endswith(ext):
                extension = ext
                break
        if not extension and file_format:
            ext_map = {
                'pdf': '.pdf',
                'png': '.png',
                'jpg': '.jpg',
                'jpeg': '.jpeg',
                'gif': '.gif',
                'webp': '.webp',
            }
            extension = ext_map.get(file_format.lower(), f'.{file_format.lower()}')

        new_public_id = public_id + extension if extension and not public_id.lower().endswith(extension.lower()) else public_id
        try:
            cloudinary.uploader.upload(
                io.BytesIO(data),
                resource_type='raw',
                type='upload',
                public_id=new_public_id,
                overwrite=True,
            )
        except CloudinaryError as exc:
            logger.error('Raw upload failed for %s: %s', public_id, exc)
            return False

        if section.document.name != new_public_id:
            section.document.name = new_public_id
            section.save(update_fields=['document'])
        self.stdout.write(
            self.style.SUCCESS(f'  -> re-uploaded as raw/upload/{new_public_id}')
        )
        return True

    def _find_existing(self, public_id):
        for resource_type in _RESOURCE_TYPES:
            try:
                info = cloudinary.api.resource(public_id, resource_type=resource_type)
                return resource_type, info.get('type') or 'upload', info.get('format')
            except CloudinaryError:
                continue
        return None, None, None

    def _download(self, public_id, resource_type, cloud_name, auth):
        url = _DOWNLOAD_URL.format(cloud=cloud_name, resource_type=resource_type)
        try:
            resp = requests.get(
                url,
                params={'public_id': public_id, 'type': 'upload', 'derived': 'false'},
                auth=auth,
                timeout=120,
            )
        except requests.RequestException as exc:
            logger.error('Download request failed for %s: %s', public_id, exc)
            return None
        if resp.status_code != 200:
            logger.error('Download HTTP %s for %s', resp.status_code, public_id)
            return None
        return resp.content