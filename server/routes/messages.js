const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../firebase');
const { authMiddleware } = require('../auth');

const router = express.Router();

router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const sentSnap = await db.collection('messages').where('sender_id', '==', userId).get();
    const receivedSnap = await db.collection('messages').where('receiver_id', '==', userId).get();

    const partnerIds = new Set();
    sentSnap.docs.forEach(d => partnerIds.add(d.data().receiver_id));
    receivedSnap.docs.forEach(d => partnerIds.add(d.data().sender_id));

    const conversations = [];
    for (const partnerId of partnerIds) {
      const partnerDoc = await db.collection('users').doc(partnerId).get();
      if (!partnerDoc.exists) continue;
      const partner = partnerDoc.data();

      const allSent = sentSnap.docs.filter(d => d.data().receiver_id === partnerId).map(d => d.data());
      const allReceived = receivedSnap.docs.filter(d => d.data().sender_id === partnerId).map(d => d.data());
      const allMsgs = [...allSent, ...allReceived].sort((a, b) => a.created_at > b.created_at ? -1 : 1);
      const lastMsg = allMsgs[0] || null;
      const unreadCount = allReceived.filter(m => !m.read).length;

      conversations.push({
        other_user_id: partnerId,
        username: partner.username,
        display_name: partner.display_name,
        profile_pic: partner.profile_pic,
        last_message: lastMsg ? lastMsg.content : '',
        last_message_at: lastMsg ? lastMsg.created_at : null,
        unread_count: unreadCount
      });
    }

    conversations.sort((a, b) => {
      if (!a.last_message_at) return 1;
      if (!b.last_message_at) return -1;
      return b.last_message_at > a.last_message_at ? 1 : -1;
    });

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const userId = req.userId;

    const sentSnap = await db.collection('messages').where('sender_id', '==', userId).where('receiver_id', '==', otherUserId).get();
    const receivedSnap = await db.collection('messages').where('sender_id', '==', otherUserId).where('receiver_id', '==', userId).get();

    let messages = [...sentSnap.docs.map(d => d.data()), ...receivedSnap.docs.map(d => d.data())];
    messages.sort((a, b) => a.created_at > b.created_at ? 1 : -1);

    const batch = db.batch();
    receivedSnap.docs.forEach(doc => {
      if (!doc.data().read) batch.update(doc.ref, { read: true });
    });
    await batch.commit();

    const otherUserDoc = await db.collection('users').doc(otherUserId).get();
    const otherUser = otherUserDoc.exists ? {
      id: otherUserDoc.data().id,
      username: otherUserDoc.data().username,
      display_name: otherUserDoc.data().display_name,
      profile_pic: otherUserDoc.data().profile_pic
    } : null;

    res.json({ messages, otherUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:userId', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content required' });
    }

    const otherUserDoc = await db.collection('users').doc(req.params.userId).get();
    if (!otherUserDoc.exists) return res.status(404).json({ error: 'User not found' });

    const id = uuidv4();
    const msgData = {
      id,
      sender_id: req.userId,
      receiver_id: req.params.userId,
      content,
      read: false,
      created_at: new Date().toISOString()
    };
    await db.collection('messages').doc(id).set(msgData);
    res.status(201).json(msgData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
