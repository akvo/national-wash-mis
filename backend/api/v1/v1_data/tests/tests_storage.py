import os
import uuid
import requests
from utils import storage
from django.test.utils import override_settings
from django.test import TestCase
from django.conf import settings


def generate_file(filename: str, hex: bool = False):
    if hex:
        hex = uuid.uuid4().hex
        filename = f"{filename}-{hex}.txt"
    f = open(filename, "a")
    f.write("This is a test file!")
    f.close()
    return filename


webdomain = os.environ["WEBDOMAIN"]
bucket_folder = "test" if "test" in webdomain else "staging"
if webdomain == "notset":
    bucket_folder = "test"


@override_settings(USE_TZ=False)
class StorageTestCase(TestCase):
    def test_upload(self):
        self.assertFalse(settings.FAKE_STORAGE)
        filename = generate_file("test.txt")
        uploaded_file = storage.upload(file=filename, folder="test")
        self.assertTrue(storage.check(uploaded_file), "File not exists")
        self.assertEqual(uploaded_file, f"{bucket_folder}/test/{filename}")

    def test_upload_with_custom_filename(self):
        self.assertFalse(settings.FAKE_STORAGE)
        custom_filename = "custom-filename-test.txt"
        filename = generate_file("test.txt")
        uploaded_file = storage.upload(file=filename,
                                       filename=custom_filename,
                                       folder="test")
        self.assertTrue(storage.check(uploaded_file), "File not exists")
        self.assertEqual(uploaded_file,
                         f"{bucket_folder}/test/{custom_filename}")

    def test_upload_with_public_access(self):
        self.assertFalse(settings.FAKE_STORAGE)
        filename = generate_file("test-public.txt")
        uploaded_file = storage.upload(file=filename,
                                       public=True,
                                       folder="test")
        storage_path = f"https://storage.googleapis.com/nwmis/{bucket_folder}"
        output_file = "{}/test/{}".format(storage_path, filename)
        self.assertEqual(uploaded_file, output_file)
        response = requests.get(output_file)
        self.assertEqual(response.status_code, 200)
        # Delete
        storage.delete(url=output_file)
        self.assertFalse(storage.check(f"{bucket_folder}/{filename}"),
                         "File is exists")

    def test_download(self):
        self.assertFalse(settings.FAKE_STORAGE)
        filename = generate_file("test.txt")
        uploaded_file = storage.upload(file=filename, folder="test")
        self.assertEqual(uploaded_file, f"{bucket_folder}/test/{filename}")
        downloaded_file = storage.download(f"{bucket_folder}/{filename}")
        self.assertEqual(downloaded_file, f"./tmp/{filename}")
        self.assertTrue(os.path.exists(downloaded_file), "File not exists")
        os.remove(downloaded_file)


@override_settings(FAKE_STORAGE=True)
class DevStorageTestCase(TestCase):
    def test_dev_upload(self):
        self.assertTrue(settings.FAKE_STORAGE)
        filename = generate_file("test.txt", hex=True)
        uploaded_file = storage.upload(file=filename, folder="test")
        self.assertTrue(os.path.exists(f"./tmp/fake_storage/{filename}"),
                        "File not exists")
        self.assertTrue(storage.check(uploaded_file), "File not exists")
        self.assertEqual(uploaded_file, f"./tmp/fake_storage/{filename}")
        os.remove(uploaded_file)
        os.remove(filename)

    def test_dev_download(self):
        self.assertTrue(settings.FAKE_STORAGE)
        filename = generate_file("test.txt", hex=True)
        uploaded_file = storage.upload(file=filename, folder="test")
        self.assertEqual(uploaded_file, f"./tmp/fake_storage/{filename}")
        downloaded_file = storage.download(uploaded_file)
        self.assertEqual(downloaded_file, f"./tmp/fake_storage/{filename}")
        self.assertTrue(os.path.exists(downloaded_file), "File not exists")
        os.remove(downloaded_file)
        os.remove(filename)
