const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('./db');

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL || '*', credentials: true },
  });

  // JWT 認證
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('未登入'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
      next();
    } catch (e) {
      next(new Error('Token 無效'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] ${socket.user.username} connected`);

    // 加入用戶專屬房間
    socket.join(`user:${socket.user.id}`);

    // 加入對話群組
    socket.on('join:group', async (groupId) => {
      // 驗證是否為群組成員
      const member = await db('chat_members').where({ group_id: groupId, user_id: socket.user.id }).first();
      if (member) {
        socket.join(`group:${groupId}`);
        socket.emit('joined', { groupId });
      }
    });

    // 發送訊息
    socket.on('message:send', async (data) => {
      try {
        const { group_id, text, media } = data;
        const [msg] = await db('chat_messages').insert({
          group_id, user_id: socket.user.id, text,
          media: JSON.stringify(media || []),
          read_by: JSON.stringify([socket.user.id]),
        }).returning('*');

        // 查發送者資訊
        const user = await db('users').where('id', socket.user.id).select('name', 'avatar').first();

        const payload = { ...msg, sender_name: user?.name, avatar: user?.avatar };

        // 廣播給群組所有人
        io.to(`group:${group_id}`).emit('message:new', payload);
      } catch (e) {
        socket.emit('error', { message: e.message });
      }
    });

    // 標記已讀
    socket.on('message:read', async (groupId) => {
      try {
        await db('chat_messages').where('group_id', groupId)
          .whereRaw("NOT (read_by @> ?::jsonb)", [JSON.stringify([socket.user.id])])
          .update({ read_by: db.raw("read_by || ?::jsonb", JSON.stringify([socket.user.id])) });
        socket.emit('read:ok', { groupId });
      } catch (e) {}
    });

    // 打字中
    socket.on('typing', (data) => {
      socket.to(`group:${data.group_id}`).emit('typing', {
        user_id: socket.user.id,
        username: socket.user.username,
        group_id: data.group_id,
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] ${socket.user.username} disconnected`);
    });
  });

  // 對外暴露推播方法
  io.pushToUser = (userId, event, data) => {
    io.to(`user:${userId}`).emit(event, data);
  };

  io.pushToGroup = (groupId, event, data) => {
    io.to(`group:${groupId}`).emit(event, data);
  };

  return io;
}

module.exports = { initSocket };
