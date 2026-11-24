import os
from typing import Optional
from supabase import create_client, Client

from app.core.config import settings

# Bucket names as defined in AGENTS.md
BUCKET_COVERS = "covers"
BUCKET_PDFS = "pdfs"
BUCKET_CHAPTER_IMAGES = "chapter-images"


class StorageService:
    def __init__(self):
        self._client: Optional[Client] = None

    @property
    def client(self) -> Client:
        if self._client is None:
            if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
                raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.")
            self._client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_ROLE_KEY,
            )
        return self._client

    def upload_file(
        self,
        bucket: str,
        path: str,
        file_bytes: bytes,
        content_type: str,
    ) -> str:
        """
        Uploads a file to a Supabase Storage bucket.
        Returns the public URL if bucket is public, or the path for private buckets.
        """
        response = self.client.storage.from_(bucket).upload(
            path=path,
            file=file_bytes,
            file_options={"content-type": content_type, "upsert": "true"},
        )
        if bucket in (BUCKET_COVERS, BUCKET_CHAPTER_IMAGES):
            return self.get_public_url(bucket, path)
        return path

    def get_public_url(self, bucket: str, path: str) -> str:
        """Generates a public URL for an asset in a public bucket."""
        return f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/public/{bucket}/{path.lstrip('/')}"

    def download_file(self, bucket: str, path: str) -> bytes:
        """Downloads a file's raw bytes from Supabase storage."""
        return self.client.storage.from_(bucket).download(path)

    def delete_file(self, bucket: str, path: str) -> None:
        """Deletes a file from a Supabase Storage bucket."""
        self.client.storage.from_(bucket).remove([path])


storage_service = StorageService()
