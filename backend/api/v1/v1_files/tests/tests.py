import uuid
import os
from django.test import TestCase
from django.core.management import call_command
from uuid import uuid4
from utils import storage


def generate_image(filename: str, extension: str = "jpg"):
    filename = f"{filename}-{uuid.uuid4().hex}.{extension}"
    f = open(filename, "a")
    f.write("This is a test file!")
    f.close()
    return filename


class ImageUploadTest(TestCase):
    def setUp(self):
        call_command("administration_seeder", "--test")
        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        user_response = self.client.post(
            "/api/v1/login", user_payload, content_type="application/json"
        )
        self.token = user_response.json().get("token")

    def test_image_upload(self):
        filename = generate_image(filename="test", extension="png")
        response = self.client.post(
            "/api/v1/upload/images/",
            {"file": open(filename, "rb")},
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(list(response.json()), ["task_id"])
        self.assertFalse(
            os.path.exists(f"./storage/images/{filename}"),
            "File exists before job is running",
        )
        # run the job
        storage.upload(
            filename,
            "images",
        )
        self.assertTrue(
            os.path.exists(f"./storage/images/{filename}"),
            "File does not exist after job is running",
        )
        os.remove(f"./storage/images/{filename}")
        os.remove(filename)
