from django.contrib import admin
from django.urls import path, include
from app import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('food-items/', views.get_food_items),
    path('voice/', views.process_voice),
    path('update-quantity/<int:id>/', views.update_quantity),
    path('login/', views.login_user),
    path('signup/', views.signup_user),
    path('logout/<int:user_id>/', views.logout_user),
    path('orders/', views.create_order),
    path('create-order/', views.create_order), # Support both
    path('verify-payment/', views.verify_payment),
    path('user-orders/<int:user_id>/', views.get_user_orders),
    path('orders/<int:user_id>/', views.get_user_orders), # Support both
    path('update-order-status/<str:order_id>/', views.update_order_status),
    path('session-cart/', views.session_cart_operations),
    path('session-cart/<str:session_id>/', views.get_session_cart),
    path('session-cart/clear/<str:session_id>/', views.clear_session_cart),
    path('', views.get_food_items),
]