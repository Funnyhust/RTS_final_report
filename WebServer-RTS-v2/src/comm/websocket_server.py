import asyncio
import json
import logging
import threading
import websockets
from typing import Set

class WebSocketServer:
    def __init__(self, host: str = "0.0.0.0", port: int = 8765):
        self.host = host
        self.port = port
        self.clients: Set[websockets.WebSocketServerProtocol] = set()
        self.loop = asyncio.new_event_loop()
        self.thread = threading.Thread(target=self._start_loop, daemon=True)
        self.logger = logging.getLogger("websocket")
        self.message_handler = None

    def start(self):
        self.thread.start()

    def _start_loop(self):
        asyncio.set_event_loop(self.loop)
        self.loop.run_until_complete(self._serve())
        self.loop.run_forever()

    async def _serve(self):
        async with websockets.serve(self._handler, self.host, self.port):
            self.logger.info(f"WebSocket Server running on ws://{self.host}:{self.port}")
            await asyncio.Future()  # Run forever

    async def _handler(self, websocket):
        self.clients.add(websocket)
        try:
            async for message in websocket:
                if self.message_handler:
                    try:
                        data = json.loads(message)
                        self.message_handler(data)
                    except Exception as e:
                        self.logger.error(f"WS Msg Error: {e}")
            await websocket.wait_closed()
        finally:
            self.clients.remove(websocket)

    def set_message_handler(self, handler):
        self.message_handler = handler

    def broadcast(self, message: dict):
        if not self.clients:
            return
            
        data = json.dumps(message)
        asyncio.run_coroutine_threadsafe(self._broadcast_async(data), self.loop)

    async def _broadcast_async(self, data: str):
        if self.clients:
            await asyncio.gather(*[client.send(data) for client in self.clients], return_exceptions=True)
