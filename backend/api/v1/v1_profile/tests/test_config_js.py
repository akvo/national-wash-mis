import os
from pathlib import Path
from django.test import TestCase
from nwmis.settings import MASTER_DATA
from django.test.utils import override_settings

from api.v1.v1_profile.management.commands import administration_seeder

config_path = f"{MASTER_DATA}/config/config.min.js"
translation_config_path = f"{MASTER_DATA}/config/i18n.min.js"


@override_settings(USE_TZ=False)
class ConfigJS(TestCase):
    def test_config_generation(self):
        administration_seeder.seed_administration_prod()
        if Path(config_path).exists():
            os.remove(config_path)
        self.assertFalse(Path(config_path).exists())
        self.client.get("/api/v1/config.js", follow=True)
        self.assertTrue(Path(config_path).exists())
        os.remove(config_path)

    def test_config_translation_generation(self):
        if Path(translation_config_path).exists():
            os.remove(translation_config_path)
        self.assertFalse(Path(translation_config_path).exists())
        self.client.get("/api/v1/i18n.js", follow=True)
        self.assertTrue(Path(translation_config_path).exists())
        os.remove(translation_config_path)
