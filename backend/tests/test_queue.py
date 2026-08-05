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

        response = (
            self.client.get(
                "/queues"
            )
        )

        self.assertEqual(
            response.status_code,
            200
        )


if __name__ == "__main__":

    unittest.main()