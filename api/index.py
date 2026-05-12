import os
import sys
from django.core.wsgi import get_wsgi_application

# Ensure the Backend directory is in the path
current_dir = os.path.dirname(__file__)
backend_dir = os.path.abspath(os.path.join(current_dir, '../Backend'))

if backend_dir not in sys.path:
    sys.path.append(backend_dir)

# Set the settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')

# This is the entry point Vercel is looking for
app = get_wsgi_application()
