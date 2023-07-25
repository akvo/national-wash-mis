import random
import string
import jwt
from nwmis.settings import SECRET_KEY


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
