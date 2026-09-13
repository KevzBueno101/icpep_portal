"""Re-host about documents as public `raw` Cloudinary assets.

Documents were historically uploaded with a restricted/authenticated
delivery mode (plain URLs 401). About docs are public information, so this
command migrates each existing document: it downloads the original bytes via
the Cloudinary Admin API (which is credential-based and works regardless of
delivery restrictions), re-uploads them as a public `raw/upload` asset, and
updates the stored field name so document.url resolves to the new URL.

The command is idempotent: a section whose stored name already ends with a
known document extension has already been migrated and is skipped.
"""

import io
import logging
import zipfile

import requests
from cloudinary.exceptions import Error as CloudinaryError
import cloudinary.api
import cloudinary.uploader
from django.conf import settings
from django.core.management.base import BaseCommand

from about.models import AboutSection

logger = logging.getLogger(__name__)

_KNOWN_EXTENSIONS = ('.pdf', '.png', '.jpg', '.jpeg')
_RESOURCE_TYPES = ('image', 'raw', 'video')

_DOWNLOAD_URL = 'https://api.cloudinary.com/v1_1/{cloud}/{resource_type}/download'


class Command(BaseCommand):
    help = 'Migrate about documents to public raw Cloudinary delivery.'

    def handle(self, *args, **options):
        storage = getattr(settings, 'CLOUDINARY_STORAGE', None)
        if not storage:
            self.stdout.write('Cloudinary not configured — skipping about document migration.')
            return

        cloud_name = storage.get('CLOUD_NAME')
        auth = (storage.get('API_KEY'), storage.get('API_SECRET'))
        if not all((cloud_name, auth[0], auth[1])):
            self.stdout.write('Incomplete Cloudinary config — skipping about document migration.')
            return

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
        resource_type, asset_type = self._find_existing(public_id)
        if not resource_type:
            logger.warning('No existing asset found for %s — leaving as-is.', public_id)
            return False

        zip_bytes = self._download(public_id, resource_type, asset_type, cloud_name, auth)
        if zip_bytes is None:
            return False

        data, extension = self._extract_original(public_id, zip_bytes)
        if data is None:
            return False

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
                return resource_type, info.get('type') or 'upload'
            except CloudinaryError:
                continue
        return None, None

    def _download(self, public_id, resource_type, asset_type, cloud_name, auth):
        url = _DOWNLOAD_URL.format(cloud=cloud_name, resource_type=resource_type)
        try:
            resp = requests.get(
                url,
                params={
                    'public_ids': public_id,
                    'type': asset_type,
                    'derived': 'false',
                },
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

    @staticmethod
    def _extract_original(public_id, zip_bytes):
        try:
            with zipfile.ZipFile(io.BytesIO(zip_bytes)) as archive:
                entries = [n for n in archive.namelist() if not n.endswith('/')]
                if not entries:
                    logger.error('Downloaded zip has no files for %s', public_id)
                    return None, None

                base = public_id.rsplit('/', 1)[-1]
                matches = [n for n in entries if n.rsplit('/', 1)[-1].startswith(base)]
                if not matches:
                    logger.error('Zip has no entry matching %s (entries: %s)', public_id, entries)
                    return None, None

                def has_known_ext(name):
                    return name.lower().endswith(_KNOWN_EXTENSIONS)

                chosen = next((m for m in matches if has_known_ext(m)), matches[0])
                data = archive.read(chosen)

            name = chosen.rsplit('/', 1)[-1]
            extension = ''
            for ext in _KNOWN_EXTENSIONS:
                if name.lower().endswith(ext):
                    extension = ext
                    break
            return data, extension
        except (zipfile.BadZipFile, KeyError) as exc:
            logger.error('Failed to extract %s: %s', public_id, exc)
            return None, None