const express = require('express');
const { db } = require('../firebase');
const { authMiddleware } = require('../auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { cursor } = req.query;
    const limit = 30;

    let query = db.collection('notifications')
      .where('user_id', '==', req.userId)
      .orderBy('created_at', 'desc')
      .limit(limit);
    if (cursor) query = query.startAfter(cursor);

    const snap = await query.get();
    const notifications = [];
    for (const doc of snap.docs) {
      const n = doc.data();
      const actorDoc = await db.collection('users').doc(n.actor_id).get();
      const actor = actorDoc.exists ? actorDoc.data() : {};
      notifications.push({
        ...n,
        username: actor.username || '',
        display_name: actor.display_name || '',
        profile_pic: actor.profile_pic || ''
      });
    }

    const nextCursor = snap.size === limit ? snap.docs[snap.docs.length - 1].data().created_at : null;
    res.json({ notifications, nextCursor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/unread', authMiddleware, async (req, res) => {
  try {
    const notifSnap = await db.collection('notifications')
      .where('user_id', '==', req.userId)
      .where('read', '==', false)
      .count().get();

    const msgSnap = await db.collection('messages')
      .where('receiver_id', '==', req.userId)
      .where('read', '==', false)
      .count().get();

    res.json({ notifications: notifSnap.data().count, messages: msgSnap.data().count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/read', authMiddleware, async (req, res) => {
  try {
    const snap = await db.collection('notifications')
      .where('user_id', '==', req.userId)
      .where('read', '==', false)
      .get();

    const batch = db.batch();
    snap.docs.forEach(doc => batch.update(doc.ref, { read: true }));
    await batch.commit();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
