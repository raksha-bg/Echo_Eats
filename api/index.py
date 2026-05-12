import os
import sys

# Ensure the Backend directory is in the path
current_dir = os.path.dirname(__file__)
backend_parent = os.path.abspath(os.path.join(current_dir, '..'))
backend_dir = os.path.join(backend_parent, 'Backend')

if backend_dir not in sys.path:
    sys.path.append(backend_dir)
if backend_parent not in sys.path:
    sys.path.append(backend_parent)

# Set the settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')

# Import the WSGI application
try:
    from django.core.wsgi import get_wsgi_application
    app = get_wsgi_application()
except Exception as e:
    print(f"Error loading Django application: {e}")
    # Fallback to a simple error app for debugging if needed
    def app(environ, start_response):
        start_response('500 Internal Server Error', [('Content-Type', 'text/plain')])
        return [f"Error: {str(e)}".encode()]
