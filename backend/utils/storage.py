import os
from pathlib import Path
import shutil


def upload(file: str, folder: str = None, filename: str = None):
    storage_location = "./storage"
    if folder:
        # create folder if not exists
        Path(f"{storage_location}/{folder}").mkdir(parents=True, exist_ok=True)
        storage_location = f"{storage_location}/{folder}"
    if not filename:
        filename = file.split("/")[-1]
    location = f"{storage_location}/{filename}"
    shutil.copy2(file, location)
    return location


def delete(url: str):
    os.remove(f"./storage/{url}")
    return url


def check(url: str):
    path = Path(f"./storage/{url}")
    return path.is_file()


def download(url):
    # copy to tmp folder
    tmp_file = url.split("/")[-1]
    tmp_file = f"./tmp/{tmp_file}"
    shutil.copy2(f"./storage/{url}", tmp_file)
    return f"./storage/{url}"
