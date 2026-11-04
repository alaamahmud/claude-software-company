from channels.generic.websocket import AsyncJsonWebsocketConsumer

from . import state

GROUP = "office"


class OfficeConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(GROUP, self.channel_name)
        await self.accept()
        await self.send_json({"type": "snapshot", "projects": state.snapshot()})

    async def disconnect(self, code):
        await self.channel_layer.group_discard(GROUP, self.channel_name)

    async def office_event(self, message):
        await self.send_json({"type": "event", "event": message["event"]})
