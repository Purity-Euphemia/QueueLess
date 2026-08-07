import uuid
import unittest
from app import app
from database import create_tables
from services.auth_service import register_user, generate_auth_token


class AuthTestCase(unittest.TestCase):

    def setUp(self):
        create_tables()
        self.client = app.test_client()

    # ============================================
    # SIGN UP / REGISTRATION TESTS
    # ============================================

    def test_register_user_success(self):
        email = f"user_{uuid.uuid4().hex}@example.com"
        response = self.client.post("/auth/register", json={
            "name": "Jane Doe",
            "email": email,
            "password": "securepassword123"
        })
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertEqual(data["message"], "Account created successfully.")
        self.assertIn("token", data)
        self.assertEqual(data["user"]["name"], "Jane Doe")
        self.assertEqual(data["user"]["email"], email)

    def test_register_user_duplicate_email(self):
        email = f"user_{uuid.uuid4().hex}@example.com"
        # First registration
        self.client.post("/auth/register", json={
            "name": "Jane Doe",
            "email": email,
            "password": "password123"
        })

        # Second registration with same email
        response = self.client.post("/auth/register", json={
            "name": "Jane Smith",
            "email": email,
            "password": "password456"
        })
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn("error", data)
        self.assertEqual(data["error"], "An account with that email already exists.")

    def test_register_user_missing_fields(self):
        # Missing name
        res1 = self.client.post("/auth/register", json={
            "email": "test@example.com",
            "password": "password123"
        })
        self.assertEqual(res1.status_code, 400)

        # Missing email
        res2 = self.client.post("/auth/register", json={
            "name": "Test User",
            "password": "password123"
        })
        self.assertEqual(res2.status_code, 400)

        # Missing password
        res3 = self.client.post("/auth/register", json={
            "name": "Test User",
            "email": "test@example.com"
        })
        self.assertEqual(res3.status_code, 400)

    # ============================================
    # LOG IN TESTS
    # ============================================

    def test_login_success(self):
        email = f"login_{uuid.uuid4().hex}@example.com"
        password = "mysecretpassword"

        # Register user
        register_user("Login User", email, password)

        # Attempt login
        response = self.client.post("/auth/login", json={
            "email": email,
            "password": password
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["message"], "Login successful.")
        self.assertIn("token", data)
        self.assertEqual(data["user"]["email"], email)

    def test_login_invalid_password(self):
        email = f"login_{uuid.uuid4().hex}@example.com"
        register_user("Login User", email, "correct_password")

        response = self.client.post("/auth/login", json={
            "email": email,
            "password": "wrong_password"
        })
        self.assertEqual(response.status_code, 401)
        data = response.get_json()
        self.assertEqual(data["error"], "Invalid email or password.")

    def test_login_nonexistent_email(self):
        response = self.client.post("/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "somepassword"
        })
        self.assertEqual(response.status_code, 401)
        data = response.get_json()
        self.assertEqual(data["error"], "Invalid email or password.")

    def test_login_missing_fields(self):
        res1 = self.client.post("/auth/login", json={"email": "test@example.com"})
        self.assertEqual(res1.status_code, 400)

        res2 = self.client.post("/auth/login", json={"password": "password123"})
        self.assertEqual(res2.status_code, 400)

    # ============================================
    # RESET PASSWORD TESTS
    # ============================================

    def test_request_password_reset_success(self):
        email = f"reset_{uuid.uuid4().hex}@example.com"
        register_user("Reset User", email, "oldpassword123")

        response = self.client.post("/auth/reset-password", json={"email": email})
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn("reset_token", data)
        self.assertEqual(data["message"], "Password reset token generated.")

    def test_request_password_reset_nonexistent_email(self):
        response = self.client.post("/auth/reset-password", json={"email": "nobody@example.com"})
        self.assertEqual(response.status_code, 404)
        data = response.get_json()
        self.assertEqual(data["error"], "No account found with that email.")

    def test_confirm_reset_password_success(self):
        email = f"confirm_reset_{uuid.uuid4().hex}@example.com"
        user_res = register_user("Confirm User", email, "oldpassword123")
        user_id = user_res["user"]["id"]

        # Request reset token
        reset_req = self.client.post("/auth/reset-password", json={"email": email})
        reset_token = reset_req.get_json()["reset_token"]

        # Confirm password reset
        confirm_res = self.client.post("/auth/reset-password/confirm", json={
            "token": reset_token,
            "password": "brandnewpassword123"
        })
        self.assertEqual(confirm_res.status_code, 200)

        # Login with new password
        login_res = self.client.post("/auth/login", json={
            "email": email,
            "password": "brandnewpassword123"
        })
        self.assertEqual(login_res.status_code, 200)

    def test_confirm_reset_password_invalid_token(self):
        response = self.client.post("/auth/reset-password/confirm", json={
            "token": "invalid.jwt.token",
            "password": "newpassword123"
        })
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn("error", data)

    # ============================================
    # PROFILE & PASSWORD CHANGE TESTS
    # ============================================

    def test_get_and_update_profile(self):
        email = f"profile_{uuid.uuid4().hex}@example.com"
        reg = register_user("Profile User", email, "password123")
        token = reg["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Get profile
        get_res = self.client.get("/auth/profile", headers=headers)
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.get_json()["user"]["name"], "Profile User")

        # Update profile
        new_email = f"updated_{uuid.uuid4().hex}@example.com"
        put_res = self.client.put("/auth/profile", headers=headers, json={
            "name": "Updated Name",
            "email": new_email
        })
        self.assertEqual(put_res.status_code, 200)
        self.assertEqual(put_res.get_json()["user"]["name"], "Updated Name")
        self.assertEqual(put_res.get_json()["user"]["email"], new_email)

    def test_change_password(self):
        email = f"pwdchange_{uuid.uuid4().hex}@example.com"
        reg = register_user("Pwd User", email, "original_pass")
        token = reg["token"]
        headers = {"Authorization": f"Bearer {token}"}

        change_res = self.client.post("/auth/password-change", headers=headers, json={
            "old_password": "original_pass",
            "new_password": "new_strong_pass"
        })
        self.assertEqual(change_res.status_code, 200)

        # Login with new password
        login_res = self.client.post("/auth/login", json={
            "email": email,
            "password": "new_strong_pass"
        })
        self.assertEqual(login_res.status_code, 200)


if __name__ == "__main__":
    unittest.main()
