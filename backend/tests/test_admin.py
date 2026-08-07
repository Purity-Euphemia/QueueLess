import uuid
import unittest
from app import app
from database import create_tables
from services.auth_service import register_user, generate_auth_token


class AdminTestCase(unittest.TestCase):

    def setUp(self):
        create_tables()
        self.client = app.test_client()

        # Create admin user & token with unique email
        email = f"admin_{uuid.uuid4().hex}@test.com"
        auth_res = register_user("Admin User", email, "admin123", role="admin")
        self.admin_user = auth_res["user"]
        self.token = generate_auth_token(self.admin_user["id"], role="admin")

        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    def test_call_next_and_now_serving(self):
        # Create queue
        q_res = self.client.post("/queues", json={"name": "Admin Test Queue", "service": "Support"})
        self.assertEqual(q_res.status_code, 201)
        queue_id = q_res.get_json()["queue"]["id"]

        # Join customer
        join_res = self.client.post(f"/queues/{queue_id}/join", json={"name": "Bob"})
        self.assertEqual(join_res.status_code, 201)
        ticket_number = join_res.get_json()["ticket_number"]

        # Call next person as admin
        next_res = self.client.post(f"/admin/queues/{queue_id}/next", headers=self.headers)
        self.assertEqual(next_res.status_code, 200)
        self.assertEqual(next_res.get_json()["member"]["ticket_number"], ticket_number)

        # Verify now_serving endpoint returns ticket_number
        now_serving_res = self.client.get(f"/queues/{queue_id}/now-serving")
        self.assertEqual(now_serving_res.status_code, 200)
        self.assertEqual(now_serving_res.get_json()["now_serving"], ticket_number)

        # Serve person
        serve_res = self.client.post(f"/admin/queues/{queue_id}/serve", headers=self.headers)
        self.assertEqual(serve_res.status_code, 200)

        # Verify now_serving is now None
        now_serving_after = self.client.get(f"/queues/{queue_id}/now-serving")
        self.assertIsNone(now_serving_after.get_json()["now_serving"])


if __name__ == "__main__":
    unittest.main()
