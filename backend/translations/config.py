# File to add custom config
import enum


class TranslationConfig(dict, enum.Enum):
    burkina_faso = {
        "languages": ["en", "fr"],
        "defaultLang": "en"
    }

    @classmethod
    def choices(cls, key):
        return cls[key].value
