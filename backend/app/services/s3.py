#t acts as a translator. Your Python code speaks "Objects and Functions," and AWS/MinIO speaks "HTTP Requests."
#  Boto3 handles the translation so you don't have to write raw network code.
import boto3
import os
from botocore.exceptions import NoCredentialsError

#wrap everything in a class so main.py call it as a service
class S3Service:
    def __init__(self):
        #we save the connection tool in our instants to use it later
        self.s3_client = boto3.client(
            #grab s3 fron boto3 (it has alot of services like lambda)
            's3', #simple storage service
            endpoint_url='http://minio:9000', #we dont want aws service we want the endpoint to be minio
            aws_access_key_id='user',
            aws_secret_access_key='password',
            region_name='us-east-1' #aws needs a region minio dont but boto3 will crash if we dont define it this is a dummy region
        )
        self.bucket_name = 'resumes'
        self._ensure_bucket_exists()
    def _ensure_bucket_exists(self):
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
        except:
            try:
                self.s3_client.create_bucket(Bucket=self.bucket_name)
            except Exception as e:
                print(f"❌ Failed to create bucket: {e}")
    def upload_file(self, fileContent: bytes, fileName: str):
        #upload the file
        try:
            self.s3_client.put_object(
                Bucket= self.bucket_name, #upload it into our instants bucket
                Key= fileName, #filename
                Body= fileContent, #file data
                ContentType = 'application/pdf' #file type
            )
            url = f"http://localhost:9000/{self.bucket_name}/{fileName}"
            return url 
        except Exception as e:
            print(f"❌ Error uploading to S3: {e}")
            return ""
        

