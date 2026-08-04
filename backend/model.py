class Queue:

    def __init__(self, id, name, status):

        self.id = id
        self.name = name
        self.status = status


class QueueMember:

    def __init__(
        self,
        id,
        queue_id,
        name,
        status
    ):

        self.id = id
        self.queue_id = queue_id
        self.name = name
        self.status = status