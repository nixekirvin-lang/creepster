const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../firebase');
const { authMiddleware } = require('../auth');

const router = express.Router();

async function enrichPost(postData, currentUserId) {
  const userDoc = await db.collection('users').doc(postData.user_id).get();
  const user = userDoc.exists ? {
    id: userDoc.data().id,
    username: userDoc.data().username,
    display_name: userDoc.data().display_name,
    profile_pic: userDoc.data().profile_pic
  } : null;

  const likesSnap = await db.collection('likes').where('post_id', '==', postData.id).count().get();
  const dislikesSnap = await db.collection('dislikes').where('post_id', '==', postData.id).count().get();
  const repostsSnap = await db.collection('reposts').where('post_id', '==', postData.id).count().get();
  const repliesSnap = await db.collection('posts').where('reply_to', '==', postData.id).count().get();

  let liked = false;
  let disliked = false;
  let reposted = false;
  if (currentUserId) {
    const likeSnap = await db.collection('likes').where('user_id', '==', currentUserId).where('post_id', '==', postData.id).limit(1).get();
    liked = !likeSnap.empty;
    const dislikeSnap = await db.collection('dislikes').where('user_id', '==', currentUserId).where('post_id', '==', postData.id).limit(1).get();
    disliked = !dislikeSnap.empty;
    const repostSnap = await db.collection('reposts').where('user_id', '==', currentUserId).where('post_id', '==', postData.id).limit(1).get();
    reposted = !repostSnap.empty;
  }

  return {
    ...postData,
    user,
    likes: likesSnap.data().count,
    dislikes: dislikesSnap.data().count,
    reposts: repostsSnap.data().count,
    replies: repliesSnap.data().count,
    liked,
    disliked,
    reposted
  };
}

function extractHashtags(content) {
  const matches = content.match(/#\w+/g);
  return matches ? matches.map(t => t.slice(1).toLowerCase()) : [];
}

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, image_url, reply_to } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content required' });
    }

    const userDoc = await db.collection('users').doc(req.userId).get();
    const charLimit = userDoc.exists ? (userDoc.data().char_limit || 300) : 300;
    if (content.length > charLimit) {
      return res.status(400).json({ error: `Content exceeds character limit (${charLimit})` });
    }

    const id = uuidv4();
    const isCursed = Math.random() < 0.03;
    const postData = {
      id,
      user_id: req.userId,
      content,
      image_url: image_url || '',
      reply_to: reply_to || null,
      created_at: new Date().toISOString(),
      is_cursed: isCursed,
      visibility: 'public'
    };

    await db.collection('posts').doc(id).set(postData);

    const hashtags = extractHashtags(content);
    for (const tag of hashtags) {
      const tagRef = db.collection('hashtags').doc(tag);
      const tagDoc = await tagRef.get();
      if (tagDoc.exists) {
        await tagRef.update({ post_count: tagDoc.data().post_count + 1 });
      } else {
        await tagRef.set({ id: tag, tag, post_count: 1 });
      }
    }

    if (reply_to) {
      const originalDoc = await db.collection('posts').doc(reply_to).get();
      if (originalDoc.exists && originalDoc.data().user_id !== req.userId) {
        await db.collection('notifications').doc(uuidv4()).set({
          id: uuidv4(),
          user_id: originalDoc.data().user_id,
          actor_id: req.userId,
          type: 'reply',
          post_id: reply_to,
          read: false,
          created_at: new Date().toISOString()
        });
      }
    }

    const enriched = await enrichPost(postData, req.userId);
    res.status(201).json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/feed', authMiddleware, async (req, res) => {
  try {
    const allPostsSnap = await db.collection('posts').get();
    const posts = [];
    for (const doc of allPostsSnap.docs) {
      const data = doc.data();
      if (!data.reply_to && data.visibility === 'public') {
        posts.push(await enrichPost(data, req.userId));
      }
    }
    posts.sort((a, b) => a.created_at > b.created_at ? -1 : 1);
    const limited = posts.slice(0, 20);
    res.json({ posts: limited, nextCursor: posts.length > 20 ? posts[20].created_at : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/explore', authMiddleware, async (req, res) => {
  try {
    const allPostsSnap = await db.collection('posts').get();
    const posts = [];
    for (const doc of allPostsSnap.docs) {
      const data = doc.data();
      if (!data.reply_to && data.visibility === 'public') {
        posts.push(await enrichPost(data, req.userId));
      }
    }
    posts.sort((a, b) => a.created_at > b.created_at ? -1 : 1);
    const limited = posts.slice(0, 20);
    res.json({ posts: limited, nextCursor: posts.length > 20 ? posts[20].created_at : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const postDoc = await db.collection('posts').doc(req.params.id).get();
    if (!postDoc.exists) return res.status(404).json({ error: 'Post not found' });

    const allPostsSnap = await db.collection('posts').get();
    const replies = [];
    for (const doc of allPostsSnap.docs) {
      const data = doc.data();
      if (data.reply_to === req.params.id) {
        replies.push(await enrichPost(data, req.userId));
      }
    }
    replies.sort((a, b) => a.created_at > b.created_at ? 1 : -1);

    const enriched = await enrichPost(postDoc.data(), req.userId);
    res.json({ post: enriched, replies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const postDoc = await db.collection('posts').doc(req.params.id).get();
    if (!postDoc.exists || postDoc.data().user_id !== req.userId) {
      return res.status(404).json({ error: 'Post not found' });
    }
    await db.collection('posts').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const postDoc = await db.collection('posts').doc(req.params.id).get();
    if (!postDoc.exists) return res.status(404).json({ error: 'Post not found' });
    const post = postDoc.data();

    const existingSnap = await db.collection('likes')
      .where('user_id', '==', req.userId)
      .where('post_id', '==', req.params.id)
      .limit(1).get();

    if (!existingSnap.empty) {
      await existingSnap.docs[0].ref.delete();
    } else {
      await db.collection('likes').doc(uuidv4()).set({
        id: uuidv4(),
        user_id: req.userId,
        post_id: req.params.id,
        created_at: new Date().toISOString()
      });
      if (post.user_id !== req.userId) {
        await db.collection('notifications').doc(uuidv4()).set({
          id: uuidv4(),
          user_id: post.user_id,
          actor_id: req.userId,
          type: 'like',
          post_id: post.id,
          read: false,
          created_at: new Date().toISOString()
        });
      }
    }

    const updatedDoc = await db.collection('posts').doc(req.params.id).get();
    const enriched = await enrichPost(updatedDoc.data(), req.userId);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/repost', authMiddleware, async (req, res) => {
  try {
    const postDoc = await db.collection('posts').doc(req.params.id).get();
    if (!postDoc.exists) return res.status(404).json({ error: 'Post not found' });
    const post = postDoc.data();

    const existingSnap = await db.collection('reposts')
      .where('user_id', '==', req.userId)
      .where('post_id', '==', req.params.id)
      .limit(1).get();

    if (!existingSnap.empty) {
      await existingSnap.docs[0].ref.delete();
    } else {
      await db.collection('reposts').doc(uuidv4()).set({
        id: uuidv4(),
        user_id: req.userId,
        post_id: req.params.id,
        created_at: new Date().toISOString()
      });
      if (post.user_id !== req.userId) {
        await db.collection('notifications').doc(uuidv4()).set({
          id: uuidv4(),
          user_id: post.user_id,
          actor_id: req.userId,
          type: 'repost',
          post_id: post.id,
          read: false,
          created_at: new Date().toISOString()
        });
      }
    }

    const updatedDoc = await db.collection('posts').doc(req.params.id).get();
    const enriched = await enrichPost(updatedDoc.data(), req.userId);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/dislike', authMiddleware, async (req, res) => {
  try {
    const postDoc = await db.collection('posts').doc(req.params.id).get();
    if (!postDoc.exists) return res.status(404).json({ error: 'Post not found' });
    const post = postDoc.data();

    const existingSnap = await db.collection('dislikes')
      .where('user_id', '==', req.userId)
      .where('post_id', '==', req.params.id)
      .limit(1).get();

    if (!existingSnap.empty) {
      await existingSnap.docs[0].ref.delete();
    } else {
      const id = uuidv4();
      await db.collection('dislikes').doc(id).set({
        id,
        user_id: req.userId,
        post_id: req.params.id,
        created_at: new Date().toISOString()
      });
      const existingLike = await db.collection('likes')
        .where('user_id', '==', req.userId)
        .where('post_id', '==', req.params.id)
        .limit(1).get();
      if (!existingLike.empty) {
        await existingLike.docs[0].ref.delete();
      }
    }

    const updatedDoc = await db.collection('posts').doc(req.params.id).get();
    const enriched = await enrichPost(updatedDoc.data(), req.userId);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
