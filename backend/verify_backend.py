import sys
sys.path.insert(0, 'backend')
from app.main import app
from app.services.sanitizer import sanitize_html

openapi_schema = app.openapi()
paths = list(openapi_schema['paths'].keys())
print(f"Total endpoints registered: {len(paths)}")
for p in sorted(paths):
    print(f"  {p}")

required_endpoints = [
    '/api/auth/google',
    '/api/auth/staff/login',
    '/api/auth/staff/verify-otp',
    '/api/auth/staff/refresh',
    '/api/auth/staff/forgot-password',
    '/api/auth/staff/reset-password',
    '/api/auth/logout',
    '/api/auth/me',
    '/api/novels',
    '/api/novels/{slug}',
    '/api/novels/{slug}/chapters',
    '/api/novels/{slug}/ratings',
    '/api/chapters/{id}',
    '/api/chapters/{id}/comments',
    '/api/chapters/upload-image',
    '/api/chapters/upload-pdf',
    '/api/chapters/pdf-jobs/{job_id}',
    '/api/bookmarks',
    '/api/bookmarks/{novel_id}',
    '/api/histories',
    '/api/follows/{novel_id}',
    '/api/notifications',
    '/api/profile',
    '/api/profile/avatar',
    '/api/novelis/dashboard',
    '/api/admin/stats',
    '/api/admin/users',
    '/api/admin/comments',
    '/api/admin/genres',
    '/api/admin/tags'
]

for req in required_endpoints:
    assert req in paths, f"Missing required endpoint: {req}"

print("\n--- ALL REQUIRED ENDPOINTS VERIFIED ---")

# Test sanitizer
test_html = '<h1 style="text-align: center;">Judul</h1><p style="text-align: justify; color: red;">Teks <script>alert(1)</script><img src="https://xyz.supabase.co/storage/v1/object/public/chapter-images/test.jpg" onload="alert(1)"></p>'
clean = sanitize_html(test_html)
print(f"Sanitizer input:  {test_html}")
print(f"Sanitizer output: {clean}")

assert '<script>' not in clean, "Script tag not removed"
assert 'onload' not in clean, "onload attribute not removed"
assert 'text-align: center' in clean, "Allowed text-align center missing"
assert 'text-align: justify' in clean, "Allowed text-align justify missing"
assert 'color: red' not in clean, "Disallowed color CSS property not removed"

print("\n--- SANITIZER CONTRACT VERIFIED ---")
print("ALL BACKEND VERIFICATIONS SUCCEEDED!")
