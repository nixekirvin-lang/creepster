const express = require('express');
const { db } = require('../firebase');
const { authMiddleware } = require('../auth');

const router = express.Router();

async function enrichPost(postData, currentUserId) {
  const userDoc = await db.collection('users').doc(postData.user_id).get();
  const user = userDoc.exists ? {
    id: userDoc.data().id, username: userDoc.data().username,
    display_name: userDoc.data().display_name, profile_pic: userDoc.data().profile_pic
  } : null;
  const likesSnap = await db.collection('likes').where('post_id', '==', postData.id).count().get();
  const repostsSnap = await db.collection('reposts').where('post_id', '==', postData.id).count().get();
  const repliesSnap = await db.collection('posts').where('reply_to', '==', postData.id).count().get();
  let liked = false, reposted = false;
  if (currentUserId) {
    liked = !(await db.collection('likes').where('user_id', '==', currentUserId).where('post_id', '==', postData.id).limit(1).get()).empty;
    reposted = !(await db.collection('reposts').where('user_id', '==', currentUserId).where('post_id', '==', postData.id).limit(1).get()).empty;
  }
  return { ...postData, user, likes: likesSnap.data().count, reposts: repostsSnap.data().count, replies: repliesSnap.data().count, liked, reposted };
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { q, type } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json({ users: [], posts: [], hashtags: [] });
    }
    const query = q.trim().toLowerCase();

    const usersSnap = await db.collection('users').get();
    const users = [];
    for (const doc of usersSnap.docs) {
      const u = doc.data();
      if (u.username.toLowerCase().includes(query) || u.display_name.toLowerCase().includes(query)) {
        const isF = !(await db.collection('follows').where('follower_id', '==', req.userId).where('following_id', '==', u.id).limit(1).get()).empty;
        users.push({ id: u.id, username: u.username, display_name: u.display_name, profile_pic: u.profile_pic, bio: u.bio, isFollowing: isF });
        if (users.length >= 20) break;
      }
    }

    if (type === 'users') return res.json({ users, posts: [], hashtags: [] });

    const postsSnap = await db.collection('posts')
      .where('visibility', '==', 'public')
      .orderBy('created_at', 'desc')
      .limit(200)
      .get();

    const posts = [];
    for (const doc of postsSnap.docs) {
      const p = doc.data();
      if (p.content.toLowerCase().includes(query)) {
        posts.push(await enrichPost(p, req.userId));
        if (posts.length >= 20) break;
      }
    }

    const hashtagsSnap = await db.collection('hashtags').get();
    const hashtags = [];
    for (const doc of hashtagsSnap.docs) {
      const h = doc.data();
      if (h.tag.includes(query)) {
        hashtags.push({ tag: h.tag, post_count: h.post_count });
        if (hashtags.length >= 10) break;
      }
    }

    res.json({ users, posts, hashtags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/hashtag/:tag', authMiddleware, async (req, res) => {
  try {
    const { cursor } = req.query;
    const limit = 20;
    const tag = req.params.tag.toLowerCase();

    const postsSnap = await db.collection('posts')
      .where('visibility', '==', 'public')
      .orderBy('created_at', 'desc')
      .limit(200)
      .get();

    const posts = [];
    for (const doc of postsSnap.docs) {
      const p = doc.data();
      if (p.content.toLowerCase().includes(`#${tag}`)) {
        posts.push(await enrichPost(p, req.userId));
        if (posts.length >= limit) break;
      }
    }

    const nextCursor = posts.length === limit ? posts[posts.length - 1].created_at : null;
    res.json({ posts, nextCursor, tag });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
