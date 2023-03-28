import logging


class ErrorLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = None
        try:
            response = self.get_response(request)
        except Exception as e:
            logging.exception("An error occurred: %s", e)
            raise e
        return response
