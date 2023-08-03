import os
import requests as r
from nwmis.settings import BASE_DIR, APP_NAME, MASTER_DATA, APK_UPLOAD_SECRET
from django.test import TestCase
from api.v1.v1_mobile.models import MobileApk


class MobileApkTestCase(TestCase):
    def setUp(self):
        self.apk_url = "https://expo.dev/artifacts/eas/dpRpygo9iviyK8k3oDUMzn.apk"
        self.apk_version = "1.0.0"
        self.mobile_apk = MobileApk.objects.create(
            apk_url=self.apk_url, apk_version=self.apk_version
        )
        self.apk_path = os.path.join(BASE_DIR, MASTER_DATA)

    def test_if_initial_apk_is_created(self):
        mobile_apk = MobileApk.objects.last()
        self.assertEqual(mobile_apk.apk_url, self.apk_url)
        self.assertEqual(mobile_apk.apk_version, self.apk_version)

    def test_if_apk_is_downloadable(self):
        request = r.get(self.apk_url)
        self.assertEqual(request.status_code, 200)

    def test_mobile_apk_download(self):
        download = self.client.get("/api/v1/device/apk/download")
        self.assertEqual(download.status_code, 200)
        self.assertEqual(
            download["Content-Type"], "application/vnd.android.package-archive"
        )
        self.assertEqual(
            download["Content-Disposition"],
            f"attachment; filename={APP_NAME}-{self.mobile_apk.apk_version}.apk",
        )
        self.assertTrue(download.has_header("Content-Length"))
        self.assertTrue(
            os.path.exists(
                f"{self.apk_path}/{APP_NAME}-{self.mobile_apk.apk_version}.apk"
            )
        )

    def test_mobile_apk_upload(self):
        # SUCCESS UPLOAD
        new_version = "1.0.1"
        upload = self.client.post(
            "/api/v1/device/apk/upload",
            {
                "apk_url": self.apk_url,
                "apk_version": new_version,
                "secret": APK_UPLOAD_SECRET,
            },
        )
        self.assertEqual(upload.status_code, 201)
        self.assertTrue(
            os.path.exists(
                f"{self.apk_path}/{APP_NAME}-{self.mobile_apk.apk_version}.apk"
            )
        )

        # NEW VERSION UPLOAD
        download = self.client.get("/api/v1/device/apk/download")
        self.assertEqual(download.status_code, 200)
        self.assertEqual(
            download["Content-Type"], "application/vnd.android.package-archive"
        )
        self.assertEqual(
            download["Content-Disposition"],
            f"attachment; filename={APP_NAME}-{new_version}.apk",
        )

        # FAILED UPLOAD WITH WRONG SECRET
        upload = self.client.post(
            "/api/v1/device/apk/upload",
            {
                "apk_url": self.apk_url,
                "apk_version": "1.0.0",
                "secret": "WRONG_SECRET",
            },
        )
        self.assertEqual(upload.status_code, 400)
        self.assertEqual(upload.data["message"], "Secret is required.")

        # FAILED UPLOAD WITH WRONG APK URL
        upload = self.client.post(
            "/api/v1/device/apk/upload",
            {
                "apk_url": "https://expo.dev/artifacts/eas/ggg.apk",
                "apk_version": "1.0.0",
                "secret": APK_UPLOAD_SECRET,
            },
        )
        self.assertEqual(upload.status_code, 404)
