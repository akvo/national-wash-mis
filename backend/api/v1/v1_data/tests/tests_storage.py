import os
import uuid
from utils import storage
from django.test.utils import override_settings
from django.test import TestCase


def generate_file(filename: str, hex: bool = False):
    if hex:
        hex = uuid.uuid4().hex
        filename = f"{filename}-{hex}.txt"
    f = open(filename, "a")
    f.write("This is a test file!")
    f.close()
    return filename


@override_settings(USE_TZ=False)
class StorageTestCase(TestCase):
    def test_upload(self):
        filename = generate_file("test", hex=True)
        uploaded_file = storage.upload(file=filename, folder="test")
        self.assertTrue(os.path.exists(f"./storage/test/{filename}"), "File not exists")
        self.assertTrue(storage.check(uploaded_file), "File not exists")
        self.assertEqual(uploaded_file, f"./storage/test/{filename}")
        os.remove(filename)

    def test_upload_with_custom_filename(self):
        custom_filename = "custom-filename-test.txt"
        filename = generate_file("test")
        uploaded_file = storage.upload(
            file=filename, filename=custom_filename, folder="test"
        )
        self.assertTrue(storage.check(uploaded_file), "File not exists")
        self.assertEqual(uploaded_file, f"./storage/test/{custom_filename}")
        os.remove(filename)

    def test_download(self):
        filename = generate_file("test", hex=True)
        uploaded_file = storage.upload(file=filename, folder="test")
        self.assertEqual(uploaded_file, f"./storage/test/{filename}")
        downloaded_file = storage.download(uploaded_file)
        self.assertEqual(downloaded_file, f"./storage/test/{filename}")
        self.assertTrue(os.path.exists(downloaded_file), "File not exists")
        os.remove(downloaded_file)
        os.remove(filename)
