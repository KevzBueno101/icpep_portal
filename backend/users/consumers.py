import json

from channels.generic.websocket import AsyncWebsocketConsumer


class OfficersConsumer(AsyncWebsocketConsumer):
    """Broadcast-only consumer for the public Student Leadership Board.

    Clients connect to the `officers` group and receive messages whenever
    the roster is updated.
    """

    async def connect(self):
        # All clients subscribe to the same group.
        self.group_name = "officers"

        # Accept connection
        await self.accept()

        # Join group
        from channels.layers import get_channel_layer

        channel_layer = get_channel_layer()
        if channel_layer is not None:
            await channel_layer.group_add(self.group_name, self.channel_name)

    async def disconnect(self, close_code):
        from channels.layers import get_channel_layer

        channel_layer = get_channel_layer()
        if channel_layer is not None:
            await channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        # No client->server messages needed.
        return

    async def officers_roster_updated(self, event):
        """Handler for `officers.roster.updated` broadcast."""
        payload = event.get("payload") or {}
        await self.send(
            text_data=json.dumps(
                {
                    "type": "officers.roster.updated",
                    "payload": payload,
                }
            )
        )


class MemberUpdatesConsumer(AsyncWebsocketConsumer):
    """Broadcast-only consumer for general member updates (announcements, about sections, etc).

    Clients connect to the `member_updates` group and receive messages whenever
    there's a relevant update.
    """

    async def connect(self):
        # All clients subscribe to the same group.
        self.group_name = "member_updates"

        # Accept connection
        await self.accept()

        # Join group
        from channels.layers import get_channel_layer

        channel_layer = get_channel_layer()
        if channel_layer is not None:
            await channel_layer.group_add(self.group_name, self.channel_name)

    async def disconnect(self, close_code):
        from channels.layers import get_channel_layer

        channel_layer = get_channel_layer()
        if channel_layer is not None:
            await channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        # No client->server messages needed.
        return

    async def announcements_updated(self, event):
        """Handler for `announcements.updated` broadcast."""
        payload = event.get("payload") or {}
        await self.send(
            text_data=json.dumps(
                {
                    "type": "announcements.updated",
                    "payload": payload,
                }
            )
        )

    async def about_updated(self, event):
        """Handler for `about.updated` broadcast."""
        payload = event.get("payload") or {}
        await self.send(
            text_data=json.dumps(
                {
                    "type": "about.updated",
                    "payload": payload,
                }
            )
        )

