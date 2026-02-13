# #t acts as a translator. Your Python code speaks "Objects and Functions," and AWS/MinIO speaks "HTTP Requests."
# #  Boto3 handles the translation so you don't have to write raw network code.
# import boto3
# import os
# from botocore.exceptions import NoCredentialsError

# #wrap everything in a class so main.py call it as a service
# class S3Service:
#     def __init__(self):
#         self.endpoint_url = os.getenv("AWS_ENDPOINT_URL", "http://localhost:9000")
#         self.access_key = os.getenv("AWS_ACCESS_KEY_ID", "minioadmin")
#         self.secret_key = os.getenv("AWS_SECRET_ACCESS_KEY", "minioadmin")
#         self.bucket_name = os.getenv("AWS_BUCKET_NAME", "resumes")
#         self.region_name = os.getenv("AWS_REGION", "us-east-1")
#         #we save the connection tool in our instants to use it later
#         self.s3_client = boto3.client(
#             #grab s3 fron boto3 (it has alot of services like lambda)
#             's3', #simple storage service
#             endpoint_url=self.endpoint_url, #we dont want aws service we want the endpoint to be minio
#             aws_access_key_id=self.access_key,
#             aws_secret_access_key=self.secret_key,
#             region_name=self.region_name #aws needs a region minio dont but boto3 will crash if we dont define it this is a dummy region
#         )
#         self.bucket_name = self.bucket_name
#         self._ensure_bucket_exists()
#     def _ensure_bucket_exists(self):
#         try:
#             self.s3_client.head_bucket(Bucket=self.bucket_name)
#         except:
#             try:
#                 self.s3_client.create_bucket(Bucket=self.bucket_name)
#             except Exception as e:
#                 print(f"❌ Failed to create bucket: {e}")
#     def upload_file(self, fileContent: bytes, fileName: str):
#         #upload the file
#         try:
#             self.s3_client.put_object(
#                 Bucket= self.bucket_name, #upload it into our instants bucket
#                 Key= fileName, #filename
#                 Body= fileContent, #file data
#                 ContentType = 'application/pdf' #file type
#             )
#             url = f"http://localhost:9000/{self.bucket_name}/{fileName}"
#             return url 
#         except Exception as e:
#             print(f" Error uploading to S3: {e}")
#             return ""
        
# backend/app/services/s3.py

class S3Service:
    def __init__(self):
        # We don't need keys anymore!
        print("⚠️ RUNNING IN NO-STORAGE MODE. Files will not be saved.")
        pass

    def upload_file(self, file_content, file_name):
        # 1. Pretend to upload
        print(f"Mocking upload for: {file_name}")
        
        # 2. Return a fake URL
        # This prevents the database from crashing when it expects a string
        return f"https://mock-storage.local/{file_name}"