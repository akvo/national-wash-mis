import random
import string
import jwt
from nwmis.settings import SECRET_KEY
import base64


def generate_random_string(length):
    letters = string.ascii_lowercase
    return "".join(random.choice(letters) for i in range(length))


class CustomJWT():
    def __init__(self):
        pass

    def encode(self, payload):
        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
        return token

    def decode(self, token):
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload


class CustomPasscode():
    def __init__(self):
        pass

    def encode(self, passcode):
        passcode_bytes = passcode.encode('utf-8')
        encoded_passcode = base64.urlsafe_b64encode(passcode_bytes)
        return encoded_passcode.decode('utf-8')

    def decode(self, encoded_passcode):
        passcode_bytes = base64.urlsafe_b64decode(encoded_passcode.encode('utf-8'))
        return passcode_bytes.decode('utf-8')
