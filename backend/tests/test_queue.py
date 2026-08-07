import unittest

from app import app


class QueueLessTestCase(
    unittest.TestCase
):

    def setUp(self):

        self.client = (
            app.test_client()
        )


    def test_home_route(self):

        response = (
            self.client.get("/")
        )

        self.assertEqual(
            response.status_code,
            200
        )


    def test_get_queues(self):
        response = self.client.get("/queues")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn("queues", data)
        for queue in data["queues"]:
            self.assertIn("now_serving", queue)

    def test_now_serving_endpoint(self):
        # Create queue
        create_res = self.client.post("/queues", json={
            "name": "Test Counter",
            "service": "Banking"
        })
        self.assertEqual(create_res.status_code, 201)
        queue_id = create_res.get_json()["queue"]["id"]

        # Fetch now-serving for new queue
        response = self.client.get(f"/queues/{queue_id}/now-serving")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["queue_id"], queue_id)
        self.assertIsNone(data["now_serving"])

        # Join queue
        join_res = self.client.post(f"/queues/{queue_id}/join", json={"name": "Alice"})
        self.assertEqual(join_res.status_code, 201)

        # Status check includes now_serving
        status_res = self.client.get(f"/queues/{queue_id}/status")
        self.assertEqual(status_res.status_code, 200)
        self.assertIn("now_serving", status_res.get_json())


if __name__ == "__main__":
    unittest.main()