import os
import sys

# Add the Backend directory to the path so we can import the project
# Vercel's root is where vercel.json is. api/ is a subdirectory.
current_dir = os.path.dirname(__file__)
backend_dir = os.path.abspath(os.path.join(current_dir, '../Backend'))

if backend_dir not in sys.path:
    sys.path.append(backend_dir)

# Set the settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')

# Import the WSGI application
from django.core.wsgi import get_wsgi_application
app = get_wsgi_application()
