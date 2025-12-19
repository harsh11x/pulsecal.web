import { Router } from 'express';
import {
  createChatRoomController,
  getChatRoomsController,
  getChatRoomByIdController,
  getChatMessagesController,
  createChatMessageController,
  markMessagesAsReadController,
  deleteChatMessageController,
} from './chat.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/rooms', authenticate, createChatRoomController);
router.get('/rooms', authenticate, getChatRoomsController);
router.get('/rooms/:id', authenticate, getChatRoomByIdController);
router.get('/rooms/:roomId/messages', authenticate, getChatMessagesController);
router.post('/rooms/:roomId/messages', authenticate, createChatMessageController);
router.post('/rooms/:roomId/read', authenticate, markMessagesAsReadController);
router.delete('/messages/:id', authenticate, deleteChatMessageController);

export default router;

