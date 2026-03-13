import boto3
import os
from botocore.exceptions import ClientError
from tenacity import retry, stop_after_attempt, wait_exponential
from app.logging_config import logger


class S3Service:
    def __init__(self):
        self.endpoint_url = os.getenv("AWS_ENDPOINT_URL", "http://localhost:9000")
        self.access_key = os.getenv("AWS_ACCESS_KEY_ID", "minioadmin")
        self.secret_key = os.getenv("AWS_SECRET_ACCESS_KEY", "minioadmin")
        self.bucket_name = os.getenv("AWS_BUCKET_NAME", "resumes")
        self.region_name = os.getenv("AWS_REGION", "us-east-1")
        self.is_available = False

        try:
            self.s3_client = boto3.client(
                "s3",
                endpoint_url=self.endpoint_url,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                region_name=self.region_name,
                config=boto3.session.Config(
                    connect_timeout=5,
                    retries={"max_attempts": 2},
                ),
            )
            # Try to ensure bucket exists but don't fail initialization
            try:
                self._ensure_bucket_exists()
                self.is_available = True
                logger.info("S3/MinIO service initialized successfully")
            except Exception as bucket_error:
                # Bucket initialization failed but S3 client exists
                logger.warning(f"Could not verify bucket on startup: {bucket_error}")
                # Try to use S3 anyway - bucket may be created on first upload
                self.is_available = True

        except Exception as e:
            logger.error(f" S3/MinIO service unavailable: {e}")
            self.is_available = False

    def _ensure_bucket_exists(self):
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            logger.info(f"Bucket '{self.bucket_name}' exists")
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "404":
                try:
                    self.s3_client.create_bucket(Bucket=self.bucket_name)
                    logger.info(f"Created bucket '{self.bucket_name}'")
                except Exception as create_error:
                    logger.error(f"Failed to create bucket: {create_error}")
            else:
                logger.error(f"Error checking bucket: {e}")
        except Exception as e:
            logger.error(f"Failed to ensure bucket exists: {e}")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        reraise=True,
    )
    def _upload_with_retry(self, file_content: bytes, file_name: str):
        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=file_name,
            Body=file_content,
            ContentType="application/pdf",
        )
        return f"{self.endpoint_url}/{self.bucket_name}/{file_name}"

    def upload_file(self, file_content: bytes, file_name: str) -> str:
        if not self.is_available:
            logger.error(f"S3 unavailable — skipping upload for: {file_name}")
            return f"https://mock-storage.local/{file_name}"

        try:
            url = self._upload_with_retry(file_content, file_name)
            logger.info(f"File uploaded successfully: {url}")
            return url

        except Exception as e:
            logger.error(
                f"All upload attempts failed for {file_name}: {e}", exc_info=True
            )
            return f"https://mock-storage.local/{file_name}"
