import logging
import datetime


class ErrorLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = None
        try:
            response = self.get_response(request)
        except Exception as e:
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            logging.exception("%s : ERROR %s", timestamp, e)
        return response
